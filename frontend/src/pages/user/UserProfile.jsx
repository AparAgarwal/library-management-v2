import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { authAPI, usersAPI } from '../../services/api';
import { updateUserProfile } from '../../store/slices/authSlice';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCalendar, FaCamera, FaEdit, FaSave, FaTimes, FaTrash } from 'react-icons/fa';
import '../UserProfile.css';

export default function UserProfile() {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: ''
  });

  const getAvatarUrl = (avatarUrl) => {
    if (avatarUrl) {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      return apiUrl.replace('/api', '') + avatarUrl;
    }
    return null;
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getProfile();
      const userData = res.data.user || res.data;
      
      // Normalize field names
      const normalizedUser = {
        ...userData,
        first_name: userData.first_name || userData.firstName,
        last_name: userData.last_name || userData.lastName,
        avatar_url: userData.avatar_url || userData.avatarUrl,
        created_at: userData.created_at || userData.createdAt
      };
      
      setProfile(normalizedUser);
      setFormData({
        firstName: normalizedUser.first_name || '',
        lastName: normalizedUser.last_name || '',
        phone: normalizedUser.phone || '',
        address: normalizedUser.address || ''
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      setMessage({ text: 'Failed to load profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ text: 'Please select an image file', type: 'error' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'Image size must be less than 5MB', type: 'error' });
      return;
    }

    setUploading(true);
    setMessage({ text: '', type: '' });

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await usersAPI.updateAvatar(formData);
      const updatedUser = res.data.user;
      
      // Normalize field names
      const normalizedUser = {
        ...profile,
        ...updatedUser,
        first_name: updatedUser.first_name || updatedUser.firstName,
        last_name: updatedUser.last_name || updatedUser.lastName,
        avatar_url: updatedUser.avatar_url || updatedUser.avatarUrl
      };
      
      // Update local state
      setProfile(normalizedUser);
      
      // Update Redux store
      dispatch(updateUserProfile(normalizedUser));
      
      setMessage({ text: 'Avatar updated successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to upload avatar', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile.avatar_url) return;

    setUploading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await usersAPI.deleteAvatar();
      const updatedUser = res.data.user;
      
      // Normalize field names and remove avatar_url
      const normalizedUser = {
        ...profile,
        ...updatedUser,
        first_name: updatedUser.first_name || updatedUser.firstName,
        last_name: updatedUser.last_name || updatedUser.lastName,
        avatar_url: updatedUser.avatar_url || updatedUser.avatarUrl || null
      };
      
      // Update local state
      setProfile(normalizedUser);
      
      // Update Redux store
      dispatch(updateUserProfile(normalizedUser));
      
      setMessage({ text: 'Profile picture removed successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to remove avatar', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address
      };

      const res = await usersAPI.updateProfile(updateData);
      const updatedUser = res.data.user;
      
      // Normalize field names
      const normalizedUser = {
        ...profile,
        ...updatedUser,
        first_name: updatedUser.first_name || updatedUser.firstName || formData.firstName,
        last_name: updatedUser.last_name || updatedUser.lastName || formData.lastName,
        phone: updatedUser.phone || formData.phone,
        address: updatedUser.address || formData.address
      };
      
      // Update local state
      setProfile(normalizedUser);
      
      // Update form data to match
      setFormData({
        firstName: normalizedUser.first_name,
        lastName: normalizedUser.last_name,
        phone: normalizedUser.phone || '',
        address: normalizedUser.address || ''
      });
      
      // Update Redux store
      dispatch(updateUserProfile(normalizedUser));
      
      setEditing(false);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.error || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      phone: profile.phone || '',
      address: profile.address || ''
    });
    setMessage({ text: '', type: '' });
  };

  if (loading) {
    return <div className="loading-spinner">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="error-message">Failed to load profile</div>;
  }

  return (
    <div className="user-profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1><FaUser /> My Profile</h1>
          {!editing && (
            <button className="btn-edit" onClick={() => setEditing(true)}>
              <FaEdit /> Edit Profile
            </button>
          )}
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="profile-content">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-container">
              {getAvatarUrl(profile.avatar_url) ? (
                <img src={getAvatarUrl(profile.avatar_url)} alt="Profile" className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {profile.first_name?.[0]}{profile.last_name?.[0]}
                </div>
              )}
              {getAvatarUrl(profile.avatar_url) && (
                <button 
                  className="avatar-delete-btn" 
                  onClick={handleDeleteAvatar}
                  disabled={uploading}
                  title="Remove profile picture"
                >
                  <FaTrash />
                </button>
              )}
              <label className="avatar-upload-btn" htmlFor="avatar-upload">
                <FaCamera />
                {uploading ? 'Uploading...' : 'Change Photo'}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </div>
            <div className="avatar-info">
              <h2>{profile.first_name} {profile.last_name}</h2>
              <p className="user-role">{profile.role === 'LIBRARIAN' ? 'Librarian' : 'Member'}</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="profile-details">
            {editing ? (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="firstName">
                      <FaUser /> First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">
                      <FaUser /> Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      <FaEnvelope /> Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={profile.email}
                      disabled
                      className="disabled-input"
                    />
                    <small>Email cannot be changed</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">
                      <FaPhone /> Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="address">
                      <FaMapMarkerAlt /> Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your address"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save" disabled={saving}>
                    <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" className="btn-cancel" onClick={handleCancel}>
                    <FaTimes /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-info-grid">
                <div className="info-card">
                  <div className="info-icon">
                    <FaEnvelope />
                  </div>
                  <div className="info-content">
                    <label>Email</label>
                    <p>{profile.email}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">
                    <FaPhone />
                  </div>
                  <div className="info-content">
                    <label>Phone</label>
                    <p>{profile.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="info-card full-width">
                  <div className="info-icon">
                    <FaMapMarkerAlt />
                  </div>
                  <div className="info-content">
                    <label>Address</label>
                    <p>{profile.address || 'Not provided'}</p>
                  </div>
                </div>

                <div className="info-card">
                  <div className="info-icon">
                    <FaCalendar />
                  </div>
                  <div className="info-content">
                    <label>Member Since</label>
                    <p>{profile.created_at && !isNaN(new Date(profile.created_at).getTime()) 
                      ? new Date(profile.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'Not available'
                    }</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
