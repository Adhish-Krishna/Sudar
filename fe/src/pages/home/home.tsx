import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBook } from 'react-icons/fa';
import { GrAdd } from 'react-icons/gr';
import { IoClose } from 'react-icons/io5';
import { MdEdit, MdDelete } from 'react-icons/md';
import './home.css';
import { useAuth } from '../../contexts/AuthContext';
import { classrooms as classroomsAPI, type ClassroomResponse, type ClassroomCreate, type ClassroomUpdate } from '../../api';

const Home: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState<ClassroomResponse[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<ClassroomResponse | null>(null);
  const [newClassroomName, setNewClassroomName] = useState('');
  const [editClassroomName, setEditClassroomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic color palette for classroom cards
  const cardColors = [
    { bg: '#17a2b8', text: '#ffffff' }, // Teal
    { bg: '#8b5cf6', text: '#ffffff' }, // Purple
    { bg: '#3b82f6', text: '#ffffff' }, // Blue
    { bg: '#ec4899', text: '#ffffff' }, // Pink
    { bg: '#f59e0b', text: '#ffffff' }, // Amber
    { bg: '#10b981', text: '#ffffff' }, // Green
    { bg: '#ef4444', text: '#ffffff' }, // Red
    { bg: '#06b6d4', text: '#ffffff' }, // Cyan
  ];

  // Fetch classrooms on component mount
  useEffect(() => {
    if (user && !loading) {
      fetchClassrooms();
    }
  }, [user, loading]);

  const fetchClassrooms = async () => {
    setError(null);
    const response = await classroomsAPI.getClassrooms();
    
    if (response.status || response.message) {
      // Error response
      setError(response.message || 'Failed to load classrooms');
      setClassrooms([]);
    } else if (Array.isArray(response)) {
      // Success response
      setClassrooms(response);
    } else {
      setError('Invalid response format');
      setClassrooms([]);
    }
  };

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newClassroomName.trim()) {
      setError('Classroom name is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    const createPayload: ClassroomCreate = {
      classroom_name: newClassroomName.trim(),
    };

    const response = await classroomsAPI.createClassroom(createPayload);

    if (response.status || response.message) {
      // Check if it's an error or success message
      if (response.status && response.status >= 400) {
        setError(response.message || 'Failed to create classroom');
      } else {
        // Success - refresh classrooms
        setNewClassroomName('');
        setShowCreateModal(false);
        await fetchClassrooms();
      }
    } else {
      // Assume success if no status property
      setNewClassroomName('');
      setShowCreateModal(false);
      await fetchClassrooms();
    }

    setIsCreating(false);
  };

  const handleOpenEditModal = (classroom: ClassroomResponse) => {
    setEditingClassroom(classroom);
    setEditClassroomName(classroom.classroom_name);
    setShowEditModal(true);
  };

  const handleUpdateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editClassroomName.trim()) {
      setError('Classroom name is required');
      return;
    }

    if (!editingClassroom) {
      setError('No classroom selected');
      return;
    }

    setIsEditing(true);
    setError(null);

    const updatePayload: ClassroomUpdate = {
      classroom_name: editClassroomName.trim(),
    };

    const response = await classroomsAPI.updateClassroom(editingClassroom.classroom_id, updatePayload);

    if (response.status && response.status >= 400) {
      setError(response.message || 'Failed to update classroom');
    } else {
      setShowEditModal(false);
      setEditingClassroom(null);
      setEditClassroomName('');
      await fetchClassrooms();
    }

    setIsEditing(false);
  };

  const handleDeleteClassroom = async (classroomId: string) => {
    if (!window.confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
      return;
    }

    setError(null);
    const response = await classroomsAPI.deleteClassroom(classroomId);

    if (response.status && response.status >= 400) {
      setError(response.message || 'Failed to delete classroom');
    } else {
      await fetchClassrooms();
    }
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

  // Get color for a classroom based on its index
  const getClassroomColor = (index: number) => {
    return cardColors[index % cardColors.length];
  };

  // Authenticated user dashboard
  return (
    <div className="home-container">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.teacher_name}!</h1>
        <p>Ready to create amazing educational content?</p>
      </div>

      {/* Classrooms Section */}
      <div className="classrooms-section">
        <h2>Your Classrooms</h2>
        <div className="classrooms-grid">
          {classrooms.map((classroom, index) => {
            const color = getClassroomColor(index);
            return (
              <div
                key={classroom.classroom_id}
                className="classroom-card"
                style={{
                  background: color.bg,
                  color: color.text,
                }}
              >
                <div 
                  className="classroom-card-content"
                  onClick={() => navigate(`/classSubjects/${classroom.classroom_id}`)}
                >
                  <div className="classroom-icon"><FaBook size={32} /></div>
                  <h3>{classroom.classroom_name.toUpperCase()}</h3>
                </div>
                <div className="classroom-card-actions">
                  <button
                    className="classroom-card-action-btn classroom-card-edit-btn"
                    onClick={() => handleOpenEditModal(classroom)}
                    title="Edit classroom"
                  >
                    <MdEdit size={18} />
                  </button>
                  <button
                    className="classroom-card-action-btn classroom-card-delete-btn"
                    onClick={() => handleDeleteClassroom(classroom.classroom_id)}
                    title="Delete classroom"
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add Classroom Button */}
          <div
            className="classroom-card add-classroom-btn"
            style={{
              background: '#2d2d2d',
              border: '2px dashed #ffffff',
              cursor: 'pointer',
            }}
            onClick={() => setShowCreateModal(true)}
          >
            <div className="add-icon"><GrAdd size={48} /></div>
          </div>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Classroom</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                <IoClose size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateClassroom}>
              <div className="form-group">
                <label htmlFor="classroom-name">Classroom Name</label>
                <input
                  id="classroom-name"
                  type="text"
                  value={newClassroomName}
                  onChange={(e) => setNewClassroomName(e.target.value)}
                  placeholder="e.g: MyClassroom etc..."
                  disabled={isCreating}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Classroom Modal */}
      {showEditModal && editingClassroom && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Classroom</h2>
              <button
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                <IoClose size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdateClassroom}>
              <div className="form-group">
                <label htmlFor="edit-classroom-name">Classroom Name</label>
                <input
                  id="edit-classroom-name"
                  type="text"
                  value={editClassroomName}
                  onChange={(e) => setEditClassroomName(e.target.value)}
                  placeholder="Enter new classroom name"
                  disabled={isEditing}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={isEditing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isEditing}
                >
                  {isEditing ? 'Updating...' : 'Update Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
