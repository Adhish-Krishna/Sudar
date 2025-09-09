import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import SudarLogo from '../../assets/Sudar.png';
import loginTeacherImage from '../../assets/login_teacher.png';
import Button from '../../components/Button';
// import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  // const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // await login(email, password);
      console.log('Login attempt:', { email, password });
      // Simulate API call delay
      setTimeout(() => {
        setIsLoading(false);
        navigate('/home');
      }, 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
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
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
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
                {isLoading ? 'Signing In...' : 'Login'}
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

export default Login;