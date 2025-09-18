import { useNavigate, useParams } from 'react-router-dom';
import './ClassSubjects.css';

const ClassSubjects = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();

  // Get class name based on ID
  const getClassName = (id: string | undefined): string => {
    const classNames: Record<string, string> = {
      '1': 'Grade 1',
      '2': 'Grade 2',
      '3': 'Grade 3',
      '4': 'Grade 4',
      '5': 'Grade 5',
      '6': 'Grade 6',
      '7': 'Grade 7',
      '8': 'Grade 8',
      '9': 'Grade 9',
      '10': 'Grade 10',
      '11': 'Grade 11',
      '12': 'Grade 12'
    };
    return classNames[id || ''] || 'Unknown Grade';
  };

  const subjects = [
    { 
      id: 1, 
      name: 'Mathematics', 
      color: '#2563eb', 
      colorDark: '#1d4ed8'
    },
    { 
      id: 2, 
      name: 'Science', 
      color: '#10b981', 
      colorDark: '#059669'
    },
    { 
      id: 3, 
      name: 'English', 
      color: '#8b5cf6', 
      colorDark: '#7c3aed'
    },
    { 
      id: 4, 
      name: 'History', 
      color: '#f59e0b', 
      colorDark: '#d97706'
    },
    { 
      id: 5, 
      name: 'Geography', 
      color: '#06b6d4', 
      colorDark: '#0891b2'
    },
    { 
      id: 6, 
      name: 'Computer Science', 
      color: '#6366f1', 
      colorDark: '#4f46e5'
    },
    { 
      id: 7, 
      name: 'Tamil', 
      color: '#dc2626', 
      colorDark: '#b91c1c'
    },
    { 
      id: 8, 
      name: 'Physical Education', 
      color: '#ea580c', 
      colorDark: '#c2410c'
    }
  ];

  const handleSubjectClick = (subjectId: number) => {
    navigate(`/subject/${subjectId}`);
  };

  const handleBackToClasses = () => {
    navigate('/classes');
  };

  const className = getClassName(classId);

  return (
    <div className="class-subjects-container">
      {/* Breadcrumb */}
      <div className="subjects-breadcrumb">
        <div className="subjects-breadcrumb-path">
          <button onClick={handleBackToClasses} className="subjects-breadcrumb-back">
            ← Back to Classes
          </button>
        </div>
        <div className="subjects-breadcrumb-current">{className}</div>
      </div>

      <div className="class-subjects-header">
        <h1>Select a Subject</h1>
        <p>Choose a subject from {className} to view content and generate worksheets</p>
      </div>
      
      <div className="subjects-grid">
        {subjects.map((subject) => (
          <div 
            key={subject.id}
            className="subject-card"
            onClick={() => handleSubjectClick(subject.id)}
            style={{ 
              '--subject-color': subject.color,
              '--subject-color-dark': subject.colorDark
            } as React.CSSProperties}
          >
            <h3>{subject.name}</h3>
            <div className="subject-overlay">
              <span>View Content</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassSubjects;