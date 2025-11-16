import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MemberDashboard from './MemberDashboard';
import LibrarianDashboard from './LibrarianDashboard';
import ProtectedRoute from '../../components/ProtectedRoute';
import { selectUser } from '../../store/slices/authSlice';

const DashboardRouter = () => {
    const user = useSelector(selectUser);
    const userRole = user?.role?.toLowerCase() || 'member';

    return (
        <Routes>
            <Route path="member" element={<ProtectedRoute allowedRoles={["member"]}><MemberDashboard /></ProtectedRoute>} />
            <Route path="admin" element={<ProtectedRoute allowedRoles={["librarian"]}><LibrarianDashboard /></ProtectedRoute>} />
            <Route path="" element={<Navigate to={userRole === 'librarian' ? 'admin' : 'member'} replace />} />
        </Routes>
    );
};

export default DashboardRouter;
