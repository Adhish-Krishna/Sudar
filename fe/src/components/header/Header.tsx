import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';
import SudarLogo from '../../assets/Sudar.png';

interface HeaderProps {
  sidebarExpanded: boolean;
}

const Header: React.FC<HeaderProps> = ({ sidebarExpanded }) => {
  const { theme, toggleTheme } = useTheme();
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const navigate = useNavigate();
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  
  // Hardcoded user data - comment out API call for now
  const user = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    role: 'Mathematics Teacher'
  };

  const handleLogout = () => {
    // await logout(); // Comment out API call
    console.log('Logout clicked - backend integration needed');
    setShowUserDropdown(false);
    navigate('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setShowThemeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className={`header ${sidebarExpanded ? 'with-sidebar-expanded' : 'with-sidebar-collapsed'}`}>
      <div className="header-content">
        <div className="logo-section">
          <img src={SudarLogo} alt="Sudar" className="logo-image" />
        </div>
        
        <div className="user-section">
          <div className="header-search">
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Search courses, subjects..." />
          </div>
          
          <div className="header-actions">
            <div className="theme-toggle-container" ref={themeDropdownRef}>
              <button 
                className="settings-btn"
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              {showThemeDropdown && (
                <div className="theme-dropdown">
                  <button 
                    onClick={() => {
                      if (theme !== 'light') toggleTheme();
                      setShowThemeDropdown(false);
                    }}
                    className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="theme-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Light
                  </button>
                  <button 
                    onClick={() => {
                      if (theme !== 'dark') toggleTheme();
                      setShowThemeDropdown(false);
                    }}
                    className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="theme-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Dark
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className={`user-profile ${showUserDropdown ? 'dropdown-open' : ''}`} ref={userDropdownRef}>
            <div 
              className="user-profile-trigger"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
            >
              <div className="user-avatar">
                <span>{user.firstName.charAt(0)}</span>
              </div>
              <div className="user-info">
                <p className="user-name">{user.firstName} {user.lastName}</p>
                <p className="user-role">{user.role}</p>
              </div>
              <svg className="dropdown-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {showUserDropdown && (
              <div className="user-dropdown">
                <button className="dropdown-item" onClick={() => setShowUserDropdown(false)}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="dropdown-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </button>
                <button className="dropdown-item" onClick={() => setShowUserDropdown(false)}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="dropdown-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>
                <button className="dropdown-item logout-item" onClick={handleLogout}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="dropdown-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
