import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AppRoutes from './routes';
import { selectUser } from './store/slices/authSlice';
import './App.css';

function AppContent() {
  const location = useLocation();
  const path = location.pathname || '';
  const user = useSelector(selectUser);

  // Determine if this should use the admin (left sidebar) layout.
  const isAdminLayout = user?.role === 'LIBRARIAN' || path.startsWith('/admin');

  // Show top navbar for non-admin users (including regular dashboard)
  const showNavbar = !isAdminLayout;

  return (
    <div className={`App ${isAdminLayout ? 'admin-layout' : ''}`}>
      {showNavbar && <Navbar />}
      {isAdminLayout && <Sidebar user={user} />}
      <main className="main">
        <AppRoutes />
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
