import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaBook, FaUsers } from 'react-icons/fa';
import { GrAdd } from 'react-icons/gr';
import { IoClose } from 'react-icons/io5';
import { MdEdit, MdDelete } from 'react-icons/md';
import './Classroom.css';
import {
  subjects as subjectsAPI,
  students as studentsAPI,
  type SubjectResponse,
  type SubjectCreate,
  type SubjectUpdate,
  type StudentResponse,
  type StudentCreate,
  type StudentUpdate,
} from '../../api';

const Classroom: React.FC = () => {
  const { classroomId } = useParams<{ classroomId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'subjects' | 'students'>('subjects');

  // Subjects state
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectFormMode, setSubjectFormMode] = useState<'create' | 'edit'>('create');
  const [editingSubject, setEditingSubject] = useState<SubjectResponse | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);

  // Students state
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentFormMode, setStudentFormMode] = useState<'create' | 'edit'>('create');
  const [editingStudent, setEditingStudent] = useState<StudentResponse | null>(null);
  const [studentFormData, setStudentFormData] = useState({
    rollno: '',
    student_name: '',
    dob: '',
    grade: 10,
  });
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);

  // Common state
  const [error, setError] = useState<string | null>(null);

  // Subject color palette
  const subjectColors = [
    { bg: '#17a2b8', text: '#ffffff' },
    { bg: '#8b5cf6', text: '#ffffff' },
    { bg: '#3b82f6', text: '#ffffff' },
    { bg: '#ec4899', text: '#ffffff' },
    { bg: '#f59e0b', text: '#ffffff' },
    { bg: '#10b981', text: '#ffffff' },
    { bg: '#ef4444', text: '#ffffff' },
    { bg: '#06b6d4', text: '#ffffff' },
  ];

  // Fetch subjects and students on component mount
  useEffect(() => {
    if (!classroomId) {
      setError('Classroom ID not found');
      return;
    }
    fetchSubjects();
    fetchStudents();
  }, [classroomId]);

  const fetchSubjects = async () => {
    if (!classroomId) return;
    setError(null);
    const response = await subjectsAPI.getSubjects(classroomId);

    if (response.status || response.message) {
      setError(response.message || 'Failed to load subjects');
      setSubjects([]);
    } else if (Array.isArray(response)) {
      setSubjects(response);
    } else {
      setError('Invalid response format');
      setSubjects([]);
    }
  };

  const fetchStudents = async () => {
    if (!classroomId) return;
    setError(null);
    const response = await studentsAPI.getStudents(classroomId);

    if (response.status || response.message) {
      setError(response.message || 'Failed to load students');
      setStudents([]);
    } else if (Array.isArray(response)) {
      setStudents(response);
    } else {
      setError('Invalid response format');
      setStudents([]);
    }
  };

  // Subject handlers
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSubjectName.trim()) {
      setError('Subject name is required');
      return;
    }

    if (!classroomId) return;

    setIsCreatingSubject(true);
    setError(null);

    const createPayload: SubjectCreate = {
      subject_name: newSubjectName.trim(),
    };

    const response = await subjectsAPI.createSubject(classroomId, createPayload);

    if (response.status || (response.message && response.status && response.status >= 400)) {
      setError(response.message || 'Failed to create subject');
    } else {
      setNewSubjectName('');
      setShowSubjectModal(false);
      await fetchSubjects();
    }

    setIsCreatingSubject(false);
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!classroomId) return;
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    setError(null);
    const response = await subjectsAPI.deleteSubject(classroomId, subjectId);

    if (response.status || (response.message && response.status && response.status >= 400)) {
      setError(response.message || 'Failed to delete subject');
    } else {
      await fetchSubjects();
    }
  };

  const handleOpenSubjectModal = (subject?: SubjectResponse) => {
    if (subject) {
      setSubjectFormMode('edit');
      setEditingSubject(subject);
      setNewSubjectName(subject.subject_name);
    } else {
      setSubjectFormMode('create');
      setEditingSubject(null);
      setNewSubjectName('');
    }
    setShowSubjectModal(true);
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSubjectName.trim()) {
      setError('Subject name is required');
      return;
    }

    if (!editingSubject || !classroomId) {
      setError('No subject selected');
      return;
    }

    setIsCreatingSubject(true);
    setError(null);

    const updatePayload: SubjectUpdate = {
      subject_name: newSubjectName.trim(),
    };

    const response = await subjectsAPI.updateSubject(classroomId, editingSubject.subject_id, updatePayload);

    if (response.status || (response.message && response.status && response.status >= 400)) {
      setError(response.message || 'Failed to update subject');
    } else {
      setNewSubjectName('');
      setShowSubjectModal(false);
      setEditingSubject(null);
      await fetchSubjects();
    }

    setIsCreatingSubject(false);
  };

  // Student handlers
  const handleOpenStudentModal = (student?: StudentResponse) => {
    if (student) {
      setStudentFormMode('edit');
      setEditingStudent(student);
      setStudentFormData({
        rollno: student.rollno,
        student_name: student.student_name,
        dob: student.dob,
        grade: student.grade,
      });
    } else {
      setStudentFormMode('create');
      setEditingStudent(null);
      setStudentFormData({
        rollno: '',
        student_name: '',
        dob: '',
        grade: 10,
      });
    }
    setShowStudentModal(true);
  };

  const handleStudentFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStudentFormData(prev => ({
      ...prev,
      [name]: name === 'grade' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentFormData.rollno.trim() || !studentFormData.student_name.trim() || !studentFormData.dob) {
      setError('All fields are required');
      return;
    }

    if (!classroomId) return;

    setIsSubmittingStudent(true);
    setError(null);

    try {
      if (studentFormMode === 'create') {
        const createPayload: StudentCreate = {
          rollno: studentFormData.rollno.trim(),
          student_name: studentFormData.student_name.trim(),
          dob: studentFormData.dob,
          grade: studentFormData.grade,
        };

        const response = await studentsAPI.createStudent(classroomId, createPayload);

        if (response.status || (response.message && response.status && response.status >= 400)) {
          setError(response.message || 'Failed to create student');
        } else {
          setShowStudentModal(false);
          await fetchStudents();
        }
      } else if (studentFormMode === 'edit' && editingStudent) {
        const updatePayload: StudentUpdate = {
          student_name: studentFormData.student_name.trim(),
          dob: studentFormData.dob,
          grade: studentFormData.grade,
        };

        const response = await studentsAPI.updateStudent(
          classroomId,
          editingStudent.rollno,
          updatePayload
        );

        if (response.status || (response.message && response.status && response.status >= 400)) {
          setError(response.message || 'Failed to update student');
        } else {
          setShowStudentModal(false);
          await fetchStudents();
        }
      }
    } finally {
      setIsSubmittingStudent(false);
    }
  };

  const handleDeleteStudent = async (rollno: string) => {
    if (!classroomId) return;
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    setError(null);
    const response = await studentsAPI.deleteStudent(classroomId, rollno);

    if (response.status || (response.message && response.status && response.status >= 400)) {
      setError(response.message || 'Failed to delete student');
    } else {
      await fetchStudents();
    }
  };

  const getSubjectColor = (index: number) => {
    return subjectColors[index % subjectColors.length];
  };

  return (
    <div className="classroom-container">
      <div className="classroom-header">
        <h1>Classroom Management</h1>
        <p>Manage subjects and students</p>
      </div>

      {error && <div className="classroom-error-banner">{error}</div>}

      {/* Tab Navigation */}
      <div className="classroom-tab-navigation">
        <button
          className={`classroom-tab-button ${activeTab === 'subjects' ? 'active' : ''}`}
          onClick={() => setActiveTab('subjects')}
        >
          <FaBook style={{ marginRight: '8px' }} />
          Subjects
        </button>
        <button
          className={`classroom-tab-button ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <FaUsers style={{ marginRight: '8px' }} />
          Students ({students.length})
        </button>
      </div>

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <div className="classroom-tab-content">
          <div className="classroom-subjects-section">
            <h2>Your Subjects</h2>
            <div className="classroom-subjects-grid">
              {subjects.map((subject, index) => {
                const color = getSubjectColor(index);
                const bgColorEncoded = color.bg.replace('#', '');
                const textColorEncoded = color.text.replace('#', '');
                return (
                  <div
                    key={subject.subject_id}
                    className="classroom-subject-card"
                    style={{
                      background: color.bg,
                      color: color.text,
                    }}
                    onClick={() => navigate(`/classroom/${classroomId}/subject/${subject.subject_id}?bgColor=${bgColorEncoded}&textColor=${textColorEncoded}`)}
                  >
                  <div className="classroom-subject-header">
                      <h3>{subject.subject_name.toUpperCase()}</h3>
                      <div className="classroom-subject-actions">
                        <button
                          className="classroom-subject-action-btn classroom-subject-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSubjectModal(subject);
                          }}
                          title="Edit subject"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          className="classroom-subject-action-btn classroom-subject-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubject(subject.subject_id);
                          }}
                          title="Delete subject"
                        >
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </div>
                    <p className="classroom-subject-date">
                      Created: {new Date(subject.created_at).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}

              {/* Add Subject Button */}
              <div
                className="classroom-subject-card classroom-add-subject-btn"
                style={{
                  background: '#2d2d2d',
                  border: '2px dashed #ffffff',
                  cursor: 'pointer',
                }}
                onClick={() => handleOpenSubjectModal()}
              >
                <div className="classroom-add-icon">
                  <GrAdd size={48} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="classroom-tab-content">
          <div className="classroom-students-section">
            <div className="classroom-students-header">
              <h2>Enrolled Students</h2>
              <button
                className="classroom-btn classroom-btn-primary classroom-add-student-btn"
                onClick={() => handleOpenStudentModal()}
              >
                <GrAdd size={20} style={{ marginRight: '8px' }} />
                Add Student
              </button>
            </div>

            {students.length === 0 ? (
              <div className="classroom-empty-state">
                <p>No students enrolled yet. Add a student to get started.</p>
              </div>
            ) : (
              <div className="classroom-students-table-wrapper">
                <table className="classroom-students-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Date of Birth</th>
                      <th>Grade</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.rollno}>
                        <td>{student.rollno}</td>
                        <td>{student.student_name}</td>
                        <td>{new Date(student.dob).toLocaleDateString()}</td>
                        <td>{student.grade}</td>
                        <td className="classroom-actions-cell">
                          <button
                            className="classroom-action-btn classroom-edit-btn"
                            onClick={() => handleOpenStudentModal(student)}
                            title="Edit student"
                          >
                            <MdEdit size={18} />
                          </button>
                          <button
                            className="classroom-action-btn classroom-delete-btn"
                            onClick={() => handleDeleteStudent(student.rollno)}
                            title="Delete student"
                          >
                            <MdDelete size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Subject Modal */}
      {showSubjectModal && (
        <div className="classroom-modal-overlay" onClick={() => setShowSubjectModal(false)}>
          <div className="classroom-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="classroom-modal-header">
              <h2>{subjectFormMode === 'create' ? 'Add New Subject' : 'Edit Subject'}</h2>
              <button
                className="classroom-close-btn"
                onClick={() => setShowSubjectModal(false)}
              >
                <IoClose size={24} />
              </button>
            </div>
            <form onSubmit={subjectFormMode === 'create' ? handleCreateSubject : handleUpdateSubject}>
              <div className="classroom-form-group">
                <label htmlFor="subject-name">Subject Name</label>
                <input
                  id="subject-name"
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g., Mathematics, Science, English"
                  disabled={isCreatingSubject}
                />
              </div>
              <div className="classroom-modal-actions">
                <button
                  type="button"
                  className="classroom-btn classroom-btn-secondary"
                  onClick={() => setShowSubjectModal(false)}
                  disabled={isCreatingSubject}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="classroom-btn classroom-btn-primary"
                  disabled={isCreatingSubject}
                >
                  {isCreatingSubject
                    ? subjectFormMode === 'create'
                      ? 'Adding...'
                      : 'Updating...'
                    : subjectFormMode === 'create'
                      ? 'Add Subject'
                      : 'Update Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showStudentModal && (
        <div className="classroom-modal-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="classroom-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="classroom-modal-header">
              <h2>{studentFormMode === 'create' ? 'Enroll New Student' : 'Edit Student'}</h2>
              <button
                className="classroom-close-btn"
                onClick={() => setShowStudentModal(false)}
              >
                <IoClose size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitStudent}>
              <div className="classroom-form-group">
                <label htmlFor="rollno">Roll Number</label>
                <input
                  id="rollno"
                  type="text"
                  name="rollno"
                  value={studentFormData.rollno}
                  onChange={handleStudentFormChange}
                  placeholder="e.g., 101"
                  disabled={studentFormMode === 'edit' || isSubmittingStudent}
                />
              </div>

              <div className="classroom-form-group">
                <label htmlFor="student_name">Student Name</label>
                <input
                  id="student_name"
                  type="text"
                  name="student_name"
                  value={studentFormData.student_name}
                  onChange={handleStudentFormChange}
                  placeholder="Enter student name"
                  disabled={isSubmittingStudent}
                />
              </div>

              <div className="classroom-form-row">
                <div className="classroom-form-group classroom-half-width">
                  <label htmlFor="dob">Date of Birth</label>
                  <input
                    id="dob"
                    type="date"
                    name="dob"
                    value={studentFormData.dob}
                    onChange={handleStudentFormChange}
                    disabled={isSubmittingStudent}
                  />
                </div>

                <div className="classroom-form-group classroom-half-width">
                  <label htmlFor="grade">Grade</label>
                  <select
                    id="grade"
                    name="grade"
                    value={studentFormData.grade}
                    onChange={handleStudentFormChange}
                    disabled={isSubmittingStudent}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                      <option key={grade} value={grade}>
                        Grade {grade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="classroom-modal-actions">
                <button
                  type="button"
                  className="classroom-btn classroom-btn-secondary"
                  onClick={() => setShowStudentModal(false)}
                  disabled={isSubmittingStudent}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="classroom-btn classroom-btn-primary"
                  disabled={isSubmittingStudent}
                >
                  {isSubmittingStudent
                    ? studentFormMode === 'create'
                      ? 'Enrolling...'
                      : 'Updating...'
                    : studentFormMode === 'create'
                      ? 'Enroll Student'
                      : 'Update Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classroom;
