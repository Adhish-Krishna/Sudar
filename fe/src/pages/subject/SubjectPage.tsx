import { useState } from 'react';
import { useParams } from 'react-router-dom';
import SubjectDetail from '../../components/subject/SubjectDetail';
import WorksheetGeneration from '../../components/subject/WorksheetGeneration';
import './SubjectPage.css';

type TabType = 'Subject' | 'AI Assistant';

const SubjectPage = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('Subject');

  // TODO: Replace with API call to fetch subject details
  const getSubjectName = (id: string | undefined): string => {
    const subjects: Record<string, string> = {
      '1': 'MATHEMATICS',
      '2': 'SCIENCE', 
      '3': 'ENGLISH',
      '4': 'HISTORY',
      '5': 'GEOGRAPHY',
      '6': 'COMPUTER SCIENCE',
      // Legacy support for old string IDs
      'math': 'MATHEMATICS',
      'science': 'SCIENCE', 
      'tamil': 'TAMIL'
    };
    return subjects[id || ''] || 'UNKNOWN SUBJECT';
  };

  const subjectName = getSubjectName(subjectId);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Subject':
        return <SubjectDetail subjectName={subjectName} subjectId={subjectId || ''} />;
      case 'AI Assistant':
        return <WorksheetGeneration subjectName={subjectName} />;
      default:
        return <SubjectDetail subjectName={subjectName} subjectId={subjectId || ''} />;
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
