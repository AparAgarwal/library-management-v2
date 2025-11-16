const axios = require('axios');
const bcrypt = require('bcryptjs');
const db = require('./config/db');

// Sample books with ISBNs
const sampleBooks = [
  { isbn: '9780140328721', title: 'Dune', author: 'Frank Herbert' },
  { isbn: '9780547928227', title: 'The Hobbit', author: 'J.R.R. Tolkien' },
  { isbn: '9780261103573', title: 'The Lord of the Rings', author: 'J.R.R. Tolkien' },
  { isbn: '9780553380163', title: 'A Game of Thrones', author: 'George R.R. Martin' },
  { isbn: '9780747532699', title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling' },
  { isbn: '9780439023481', title: 'The Hunger Games', author: 'Suzanne Collins' },
  { isbn: '9780316769174', title: 'The Catcher in the Rye', author: 'J.D. Salinger' },
  { isbn: '9780061120084', title: 'To Kill a Mockingbird', author: 'Harper Lee' },
  { isbn: '9780141439518', title: '1984', author: 'George Orwell' },
  { isbn: '9780451524935', title: 'Animal Farm', author: 'George Orwell' },
  { isbn: '9780743273565', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
  { isbn: '9780140817744', title: 'Pride and Prejudice', author: 'Jane Austen' },
  { isbn: '9780142437230', title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle' },
  { isbn: '9780345391803', title: 'The Hitchhiker\'s Guide to the Galaxy', author: 'Douglas Adams' },
  { isbn: '9780441172719', title: 'Neuromancer', author: 'William Gibson' },
  { isbn: '9780765326355', title: 'The Way of Kings', author: 'Brandon Sanderson' },
  { isbn: '9780765311788', title: 'Mistborn', author: 'Brandon Sanderson' },
  { isbn: '9780812550702', title: 'Ender\'s Game', author: 'Orson Scott Card' },
  { isbn: '9780553382563', title: 'Foundation', author: 'Isaac Asimov' },
  { isbn: '9780345339683', title: 'The Martian', author: 'Andy Weir' },
  { isbn: '9780316055437', title: 'The Twilight Saga', author: 'Stephenie Meyer' },
  { isbn: '9780064471046', title: 'Charlotte\'s Web', author: 'E.B. White' },
  { isbn: '9780439139595', title: 'The Lightning Thief', author: 'Rick Riordan' },
  { isbn: '9780452284234', title: 'Brave New World', author: 'Aldous Huxley' },
  { isbn: '9780143127741', title: 'The Handmaid\'s Tale', author: 'Margaret Atwood' },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create a default librarian user
    const librarianPassword = await bcrypt.hash('admin123', 10);
    await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@library.com', librarianPassword, 'Admin', 'Librarian', 'LIBRARIAN']
    );
    console.log('✅ Created librarian user (admin@library.com / admin123)');

    // Create a sample member user
    const memberPassword = await bcrypt.hash('member123', 10);
    await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['member@library.com', memberPassword, 'John', 'Doe', 'MEMBER']
    );
    console.log('✅ Created member user (member@library.com / member123)');

    // Seed books
    for (const book of sampleBooks) {
      try {
        // Try to get book data from Open Library API
        let bookData = { ...book };
        
        try {
          const response = await axios.get(
            `https://openlibrary.org/api/books?bibkeys=ISBN:${book.isbn}&format=json&jscmd=data`,
            { timeout: 5000 }
          );

          const key = `ISBN:${book.isbn}`;
          if (response.data[key]) {
            const apiData = response.data[key];
            bookData.description = apiData.excerpts?.[0]?.text || 'No description available';
            bookData.coverUrl = apiData.cover?.large || apiData.cover?.medium || null;
            bookData.publisher = apiData.publishers?.[0]?.name || 'Unknown';
            bookData.publicationYear = apiData.publish_date ? new Date(apiData.publish_date).getFullYear() : null;
          }
        } catch (apiError) {
          console.log(`  ⚠️  Could not fetch API data for ${book.title}`);
        }

        // Insert book
        const bookResult = await db.query(
          `INSERT INTO books (isbn, title, author, publisher, publication_year, description, cover_url, category)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (isbn) DO NOTHING
           RETURNING book_id`,
          [
            bookData.isbn,
            bookData.title,
            bookData.author,
            bookData.publisher || 'Unknown',
            bookData.publicationYear || null,
            bookData.description || 'No description available',
            bookData.coverUrl || null,
            'Fiction'
          ]
        );

        if (bookResult.rows.length > 0) {
          const bookId = bookResult.rows[0].book_id;

          // Add 2-3 physical copies for each book
          const copies = Math.floor(Math.random() * 2) + 2; // 2-3 copies
          for (let i = 1; i <= copies; i++) {
            const barcode = `${book.isbn}-${i}`;
            await db.query(
              `INSERT INTO book_items (book_id, barcode, status, location)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (barcode) DO NOTHING`,
              [bookId, barcode, 'AVAILABLE', `Shelf-${Math.floor(Math.random() * 20) + 1}`]
            );
          }

          console.log(`  ✅ Added: ${book.title} (${copies} copies)`);
        }

        // Small delay to avoid API rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`  ❌ Error adding ${book.title}:`, error.message);
      }
    }

    console.log('\n🎉 Database seeding completed!');
    console.log('\n📝 Login credentials:');
    console.log('   Librarian: admin@library.com / admin123');
    console.log('   Member: member@library.com / member123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeder
seedDatabase();
