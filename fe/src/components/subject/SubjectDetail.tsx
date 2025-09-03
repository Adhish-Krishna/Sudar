import './SubjectDetail.css';

interface SubjectDetailProps {
  subjectName: string;
  subjectId: string;
}

interface Activity {
  id: string;
  title: string;
  date: string;
  type: 'document' | 'video';
}

const SubjectDetail = ({ subjectName, subjectId }: SubjectDetailProps) => {
  // Get subject-specific activities based on subjectId
  const getSubjectActivities = (id: string): Activity[] => {
    const subjectActivities: Record<string, Activity[]> = {
      '1': [ // Mathematics
        {
          id: '1',
          title: 'Algebra - Linear Equations Worksheet',
          date: '29 July, 2025',
          type: 'document'
        },
        {
          id: '2',
          title: 'Calculus Introduction Video',
          date: '28 July, 2025',
          type: 'video'
        },
        {
          id: '3',
          title: 'Geometry - Triangles Quiz',
          date: '27 July, 2025',
          type: 'document'
        }
      ],
      '2': [ // Science
        {
          id: '1',
          title: 'Physics - Newton\'s Laws Experiment',
          date: '30 July, 2025',
          type: 'video'
        },
        {
          id: '2',
          title: 'Chemistry - Periodic Table Assignment',
          date: '29 July, 2025',
          type: 'document'
        },
        {
          id: '3',
          title: 'Biology - Cell Structure Video',
          date: '28 July, 2025',
          type: 'video'
        }
      ],
      '3': [ // English
        {
          id: '1',
          title: 'Shakespeare - Romeo and Juliet Analysis',
          date: '31 July, 2025',
          type: 'document'
        },
        {
          id: '2',
          title: 'Grammar - Tenses Practice',
          date: '30 July, 2025',
          type: 'document'
        },
        {
          id: '3',
          title: 'Poetry - Literary Devices Video',
          date: '29 July, 2025',
          type: 'video'
        }
      ],
      '4': [ // History
        {
          id: '1',
          title: 'World War II - Key Events Timeline',
          date: '01 August, 2025',
          type: 'document'
        },
        {
          id: '2',
          title: 'Ancient Civilizations Documentary',
          date: '31 July, 2025',
          type: 'video'
        },
        {
          id: '3',
          title: 'Industrial Revolution Assignment',
          date: '30 July, 2025',
          type: 'document'
        }
      ],
      '5': [ // Geography
        {
          id: '1',
          title: 'Climate Change Impact Study',
          date: '02 August, 2025',
          type: 'document'
        },
        {
          id: '2',
          title: 'Mountain Formation Video',
          date: '01 August, 2025',
          type: 'video'
        },
        {
          id: '3',
          title: 'World Capitals Quiz',
          date: '31 July, 2025',
          type: 'document'
        }
      ],
      '6': [ // Computer Science
        {
          id: '1',
          title: 'Python Programming - Loops Tutorial',
          date: '03 August, 2025',
          type: 'video'
        },
        {
          id: '2',
          title: 'Data Structures - Arrays Assignment',
          date: '02 August, 2025',
          type: 'document'
        },
        {
          id: '3',
          title: 'Algorithm Design Workshop',
          date: '01 August, 2025',
          type: 'video'
        }
      ],
      // Legacy support for old string IDs
      'math': [
        {
          id: '1',
          title: 'Algebra - Linear Equations Worksheet',
          date: '29 July, 2025',
          type: 'document'
        }
      ],
      'science': [
        {
          id: '1',
          title: 'Physics - Newton\'s Laws Experiment',
          date: '30 July, 2025',
          type: 'video'
        }
      ],
      'tamil': [
        {
          id: '1',
          title: 'Tamizhar Thozhilnutpam Unit test -2',
          date: '29 July, 2025',
          type: 'document'
        },
        {
          id: '2',
          title: 'Tamizhar Thozhilnutpam',
          date: '29 July, 2025',
          type: 'video'
        }
      ]
    };
    
    return subjectActivities[id] || [];
  };

  const recentActivities = getSubjectActivities(subjectId);

  const getSubjectGradient = (id: string): string => {
    const gradients: Record<string, string> = {
      '1': 'from-cyan-500 to-blue-600',     // Mathematics
      '2': 'from-orange-500 to-red-600',    // Science
      '3': 'from-green-500 to-teal-600',    // English
      '4': 'from-purple-500 to-indigo-600', // History
      '5': 'from-blue-500 to-cyan-600',     // Geography
      '6': 'from-gray-500 to-slate-600',    // Computer Science
      // Legacy support
      'math': 'from-cyan-500 to-blue-600',
      'science': 'from-orange-500 to-red-600',
      'tamil': 'from-blue-500 to-indigo-600'
    };
    return gradients[id] || 'from-gray-500 to-gray-600';
  };

  const renderActivityIcon = (type: 'document' | 'video') => {
    if (type === 'document') {
      return (
        <div className="activity-icon document">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="activity-icon video">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
  };

  return (
    <div className="subject-detail">
      {/* Subject Header Card */}
      <div className={`subject-header-card ${getSubjectGradient(subjectId)}`}>
        <h2 className="subject-title">{subjectName}</h2>
      </div>

      {/* Recent Activity Section */}
      <div className="recent-activity-section">
        <h3 className="section-title">Recent Activity</h3>
        <div className="activity-list">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="activity-item">
              {renderActivityIcon(activity.type)}
              <div className="activity-content">
                <p className="activity-title">{activity.title}</p>
              </div>
              <span className="activity-date">{activity.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubjectDetail;
