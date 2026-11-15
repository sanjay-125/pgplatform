import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StyledSelect } from '../../components/StyledSelect';
import { isValidEmail, isValidIndianPhone } from '../../utils/validation';

interface TenantProfileCreationProps {
  onContinueToDashboard: () => void;
}

interface FormState {
  name: string;
  phoneNumber: string;
  email: string;
  propertyId: string;
  pgName: string;
  bedNumber: string;
  roomNumber: string;
  roomSharingType: string;
  joiningDate: string;
  depositAmount: string;
  emergencyContactNumber: string;
}

interface FormErrors {
  name?: string;
  phoneNumber?: string;
  email?: string;
  propertyId?: string;
  pgName?: string;
  bedNumber?: string;
  roomNumber?: string;
  roomSharingType?: string;
  joiningDate?: string;
  depositAmount?: string;
  emergencyContactNumber?: string;
}

export const TenantProfileCreation: React.FC<TenantProfileCreationProps> = ({
  onContinueToDashboard,
}) => {
  const { user, activeProperty } = useAuth();

  // Initialize form state with sensible defaults so all fields are ready out of the box
  const [form, setForm] = useState<FormState>({
    name: user?.name || 'Arun Kumar',
    phoneNumber: user?.phone || '9876543210',
    email: user?.email || 'arun@staydesk.in',
    propertyId: activeProperty?.id ? String(activeProperty.id) : '1',
    pgName: activeProperty?.name || 'StayDesk Living PG',
    bedNumber: 'B-1',
    roomNumber: '101',
    roomSharingType: 'Single',
    joiningDate: new Date().toISOString().slice(0, 10),
    depositAmount: '5000',
    emergencyContactNumber: '9876543211',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const validateField = (name: keyof FormState, value: string): string | undefined => {
    const trimmed = value.trim();

    switch (name) {
      case 'name':
        if (!trimmed) return 'Name is required.';
        if (trimmed.length < 2) return 'Please enter at least 2 characters.';
        return undefined;

      case 'phoneNumber':
        if (!trimmed) return 'Phone Number is required.';
        if (!isValidIndianPhone(trimmed)) {
          return 'Enter a valid 10-digit Indian phone number starting with 6-9.';
        }
        return undefined;

      case 'email':
        if (!trimmed) return 'Email is required.';
        if (!isValidEmail(trimmed)) {
          return 'Enter a valid email address (e.g. tenant@example.com).';
        }
        return undefined;

      case 'propertyId':
        if (!trimmed) return 'Property ID is required.';
        return undefined;

      case 'pgName':
        if (!trimmed) return 'PG Name is required.';
        return undefined;

      case 'bedNumber':
        if (!trimmed) return 'Bed Number is required.';
        return undefined;

      case 'roomNumber':
        if (!trimmed) return 'Room Number is required.';
        return undefined;

      case 'roomSharingType':
        if (!trimmed) return 'Room Sharing Type is required. Please select an option.';
        return undefined;

      case 'joiningDate':
        if (!trimmed) return 'Joining Date is required.';
        return undefined;

      case 'depositAmount':
        if (!trimmed) return 'Deposit Amount Paid is required.';
        if (isNaN(Number(trimmed)) || Number(trimmed) < 0) {
          return 'Enter a valid non-negative deposit amount (e.g. 5000).';
        }
        return undefined;

      case 'emergencyContactNumber':
        if (!trimmed) return 'Emergency Contact Number is required.';
        if (!isValidIndianPhone(trimmed)) {
          return 'Enter a valid 10-digit Indian emergency phone number starting with 6-9.';
        }
        return undefined;

      default:
        return undefined;
    }
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check all fields for inline validation warnings if user touched them
    const fields: (keyof FormState)[] = [
      'name',
      'phoneNumber',
      'email',
      'propertyId',
      'pgName',
      'bedNumber',
      'roomNumber',
      'roomSharingType',
      'joiningDate',
      'depositAmount',
      'emergencyContactNumber',
    ];

    const newErrors: FormErrors = {};
    const newTouched: Record<string, boolean> = {};

    fields.forEach((field) => {
      newTouched[field] = true;
      const err = validateField(field, form[field]);
      if (err) {
        newErrors[field] = err;
      }
    });

    setTouched(newTouched);
    setErrors(newErrors);

    // UI-only dummy flow for now: always show the success message dialog and allow continuing to the dashboard view
    setShowSuccessModal(true);
  };

  const handleContinue = () => {
    setShowSuccessModal(false);
    // Navigate to tenant dashboard and ensure view scrolls to top
    if (window.location.pathname !== '/') {
      window.history.replaceState({}, '', '/');
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    onContinueToDashboard();
  };

  // Keyboard accessibility for modal
  useEffect(() => {
    if (!showSuccessModal) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        event.preventDefault();
        handleContinue();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSuccessModal]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 rounded-full bg-brand-700/60 text-brand-200 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-3 border border-brand-500/30">
            <UserCheck className="w-3.5 h-3.5" />
            Resident Onboarding
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tenant Profile Creation
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Please complete your stay and profile details to request tenant verification from your property management.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs font-semibold text-slate-200">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Account Verification Required</span>
        </div>
      </div>

      {/* Profile Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-900/5 overflow-hidden">
        <div className="px-6 py-4 sm:px-8 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Required Profile Information
            </span>
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Note / Help Banner */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-xs leading-relaxed text-brand-950">
            <Info className="h-4 w-4 shrink-0 text-brand-700 mt-0.5" aria-hidden="true" />
            <p>
              Please verify your personal and allocated room details carefully. This information is submitted to your property management for profile verification and stay records.
            </p>
          </div>

          {/* Form Fields: Ordered 1 to 11 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* 1. Name */}
            <div>
              <label
                htmlFor="field-name"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                1. Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="field-name"
                name="name"
                required
                aria-required="true"
                aria-invalid={errors.name ? 'true' : undefined}
                aria-describedby={errors.name ? 'error-name' : undefined}
                placeholder="e.g. Arun Kumar"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition ${
                  errors.name
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.name && (
                <p id="error-name" role="alert" className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* 2. Phone Number */}
            <div>
              <label
                htmlFor="field-phoneNumber"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                2. Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                id="field-phoneNumber"
                name="phoneNumber"
                inputMode="numeric"
                maxLength={10}
                required
                aria-required="true"
                aria-invalid={errors.phoneNumber ? 'true' : undefined}
                aria-describedby={errors.phoneNumber ? 'error-phoneNumber' : undefined}
                placeholder="10-digit mobile number"
                value={form.phoneNumber}
                onChange={(e) => handleChange('phoneNumber', e.target.value)}
                onBlur={() => handleBlur('phoneNumber')}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition ${
                  errors.phoneNumber
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.phoneNumber && (
                <p id="error-phoneNumber" role="alert" className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* 3. Email */}
            <div>
              <label
                htmlFor="field-email"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                3. Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                id="field-email"
                name="email"
                required
                aria-required="true"
                aria-invalid={errors.email ? 'true' : undefined}
                aria-describedby={errors.email ? 'error-email' : undefined}
                placeholder="e.g. arun@staydesk.in"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition ${
                  errors.email
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.email && (
                <p id="error-email" role="alert" className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* 4. Property ID */}
            <div>
              <label
                htmlFor="field-propertyId"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                4. Property ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="field-propertyId"
                name="propertyId"
                required
                aria-required="true"
                aria-invalid={errors.propertyId ? 'true' : undefined}
                aria-describedby={errors.propertyId ? 'error-propertyId' : undefined}
                placeholder="e.g. 1 or PROP-101"
                value={form.propertyId}
                onChange={(e) => handleChange('propertyId', e.target.value)}
                onBlur={() => handleBlur('propertyId')}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition ${
                  errors.propertyId
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.propertyId && (
                <p id="error-propertyId" role="alert" className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.propertyId}
                </p>
              )}
            </div>

            {/* 5. PG Name */}
            <div>
              <label
                htmlFor="field-pgName"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                5. PG Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="field-pgName"
                name="pgName"
                required
                aria-required="true"
                aria-invalid={errors.pgName ? 'true' : undefined}
                aria-describedby={errors.pgName ? 'error-pgName' : undefined}
                placeholder="e.g. StayDesk Premier PG"
                value={form.pgName}
                onChange={(e) => handleChange('pgName', e.target.value)}
                onBlur={() => handleBlur('pgName')}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition ${
                  errors.pgName
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.pgName && (
                <p id="error-pgName" role="alert" className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.pgName}
                </p>
              )}
            </div>

            {/* 6. Bed Number */}
            <div>
              <label
                htmlFor="field-bedNumber"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                6. Bed Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="field-bedNumber"
                name="bedNumber"
                required
                aria-required="true"
                aria-invalid={errors.bedNumber ? 'true' : undefined}
                aria-describedby={errors.bedNumber ? 'error-bedNumber' : undefined}
                placeholder="e.g. Bed-1 or B2"
                value={form.bedNumber}
                onChange={(e) => handleChange('bedNumber', e.target.value)}
                onBlur={() => handleBlur('bedNumber')}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition ${
                  errors.bedNumber
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.bedNumber && (
                <p id="error-bedNumber" role="alert" className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.bedNumber}
                </p>
              )}
            </div>

            {/* 7. Room Number */}
            <div>
              <label
                htmlFor="field-roomNumber"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                7. Room Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="field-roomNumber"
                name="roomNumber"
                required
                aria-required="true"
                aria-invalid={errors.roomNumber ? 'true' : undefined}
                aria-describedby={errors.roomNumber ? 'error-roomNumber' : undefined}
                placeholder="e.g. 101 or 204"
                value={form.roomNumber}
                onChange={(e) => handleChange('roomNumber', e.target.value)}
                onBlur={() => handleBlur('roomNumber')}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition ${
                  errors.roomNumber
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.roomNumber && (
                <p id="error-roomNumber" role="alert" className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.roomNumber}
                </p>
              )}
            </div>

            {/* 8. Room Sharing Type */}
            <div>
              <label
                htmlFor="field-roomSharingType"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                8. Room Sharing Type <span className="text-rose-500">*</span>
              </label>
              <StyledSelect
                id="field-roomSharingType"
                name="roomSharingType"
                value={form.roomSharingType}
                onValueChange={(val) => handleChange('roomSharingType', val)}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none transition ${
                  errors.roomSharingType
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              >
                <option value="">Select Sharing Type</option>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Triple">Triple</option>
                <option value="Shared">Shared</option>
              </StyledSelect>
              {errors.roomSharingType && (
                <p id="error-roomSharingType" role="alert" className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.roomSharingType}
                </p>
              )}
            </div>

            {/* 9. Joining Date */}
            <div>
              <label
                htmlFor="field-joiningDate"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                9. Joining Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="field-joiningDate"
                name="joiningDate"
                required
                aria-required="true"
                aria-invalid={errors.joiningDate ? 'true' : undefined}
                aria-describedby={errors.joiningDate ? 'error-joiningDate' : undefined}
                value={form.joiningDate}
                onChange={(e) => handleChange('joiningDate', e.target.value)}
                onBlur={() => handleBlur('joiningDate')}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none transition ${
                  errors.joiningDate
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.joiningDate && (
                <p id="error-joiningDate" role="alert" className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.joiningDate}
                </p>
              )}
            </div>

            {/* 10. Deposit Amount Paid */}
            <div>
              <label
                htmlFor="field-depositAmount"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                10. Deposit Amount Paid (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="field-depositAmount"
                name="depositAmount"
                required
                aria-required="true"
                aria-invalid={errors.depositAmount ? 'true' : undefined}
                aria-describedby={errors.depositAmount ? 'error-depositAmount' : undefined}
                placeholder="e.g. 5000"
                value={form.depositAmount}
                onChange={(e) => handleChange('depositAmount', e.target.value)}
                onBlur={() => handleBlur('depositAmount')}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition ${
                  errors.depositAmount
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.depositAmount && (
                <p id="error-depositAmount" role="alert" className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.depositAmount}
                </p>
              )}
            </div>

            {/* 11. Emergency Contact Number */}
            <div className="md:col-span-2">
              <label
                htmlFor="field-emergencyContactNumber"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                11. Emergency Contact Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                id="field-emergencyContactNumber"
                name="emergencyContactNumber"
                inputMode="numeric"
                maxLength={10}
                required
                aria-required="true"
                aria-invalid={errors.emergencyContactNumber ? 'true' : undefined}
                aria-describedby={errors.emergencyContactNumber ? 'error-emergencyContactNumber' : undefined}
                placeholder="10-digit emergency contact (parent / guardian)"
                value={form.emergencyContactNumber}
                onChange={(e) => handleChange('emergencyContactNumber', e.target.value)}
                onBlur={() => handleBlur('emergencyContactNumber')}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition ${
                  errors.emergencyContactNumber
                    ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                    : 'border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'
                }`}
              />
              {errors.emergencyContactNumber && (
                <p id="error-emergencyContactNumber" role="alert" className="mt-1 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.emergencyContactNumber}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
              Submission sends a profile verification request to your property representative.
            </p>

            <button
              type="submit"
              className="w-full sm:w-auto min-w-[280px] py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-600/25 transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 flex items-center justify-center gap-2"
            >
              <span>Submit Profile Creation Request</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal Pop-up (Centered Modal, No X button, Single clear Action) */}
      {showSuccessModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 text-center text-slate-900 animate-in fade-in zoom-in-95 duration-150">
            {/* Status Icon in StayDesk Blue */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 mb-4 shadow-sm">
              <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
            </div>

            {/* Title */}
            <h3 id="success-modal-title" className="text-lg font-black text-slate-900 tracking-tight">
              Profile Request Submitted
            </h3>

            {/* Exact Required Message */}
            <p className="mt-2.5 text-xs font-semibold leading-relaxed text-slate-600">
              Profile creation request submitted successfully! You will be notified after successful account verification.
            </p>

            {/* Single Clear Action Button: Continue to Dashboard in StayDesk Blue */}
            <div className="mt-6">
              <button
                type="button"
                autoFocus
                onClick={handleContinue}
                className="w-full py-3 px-5 rounded-xl font-bold text-xs sm:text-sm text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/25 transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 flex items-center justify-center gap-2"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
