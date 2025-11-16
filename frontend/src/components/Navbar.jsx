import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logout } from '../store/slices/authSlice';
import { GiBookshelf } from 'react-icons/gi';
import './Navbar.css';

const Navbar = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  
  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <GiBookshelf size={32} /> Library System
        </Link>
        
        <div className="navbar-menu">
          <Link to="/" className="navbar-link">Home</Link>
          <Link to="/books" className="navbar-link">Books</Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className="navbar-link">
                {user.role === 'LIBRARIAN' ? 'Admin Dashboard' : 'My Dashboard'}
              </Link>
              <button onClick={handleLogout} className="navbar-button">
                Logout ({user.firstName || user.email})
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="navbar-button-link">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
