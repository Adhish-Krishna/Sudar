import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import SudarLogo from '../../assets/Sudar.png';
import loginTeacherImage from '../../assets/login_teacher.png';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import type { Login } from '../../api';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const loginData: Login = {
        email,
        password,
      };
      await login(loginData);
      navigate('/home');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

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
            
            <h1 className="login-title">Login to Your Account</h1>
            
            <form onSubmit={handleLogin} className="login-form">
              {error && <div className="error-message">{error}</div>}
              
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
              
              <div className="input-group">
                <label htmlFor="password" className="input-label">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
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
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            
            {/* Example of inline styles with CSS variables */}
            <button 
              onClick={handleForgotPassword}
              className="forgot-password-link"
              style={{
                color: 'var(--primary-color)',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '14px',
                marginTop: '16px',
              }}
            >
              Forgot Password?
            </button>
            
            <div className="login-footer">
              <p>Don't have an account?</p>
              <button 
                onClick={handleSignUp}
                className="forgot-password-link"
                style={{
                  color: 'var(--primary-color)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Sign Up
              </button>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;