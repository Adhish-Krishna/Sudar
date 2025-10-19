import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import SudarLogo from '../../assets/Sudar.png';
import loginTeacherImage from '../../assets/login_teacher.png';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import type { ForgotPassword, ResetPassword } from '../../api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const navigate = useNavigate();
  const { forgotPassword, resetPassword, isAuthenticated, loading } = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const forgotPasswordData: ForgotPassword = {
        email,
      };
      await forgotPassword(forgotPasswordData);
      setIsEmailSent(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const resetPasswordData: ResetPassword = {
        email,
        code,
        new_password: newPassword,
      };
      await resetPassword(resetPasswordData);
      setIsPasswordReset(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isPasswordReset) {
    return (
      <div className="login-container">
        <div className="login-content">
          <div className="login-image-section">
            <img src={loginTeacherImage} alt="Teacher Illustration" className="login-teacher-image" />
          </div>
          
          <div className="login-form-section">
            <div className="login-card">
              <div className="logo-container">
                <img src={SudarLogo} alt="Sudar Logo" className="logo" />
              </div>
              
              <h1 className="login-title">Password Reset Successful!</h1>
              <p className="forgot-password-message">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              
              <Button
                onClick={handleBackToLogin}
                variant="primary"
                style={{
                  width: '100%',
                  marginTop: '24px',
                  backgroundColor: 'var(--primary-color)',
                  fontSize: '16px',
                }}
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEmailSent) {
    return (
      <div className="login-container">
        <div className="login-content">
          <div className="login-image-section">
            <img src={loginTeacherImage} alt="Teacher Illustration" className="login-teacher-image" />
          </div>
          
          <div className="login-form-section">
            <div className="login-card">
              <div className="logo-container">
                <img src={SudarLogo} alt="Sudar Logo" className="logo" />
              </div>
              
              <h1 className="login-title">Reset Your Password</h1>
              <p className="forgot-password-subtitle">
                We've sent a reset code to <strong>{email}</strong>. Enter the code and your new password below.
              </p>
              
              {error && <div className="error-message">{error}</div>}
              
              <form onSubmit={handleResetPassword} className="login-form">
                <div className="input-group">
                  <label htmlFor="code" className="input-label">Reset Code</label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="input-field"
                    placeholder="Enter the reset code"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label htmlFor="newPassword" className="input-label">New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field"
                      placeholder="Enter your new password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                
                <div className="input-group">
                  <label htmlFor="confirmNewPassword" className="input-label">Confirm New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      id="confirmNewPassword"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="input-field"
                      placeholder="Confirm your new password"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    >
                      {showConfirmNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    backgroundColor: 'var(--primary-color)',
                    fontSize: '16px',
                  }}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
              
              <button 
                onClick={handleBackToLogin}
                className="forgot-password-link"
                style={{
                  color: 'var(--primary-color)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '14px',
                  marginTop: '16px',
                }}
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-image-section">
          <img src={loginTeacherImage} alt="Teacher Illustration" className="login-teacher-image" />
        </div>
        
        <div className="login-form-section">
          <div className="login-card">
            <div className="logo-container">
              <img src={SudarLogo} alt="Sudar Logo" className="logo" />
            </div>
            
            <h1 className="login-title">Forgot Password</h1>
            <p className="forgot-password-subtitle">
              Enter your email address and we'll send you a reset code to reset your password.
            </p>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleForgotPassword} className="login-form">
              <div className="input-group">
                <label htmlFor="email" className="input-label">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  backgroundColor: 'var(--primary-color)',
                  fontSize: '16px',
                }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
            
            <button 
              onClick={handleBackToLogin}
              className="forgot-password-link"
              style={{
                color: 'var(--primary-color)',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                marginTop: '16px',
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;