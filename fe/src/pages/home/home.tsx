import React from 'react';
import { useNavigate } from 'react-router-dom';
import './home.css';
import { useAuth } from '../../contexts/AuthContext';
// import { protectedAPI } from '../../api';

const Home: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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

  // Authenticated user dashboard
  return (
    <div className="home-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.teacher_name}!</h1>
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
