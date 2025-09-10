import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import SudarLogo from '../../assets/Sudar.png';
import loginTeacherImage from '../../assets/login_teacher.png';
import Button from '../../components/Button';
// import { authAPI } from '../../api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // await authAPI.forgotPassword(email);
      console.log('Forgot password request for:', email);
      // Simulate API call delay
      setTimeout(() => {
        setIsEmailSent(true);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send reset email');
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

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
              
              <h1 className="login-title">Email Sent!</h1>
              <p className="forgot-password-message">
                We've sent a password reset link to <strong>{email}</strong>. 
                Please check your email and follow the instructions to reset your password.
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
              Enter your email address and we'll send you a link to reset your password.
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

export default ForgotPassword;