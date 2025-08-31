import { useNavigate } from 'react-router-dom';
import './Home.css';

interface Subject {
  id: string;
  name: string;
  gradient: string;
}

const Home = () => {
  const navigate = useNavigate();
  
  // TODO: Replace with API call to fetch subjects
  const subjects: Subject[] = [
    { 
      id: 'math', 
      name: 'MATHEMATICS', 
      gradient: 'from-cyan-500 to-blue-600' 
    },
    { 
      id: 'science', 
      name: 'SCIENCE', 
      gradient: 'from-orange-500 to-red-600' 
    },
    { 
      id: 'tamil', 
      name: 'TAMIL', 
      gradient: 'from-blue-500 to-indigo-600' 
    }
  ];

  const handleSubjectClick = (subjectId: string) => {
    navigate(`/subject/${subjectId}`);
  };

  const handleAddNewSubject = () => {
    // TODO: Implement add new subject functionality
    console.log('Add new subject clicked');
  };

  return (
    <div className="home-container">
      <div className="subjects-grid">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className={`subject-card ${subject.gradient}`}
            onClick={() => handleSubjectClick(subject.id)}
          >
            <div className="subject-star">
              <svg xmlns="http://www.w3.org/2000/svg" className="star-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h2 className="subject-name">{subject.name}</h2>
          </div>
        ))}
        
        {/* Add new subject card */}
        <div 
          className="subject-card add-card"
          onClick={handleAddNewSubject}
        >
          <div className="add-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="plus-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
