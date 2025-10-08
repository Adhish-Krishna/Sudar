import React, { useState } from 'react';
import './ManageStudents.css';

interface Student {
  id: number;
  name: string;
  grade: string;
  email: string;
  phone: string;
  joinDate: string;
  status: 'active' | 'inactive';
}

const ManageStudents: React.FC = () => {
  const [students] = useState<Student[]>([
    {
      id: 1,
      name: 'Aarav Sharma',
      grade: 'Grade 10',
      email: 'aarav.sharma@email.com',
      phone: '+91 98765 43210',
      joinDate: '2024-01-15',
      status: 'active'
    },
    {
      id: 2,
      name: 'Priya Patel',
      grade: 'Grade 9',
      email: 'priya.patel@email.com',
      phone: '+91 87654 32109',
      joinDate: '2024-01-20',
      status: 'active'
    },
    {
      id: 3,
      name: 'Rohit Kumar',
      grade: 'Grade 11',
      email: 'rohit.kumar@email.com',
      phone: '+91 76543 21098',
      joinDate: '2024-02-01',
      status: 'inactive'
    },
    {
      id: 4,
      name: 'Sneha Reddy',
      grade: 'Grade 10',
      email: 'sneha.reddy@email.com',
      phone: '+91 65432 10987',
      joinDate: '2024-02-10',
      status: 'active'
    },
    {
      id: 5,
      name: 'Arjun Singh',
      grade: 'Grade 12',
      email: 'arjun.singh@email.com',
      phone: '+91 54321 09876',
      joinDate: '2024-01-05',
      status: 'active'
    },
    {
      id: 6,
      name: 'Kavya Nair',
      grade: 'Grade 9',
      email: 'kavya.nair@email.com',
      phone: '+91 43210 98765',
      joinDate: '2024-02-15',
      status: 'active'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = !filterGrade || student.grade === filterGrade;
    const matchesStatus = !filterStatus || student.status === filterStatus;
    
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const handleViewStudent = (studentId: number) => {
    console.log('View student:', studentId);
    alert(`View details for student ID: ${studentId}`);
  };

  const handleEditStudent = (studentId: number) => {
    console.log('Edit student:', studentId);
    alert(`Edit student ID: ${studentId}`);
  };

  const handleDeleteStudent = (studentId: number) => {
    console.log('Delete student:', studentId);
    if (window.confirm('Are you sure you want to remove this student?')) {
      alert(`Student ID ${studentId} removed (functionality to be implemented)`);
    }
  };

  return (
    <div className="manage-students">
      <div className="students-container">
        <div className="students-header">
          <h1>Manage Students</h1>
          <p>View and manage your students' information and progress</p>
        </div>

        <div className="students-controls">
          <div className="search-section">
            <div className="search-input-container">
              <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="filter-section">
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="filter-select"
            >
              <option value="">All Grades</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <button className="add-student-btn">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Student
          </button>
        </div>

        <div className="students-grid">
          {filteredStudents.map((student) => (
            <div key={student.id} className="student-card">
              <div className="student-header">
                <div className="student-avatar">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="student-info">
                  <h3 className="student-name">{student.name}</h3>
                  <p className="student-grade">{student.grade}</p>
                </div>
                <div className={`student-status ${student.status}`}>
                  {student.status}
                </div>
              </div>

              <div className="student-details">
                <div className="detail-item">
                  <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{student.email}</span>
                </div>
                <div className="detail-item">
                  <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{student.phone}</span>
                </div>
                <div className="detail-item">
                  <svg className="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 6v6a2 2 0 002 2h4a2 2 0 002-2v-6m-6 0h8m-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h2m8-10H16a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
                  </svg>
                  <span>Joined: {new Date(student.joinDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="student-actions">
                <button
                  onClick={() => handleViewStudent(student.id)}
                  className="action-btn view-btn"
                  title="View Details"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleEditStudent(student.id)}
                  className="action-btn edit-btn"
                  title="Edit Student"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteStudent(student.id)}
                  className="action-btn delete-btn"
                  title="Remove Student"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="no-students">
            <svg className="no-students-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3>No students found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStudents;