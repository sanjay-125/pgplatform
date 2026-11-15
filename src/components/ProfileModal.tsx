import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  PhoneCall,
  Mail,
  KeyRound,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  Pencil,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { api } from '../services/api';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user, activeProperty, updateUser } = useAuth();
  const { showToast } = useToast();

  const [profileData, setProfileData] = useState({
    name: user?.name || 'Arun Kumar',
    phone: user?.phone || '9876543210',
    emergencyPhone: '9876543211',
    email: user?.email || 'arun@staydesk.in',
    pgName: activeProperty?.name || 'StayDesk Living PG',
  });

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || 'Arun Kumar',
    phone: user?.phone || '9876543210',
    emergencyPhone: '9876543211',
    email: user?.email || 'arun@staydesk.in',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Password Change Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Delete Account Confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Attempt to load live tenant stay data if available
    if (user?.role === 'tenant') {
      api
        .getTenantMe()
        .then((data) => {
          if (data) {
            setProfileData({
              name: data.name || user?.name || 'Arun Kumar',
              phone: data.phone || user?.phone || '9876543210',
              emergencyPhone: data.emergency_phone || '9876543211',
              email: data.email || user?.email || 'arun@staydesk.in',
              pgName: data.property_name || activeProperty?.name || 'StayDesk Living PG',
            });
          }
        })
        .catch(() => {
          // Graceful fallback to default/auth values
        });
    }
  }, [user, activeProperty]);

  // Handle password change submission
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    // Success flow (UI placeholder for password update)
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    showToast('Password updated successfully!');
  };

  // Handle delete account confirmation
  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    showToast('Account deletion request submitted to administration.', 'info');
  };

  // Handle start editing
  const handleStartEdit = () => {
    setEditForm({
      name: profileData.name,
      phone: profileData.phone,
      emergencyPhone: profileData.emergencyPhone,
      email: profileData.email,
    });
    setFormErrors({});
    setIsEditing(true);
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setFormErrors({});
    setIsEditing(false);
  };

  // Handle save profile details
  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!editForm.name.trim()) {
      errors.name = 'Name is required';
    }

    const cleanPhone = editForm.phone.replace(/[\s\-()]/g, '');
    if (!editForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (cleanPhone.length < 10) {
      errors.phone = 'Enter at least 10 digits';
    }

    const cleanEmergency = editForm.emergencyPhone.replace(/[\s\-()]/g, '');
    if (!editForm.emergencyPhone.trim()) {
      errors.emergencyPhone = 'Emergency phone is required';
    } else if (cleanEmergency.length < 10) {
      errors.emergencyPhone = 'Enter at least 10 digits';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(editForm.email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const updated = {
      ...profileData,
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      emergencyPhone: editForm.emergencyPhone.trim(),
      email: editForm.email.trim(),
    };

    setProfileData(updated);
    if (updateUser) {
      updateUser({
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
      });
    }

    setIsEditing(false);
    setFormErrors({});
    showToast('Profile details updated successfully!');
  };

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPasswordModal) {
          setShowPasswordModal(false);
        } else if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (isEditing) {
          setIsEditing(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPasswordModal, showDeleteConfirm, isEditing, onClose]);

  const initials = profileData.name
    ? profileData.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-slate-900 relative">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center font-bold text-brand-700 text-xs shadow-sm">
              {initials}
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">My Profile</h2>
              <p className="text-[10px] font-semibold text-slate-500">
                {user?.role === 'tenant'
                  ? 'Tenant Account'
                  : user?.role === 'owner'
                  ? 'PG Owner Account'
                  : 'Super Admin Account'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Profile"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[85vh]">
          {/* User Overview Card */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 truncate">
                  {profileData.name}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Tenant
                </span>
              </div>
              <p className="text-[11px] font-semibold text-brand-600 mt-0.5 truncate">
                {profileData.pgName}
              </p>
            </div>
          </div>

          {/* Profile Details Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                {isEditing ? (
                  <>
                    <Pencil className="w-3 h-3 text-brand-600" />
                    <span className="text-brand-700">Editing Profile Details</span>
                  </>
                ) : (
                  'Profile Details'
                )}
              </h4>
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/80 transition border border-brand-200/60 shadow-2xs"
                >
                  <Pencil className="w-3 h-3" />
                  Edit Details
                </button>
              )}
            </div>

            {!isEditing ? (
              /* View Mode - 4 Cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Name */}
                <div className="px-3 py-2 bg-slate-50/70 border border-slate-200/70 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Name
                  </span>
                  <div className="mt-0.5 flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {profileData.name}
                    </span>
                  </div>
                </div>

                {/* Contact Number */}
                <div className="px-3 py-2 bg-slate-50/70 border border-slate-200/70 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Contact Number
                  </span>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {profileData.phone}
                    </span>
                  </div>
                </div>

                {/* Emergency Contact Number */}
                <div className="px-3 py-2 bg-slate-50/70 border border-slate-200/70 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Emergency Contact
                  </span>
                  <div className="mt-0.5 flex items-center gap-2">
                    <PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {profileData.emergencyPhone}
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div className="px-3 py-2 bg-slate-50/70 border border-slate-200/70 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Email
                  </span>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {profileData.email}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Mode - Interactive Form Fields */
              <form onSubmit={handleSaveEdit} className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Name Input */}
                  <div
                    className={`px-3 py-1.5 bg-white border ${
                      formErrors.name
                        ? 'border-rose-400 ring-1 ring-rose-200'
                        : 'border-brand-300 ring-1 ring-brand-100'
                    } rounded-xl shadow-xs transition`}
                  >
                    <label
                      htmlFor="profile-edit-name"
                      className="text-[9px] font-bold text-brand-700 uppercase tracking-wider block"
                    >
                      Name *
                    </label>
                    <div className="mt-0.5 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <input
                        id="profile-edit-name"
                        type="text"
                        value={editForm.name}
                        onChange={(e) => {
                          setEditForm({ ...editForm, name: e.target.value });
                          if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                        }}
                        placeholder="Full Name"
                        className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 py-0.5"
                        autoFocus
                      />
                    </div>
                    {formErrors.name && (
                      <p className="text-[9px] text-rose-500 font-bold mt-0.5 leading-none">
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Contact Number Input */}
                  <div
                    className={`px-3 py-1.5 bg-white border ${
                      formErrors.phone
                        ? 'border-rose-400 ring-1 ring-rose-200'
                        : 'border-brand-300 ring-1 ring-brand-100'
                    } rounded-xl shadow-xs transition`}
                  >
                    <label
                      htmlFor="profile-edit-phone"
                      className="text-[9px] font-bold text-brand-700 uppercase tracking-wider block"
                    >
                      Contact Number *
                    </label>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <input
                        id="profile-edit-phone"
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => {
                          setEditForm({ ...editForm, phone: e.target.value });
                          if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                        }}
                        placeholder="10-digit phone"
                        className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 py-0.5"
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-[9px] text-rose-500 font-bold mt-0.5 leading-none">
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Emergency Contact Input */}
                  <div
                    className={`px-3 py-1.5 bg-white border ${
                      formErrors.emergencyPhone
                        ? 'border-rose-400 ring-1 ring-rose-200'
                        : 'border-brand-300 ring-1 ring-brand-100'
                    } rounded-xl shadow-xs transition`}
                  >
                    <label
                      htmlFor="profile-edit-emergency"
                      className="text-[9px] font-bold text-brand-700 uppercase tracking-wider block"
                    >
                      Emergency Contact *
                    </label>
                    <div className="mt-0.5 flex items-center gap-2">
                      <PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <input
                        id="profile-edit-emergency"
                        type="tel"
                        value={editForm.emergencyPhone}
                        onChange={(e) => {
                          setEditForm({ ...editForm, emergencyPhone: e.target.value });
                          if (formErrors.emergencyPhone)
                            setFormErrors({ ...formErrors, emergencyPhone: '' });
                        }}
                        placeholder="Emergency contact"
                        className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 py-0.5"
                      />
                    </div>
                    {formErrors.emergencyPhone && (
                      <p className="text-[9px] text-rose-500 font-bold mt-0.5 leading-none">
                        {formErrors.emergencyPhone}
                      </p>
                    )}
                  </div>

                  {/* Email Input */}
                  <div
                    className={`px-3 py-1.5 bg-white border ${
                      formErrors.email
                        ? 'border-rose-400 ring-1 ring-rose-200'
                        : 'border-brand-300 ring-1 ring-brand-100'
                    } rounded-xl shadow-xs transition`}
                  >
                    <label
                      htmlFor="profile-edit-email"
                      className="text-[9px] font-bold text-brand-700 uppercase tracking-wider block"
                    >
                      Email *
                    </label>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <input
                        id="profile-edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => {
                          setEditForm({ ...editForm, email: e.target.value });
                          if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                        }}
                        placeholder="Email address"
                        className="w-full text-xs font-bold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 py-0.5"
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-[9px] text-rose-500 font-bold mt-0.5 leading-none">
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit Form Actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition active:scale-[0.98]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Update Profile
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Actions Section: Short buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Account Security &amp; Settings
            </h4>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Change Password (short button) */}
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-brand-300 bg-white hover:bg-brand-50/50 text-slate-800 transition group shadow-sm active:scale-[0.99]"
              >
                <div className="w-6 h-6 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100 group-hover:bg-brand-600 group-hover:text-white transition">
                  <KeyRound className="w-3 h-3" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-brand-700 transition">
                  Change Password
                </span>
              </button>

              {/* Delete Account (short button) */}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50/50 text-slate-800 transition group shadow-sm active:scale-[0.99]"
              >
                <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition">
                  <Trash2 className="w-3 h-3" />
                </div>
                <span className="text-xs font-bold text-rose-700 group-hover:text-rose-800 transition">
                  Delete Account
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Password Change Pop-up Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-200">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Change Password</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError('');
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              {passwordError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Current Password *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    placeholder="Enter current password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 pr-9 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    placeholder="Enter new password (min. 6 chars)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 pr-9 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 pr-9 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Account Confirmation Pop-up Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center text-slate-900">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">Delete Account</h3>
            <p className="mt-2 text-xs font-medium text-slate-600 leading-relaxed">
              Are you sure you want to delete your account? This action will submit an account removal request to administration.
            </p>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
