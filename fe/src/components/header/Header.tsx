import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';
import SudarLogo from '../../assets/Sudar.png';

interface HeaderProps {
  sidebarExpanded: boolean;
}

const Header: React.FC<HeaderProps> = ({ sidebarExpanded }) => {
  const { theme, toggleTheme } = useTheme();
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

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
            <button className="notification-btn">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5V9.09c0-1.05-.95-2.09-2.09-2.09h-5.82C6.05 7 5.1 8.04 5.1 9.09V12l-5 5h5m7.5 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="notification-badge">3</span>
            </button>
            
            <div className="theme-toggle-container">
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
          
          <div className="user-profile">
            <div className="user-avatar">
              <span>T</span>
            </div>
            <div className="user-info">
              <p className="user-name">Teacher Name</p>
              <p className="user-role">Educator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
