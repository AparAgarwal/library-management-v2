import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { GiBookshelf } from 'react-icons/gi';
import { FaUserFriends, FaSearch, FaBolt, FaRegChartBar, FaUserShield } from "react-icons/fa";
import '../Home.css';

const Home = () => {
    const user = useSelector(selectUser);

    return (
        <div className="home-page">
            <section className="hero">
                <div className="hero-content">
                    <h1> Welcome to the Library Management System</h1>
                    <p>Your gateway to knowledge and learning</p>

                    {user ? (
                        <div className="hero-buttons">
                            <Link to="/books" className="hero-button primary">
                                Browse Books
                            </Link>
                            <Link to="/dashboard" className="hero-button secondary">
                                Go to Dashboard
                            </Link>
                        </div>
                    ) : (
                        <div className="hero-buttons">
                            <Link to="/register" className="hero-button primary">
                                Get Started
                            </Link>
                            <Link to="/login" className="hero-button secondary">
                                Login
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            <section className="features">
                <h2>Features</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon"><GiBookshelf size={44} /></div>
                        <h3>Browse Books</h3>
                        <p>Explore our extensive collection of books across various genres and categories.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon"><FaSearch size={40} /></div>
                        <h3>Search & Filter</h3>
                        <p>Easily find books by title, author, ISBN, or category with our powerful search.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon"><FaUserFriends size={44} /></div>
                        <h3>Member Portal</h3>
                        <p>Track your borrowed books, due dates, and manage your library account.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon"><FaRegChartBar size={44} /></div>
                        <h3>Library Statistics</h3>
                        <p>View real-time availability and manage your borrowing history.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon"><FaUserShield size={44} /></div>
                        <h3>Secure Access</h3>
                        <p>Your account and data are protected with industry-standard security.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon"><FaBolt size={44} /></div>
                        <h3>Fast & Efficient</h3>
                        <p>Quick checkout process and instant updates on book availability.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
