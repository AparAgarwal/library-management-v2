import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, logout } from '../store/slices/authSlice';
import { GiBookshelf } from 'react-icons/gi';
import './Navbar.css';
import './AvatarMenu.css';
import './Navbar.css';

const Navbar = () => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const getAvatarUrl = () => {
    if (user?.avatarUrl) {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      return apiUrl.replace('/api', '') + user.avatarUrl;
    }
    return null;
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
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
              <div className="avatar-menu">
                <div className="avatar-circle">
                  {getAvatarUrl() ? (
                    <img src={getAvatarUrl()} alt="User avatar" className="avatar-img" />
                  ) : (
                    getInitials()
                  )}
                </div>
                <div className="avatar-dropdown">
                  <Link to="/profile">Profile</Link>
                  <button onClick={handleLogout} className="link-button">Logout</button>
                </div>
              </div>
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
