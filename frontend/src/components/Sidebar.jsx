import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import './Sidebar.css';
import { GiHamburgerMenu } from 'react-icons/gi';
import {
  PiHouseFill,
  PiBooksFill,
  PiLayoutFill,
  PiUsersFill,
  PiClockFill,
  PiCurrencyDollarFill,
} from "react-icons/pi";


const Sidebar = ({ user }) => {
  const [collapsed, setCollapsed] = useState(false);
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
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'G';
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top">
        <button className="hamburger" onClick={() => setCollapsed(!collapsed)}>
          <GiHamburgerMenu size={20} />
        </button>
        <Link to="/" className="sidebar-logo">
          <span className="logo-text">Library System</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {/* We wrap the text in a <span> to style it separately */}
        <Link to="/" className="side-link"><PiHouseFill size={20} /> <span className="link-text">Home</span></Link>
        <Link to="/books" className="side-link"><PiBooksFill size={20} /> <span className="link-text">Books</span></Link>
        <Link to="/dashboard" className="side-link"><PiLayoutFill size={20} /> <span className="link-text">Dashboard</span></Link>
        <Link to="/admin/members" className="side-link"><PiUsersFill size={20} /> <span className="link-text">Members</span></Link>
        <Link to="/admin/overdue" className="side-link"><PiClockFill size={20} /> <span className="link-text">Overdue</span></Link>
        <Link to="/admin/fines" className="side-link"><PiCurrencyDollarFill size={20} /> <span className="link-text">Fines</span></Link>
      </nav>

      <div className="sidebar-footer">
        <Link to="/profile" className="avatar-placeholder">
          {getAvatarUrl() ? (
            <img src={getAvatarUrl()} alt="User avatar" className="sidebar-avatar-img" />
          ) : (
            getInitials()
          )}
        </Link>
        <div className="avatar-info">
          <div className="username">{user ? user.firstName + ' ' + user.lastName || user.email : 'Guest'}</div>
          {user ? (
            <button onClick={handleLogout} className="logout-link">Logout</button>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="side-link">Login</Link>
              <Link to="/register" className="side-link">Register</Link>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;