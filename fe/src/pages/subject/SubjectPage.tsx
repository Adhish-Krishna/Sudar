import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import SubjectDetail from '../../components/subject/SubjectDetail';
import WorksheetGeneration from '../../components/subject/WorksheetGeneration';
import { activities as activitiesAPI, subjects as subjectsAPI, type ActivityResponse } from '../../api';
import './SubjectPage.css';

type TabType = 'Subject' | 'AI Assistant';

const SubjectPage = () => {
  const { classroomId, subjectId } = useParams<{ classroomId: string; subjectId: string }>();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState<TabType>('Subject');
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [subjectName, setSubjectName] = useState<string>('');
  const [bannerColor, setBannerColor] = useState({ bg: '#3b82f6', text: '#ffffff' });

  // Fetch subject details and activities on component mount
  useEffect(() => {
    if (classroomId && subjectId) {
      fetchSubjectAndActivities();
    }
    
    // Extract color from URL query parameters
    const searchParams = new URLSearchParams(location.search);
    const bgColor = searchParams.get('bgColor');
    const textColor = searchParams.get('textColor');
    
    if (bgColor && textColor) {
      setBannerColor({ 
        bg: `#${bgColor}`, 
        text: `#${textColor}` 
      });
    }
  }, [classroomId, subjectId, location.search]);

  const fetchSubjectAndActivities = async () => {
    if (!classroomId || !subjectId) return;

    try {
      // Fetch subject details
      const subjectResponse = await subjectsAPI.getSubject(classroomId, subjectId);
      if (!subjectResponse.status && subjectResponse.subject_name) {
        setSubjectName(subjectResponse.subject_name);
      } else {
        setSubjectName('Unknown Subject');
      }

      // Fetch activities for the subject
      const activitiesResponse = await activitiesAPI.getActivitiesBySubject(subjectId);
      
      if (activitiesResponse.status || (activitiesResponse.message && activitiesResponse.status && activitiesResponse.status >= 400)) {
        setActivities([]);
      } else if (Array.isArray(activitiesResponse)) {
        setActivities(activitiesResponse);
      } else {
        setActivities([]);
      }
    } catch (err) {
      setSubjectName('Unknown Subject');
      setActivities([]);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Subject':
        return (
          <SubjectDetail 
            subjectName={subjectName} 
            activities={activities}
            bannerColor={bannerColor}
          />
        );
      case 'AI Assistant':
        return <WorksheetGeneration subjectName={subjectName} />;
      default:
        return (
          <SubjectDetail 
            subjectName={subjectName} 
            activities={activities}
            bannerColor={bannerColor}
          />
        );
    }
  };

  return (
    <div className="subject-page">
      {/* Breadcrumb */}
      {/* <div className="breadcrumb">
        <span className="breadcrumb-item">{subjectName}</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">{activeTab}</span>
      </div> */}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {(['Subject', 'AI Assistant'] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default SubjectPage;
