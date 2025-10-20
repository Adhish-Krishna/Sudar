import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import './SignUp.css';
import SudarLogo from '../../assets/Sudar.png';
import loginTeacherImage from '../../assets/login_teacher.png';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import type { SignUp , EmailVerification } from '../../api';

interface SignUpFormData {
  teacherName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface SignUpFormErrors {
  teacherName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  verificationCode?: string;
}

const SignUpPage: React.FC = () => {
  const [formData, setFormData] = useState<SignUpFormData>({
    teacherName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<SignUpFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const navigate = useNavigate();
  const { verifyEmail, signup, isAuthenticated, loading } = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof SignUpFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: SignUpFormErrors = {};

    if (!formData.teacherName.trim()) newErrors.teacherName = 'Teacher name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (isVerificationSent && !verificationCode.trim()) {
      newErrors.verificationCode = 'Verification code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setSubmitError('');
    
    try {
      if (!isVerificationSent) {
        // Step 1: Send verification email
        const verifyData: EmailVerification = {
          email: formData.email,
          teacher_name: formData.teacherName,
        };
        await verifyEmail(verifyData);
        setIsVerificationSent(true);
        setIsLoading(false);
        return; // Wait for user to enter code
      } else {
        // Step 2: Sign up with verification code
        const signupData: SignUp = {
          teacher_name: formData.teacherName,
          email: formData.email,
          password: formData.password,
          verification_code: verificationCode,
        };
        await signup(signupData);
        navigate('/home');
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-image-section">
          <img src={loginTeacherImage} alt="Teacher Illustration" className="login-teacher-image" />
        </div>
        
        <div className="login-form-section">
          <div className="login-card signup-card">
            <div className="logo-container">
              <img src={SudarLogo} alt="Sudar Logo" className="logo" />
            </div>
            
            <h1 className="login-title">Create Your Account</h1>
            <p className="signup-subtitle">
              {isVerificationSent 
                ? 'Enter the verification code sent to your email to complete signup' 
                : 'Join Sudar and start creating amazing educational content'
              }
            </p>
            
            {submitError && <div className="error-message">{submitError}</div>}
            
            <form onSubmit={handleSignUp} className="login-form signup-form">
              <div className="input-group">
                <label htmlFor="teacherName" className="input-label">Teacher Name</label>
                <input
                  type="text"
                  id="teacherName"
                  name="teacherName"
                  value={formData.teacherName}
                  onChange={handleInputChange}
                  className={`input-field ${errors.teacherName ? 'error' : ''}`}
                  placeholder="Enter your full name"
                />
                {errors.teacherName && <span className="error-text">{errors.teacherName}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="email" className="input-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`input-field ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your email"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              {isVerificationSent && (
                <div className="input-group">
                  <label htmlFor="verificationCode" className="input-label">Verification Code</label>
                  <input
                    type="text"
                    id="verificationCode"
                    name="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className={`input-field ${errors.verificationCode ? 'error' : ''}`}
                    placeholder="Enter the verification code sent to your email"
                  />
                  {errors.verificationCode && <span className="error-text">{errors.verificationCode}</span>}
                </div>
              )}

              <div className="form-row">
                <div className="input-group half-width">
                  <label htmlFor="password" className="input-label">Password</label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`input-field ${errors.password ? 'error' : ''}`}
                      placeholder="Create password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <AiOutlineEye size={20} /> : <AiOutlineEyeInvisible size={20} />}
                    </button>
                  </div>
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>
                
                <div className="input-group half-width">
                  <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <AiOutlineEye size={20} /> : <AiOutlineEyeInvisible size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  backgroundColor: 'var(--primary-color)',
                  fontSize: '16px',
                }}
              >
                {isLoading ? (isVerificationSent ? 'Creating Account...' : 'Sending Code...') : (isVerificationSent ? 'Create Account' : 'Send Verification Code')}
              </Button>
            </form>
            
            <div className="login-footer">
              <p>Already have an account?</p>
              <button 
                onClick={handleBackToLogin}
                className="forgot-password-link"
                style={{
                  color: 'var(--primary-color)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;