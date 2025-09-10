import React from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';
// import { useAuth } from '../../contexts/AuthContext';
// import { protectedAPI } from '../../api';

const Home: React.FC = () => {
  // const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();
  
  // Temporary: Mock authentication state for frontend development
  const isAuthenticated = true; // Set to false to test unauthenticated view
  const loading = false;
  const user = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    schoolName: 'Springfield Elementary',
    subject: 'Mathematics',
    experience: '5-10 years'
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="home-container">
        <div className="hero-section">
          <h1 className="hero-title">Welcome to Sudar</h1>
          <p className="hero-subtitle">
            Empowering educators with intelligent content creation and worksheet generation tools.
          </p>
          <div className="hero-features">
            <div className="feature-item">
              <h3>Smart Content Creation</h3>
              <p>Generate educational content tailored to your curriculum and students' needs.</p>
            </div>
            <div className="feature-item">
              <h3>Automated Worksheets</h3>
              <p>Create custom worksheets with various question types and difficulty levels.</p>
            </div>
            <div className="feature-item">
              <h3>Subject Management</h3>
              <p>Organize your teaching materials by subjects and grade levels.</p>
            </div>
          </div>
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/signup')}
            >
              Get Started
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user dashboard
  return (
    <div className="home-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.firstName}!</h1>
        <p>Ready to create amazing educational content?</p>
      </div>

      <div className="dashboard-actions">
        <div className="action-grid">
          <div className="action-card">
            <h3>Manage Students</h3>
            <p>View and manage your students' information and progress</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/students')}
            >
              Manage Students
            </button>
          </div>

          <div className="action-card">
            <h3>Doubt Clearance</h3>
            <p>Address student questions and provide explanations</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/doubt-clearance')}
            >
              Clear Doubts
            </button>
          </div>

          <div className="action-card">
            <h3>AI Character</h3>
            <p>Interact with AI teaching assistant for help and guidance</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/ai-character')}
            >
              Chat with AI
            </button>
          </div>

          <div className="action-card">
            <h3>List of Classes</h3>
            <p>View all your classes and their schedules</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/classes')}
            >
              View Classes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
