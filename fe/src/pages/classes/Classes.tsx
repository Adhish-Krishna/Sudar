import { useNavigate } from 'react-router-dom';
import './Classes.css';

const Classes = () => {
  const navigate = useNavigate();

  const classes = [
    { 
      id: 1, 
      name: 'Grade 1', 
      description: 'Primary Level - Foundation Learning',
      color: '#ff6b6b', 
      colorDark: '#ee5a52',
      studentCount: 25
    },
    { 
      id: 2, 
      name: 'Grade 2', 
      description: 'Primary Level - Basic Skills',
      color: '#4ecdc4', 
      colorDark: '#45b7aa',
      studentCount: 28
    },
    { 
      id: 3, 
      name: 'Grade 3', 
      description: 'Primary Level - Core Concepts',
      color: '#45b7d1', 
      colorDark: '#3a9bc1',
      studentCount: 30
    },
    { 
      id: 4, 
      name: 'Grade 4', 
      description: 'Primary Level - Advanced Basics',
      color: '#96ceb4', 
      colorDark: '#85b89d',
      studentCount: 32
    },
    { 
      id: 5, 
      name: 'Grade 5', 
      description: 'Elementary Level - Comprehensive Learning',
      color: '#feca57', 
      colorDark: '#fd9644',
      studentCount: 29
    },
    { 
      id: 6, 
      name: 'Grade 6', 
      description: 'Elementary Level - Pre-Middle School',
      color: '#ff9ff3', 
      colorDark: '#f368e0',
      studentCount: 27
    },
    { 
      id: 7, 
      name: 'Grade 7', 
      description: 'Middle School - Core Subjects',
      color: '#54a0ff', 
      colorDark: '#2e86de',
      studentCount: 35
    },
    { 
      id: 8, 
      name: 'Grade 8', 
      description: 'Middle School - Advanced Topics',
      color: '#5f27cd', 
      colorDark: '#341f97',
      studentCount: 33
    },
    { 
      id: 9, 
      name: 'Grade 9', 
      description: 'High School - Foundation Year',
      color: '#00d2d3', 
      colorDark: '#01a3a4',
      studentCount: 38
    },
    { 
      id: 10, 
      name: 'Grade 10', 
      description: 'High School - Board Preparation',
      color: '#ff6348', 
      colorDark: '#e55039',
      studentCount: 36
    },
    { 
      id: 11, 
      name: 'Grade 11', 
      description: 'Higher Secondary - Stream Selection',
      color: '#2ed573', 
      colorDark: '#20bf6b',
      studentCount: 40
    },
    { 
      id: 12, 
      name: 'Grade 12', 
      description: 'Higher Secondary - Final Year',
      color: '#ffa502', 
      colorDark: '#ff6348',
      studentCount: 42
    }
  ];

  const handleClassClick = (classId: number) => {
    navigate(`/classes/${classId}/subjects`);
  };

  return (
    <div className="classes-container">
      <div className="classes-header">
        <h1>Select a Class</h1>
        <p>Choose a grade level to view subjects and manage content</p>
      </div>
      
      <div className="classes-grid">
        {classes.map((classItem) => (
          <div 
            key={classItem.id}
            className="class-card"
            onClick={() => handleClassClick(classItem.id)}
            style={{ 
              '--class-color': classItem.color,
              '--class-color-dark': classItem.colorDark
            } as React.CSSProperties}
          >
            <div className="class-content">
              <h3>{classItem.name}</h3>
              <p className="class-description">{classItem.description}</p>
              <div className="class-stats">
                <span className="student-count">{classItem.studentCount} Students</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Classes;