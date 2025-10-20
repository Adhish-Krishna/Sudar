import './SubjectDetail.css';
import type { ActivityResponse } from '../../api';
import { FaPlay, FaClock, FaFileAlt } from 'react-icons/fa';

interface SubjectDetailProps {
  subjectName: string;
  activities?: ActivityResponse[];
  bannerColor?: {
    bg: string;
    text: string;
  };
  loading?: boolean;
  error?: string | null;
}

interface Activity {
  id: string;
  title: string;
  date: string;
  type: 'document' | 'video';
}

const SubjectDetail = ({ subjectName, activities: apiActivities = [], bannerColor = { bg: '#3b82f6', text: '#ffffff' } }: SubjectDetailProps) => {
  // Convert API activities to display format
  const convertApiActivities = (apiActivities: ActivityResponse[]): Activity[] => {
    return apiActivities.map((activity) => ({
      id: activity.activity_id,
      title: activity.title,
      date: new Date(activity.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      type: activity.type === 'Worksheet' ? 'document' : 'document'
    }));
  };

  // Get subject-specific activities based on subjectId
  const getSubjectActivities = (): Activity[] => {
    // Return API activities only
    return apiActivities && apiActivities.length > 0 ? convertApiActivities(apiActivities) : [];
  };

  const recentActivities = getSubjectActivities();

  return (
    <div className="subject-detail">
      {/* Subject Header Banner */}
      <div className="subject-banner" style={{ backgroundColor: bannerColor.bg }}>
        <div className="subject-banner-content">
          <h1 className="subject-banner-title" style={{ color: bannerColor.text }}>
            {subjectName}
          </h1>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="recent-activity-section">
        <div className="recent-activity-header">
          <FaClock className="recent-activity-icon" />
          <h3 className="recent-activity-title">Recent Activity</h3>
        </div>

        {recentActivities.length === 0 ? (
          <div className="empty-activities">
            <p>No activities yet</p>
          </div>
        ) : (
          <div className="activity-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon-wrapper">
                  {activity.type === 'document' ? (
                    <div className="activity-icon document">
                      <FaFileAlt />
                    </div>
                  ) : (
                    <div className="activity-icon video">
                      <FaPlay />
                    </div>
                  )}
                </div>
                <div className="activity-content">
                  <p className="activity-title">{activity.title}</p>
                </div>
                <span className="activity-date">{activity.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectDetail;
