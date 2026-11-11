import { DB_LIMITS } from '../config/dbLimits';
import React, { useState } from 'react';
import {
  User,
  Lock,
  UserCheck,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  IdCard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { PixelIcon } from './PixelIcon';

interface LoginViewProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onClose, isModal = false }) => {
  const { currentUser, users, login, register, logout, deleteAccount } = useAuth();
  const { t, formatDate, language } = useLanguage();
  const networkError = language === 'en'
    ? 'Cannot connect to the server. Please check that the backend is running.'
    : 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบว่าเปิด backend แล้ว';

  // Mode: if no accounts yet, direct to register, else login
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(() => {
    return users.length === 0 ? 'login' : 'login';
  });

  // Form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regUsername, setRegUsername] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status and error messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Account Confirmation Modal state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Logout Confirmation state
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginUsername.trim() || !loginPassword.trim()) {
      setErrorMessage(t('errorMissingFields'));
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      const res = await login(loginUsername, loginPassword);
      setIsSubmitting(false);
      if (!res.success) {
        if (res.error === 'network_error') {
          setErrorMessage(networkError);
        } else if (res.error === 'invalid_credentials') {
          setErrorMessage(t('errorInvalidCredentials'));
        } else {
          setErrorMessage(t('errorMissingFields'));
        }
        return;
      }

      setSuccessMessage(t('loginSuccess'));
      setTimeout(() => {
        setSuccessMessage(null);
        if (onClose) onClose();
      }, 900);
    }, 400);
  };

  // Handle Register submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regUsername.trim() || !regName.trim() || !regPassword.trim()) {
      setErrorMessage(t('errorMissingFields'));
      return;
    }

    if (regUsername.trim().length < 3) {
      setErrorMessage(t('errorUsernameShort'));
      return;
    }

    if (regPassword.trim().length < 4) {
      setErrorMessage(t('errorPasswordShort'));
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage(t('errorPasswordMismatch'));
      return;
    }

    setIsSubmitting(true);
    setTimeout(async () => {
      const res = await register(regUsername, regName, regPassword);
      setIsSubmitting(false);
      if (!res.success) {
        if (res.error === 'network_error') {
          setErrorMessage(networkError);
        } else if (res.error === 'username_taken') {
          setErrorMessage(t('errorUsernameTaken'));
        } else if (res.error === 'username_too_short') {
          setErrorMessage(t('errorUsernameShort'));
        } else if (res.error === 'password_too_short') {
          setErrorMessage(t('errorPasswordShort'));
        } else {
          setErrorMessage(t('errorMissingFields'));
        }
        return;
      }

      setSuccessMessage(t('registerSuccess'));
      setTimeout(() => {
        setSuccessMessage(null);
        if (onClose) onClose();
      }, 1000);
    }, 400);
  };

  // Handle Log Out
  const handleConfirmLogout = () => {
    logout();
    setIsLogoutConfirmOpen(false);
    setSuccessMessage(t('logoutSuccess'));
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  // Handle Delete Account
  const handleConfirmDeleteAccount = async () => {
    setDeleteError(null);
    const res = await deleteAccount(deleteConfirmPassword);
    if (!res.success) {
      if (res.error === 'password_mismatch') {
        setDeleteError(t('errorDeletePasswordWrong'));
      } else {
        setDeleteError(t('errorInvalidCredentials'));
      }
      return;
    }

    setIsDeleteConfirmOpen(false);
    setDeleteConfirmPassword('');
    setSuccessMessage(t('deleteAccountSuccess'));
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const containerContent = (
    <div className="w-full max-w-lg mx-auto px-window bg-[var(--px-surface)] text-[var(--px-text)] relative overflow-hidden">
      {/* Window Titlebar */}
      <div className="px-titlebar">
        <div className="flex items-center gap-2">
          <PixelIcon name="computer" size={16} />
          <span className="font-bold tracking-wider">
            {currentUser ? 'ACCOUNT.EXE' : activeTab === 'login' ? 'LOGIN.EXE' : 'REGISTER.EXE'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onClose && (
            <button
              onClick={onClose}
              className="px-btn px-1 py-0.5 text-xs font-mono font-bold leading-none bg-[var(--color-px-yellow)] text-[#2A2350] cursor-pointer"
              aria-label={t('close')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {/* Header Badge & Title */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-badge bg-[var(--color-px-yellow)] text-[#2A2350] text-xs font-bold font-pixel">
            <PixelIcon name="star" size={14} />
            <span>{currentUser ? t('accountInfo') : t('loginTitle')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-pixel text-[var(--px-text)]">
            {currentUser ? currentUser.name : activeTab === 'login' ? t('loginTitle') : t('registerTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--px-text-muted)] max-w-md mx-auto">
            {currentUser ? t('accountSubtitle', { username: currentUser.username }) || t('loginSubtitle') : activeTab === 'login' ? t('loginSubtitle') : t('registerSubtitle')}
          </p>
        </div>

        {/* Loading / Submitting Progress Bar */}
        {isSubmitting && (
          <div className="p-3 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] rounded space-y-1.5">
            <div className="flex items-center justify-between text-[13px] font-pixel text-[var(--px-text)]">
              <span>AUTHENTICATING...</span>
              <span className="animate-pulse">75%</span>
            </div>
            <div className="px-progress w-full h-3">
              <div className="px-progress-bar w-3/4" />
            </div>
          </div>
        )}

        {/* Success banner */}
        {successMessage && (
          <div className="p-3 bg-[var(--color-px-mint)] border-2 border-[var(--px-border)] text-[#2A2350] text-xs sm:text-sm flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-5 h-5 text-[#2A2350] flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error banner */}
        {errorMessage && (
          <div className="p-3 bg-[var(--px-error)] border-2 border-[#B91C47] text-[#7A1D28] text-xs sm:text-sm flex items-center gap-2.5 font-bold">
            <AlertTriangle className="w-5 h-5 text-[#7A1D28] flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* 1. VIEW WHEN USER IS LOGGED IN */}
        {/* ============================================================ */}
        {currentUser ? (
          <div className="space-y-4">
            {/* User Profile Card */}
            <div className="p-4 bg-[var(--px-surface-2)] border-2 border-[var(--px-border)] shadow-[3px_3px_0_var(--px-hard-shadow)] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[var(--color-px-yellow)] border-2 border-[var(--px-border)] flex items-center justify-center text-[#2A2350] font-pixel font-bold text-2xl shadow-[2px_2px_0_var(--px-hard-shadow)]">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold font-pixel text-[var(--px-text)] truncate">
                      {currentUser.name}
                    </h3>
                    <span className="px-badge bg-[var(--color-px-sky)] text-[#2A2350] text-[13px] font-bold font-pixel">
                      TEACHER
                    </span>
                  </div>
                  <p className="text-xs text-[var(--px-text-muted)] font-mono flex items-center gap-1 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                    <span>@{currentUser.username}</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t-2 border-dashed border-[var(--px-border)]/40 text-xs">
                <div className="bg-[var(--px-surface-sunken)] p-2 border border-[var(--px-border)]">
                  <span className="text-[var(--px-text-muted)] block text-[13px] font-pixel">{t('memberSince')}</span>
                  <span className="text-[var(--px-text)] font-bold">
                    {formatDate(currentUser.createdAt)}
                  </span>
                </div>
                <div className="bg-[var(--px-surface-sunken)] p-2 border border-[var(--px-border)]">
                  <span className="text-[var(--px-text-muted)] block text-[13px] font-pixel">{t('lastLogin')}</span>
                  <span className="text-[var(--px-text)] font-bold">
                    {formatDate(currentUser.lastLoginAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructor Controls & Safety Actions */}
            <div className="space-y-2 pt-1">
              <div className="text-[13px] font-pixel font-bold text-[var(--px-text-muted)] uppercase tracking-wider">
                {t('actions')}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                {/* Log Out Button */}
                <button
                  type="button"
                  onClick={() => setIsLogoutConfirmOpen(true)}
                  className="flex-1 px-btn bg-[var(--color-px-yellow)] text-[#2A2350] font-bold font-pixel text-xs py-2.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>

                {/* Delete Account Button */}
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteConfirmPassword('');
                    setIsDeleteConfirmOpen(true);
                  }}
                  className="px-btn-danger font-bold font-pixel text-xs py-2.5 px-3 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('deleteAccount')}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* 2. VIEW WHEN USER IS NOT LOGGED IN (LOGIN / REGISTER FORM) */
          /* ============================================================ */
          <div>
            {/* Tab Switcher: Log In vs Register */}
            <div className="flex bg-[var(--px-surface-sunken)] p-1 border-2 border-[var(--px-border)] mb-4 gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-bold font-pixel transition flex items-center justify-center gap-2 border-2 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-[var(--color-px-yellow)] text-[#2A2350] border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                    : 'bg-transparent text-[var(--px-text-muted)] border-transparent hover:bg-[var(--px-surface-2)]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{t('login')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 px-3 text-xs font-bold font-pixel transition flex items-center justify-center gap-2 border-2 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-[var(--color-px-yellow)] text-[#2A2350] border-[var(--px-border)] shadow-[2px_2px_0_var(--px-hard-shadow)]'
                    : 'bg-transparent text-[var(--px-text-muted)] border-transparent hover:bg-[var(--px-surface-2)]'
                }`}
              >
                <IdCard className="w-3.5 h-3.5" />
                <span>{t('register')}</span>
              </button>
            </div>

            {/* TAB 1: LOGIN FORM */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Username field */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-[var(--px-text)] font-pixel flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[var(--px-text-muted)]" />
                    <span>{t('username')}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={loginUsername}
                    maxLength={DB_LIMITS.username}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder={t('usernamePlaceholder')}
                    className="px-input w-full"
                  />
                </div>

                {/* Password field */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-[var(--px-text)] font-pixel flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[var(--px-text-muted)]" />
                    <span>{t('password')}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder={t('passwordPlaceholder')}
                      className="px-input w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--px-text-muted)] hover:text-[var(--px-text)] p-1 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-btn w-full py-2.5 bg-[var(--color-px-mint)] text-[#2A2350] font-bold font-pixel text-sm flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'CONNECTING...' : t('login')}</span>
                </button>

                {/* Switch to Register link */}
                <div className="text-center pt-2 text-xs text-[var(--px-text-muted)]">
                  <span>{t('noAccountPrompt')} </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setErrorMessage(null);
                    }}
                    className="font-bold text-[var(--px-text)] underline hover:text-[var(--color-accent-strong)] cursor-pointer"
                  >
                    {t('createAccountNow')}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: REGISTER FORM */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {/* Username field */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-[var(--px-text)] font-pixel flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[var(--px-text-muted)]" />
                    <span>{t('username')}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    maxLength={DB_LIMITS.username}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder={t('usernamePlaceholder')}
                    className="px-input w-full"
                  />
                </div>

                {/* Name field (Full Name / Display Name) */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-[var(--px-text)] font-pixel flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-[var(--px-text-muted)]" />
                    <span>{t('displayName')}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    maxLength={DB_LIMITS.teacherName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={t('displayNamePlaceholder')}
                    className="px-input w-full"
                  />
                </div>

                {/* Password field */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-[var(--px-text)] font-pixel flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[var(--px-text-muted)]" />
                    <span>{t('password')}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder={t('passwordPlaceholder')}
                      className="px-input w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--px-text-muted)] hover:text-[var(--px-text)] p-1 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password field */}
                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-[var(--px-text)] font-pixel flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[var(--px-text-muted)]" />
                    <span>{t('confirmPassword')}</span>
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder={t('confirmPasswordPlaceholder')}
                    className="px-input w-full"
                  />
                </div>

                {/* Register button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-btn w-full py-2.5 bg-[var(--color-px-pink)] text-[#2A2350] font-bold font-pixel text-sm flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  <PixelIcon name="star" size={16} />
                  <span>{isSubmitting ? 'CREATING...' : t('register')}</span>
                </button>

                {/* Switch to Login link */}
                <div className="text-center pt-2 text-xs text-[var(--px-text-muted)]">
                  <span>{t('haveAccountPrompt')} </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMessage(null);
                    }}
                    className="font-bold text-[var(--px-text)] underline hover:text-[var(--color-accent-strong)] cursor-pointer"
                  >
                    {t('signInNow')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 3. LOG OUT CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {isLogoutConfirmOpen && (
        <div className="px-modal-overlay">
          <div className="px-window w-full max-w-sm bg-[var(--px-surface)] text-[var(--px-text)] p-0">
            <div className="px-titlebar">
              <div className="flex items-center gap-2">
                <PixelIcon name="computer" size={14} />
                <span className="font-bold">LOGOUT.EXE</span>
              </div>
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="px-btn px-1 py-0.5 text-xs font-mono font-bold leading-none bg-[var(--color-px-yellow)] text-[#2A2350] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 text-center space-y-3">
              <div className="w-10 h-10 mx-auto bg-[var(--color-px-yellow)] border-2 border-[var(--px-border)] flex items-center justify-center text-[#2A2350]">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-pixel font-bold text-sm text-[var(--px-text)]">{t('confirmLogoutTitle')}</h3>
                <p className="text-xs text-[var(--px-text-muted)] mt-1">{t('confirmLogoutDesc')}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogoutConfirmOpen(false)}
                  className="flex-1 px-btn-secondary text-xs py-2 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="flex-1 px-btn bg-[var(--color-px-yellow)] text-[#2A2350] text-xs font-bold font-pixel py-2 cursor-pointer"
                >
                  {t('logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. DELETE ACCOUNT CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {isDeleteConfirmOpen && (
        <div className="px-modal-overlay">
          <div className="px-window w-full max-w-md bg-[var(--px-surface)] text-[var(--px-text)] p-0 border-[#FF9AA2]">
            <div className="px-titlebar bg-[var(--px-error)] text-[#7A1D28]">
              <div className="flex items-center gap-2">
                <PixelIcon name="trash" size={14} />
                <span className="font-bold text-[#7A1D28]">DELETE_ACCOUNT.EXE</span>
              </div>
              <button
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setDeleteConfirmPassword('');
                  setDeleteError(null);
                }}
                className="px-btn px-1 py-0.5 text-xs font-mono font-bold leading-none bg-white text-[#7A1D28] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3 text-left">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[var(--px-error)] border-2 border-[var(--px-border)] flex items-center justify-center text-[#7A1D28] flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-pixel font-bold text-sm text-[var(--px-text)]">{t('confirmDeleteAccountTitle')}</h3>
                  <span className="px-badge bg-[var(--px-error)] text-[#7A1D28] text-[13px] font-bold">PERMANENT ACTION</span>
                </div>
              </div>

              <p className="text-xs text-[var(--px-text-muted)]">
                {t('confirmDeleteAccountDesc')}
              </p>

              {deleteError && (
                <div className="p-2.5 bg-[var(--px-error)] border border-[#7A1D28] text-[#7A1D28] text-xs flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--px-text)] font-pixel flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[var(--px-text-muted)]" />
                  <span>{t('confirmDeleteAccountTypePassword')}</span>
                </label>
                <input
                  type="password"
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  className="px-input w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setDeleteConfirmPassword('');
                    setDeleteError(null);
                  }}
                  className="px-btn-secondary text-xs py-2 px-3 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteAccount}
                  className="px-btn-danger text-xs py-2 px-4 flex items-center gap-1.5 font-pixel font-bold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('confirmDeleteAccountBtn')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // If presented as full modal overlay
  if (isModal) {
    return (
      <div className="px-modal-overlay">
        {containerContent}
      </div>
    );
  }

  // If presented as standard view inside App
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {containerContent}
    </div>
  );
};