import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './login.css';
import SudarLogo from '../../assets/Sudar.png';
import loginTeacherImage from '../../assets/login_teacher.png';
import Button from '../../components/Button';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Placeholder for API call - to be implemented later
    console.log('Login attempt with:', { email, password });
    
    // For now, simply navigate to home page after form submission
    // TODO: Add proper authentication logic here
    // Example:
    // try {
    //   const response = await fetch('/api/login', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ email, password }),
    //   });
    //   const data = await response.json();
    //   if (data.success) {
    //     navigate('/');
    //   }
    // } catch (error) {
    //   console.error('Login error:', error);
    // }
    
    // Temporary: Navigate to home page immediately
    navigate('/home');
  };

  const handleForgotPassword = () => {
    // Placeholder for forgot password functionality
    console.log('Forgot password clicked');
    // TODO: Implement forgot password logic
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
              
              {/* Example using the Button component with CSS variables */}
              <Button
                type="submit"
                variant="primary"
                style={{
                  width: '100%',
                  marginTop: '8px',
                  backgroundColor: 'var(--primary-color)',
                  fontSize: '16px',
                }}
              >
                Login
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
            
            {/* Example of a secondary button with CSS variables */}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;