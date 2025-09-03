import { useNavigate } from 'react-router-dom';
import './Home.css';

interface HomeSection {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  route: string;
}

const Home = () => {
  const navigate = useNavigate();
  
  const homeSections: HomeSection[] = [
    { 
      id: 'students', 
      name: 'Manage Students', 
      description: 'Add, edit and manage student information',
      icon: 'users',
      gradient: 'from-blue-500 to-cyan-600',
      route: '/students'
    },
    { 
      id: 'doubt-clearance', 
      name: 'Doubt Clearance', 
      description: 'Help students with their questions and doubts',
      icon: 'help',
      gradient: 'from-green-500 to-emerald-600',
      route: '/doubt-clearance'
    },
    { 
      id: 'ai-character', 
      name: 'AI Character', 
      description: 'Interactive AI assistant for enhanced learning',
      icon: 'robot',
      gradient: 'from-purple-500 to-violet-600',
      route: '/ai-character'
    },
    { 
      id: 'classes', 
      name: 'List of Subjects', 
      description: 'View and manage all your class subjects',
      icon: 'classes',
      gradient: 'from-orange-500 to-red-600',
      route: '/classes'
    }
  ];

  const handleSectionClick = (section: HomeSection) => {
    if (section.id === 'classes') {
      // Navigate to classes page which will show subjects
      navigate('/classes');
    } else {
      navigate(section.route);
    }
  };

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'users':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="section-icon">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'help':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="section-icon">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'robot':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="section-icon">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'classes':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="section-icon">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">Welcome to Sudar Educational Platform</h1>
      </div>
      
      <div className="sections-grid">
        {homeSections.map((section) => (
          <div
            key={section.id}
            className={`section-card ${section.gradient}`}
            onClick={() => handleSectionClick(section)}
          >
            <div className="section-icon-container">
              {renderIcon(section.icon)}
            </div>
            <div className="section-content">
              <h3 className="section-name">{section.name}</h3>
              <p className="section-description">{section.description}</p>
            </div>
            <div className="section-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="arrow-icon">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
