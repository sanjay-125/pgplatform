import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Eye,
  EyeOff,
  FileText,
  Info,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCog,
  UserRoundCheck,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { StyledSelect } from '../components/StyledSelect';
import { ButtonSpinner } from '../components/LoadingStates';
import type { UserRole } from '../types';
import { EMAIL_PATTERN, isValidEmail, isValidIndianPhone } from '../utils/validation';

type PublicRole = 'admin' | 'tenant' | 'superadmin';
type AuthMode = 'login' | 'signup';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-800 placeholder:text-slate-400 transition focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10';
const passwordPattern = '^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$';
const passwordRule = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
const developmentDemoAccounts: Record<UserRole, { email: string; password: string }> = {
  owner: { email: 'owner@staydesk.in', password: 'Owner@123' },
  tenant: { email: 'arun@staydesk.in', password: 'Tenant@123' },
  superadmin: { email: 'superadmin@staydesk.in', password: 'SuperAdmin@123' },
};

const routeFor = (role: PublicRole, mode: AuthMode) => {
  if (role === 'superadmin') return mode === 'signup' ? '/superadminsignup' : '/superadminlogin';
  if (role === 'admin') return mode === 'signup' ? '/adminsignup' : '/adminlogin';
  return mode === 'signup' ? '/tenantsignup' : '/tenantlogin';
};

const authRoleFor = (role: PublicRole): UserRole => role === 'admin' ? 'owner' : role;

const normalizePath = (pathname: string) => pathname.replace(/\/+$/, '').toLowerCase() || '/';

const roleDetails: Record<PublicRole, {
  title: string;
  cardTitle: string;
  loginTitle: string;
  description: string;
  Icon: LucideIcon;
}> = {
  admin: {
    title: 'Admin',
    cardTitle: 'Admin',
    loginTitle: 'Login as Admin',
    description: 'Manages assigned properties with owner-defined permission.',
    Icon: UserCog,
  },
  tenant: {
    title: 'Tenant',
    cardTitle: 'Tenant',
    loginTitle: 'Login as Tenant',
    description: 'Manage your own profile and accommodation details.',
    Icon: UserRoundCheck,
  },
  superadmin: {
    title: 'Super Admin',
    cardTitle: 'Super Admin',
    loginTitle: 'Login as Super Admin',
    description: 'Owns and oversees the entire accommodation business.',
    Icon: Building2,
  },
};

function AuthShell({
  children,
  width = 'max-w-4xl',
}: {
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 px-4 py-2 text-white selection:bg-brand-500 selection:text-white sm:px-6 sm:py-2">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full bg-brand-600/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -left-36 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />
      <main className={'relative z-10 mx-auto flex w-full flex-1 flex-col justify-center py-1 sm:py-1 ' + width}>
        {children}
      </main>
      <footer className="relative z-10 mx-auto w-full max-w-6xl pt-1 text-center text-[11px] font-medium text-slate-400">
        A Product From PinnacleStride
      </footer>
    </div>
  );
}

function navigateLink(event: React.MouseEvent<HTMLAnchorElement>, navigate: (path: string) => void, path: string) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(path);
}

function RoleCard({
  role,
  navigate,
}: {
  role: PublicRole;
  navigate: (path: string) => void;
}) {
  const detail = roleDetails[role];
  const Icon = detail.Icon;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-extrabold tracking-tight">{detail.cardTitle}</h3>
      <p
        title={detail.description}
        className="mt-1 min-h-4 text-[11px] leading-4 text-slate-500 lg:truncate lg:whitespace-nowrap"
      >
        {detail.description}
      </p>
      <div className="mt-3 grid gap-2">
        <a
          href={routeFor(role, 'login')}
          onClick={(event) => navigateLink(event, navigate, routeFor(role, 'login'))}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
        >
          Log in <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
        <a
          href={routeFor(role, 'signup')}
          onClick={(event) => navigateLink(event, navigate, routeFor(role, 'signup'))}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50/60 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
        >
          Create account
        </a>
      </div>
    </article>
  );
}

function LandingPage({ navigate }: { navigate: (path: string) => void }) {
  return (
    <AuthShell width="max-w-6xl">
      <div className="mx-auto mb-4 max-w-2xl text-center sm:mb-5">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
          Welcome to StayDesk
        </h1>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-brand-300/20 bg-brand-500/10 px-3 py-1.5 text-[9px] font-bold tracking-wide text-brand-200 sm:mt-5 sm:text-[11px]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Simplifying Accommodation. Empowering Smarter Living
        </div>
      </div>

      <section aria-labelledby="choose-account-heading" className="rounded-3xl border border-white/70 bg-white p-4 text-slate-900 shadow-2xl shadow-slate-950/30 sm:p-5">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="choose-account-heading" className="text-lg font-extrabold tracking-tight sm:text-xl">Choose your account</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">Log in or create an account as a tenant, admin manager, or original PG owner.</p>
          </div>
          <span className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 sm:mt-0">
            <BadgeCheck className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
            Secure role-based access
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <RoleCard role="tenant" navigate={navigate} />
          <RoleCard role="admin" navigate={navigate} />
          <RoleCard role="superadmin" navigate={navigate} />
        </div>
      </section>
    </AuthShell>
  );
}

function TextField({
  label,
  hint,
  icon: Icon,
  wrapperClassName,
  id,
  name,
  required,
  type,
  pattern,
  onBlur,
  onChange,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  icon?: LucideIcon;
  wrapperClassName?: string;
}) {
  const [emailInvalid, setEmailInvalid] = useState(false);
  const fieldId = id || name || label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const hintId = hint ? fieldId + '-hint' : undefined;
  const isEmail = type === 'email';
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
    if (isEmail) {
      setEmailInvalid(Boolean(event.currentTarget.value) && !isValidEmail(event.currentTarget.value));
    }
  };
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    if (isEmail && emailInvalid) {
      setEmailInvalid(Boolean(event.currentTarget.value) && !isValidEmail(event.currentTarget.value));
    }
  };
  return (
    <div className={'min-w-0 ' + (wrapperClassName || '')}>
      <label htmlFor={fieldId} className="mb-1.5 flex items-center gap-1 text-xs font-bold text-slate-700">
        {label}
        {required && <span className="text-brand-700" aria-label="required">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
        <input
          {...props}
          id={fieldId}
          name={name}
          type={type}
          required={required}
          pattern={isEmail ? EMAIL_PATTERN : pattern}
          onBlur={handleBlur}
          onChange={handleChange}
          aria-describedby={hintId}
          aria-invalid={emailInvalid || undefined}
          className={inputClass + (Icon ? ' pl-10' : '') + (emailInvalid ? ' input-format-invalid' : '')}
        />
      </div>
      {hint && <p id={hintId} className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  required = true,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1.5 flex items-center gap-1 text-xs font-bold text-slate-700">
        {label}{required && <span className="text-brand-700" aria-label="required">*</span>}
      </label>
      <StyledSelect
        id={name}
        name={name}
        required={required}
        defaultValue=""
        className={inputClass + ' pr-3'}
      >
        <option value="" disabled>Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </StyledSelect>
    </div>
  );
}

function PhoneField({ label, name }: { label: string; name: string }) {
  const [formatInvalid, setFormatInvalid] = useState(false);
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1.5 flex items-center gap-1 text-xs font-bold text-slate-700">
        {label}<span className="text-brand-700" aria-label="required">*</span>
      </label>
      <div className={'flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/10' + (formatInvalid ? ' input-format-invalid' : '')}>
        <input
          id={name}
          name={name}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          pattern="[6-9][0-9]{9}"
          maxLength={10}
          title="Enter a valid 10-digit Indian contact number."
          placeholder="9876543210"
          aria-invalid={formatInvalid || undefined}
          onBlur={(event) => setFormatInvalid(Boolean(event.currentTarget.value) && !isValidIndianPhone(event.currentTarget.value))}
          onChange={(event) => {
            if (formatInvalid) {
              setFormatInvalid(Boolean(event.currentTarget.value) && !isValidIndianPhone(event.currentTarget.value));
            }
          }}
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
    </div>
  );
}

function PasswordField({
  label,
  name,
  required = true,
  hint,
  minLength,
  pattern,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  minLength?: number;
  pattern?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const hintId = name + '-hint';
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center gap-1">
        <label htmlFor={name} className="flex items-center gap-1 text-xs font-bold text-slate-700">
          {label}{required && <span className="text-brand-700" aria-label="required">*</span>}
        </label>
        {hint && (
          <span className="relative inline-flex">
            <button
              type="button"
              aria-label="Show password requirements"
              aria-expanded={showHint}
              aria-controls={hintId + '-popover'}
              onClick={() => setShowHint((value) => !value)}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-brand-600 transition hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            {showHint && (
              <span
                id={hintId + '-popover'}
                role="tooltip"
                className="absolute bottom-full left-0 z-30 mb-2 w-64 max-w-[calc(100vw-3rem)] rounded-lg border border-brand-100 bg-white px-3 py-2 text-[11px] font-medium leading-relaxed text-slate-700 shadow-lg"
              >
                {hint}
              </span>
            )}
          </span>
        )}
      </div>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          pattern={pattern}
          title={pattern ? 'Use at least 8 characters, with one uppercase letter, one number, and one special character.' : undefined}
          autoComplete={autoComplete || 'new-password'}
          value={value}
          onChange={onChange}
          aria-describedby={hint ? hintId : undefined}
          className={inputClass + ' auth-password-input pl-10 pr-11'}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-transparent text-brand-600 transition hover:bg-transparent hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {hint && <p id={hintId} className="sr-only">{hint}</p>}
    </div>
  );
}

function ForgotPasswordDialog({
  initialEmail,
  onClose,
}: {
  initialEmail: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'done'>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSendCode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStep('code');
    setNotice('Preview only: email delivery is not connected. Enter any 6 digits to preview the next step.');
  };

  const handleVerifyCode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStep('password');
    setNotice('Code verification is preview-only; no code was actually verified.');
  };

  const handleSetPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get('newPassword') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');
    if (!passwordRule.test(newPassword)) {
      setError('Use at least 8 characters with one uppercase letter, one number, and one special character.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setError('');
    setStep('done');
    setNotice('');
  };

  const title = step === 'password' ? 'Set a new password' : step === 'done' ? 'Reset preview complete' : 'Reset your password';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-700">Account recovery</p>
            <h2 id="forgot-password-title" className="mt-1 text-lg font-extrabold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close password reset"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-5">
          {step === 'email' && (
            <>
              <p className="text-xs leading-relaxed text-slate-500">Enter the email for your StayDesk account.</p>
              <form onSubmit={handleSendCode} className="space-y-4">
                <TextField
                  id="reset-email"
                  name="resetEmail"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  icon={Mail}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25"
                >
                  Send verification code
                </button>
              </form>
            </>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              {notice && (
                <p role="status" className="rounded-xl border border-brand-100 bg-brand-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-brand-900">
                  {notice}
                </p>
              )}
              <TextField
                id="reset-code"
                name="verificationCode"
                label="Verification code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                pattern="[0-9]{6}"
                maxLength={6}
                title="Enter the 6-digit verification code."
                placeholder="6-digit code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25"
              >
                Verify
              </button>
            </form>
          )}

          {step === 'password' && (
            <>
              {notice && (
                <p role="status" className="rounded-xl border border-brand-100 bg-brand-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-brand-900">
                  {notice}
                </p>
              )}
              <form onSubmit={handleSetPassword} className="space-y-4">
                <PasswordField
                  name="newPassword"
                  label="New Password"
                  required
                  minLength={8}
                  pattern={passwordPattern}
                  hint="At least 8 characters, including one uppercase letter, one number, and one special character."
                />
                <PasswordField
                  name="confirmPassword"
                  label="Confirm Password"
                  required
                  minLength={8}
                />
                {error && <p role="alert" className="text-xs font-semibold text-rose-700">{error}</p>}
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25"
                >
                  Set Password
                </button>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Check className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-sm font-bold text-slate-800">Password reset is not connected yet. No password was changed.</p>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-extrabold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/25"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-10 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 hover:shadow-md hover:shadow-brand-600/10 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
    >
      <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 text-[12px] font-extrabold text-brand-600">G</span>
      Sign in with Google
    </button>
  );
}

function BackToAccounts({ navigate }: { navigate: (path: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => navigate('/')}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-bold text-white transition hover:border-brand-400 hover:bg-brand-600 hover:text-white hover:shadow-lg hover:shadow-brand-600/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/30"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
    </button>
  );
}

function LoginForm({
  role,
  navigate,
}: {
  role: PublicRole;
  navigate: (path: string) => void;
}) {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const authRole = authRoleFor(role);
  const detail = roleDetails[role];
  const Icon = detail.Icon;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const enteredEmail = email.trim();
    const isEmptyDevShortcut = import.meta.env.DEV && !enteredEmail && !password;
    if (!isEmptyDevShortcut && (!enteredEmail || !password)) {
      showToast('Please enter both email and password.', 'error');
      return;
    }
    const credentials = isEmptyDevShortcut
      ? developmentDemoAccounts[authRole]
      : { email: enteredEmail, password };
    setLoading(true);
    try {
      await login(credentials.email, credentials.password, authRole);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to sign in. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell width="max-w-md">
      <div className="mb-4"><BackToAccounts navigate={navigate} /></div>
      <section aria-labelledby="login-heading" className="rounded-3xl bg-white p-4 text-slate-900 shadow-2xl shadow-slate-950/30 sm:p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-700">{detail.title} account</p>
            <h1 id="login-heading" className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">{detail.loginTitle}</h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{detail.description}</p>
          </div>
        </div>

        <form noValidate={import.meta.env.DEV} onSubmit={handleSubmit} className="space-y-2.5" aria-busy={loading}>
          <TextField
            id="login-email"
            name="email"
            label="Email"
            type="email"
            autoComplete="username"
            required
            icon={Mail}
            placeholder="name@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <div>
            <PasswordField
              label="Password"
              name="login-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="rounded text-xs font-bold text-brand-700 transition hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Forgot password?
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
          >
            {loading ? (
              <ButtonSpinner label="Signing in..." />
            ) : import.meta.env.DEV && !email.trim() && !password ? (
              'Enter demo portal'
            ) : (
              'Sign in'
            )}
            {!loading && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
          {import.meta.env.DEV && !email.trim() && !password && (
            <p className="text-center text-[10px] leading-relaxed text-slate-400">
              Development shortcut: open the demo {detail.title.toLowerCase()} account without credentials.
            </p>
          )}
        </form>

        <div className="mt-2 border-t border-slate-100 pt-2">
          <div className="mb-2 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="h-px flex-1 bg-slate-100" />
            or
            <span className="h-px flex-1 bg-slate-100" />
          </div>
          <GoogleButton onClick={() => showToast('Google sign-in is not connected yet.', 'info')} />
        </div>

        <p className="mt-3 border-t border-slate-100 pt-3 text-center text-xs text-slate-500">
          New to StayDesk?{' '}
          <a
            href={routeFor(role, 'signup')}
            onClick={(event) => navigateLink(event, navigate, routeFor(role, 'signup'))}
            className="font-extrabold text-brand-700 hover:text-brand-900 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Create a {detail.title} account
          </a>
        </p>
      </section>
      {showForgotPassword && (
        <ForgotPasswordDialog
          initialEmail={email.trim()}
          onClose={() => setShowForgotPassword(false)}
        />
      )}
    </AuthShell>
  );
}

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0 sm:pt-5">
      <div className="mb-3">
        <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{subtitle}</p>}
      </div>
      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function FileField({ label, name, multiple = false }: { label: string; name: string; multiple?: boolean }) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1.5 flex items-center gap-1 text-xs font-bold text-slate-700">
        {label}<span className="ml-1 text-[10px] font-medium text-slate-400">(optional)</span>
      </label>
      <label
        htmlFor={name}
        className="flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-3 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:bg-brand-50/50 focus-within:ring-4 focus-within:ring-brand-500/10"
      >
        <FileText className="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">
          {selectedFiles.length
            ? (multiple ? selectedFiles.length + ' file(s) selected' : selectedFiles[0])
            : 'Choose ' + (multiple ? 'documents' : 'a file')}
        </span>
        <input
          id={name}
          name={name}
          type="file"
          multiple={multiple}
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={(event) => setSelectedFiles(Array.from(event.target.files || []).map((file) => file.name))}
        />
      </label>
      <p className="mt-1.5 text-[10px] text-slate-400">PDF, JPG, or PNG</p>
    </div>
  );
}

function TermsCheckbox({
  name,
  children,
  missing,
  onChange,
}: {
  name: string;
  children: React.ReactNode;
  missing: boolean;
  onChange: (name: string, checked: boolean) => void;
}) {
  const errorId = name + '-required-error';
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-slate-600">
        <input
          type="checkbox"
          name={name}
          required
          aria-required={true}
          aria-invalid={missing || undefined}
          aria-describedby={missing ? errorId : undefined}
          onChange={(event) => {
            onChange(name, event.currentTarget.checked);
          }}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <span>
          {children}
          <span className="ml-0.5 font-bold text-brand-700" aria-hidden="true">*</span>
          <span className="sr-only"> Required</span>
        </span>
      </label>
      {missing && (
        <p id={errorId} role="alert" className="ml-6 mt-1 text-[11px] font-medium text-rose-700">
          This agreement is required to continue.
        </p>
      )}
    </div>
  );
}

function PolicyDialog({
  kind,
  role,
  onClose,
}: {
  kind: 'terms' | 'privacy';
  role: PublicRole;
  onClose: () => void;
}) {
  const isTerms = kind === 'terms';
  const title = isTerms ? 'Terms & Conditions' : 'Privacy Policy';
  const accessTerms = role === 'admin'
    ? 'Admin access requires Super Admin approval, with properties and permissions assigned after approval.'
    : role === 'tenant'
      ? 'Tenant access stays pending until the Super Admin approves the registration.'
      : 'The Super Admin account belongs to the original PG owner overseeing the entire business.';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-dialog-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl"
      >
        <header className="border-b border-slate-100 px-5 py-4">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-700">
            StayDesk account registration
          </p>
          <h2 id="policy-dialog-title" className="mt-1 text-lg font-extrabold">{title}</h2>
        </header>
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-600">
          {isTerms ? (
            <>
              <p>
                Please provide accurate information and use StayDesk only for its intended property and stay management features. {accessTerms}
              </p>
              <p className="mt-3 rounded-xl border border-brand-100 bg-brand-50 px-3.5 py-3 text-xs font-semibold text-brand-900">
                Registration is not connected yet. This form does not create an account or send an approval request.
              </p>
            </>
          ) : (
            <>
              <p>
                The details entered on this signup form are currently validated in your browser only. They are not sent or stored by this registration flow.
              </p>
              <p className="mt-3">
                Before registration is connected, StayDesk will publish a finalized privacy policy describing what information is collected, how it is used and protected, who can access it, and how long it is retained.
              </p>
            </>
          )}
        </div>
        <footer className="border-t border-slate-100 px-5 py-3.5 bg-slate-50/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
          >
            I Understand
          </button>
        </footer>
      </section>
    </div>
  );
}

function AgreementAlertModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agreement-alert-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center text-slate-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 border border-amber-200">
          <FileText className="h-6 w-6" aria-hidden="true" />
        </div>

        <h3 id="agreement-alert-title" className="text-lg font-extrabold text-slate-900 tracking-tight">
          Required Agreements
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-slate-600 font-medium">
          Accept the required agreements to continue. Please review and accept the Terms &amp; Conditions and Privacy Policy before submitting.
        </p>

        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

function SignupPage({
  role,
  navigate,
}: {
  role: PublicRole;
  navigate: (path: string) => void;
}) {
  const { showToast } = useToast();
  const [notice, setNotice] = useState('');
  const [missingConsents, setMissingConsents] = useState<string[]>([]);
  const [activePolicy, setActivePolicy] = useState<'terms' | 'privacy' | null>(null);
  const [showAgreementAlert, setShowAgreementAlert] = useState(false);
  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin';
  const title = isSuperAdmin
    ? 'Create your Super Admin account'
    : isAdmin
      ? 'Create your Admin account'
      : 'Create your Tenant account';
  const Icon = isSuperAdmin ? Building2 : isAdmin ? UserCog : UserRoundCheck;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const requiredFields = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[required]'),
    );
    const invalidFields = requiredFields.filter((field) => !field.validity.valid);
    const missing = invalidFields
      .filter((field): field is HTMLInputElement => field instanceof HTMLInputElement && field.type === 'checkbox')
      .map((checkbox) => checkbox.name);
    setMissingConsents(missing);
    if (invalidFields.length) {
      const firstInvalid = invalidFields[0];
      firstInvalid.focus();
      if (missing.length) {
        setShowAgreementAlert(true);
      } else {
        showToast('Complete the required fields with valid information.', 'error');
      }
      return;
    }
    setMissingConsents([]);
    const data = new FormData(form);
    const password = String(data.get('password') || '');
    const confirmPassword = String(data.get('confirmPassword') || '');
    if (!passwordRule.test(password)) {
      showToast('Use at least 8 characters with one uppercase letter, one number, and one special character.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('The passwords do not match.', 'error');
      return;
    }
    setNotice(role === 'admin'
      ? 'Your details passed validation. Admin approval is not connected yet, so no access request has been sent.'
      : 'Your details passed validation. Registration is not connected yet, so no request has been sent.');
    showToast('Form validated. Registration is not connected yet.', 'info');
  };

  const updateConsent = (name: string, checked: boolean) => {
    if (checked) {
      setMissingConsents((current) => current.filter((item) => item !== name));
    }
  };

  return (
    <AuthShell width="max-w-3xl">
      <div className="mb-4"><BackToAccounts navigate={navigate} /></div>
      <section aria-labelledby="signup-heading" className="overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl shadow-slate-950/30">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 pb-3 pt-5 sm:px-8 sm:pb-4 sm:pt-6">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-700">
                {isSuperAdmin ? 'Super Admin registration' : isAdmin ? 'Admin registration' : 'Tenant registration'}
              </p>
              <h1 id="signup-heading" className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h1>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {isSuperAdmin
                  ? 'Set up the primary business account as the original PG owner.'
                  : isAdmin
                    ? 'Request manager access to a property overseen by a Super Admin.'
                    : 'Enter your details and the Property ID shared by your Super Admin.'}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50/70 px-3.5 py-3 text-[11px] leading-relaxed text-brand-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
            <span>
              {isSuperAdmin
                ? 'For the original PG owner who oversees the entire business.'
                : isAdmin
                  ? 'Admin signup requests need Super Admin approval. Property access and permissions are assigned after approval.'
                  : 'Tenant registrations stay pending until the Super Admin approves them.'}
            </span>
          </div>
        </div>

        <form noValidate onSubmit={handleSubmit} className="space-y-1 px-5 pb-5 pt-2 sm:space-y-2 sm:px-8 sm:pb-6 sm:pt-3">
          {isSuperAdmin ? (
            <>
              <FormSection title="Super Admin Account Details">
                <TextField name="fullName" label="Name" type="text" autoComplete="name" required placeholder="Your name" />
                <TextField name="email" label="Email" type="email" autoComplete="email" required placeholder="you@example.com" />
                <PhoneField name="mobileNumber" label="Contact Number" />
                <PasswordField
                  name="password"
                  label="Password"
                  required
                  minLength={8}
                  pattern={passwordPattern}
                  hint="At least 8 characters, including one uppercase letter, one number, and one special character."
                />
                <PasswordField name="confirmPassword" label="Confirm Password" required minLength={8} />
              </FormSection>

              <FormSection title="PG/Stay Details" subtitle="Add the property details for your business.">
                <TextField name="stayName" label="PG/Stay Name" type="text" required placeholder="Property or stay name" />
                <SelectField
                  name="accommodationType"
                  label="Accommodation Type"
                  options={["Men's PG", "Women's PG", 'Co-live PG', 'Stay']}
                />
                <TextField name="stayEmail" label="Email" type="email" autoComplete="organization" required placeholder="property@example.com" />
                <PhoneField name="contactNumber" label="Contact Number" />
                <TextField name="address" label="Address" type="text" autoComplete="street-address" required placeholder="Street, area, building" wrapperClassName="sm:col-span-2" />
                <TextField name="city" label="City" type="text" autoComplete="address-level2" required placeholder="City" />
                <TextField name="state" label="State" type="text" autoComplete="address-level1" required placeholder="State" />
                <TextField name="pinCode" label="PIN Code" type="text" inputMode="numeric" autoComplete="postal-code" required pattern="[0-9]{6}" maxLength={6} title="Enter a 6-digit PIN code." placeholder="6-digit PIN code" />
                <TextField name="country" label="Country" type="text" autoComplete="country-name" required placeholder="Country" />
              </FormSection>

              <FormSection title="Original Owner Verification Details" subtitle="These details help verify the account and property.">
                <SelectField
                  name="identificationType"
                  label="Identification Type"
                  options={['Aadhaar', 'PAN', 'Passport', 'Voter ID', 'Driving Licence', 'Other Government-Issued ID']}
                />
                <TextField name="identificationNumber" label="Identification Number" type="text" required placeholder="Enter your ID number" />
                <FileField name="ownershipProof" label="Property Ownership Proof" />
                <FileField name="additionalDocuments" label="Additional Documents" multiple />
              </FormSection>

              <FormSection title="Terms & Submission">
                <div className="space-y-3 sm:col-span-2">
                  <TermsCheckbox name="acceptTerms" missing={missingConsents.includes('acceptTerms')} onChange={updateConsent}>
                    <span>
                      I agree to the{' '}
                      <a
                        href="#terms-and-conditions"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setActivePolicy('terms');
                        }}
                        className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900"
                      >
                        Terms &amp; Conditions
                      </a>.
                    </span>
                  </TermsCheckbox>
                  <TermsCheckbox name="acceptPrivacy" missing={missingConsents.includes('acceptPrivacy')} onChange={updateConsent}>
                    <span>
                      I have read and accept the{' '}
                      <a
                        href="#privacy-policy"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setActivePolicy('privacy');
                        }}
                        className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900"
                      >
                        Privacy Policy
                      </a>.
                    </span>
                  </TermsCheckbox>
                  <TermsCheckbox name="confirmAccuracy" missing={missingConsents.includes('confirmAccuracy')} onChange={updateConsent}>
                    I confirm that the information provided is accurate.
                  </TermsCheckbox>
                </div>
              </FormSection>
            </>
          ) : isAdmin ? (
            <>
              <FormSection title="Admin Account Details">
                <TextField name="fullName" label="Name" type="text" autoComplete="name" required placeholder="Your name" />
                <TextField name="email" label="Email" type="email" autoComplete="email" required placeholder="you@example.com" />
                <PhoneField name="mobileNumber" label="Contact Number" />
                <PasswordField
                  name="password"
                  label="Password"
                  required
                  minLength={8}
                  pattern={passwordPattern}
                  hint="At least 8 characters, including one uppercase letter, one number, and one special character."
                />
                <PasswordField name="confirmPassword" label="Confirm Password" required minLength={8} />
              </FormSection>

              <FormSection title="Admin Access Request" subtitle="Your Super Admin assigns properties and permissions after approval.">
                <TextField
                  name="propertyId"
                  label="Property ID"
                  type="text"
                  required
                  placeholder="Enter the Property ID shared by your Super Admin"
                  hint="This helps route your access request to the right property."
                  wrapperClassName="sm:col-span-2"
                />
              </FormSection>

              <FormSection title="Terms & Conditions">
                <div className="space-y-3 sm:col-span-2">
                  <TermsCheckbox name="acceptTerms" missing={missingConsents.includes('acceptTerms')} onChange={updateConsent}>
                    <span>
                      I agree to the{' '}
                      <a
                        href="#terms-and-conditions"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setActivePolicy('terms');
                        }}
                        className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900"
                      >
                        Terms &amp; Conditions
                      </a>.
                    </span>
                  </TermsCheckbox>
                  <TermsCheckbox name="acceptPrivacy" missing={missingConsents.includes('acceptPrivacy')} onChange={updateConsent}>
                    <span>
                      I have read and accept the{' '}
                      <a
                        href="#privacy-policy"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setActivePolicy('privacy');
                        }}
                        className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900"
                      >
                        Privacy Policy
                      </a>.
                    </span>
                  </TermsCheckbox>
                </div>
              </FormSection>
            </>
          ) : (
            <>
              <FormSection title="Tenant Account Details">
                <TextField name="fullName" label="Name" type="text" autoComplete="name" required placeholder="Your name" />
                <PhoneField name="mobileNumber" label="Contact Number" />
                <TextField name="email" label="Email" type="email" autoComplete="email" required placeholder="you@example.com" />
                <TextField name="propertyId" label="Property ID" type="text" required placeholder="Enter the Property ID shared by your Super Admin" hint="This ID connects your account to the right property." wrapperClassName="sm:col-span-2" />
                <PasswordField
                  name="password"
                  label="Password"
                  required
                  minLength={8}
                  pattern={passwordPattern}
                  hint="At least 8 characters, including one uppercase letter, one number, and one special character."
                />
                <PasswordField name="confirmPassword" label="Confirm Password" required minLength={8} />
              </FormSection>

              <FormSection title="Terms & Conditions">
                <div className="space-y-3 sm:col-span-2">
                  <TermsCheckbox name="acceptTerms" missing={missingConsents.includes('acceptTerms')} onChange={updateConsent}>
                    <span>
                      I agree to the{' '}
                      <a
                        href="#terms-and-conditions"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setActivePolicy('terms');
                        }}
                        className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900"
                      >
                        Terms &amp; Conditions
                      </a>.
                    </span>
                  </TermsCheckbox>
                  <TermsCheckbox name="acceptPrivacy" missing={missingConsents.includes('acceptPrivacy')} onChange={updateConsent}>
                    <span>
                      I have read and accept the{' '}
                      <a
                        href="#privacy-policy"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setActivePolicy('privacy');
                        }}
                        className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900"
                      >
                        Privacy Policy
                      </a>.
                    </span>
                  </TermsCheckbox>
                </div>
              </FormSection>
            </>
          )}

          {notice && (
            <div role="status" className="flex items-start gap-2.5 rounded-xl border border-brand-100 bg-brand-50 px-3.5 py-3 text-xs font-semibold leading-relaxed text-brand-900">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
              <span>{notice}</span>
            </div>
          )}

          <div className="border-t border-slate-100 pt-5">
            <button
              type="submit"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
            >
              {isSuperAdmin
                ? 'Create Super Admin Account'
                : isAdmin
                  ? 'Submit Admin Access Request'
                  : 'Create Account'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-400">
              Your information is validated in this form. Account registration is not connected yet.
            </p>
            <p className="mt-4 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <a
                href={routeFor(role, 'login')}
                onClick={(event) => navigateLink(event, navigate, routeFor(role, 'login'))}
                className="font-extrabold text-brand-700 hover:text-brand-900 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Log in
              </a>
            </p>
          </div>
        </form>
      </section>
      {showAgreementAlert && <AgreementAlertModal onClose={() => setShowAgreementAlert(false)} />}
      {activePolicy && <PolicyDialog kind={activePolicy} role={role} onClose={() => setActivePolicy(null)} />}
    </AuthShell>
  );
}

export const Login: React.FC = () => {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const updatePath = () => setPathname(normalizePath(window.location.pathname));
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setPathname(normalizePath(path));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (pathname === '/adminlogin' || pathname === '/ownerlogin') return <LoginForm role="admin" navigate={navigate} />;
  if (pathname === '/tenantlogin') return <LoginForm role="tenant" navigate={navigate} />;
  if (pathname === '/superadminlogin') return <LoginForm role="superadmin" navigate={navigate} />;
  if (pathname === '/adminsignup') return <SignupPage role="admin" navigate={navigate} />;
  if (pathname === '/superadminsignup' || pathname === '/ownersignup') return <SignupPage role="superadmin" navigate={navigate} />;
  if (pathname === '/tenantsignup') return <SignupPage role="tenant" navigate={navigate} />;
  return <LandingPage navigate={navigate} />;
};
