import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isExpanded, onToggle }: SidebarProps) => {
  const location = useLocation();
  
  const subjects = [
    { id: 'math', name: 'Maths' },
    { id: 'science', name: 'Science' },
    { id: 'tamil', name: 'Tamil' }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Header with hamburger menu */}
      <div className="sidebar-header">
        <button className="hamburger-btn" onClick={onToggle}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Navigation items */}
      <nav className="sidebar-nav">
        {/* Home icon - Updated with house icon */}
        <Link to="/home" className={`nav-item ${isActive('/home') ? 'active' : ''}`}>
          <div className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          {isExpanded && <span className="nav-text">Home</span>}
        </Link>

        <Link to="/students" className={`nav-item ${isActive('/students') ? 'active' : ''}`}>
          <div className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          {isExpanded && <span className="nav-text">Manage Students</span>}
        </Link>

        <Link to="/doubt-clearance" className={`nav-item ${isActive('/doubt-clearance') ? 'active' : ''}`}>
          <div className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {isExpanded && <span className="nav-text">Doubt Clearance</span>}
        </Link>

        <Link to="/ai-character" className={`nav-item ${isActive('/ai-character') ? 'active' : ''}`}>
          <div className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          {isExpanded && <span className="nav-text">AI Character</span>}
        </Link>

        <Link to="/classes" className={`nav-item expandable ${location.pathname.includes('/classes') || location.pathname.includes('/subject') ? 'active' : ''}`}>
          <div className="nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          {isExpanded && <span className="nav-text">List of Classes</span>}
        </Link>

        {/* Subject list - only show when expanded */}
        {isExpanded && (
          <div className="subject-list">
            {subjects.map(subject => (
              <Link 
                key={subject.id} 
                to={`/subject/${subject.id}`}
                className={`subject-item ${isActive(`/subject/${subject.id}`) ? 'active' : ''}`}
              >
                {subject.name}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
