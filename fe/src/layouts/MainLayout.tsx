import { useState } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import Header from '../components/header/Header';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className="main-layout">
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        onToggle={toggleSidebar} 
      />
      <div className={`main-content ${isSidebarExpanded ? 'expanded' : 'collapsed'}`}>
        <Header />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
