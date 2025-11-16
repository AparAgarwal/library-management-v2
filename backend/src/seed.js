const axios = require('axios');
const bcrypt = require('bcryptjs');
const db = require('./config/db');

// Comprehensive book collection with 100+ titles across genres
const sampleBooks = [
  // Science Fiction
  { isbn: '9780140328721', title: 'Dune', author: 'Frank Herbert', category: 'Science Fiction', publisher: 'Ace Books', year: 1965 },
  { isbn: '9780441172719', title: 'Neuromancer', author: 'William Gibson', category: 'Science Fiction', publisher: 'Ace Books', year: 1984 },
  { isbn: '9780553382563', title: 'Foundation', author: 'Isaac Asimov', category: 'Science Fiction', publisher: 'Bantam Spectra', year: 1951 },
  { isbn: '9780345339683', title: 'The Martian', author: 'Andy Weir', category: 'Science Fiction', publisher: 'Broadway Books', year: 2011 },
  { isbn: '9780812550702', title: 'Ender\'s Game', author: 'Orson Scott Card', category: 'Science Fiction', publisher: 'Tor Books', year: 1985 },
  { isbn: '9780345391803', title: 'The Hitchhiker\'s Guide to the Galaxy', author: 'Douglas Adams', category: 'Science Fiction', publisher: 'Del Rey', year: 1979 },
  { isbn: '9780575084759', title: 'Hyperion', author: 'Dan Simmons', category: 'Science Fiction', publisher: 'Gollancz', year: 1989 },
  { isbn: '9780765342294', title: 'Old Man\'s War', author: 'John Scalzi', category: 'Science Fiction', publisher: 'Tor Books', year: 2005 },
  { isbn: '9780345404473', title: 'Stranger in a Strange Land', author: 'Robert A. Heinlein', category: 'Science Fiction', publisher: 'Ace Books', year: 1961 },
  { isbn: '9780553283686', title: 'Snow Crash', author: 'Neal Stephenson', category: 'Science Fiction', publisher: 'Bantam Spectra', year: 1992 },
  
  // Fantasy
  { isbn: '9780547928227', title: 'The Hobbit', author: 'J.R.R. Tolkien', category: 'Fantasy', publisher: 'HarperCollins', year: 1937 },
  { isbn: '9780261103573', title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', category: 'Fantasy', publisher: 'HarperCollins', year: 1954 },
  { isbn: '9780553380163', title: 'A Game of Thrones', author: 'George R.R. Martin', category: 'Fantasy', publisher: 'Bantam Books', year: 1996 },
  { isbn: '9780747532699', title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', category: 'Fantasy', publisher: 'Bloomsbury', year: 1997 },
  { isbn: '9780765326355', title: 'The Way of Kings', author: 'Brandon Sanderson', category: 'Fantasy', publisher: 'Tor Books', year: 2010 },
  { isbn: '9780765311788', title: 'Mistborn', author: 'Brandon Sanderson', category: 'Fantasy', publisher: 'Tor Books', year: 2006 },
  { isbn: '9780441013593', title: 'The Name of the Wind', author: 'Patrick Rothfuss', category: 'Fantasy', publisher: 'DAW Books', year: 2007 },
  { isbn: '9780316666343', title: 'The Lightning Thief', author: 'Rick Riordan', category: 'Fantasy', publisher: 'Disney Hyperion', year: 2005 },
  { isbn: '9780060531041', title: 'American Gods', author: 'Neil Gaiman', category: 'Fantasy', publisher: 'William Morrow', year: 2001 },
  { isbn: '9780765348784', title: 'The Wheel of Time', author: 'Robert Jordan', category: 'Fantasy', publisher: 'Tor Books', year: 1990 },
  
  // Dystopian/Classic Literature
  { isbn: '9780141439518', title: '1984', author: 'George Orwell', category: 'Dystopian', publisher: 'Penguin Books', year: 1949 },
  { isbn: '9780451524935', title: 'Animal Farm', author: 'George Orwell', category: 'Fiction', publisher: 'Signet Classics', year: 1945 },
  { isbn: '9780439023481', title: 'The Hunger Games', author: 'Suzanne Collins', category: 'Dystopian', publisher: 'Scholastic', year: 2008 },
  { isbn: '9780452284234', title: 'Brave New World', author: 'Aldous Huxley', category: 'Dystopian', publisher: 'Harper Perennial', year: 1932 },
  { isbn: '9780143127741', title: 'The Handmaid\'s Tale', author: 'Margaret Atwood', category: 'Dystopian', publisher: 'Anchor Books', year: 1985 },
  { isbn: '9780062255655', title: 'Fahrenheit 451', author: 'Ray Bradbury', category: 'Dystopian', publisher: 'Simon & Schuster', year: 1953 },
  
  // Classic American Literature
  { isbn: '9780316769174', title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Fiction', publisher: 'Little, Brown', year: 1951 },
  { isbn: '9780061120084', title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', publisher: 'Harper Perennial', year: 1960 },
  { isbn: '9780743273565', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', publisher: 'Scribner', year: 1925 },
  { isbn: '9780142437230', title: 'The Adventures of Tom Sawyer', author: 'Mark Twain', category: 'Fiction', publisher: 'Penguin Classics', year: 1876 },
  { isbn: '9780142000670', title: 'Of Mice and Men', author: 'John Steinbeck', category: 'Fiction', publisher: 'Penguin Books', year: 1937 },
  { isbn: '9780060935467', title: 'The Grapes of Wrath', author: 'John Steinbeck', category: 'Fiction', publisher: 'Penguin Books', year: 1939 },
  
  // British Classics
  { isbn: '9780140817744', title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Romance', publisher: 'Penguin Classics', year: 1813 },
  { isbn: '9780141439556', title: 'Jane Eyre', author: 'Charlotte Brontë', category: 'Romance', publisher: 'Penguin Classics', year: 1847 },
  { isbn: '9780141439846', title: 'Wuthering Heights', author: 'Emily Brontë', category: 'Romance', publisher: 'Penguin Classics', year: 1847 },
  { isbn: '9780141439600', title: 'Great Expectations', author: 'Charles Dickens', category: 'Fiction', publisher: 'Penguin Classics', year: 1861 },
  { isbn: '9780141439587', title: 'A Tale of Two Cities', author: 'Charles Dickens', category: 'Historical Fiction', publisher: 'Penguin Classics', year: 1859 },
  
  // Mystery & Thriller
  { isbn: '9780062073501', title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', category: 'Mystery', publisher: 'Vintage', year: 2005 },
  { isbn: '9780307588371', title: 'Gone Girl', author: 'Gillian Flynn', category: 'Thriller', publisher: 'Broadway Books', year: 2012 },
  { isbn: '9780307947925', title: 'The Da Vinci Code', author: 'Dan Brown', category: 'Thriller', publisher: 'Anchor Books', year: 2003 },
  { isbn: '9780062657207', title: 'The Silent Patient', author: 'Alex Michaelides', category: 'Thriller', publisher: 'Celadon Books', year: 2019 },
  { isbn: '9780062457738', title: 'The Woman in the Window', author: 'A.J. Finn', category: 'Thriller', publisher: 'William Morrow', year: 2018 },
  
  // Horror
  { isbn: '9780307743664', title: 'The Shining', author: 'Stephen King', category: 'Horror', publisher: 'Anchor Books', year: 1977 },
  { isbn: '9781501156762', title: 'It', author: 'Stephen King', category: 'Horror', publisher: 'Scribner', year: 1986 },
  { isbn: '9780385121675', title: 'Carrie', author: 'Stephen King', category: 'Horror', publisher: 'Doubleday', year: 1974 },
  { isbn: '9780141034614', title: 'Dracula', author: 'Bram Stoker', category: 'Horror', publisher: 'Penguin Classics', year: 1897 },
  { isbn: '9780141439471', title: 'Frankenstein', author: 'Mary Shelley', category: 'Horror', publisher: 'Penguin Classics', year: 1818 },
  
  // Historical Fiction
  { isbn: '9780007177738', title: 'The Book Thief', author: 'Markus Zusak', category: 'Historical Fiction', publisher: 'Picador', year: 2005 },
  { isbn: '9781594631931', title: 'All the Light We Cannot See', author: 'Anthony Doerr', category: 'Historical Fiction', publisher: 'Scribner', year: 2014 },
  { isbn: '9780007268399', title: 'The Kite Runner', author: 'Khaled Hosseini', category: 'Historical Fiction', publisher: 'Riverhead Books', year: 2003 },
  { isbn: '9780385721790', title: 'The Pillars of the Earth', author: 'Ken Follett', category: 'Historical Fiction', publisher: 'Penguin Books', year: 1989 },
  
  // Contemporary Fiction
  { isbn: '9780316769488', title: 'The Catcher in the Rye', author: 'J.D. Salinger', category: 'Fiction', publisher: 'Little, Brown', year: 1951 },
  { isbn: '9780525478812', title: 'The Fault in Our Stars', author: 'John Green', category: 'Young Adult', publisher: 'Dutton Books', year: 2012 },
  { isbn: '9780375842207', title: 'Looking for Alaska', author: 'John Green', category: 'Young Adult', publisher: 'Dutton Books', year: 2005 },
  { isbn: '9780385537858', title: 'Thirteen Reasons Why', author: 'Jay Asher', category: 'Young Adult', publisher: 'Razorbill', year: 2007 },
  
  // Non-Fiction
  { isbn: '9780345816023', title: 'Sapiens', author: 'Yuval Noah Harari', category: 'Non-Fiction', publisher: 'Harper', year: 2011 },
  { isbn: '9780385537859', title: 'Educated', author: 'Tara Westover', category: 'Memoir', publisher: 'Random House', year: 2018 },
  { isbn: '9780062316097', title: 'Becoming', author: 'Michelle Obama', category: 'Memoir', publisher: 'Crown', year: 2018 },
  { isbn: '9780385490818', title: 'The Immortal Life of Henrietta Lacks', author: 'Rebecca Skloot', category: 'Non-Fiction', publisher: 'Crown', year: 2010 },
  { isbn: '9780812993547', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', category: 'Psychology', publisher: 'Farrar, Straus', year: 2011 },
  
  // Children's Literature
  { isbn: '9780064471046', title: 'Charlotte\'s Web', author: 'E.B. White', category: 'Children', publisher: 'HarperCollins', year: 1952 },
  { isbn: '9780590353427', title: 'Harry Potter and the Sorcerer\'s Stone', author: 'J.K. Rowling', category: 'Fantasy', publisher: 'Scholastic', year: 1998 },
  { isbn: '9780439139595', title: 'Harry Potter and the Goblet of Fire', author: 'J.K. Rowling', category: 'Fantasy', publisher: 'Scholastic', year: 2000 },
  { isbn: '9780590405959', title: 'Animorphs: The Invasion', author: 'K.A. Applegate', category: 'Science Fiction', publisher: 'Scholastic', year: 1996 },
  { isbn: '9780439708180', title: 'The Giver', author: 'Lois Lowry', category: 'Dystopian', publisher: 'HMH Books', year: 1993 },
  
  // Romance
  { isbn: '9780316055437', title: 'Twilight', author: 'Stephenie Meyer', category: 'Romance', publisher: 'Little, Brown', year: 2005 },
  { isbn: '9780142424179', title: 'The Notebook', author: 'Nicholas Sparks', category: 'Romance', publisher: 'Grand Central', year: 1996 },
  { isbn: '9780525536291', title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', category: 'Historical Fiction', publisher: 'Atria Books', year: 2017 },
  { isbn: '9781250014665', title: 'Me Before You', author: 'Jojo Moyes', category: 'Romance', publisher: 'Pamela Dorman Books', year: 2012 },
  
  // Philosophy & Self-Help
  { isbn: '9780062316110', title: 'Man\'s Search for Meaning', author: 'Viktor E. Frankl', category: 'Philosophy', publisher: 'Beacon Press', year: 1946 },
  { isbn: '9780143127796', title: 'The Power of Now', author: 'Eckhart Tolle', category: 'Self-Help', publisher: 'New World Library', year: 1997 },
  { isbn: '9780062315007', title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', publisher: 'HarperOne', year: 1988 },
  { isbn: '9781591847816', title: 'Atomic Habits', author: 'James Clear', category: 'Self-Help', publisher: 'Avery', year: 2018 },
  
  // Business & Economics
  { isbn: '9780062301239', title: 'Lean In', author: 'Sheryl Sandberg', category: 'Business', publisher: 'Knopf', year: 2013 },
  { isbn: '9781591846444', title: 'The Lean Startup', author: 'Eric Ries', category: 'Business', publisher: 'Crown Business', year: 2011 },
  { isbn: '9780062273208', title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz', category: 'Business', publisher: 'Harper Business', year: 2014 },
  { isbn: '9780062407801', title: 'Zero to One', author: 'Peter Thiel', category: 'Business', publisher: 'Crown Business', year: 2014 },
  
  // Biography
  { isbn: '9781501127625', title: 'Steve Jobs', author: 'Walter Isaacson', category: 'Biography', publisher: 'Simon & Schuster', year: 2011 },
  { isbn: '9780143127550', title: 'Born a Crime', author: 'Trevor Noah', category: 'Memoir', publisher: 'Spiegel & Grau', year: 2016 },
  { isbn: '9780316346627', title: 'Elon Musk', author: 'Ashlee Vance', category: 'Biography', publisher: 'Ecco', year: 2015 },
  
  // Science & Nature
  { isbn: '9780553380163', title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science', publisher: 'Bantam', year: 1988 },
  { isbn: '9780062409850', title: 'The Gene', author: 'Siddhartha Mukherjee', category: 'Science', publisher: 'Scribner', year: 2016 },
  { isbn: '9780143127369', title: 'Cosmos', author: 'Carl Sagan', category: 'Science', publisher: 'Ballantine Books', year: 1980 },
  { isbn: '9780385537859', title: 'Astrophysics for People in a Hurry', author: 'Neil deGrasse Tyson', category: 'Science', publisher: 'W. W. Norton', year: 2017 },
  
  // Poetry & Drama
  { isbn: '9780743477123', title: 'The Complete Works of William Shakespeare', author: 'William Shakespeare', category: 'Drama', publisher: 'Simon & Schuster', year: 1623 },
  { isbn: '9780060850524', title: 'Where the Sidewalk Ends', author: 'Shel Silverstein', category: 'Poetry', publisher: 'HarperCollins', year: 1974 },
  { isbn: '9780156027328', title: 'Leaves of Grass', author: 'Walt Whitman', category: 'Poetry', publisher: 'Penguin Classics', year: 1855 },
  
  // Graphic Novels & Comics
  { isbn: '9781401227920', title: 'Watchmen', author: 'Alan Moore', category: 'Graphic Novel', publisher: 'DC Comics', year: 1986 },
  { isbn: '9781401238964', title: 'V for Vendetta', author: 'Alan Moore', category: 'Graphic Novel', publisher: 'Vertigo', year: 1988 },
  { isbn: '9781603090384', title: 'Maus', author: 'Art Spiegelman', category: 'Graphic Novel', publisher: 'Pantheon', year: 1991 },
  { isbn: '9781603094276', title: 'Persepolis', author: 'Marjane Satrapi', category: 'Graphic Novel', publisher: 'Pantheon', year: 2000 },
  
  // Additional Popular Titles
  { isbn: '9780385504201', title: 'The Giver', author: 'Lois Lowry', category: 'Young Adult', publisher: 'HMH Books', year: 1993 },
  { isbn: '9780375831003', title: 'Life of Pi', author: 'Yann Martel', category: 'Fiction', publisher: 'Harcourt', year: 2001 },
  { isbn: '9780316015844', title: 'Twilight', author: 'Stephenie Meyer', category: 'Romance', publisher: 'Little, Brown', year: 2005 },
  { isbn: '9780062024039', title: 'Divergent', author: 'Veronica Roth', category: 'Dystopian', publisher: 'Katherine Tegen Books', year: 2011 },
  { isbn: '9780439023511', title: 'Catching Fire', author: 'Suzanne Collins', category: 'Dystopian', publisher: 'Scholastic', year: 2009 },
  { isbn: '9780439023528', title: 'Mockingjay', author: 'Suzanne Collins', category: 'Dystopian', publisher: 'Scholastic', year: 2010 },
  { isbn: '9780545139700', title: 'The Maze Runner', author: 'James Dashner', category: 'Dystopian', publisher: 'Delacorte Press', year: 2009 },
  { isbn: '9780062315007', title: 'The 5th Wave', author: 'Rick Yancey', category: 'Science Fiction', publisher: 'Putnam', year: 2013 },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Create default users
    console.log('👥 Creating default users...');
    const librarianPassword = await bcrypt.hash('admin123', 10);
    await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@library.com', librarianPassword, 'Admin', 'Librarian', 'LIBRARIAN', '555-0100', '123 Library St']
    );
    console.log('  ✅ Librarian: admin@library.com / admin123');

    const memberPassword = await bcrypt.hash('member123', 10);
    await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      ['member@library.com', memberPassword, 'John', 'Doe', 'MEMBER', '555-0101', '456 Main St']
    );
    console.log('  ✅ Member: member@library.com / member123');

    // Create additional sample members
    const sampleMembers = [
      { email: 'alice@example.com', firstName: 'Alice', lastName: 'Johnson', phone: '555-0102', address: '789 Oak Ave' },
      { email: 'bob@example.com', firstName: 'Bob', lastName: 'Smith', phone: '555-0103', address: '321 Pine Rd' },
      { email: 'carol@example.com', firstName: 'Carol', lastName: 'Williams', phone: '555-0104', address: '654 Elm St' },
    ];

    for (const member of sampleMembers) {
      const password = await bcrypt.hash('password123', 10);
      await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO NOTHING`,
        [member.email, password, member.firstName, member.lastName, 'MEMBER', member.phone, member.address]
      );
    }
    console.log(`  ✅ Created ${sampleMembers.length} additional sample members\n`);

    // Seed books
    console.log(`📚 Seeding ${sampleBooks.length} books...`);
    let booksAdded = 0;
    let copiesAdded = 0;

    for (let idx = 0; idx < sampleBooks.length; idx++) {
      const book = sampleBooks[idx];
      try {
        // Basic fallback values from our list
        let title = book.title;
        let author = book.author;
        let publisher = book.publisher;
        let publication_year = book.year;
        let description = `${book.title} by ${book.author} is a ${book.category} published by ${book.publisher} in ${book.year}. This is a must-read classic in its genre.`;
        let coverUrl = book.isbn ? `https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg` : null;

        // If ISBN available, try to fetch authoritative metadata from Open Library
        if (book.isbn) {
          try {
            const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${book.isbn}&format=json&jscmd=data`;
            const resp = await axios.get(olUrl, { timeout: 8000 });
            const key = `ISBN:${book.isbn}`;
            const data = resp.data && resp.data[key] ? resp.data[key] : null;
            if (data) {
              if (data.title) title = data.title;
              if (data.authors && Array.isArray(data.authors)) author = data.authors.map(a => a.name).join(', ');
              if (data.publishers && Array.isArray(data.publishers) && data.publishers[0] && data.publishers[0].name) publisher = data.publishers[0].name;
              if (data.publish_date) {
                // Try to extract a 4-digit year
                const yearMatch = String(data.publish_date).match(/(\d{4})/);
                if (yearMatch) publication_year = parseInt(yearMatch[1], 10);
              }
              if (data.description) {
                description = typeof data.description === 'string' ? data.description : (data.description.value || description);
              }
              if (data.cover) {
                coverUrl = data.cover.large || data.cover.medium || data.cover.small || coverUrl;
              }
            }
          } catch (olErr) {
            // Don't fail seeding if Open Library request fails; fall back to local data
            // console.warn(`  ⚠️ OpenLibrary lookup failed for ISBN ${book.isbn}: ${olErr.message}`);
          }

          // Small delay to be polite with Open Library
          await new Promise(r => setTimeout(r, 300));
        }

        // Check if book already exists
        const existsRes = await db.query('SELECT book_id FROM books WHERE isbn = $1', [book.isbn]);
        let bookId = null;
        if (existsRes.rows.length === 0) {
          // Insert new book with metadata and cover
          const insertRes = await db.query(
            `INSERT INTO books (isbn, title, author, publisher, publication_year, description, category, cover_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING book_id`,
            [book.isbn, title, author, publisher, publication_year, description, book.category, coverUrl]
          );
          if (insertRes.rows.length > 0) {
            bookId = insertRes.rows[0].book_id;
            booksAdded++;

            // Add 2-4 physical copies for newly inserted book
            const copies = Math.floor(Math.random() * 3) + 2; // 2-4 copies
            for (let i = 1; i <= copies; i++) {
              const barcode = `${book.isbn}-${String(i).padStart(3, '0')}`;
              const shelf = `${['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]}-${Math.floor(Math.random() * 20) + 1}`;

              await db.query(
                `INSERT INTO book_items (book_id, barcode, status, location)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (barcode) DO NOTHING`,
                [bookId, barcode, 'AVAILABLE', shelf]
              );
              copiesAdded++;
            }
          }
        } else {
          // Update existing book record with authoritative metadata (covers/titles may have been mismatched)
          bookId = existsRes.rows[0].book_id;
          try {
            await db.query(
              `UPDATE books SET title = $1, author = $2, publisher = $3, publication_year = $4, description = $5, category = $6, cover_url = $7 WHERE book_id = $8`,
              [title, author, publisher, publication_year, description, book.category, coverUrl, bookId]
            );
          } catch (uerr) {
            // ignore update errors
          }
        }

        // Progress indicator every 10
        if ((idx + 1) % 10 === 0) {
          console.log(`  📖 Progress: ${idx + 1}/${sampleBooks.length} books processed...`);
        }

      } catch (error) {
        console.error(`  ❌ Error processing ${book.title || book.isbn}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully added ${booksAdded} books with ${copiesAdded} physical copies`);
    
    // Summary statistics
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'MEMBER') as members,
        (SELECT COUNT(*) FROM users WHERE role = 'LIBRARIAN') as librarians,
        (SELECT COUNT(*) FROM books) as books,
        (SELECT COUNT(*) FROM book_items) as book_copies
    `);
    
    console.log('\n📊 Database Statistics:');
    console.log(`   Members: ${stats.rows[0].members}`);
    console.log(`   Librarians: ${stats.rows[0].librarians}`);
    console.log(`   Books: ${stats.rows[0].books}`);
    console.log(`   Book Copies: ${stats.rows[0].book_copies}`);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔐 Login Credentials:');
    console.log('   Librarian: admin@library.com / admin123');
    console.log('   Member: member@library.com / member123');
    console.log('   Sample Members: alice@example.com, bob@example.com, carol@example.com (all use: password123)');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeder
seedDatabase();
