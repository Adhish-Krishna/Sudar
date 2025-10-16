import { useState } from 'react';
import './WorksheetGeneration.css';

interface WorksheetGenerationProps {
  subjectName: string;
}

type Mode = 'worksheet' | 'content';

interface WorksheetHistory {
  id: number;
  title: string;
  topics: string;
  date: string;
  type: 'worksheet' | 'content';
}

const WorksheetGeneration = ({ subjectName }: WorksheetGenerationProps) => {
  const [topics, setTopics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<Mode>('worksheet');
  const [showHistory, setShowHistory] = useState(false);
  
  // Mock history data - Replace with API call
  const [history] = useState<WorksheetHistory[]>([
    {
      id: 1,
      title: 'Mathematics - Algebra Basics',
      topics: 'Linear equations, quadratic equations, polynomials',
      date: '2024-01-15',
      type: 'worksheet'
    },
    {
      id: 2,
      title: 'Science - Photosynthesis',
      topics: 'Plant biology, chemical reactions, energy conversion',
      date: '2024-01-14',
      type: 'worksheet'
    },
    {
      id: 3,
      title: 'English - Grammar Exercises',
      topics: 'Tenses, articles, prepositions',
      date: '2024-01-13',
      type: 'worksheet'
    }
  ]);

  const handleViewHistory = () => {
    setShowHistory(!showHistory);
    console.log('View worksheet history clicked');
  };

  const handleGenerate = async () => {
    if (!topics.trim()) return;
    
    setIsGenerating(true);
    
    // TODO: API call to generate worksheet or content based on mode
    if (mode === 'worksheet') {
      console.log('Generating worksheet for topics:', topics);
      console.log('Subject:', subjectName);
    } else {
      console.log('Creating content for:', topics);
      console.log('Subject:', subjectName);
    }
    
    // Simulate API call delay
    setTimeout(() => {
      setIsGenerating(false);
      const message = mode === 'worksheet' 
        ? 'Worksheet generation feature coming soon!' 
        : 'Content creation feature coming soon!';
      alert(message);
    }, 2000);
  };

  const handleAttachFiles = () => {
    // TODO: Implement file attachment functionality
    console.log('Attach files clicked');
    alert('File attachment feature coming soon!');
  };

  return (
    <div className="worksheet-generation">
      <div className="worksheet-container">
        <div className="greeting-section">
          <h2 className="greeting-title">
            Hi, <span className="educator-highlight">Educator</span> !
          </h2>
          
          {/* History Button - Only show in worksheet mode */}
          {mode === 'worksheet' && (
            <button 
              onClick={handleViewHistory}
              className="history-button"
              title="View Previous Worksheets"
            >
              <svg className="history-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="history-badge">3</span>
            </button>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="mode-switcher">
          <button 
            className={`mode-button ${mode === 'worksheet' ? 'active' : ''}`}
            onClick={() => setMode('worksheet')}
          >
            <svg className="mode-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate Worksheet
          </button>
          
          <button 
            className={`mode-button ${mode === 'content' ? 'active' : ''}`}
            onClick={() => setMode('content')}
          >
            <svg className="mode-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Create Content
          </button>
        </div>

        <div className="input-section">
          <div className="chat-input-container">
            <textarea
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder={
                mode === 'worksheet' 
                  ? "List down the topics to generate the worksheet." 
                  : "Describe the content you want to create or concepts you want to explain."
              }
              className="topics-input"
              rows={4}
            />
            
            <div className="input-actions">
              <button 
                onClick={handleAttachFiles}
                className="attach-button"
                title="Attach Files"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="attach-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Attach Files
              </button>
              
              <button 
                onClick={handleGenerate}
                disabled={!topics.trim() || isGenerating}
                className="generate-button"
                title={mode === 'worksheet' ? "Generate Worksheet" : "Create Content"}
              >
                {isGenerating ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="send-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="info-section">
          <p className="info-text">
            <strong>Subject:</strong> {subjectName}
          </p>
          <p className="info-text">
            {mode === 'worksheet' ? '📝' : '✍️'} <em>
              {mode === 'worksheet' 
                ? 'Worksheet generation functionality will be implemented with AI integration.' 
                : 'Content creation functionality will be implemented with AI assistance.'}
            </em>
          </p>
        </div>

        {/* History Modal */}
        {showHistory && (
          <div className="history-overlay" onClick={handleViewHistory}>
            <div className="history-modal" onClick={(e) => e.stopPropagation()}>
              <div className="history-header">
                <h3>Previously Generated Worksheets</h3>
                <button 
                  className="close-button"
                  onClick={handleViewHistory}
                  title="Close"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="history-content">
                {history.length === 0 ? (
                  <div className="no-history">
                    <svg className="no-history-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No worksheets generated yet</p>
                  </div>
                ) : (
                  <div className="history-list">
                    {history.map((item) => (
                      <div key={item.id} className="history-item">
                        <div className="history-item-header">
                          <h4>{item.title}</h4>
                          <span className="history-date">
                            {new Date(item.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="history-topics">{item.topics}</p>
                        <div className="history-actions">
                          <button 
                            className="history-action-btn view-btn"
                            onClick={() => console.log('View worksheet:', item.id)}
                            title="View Worksheet"
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                          <button 
                            className="history-action-btn download-btn"
                            onClick={() => console.log('Download worksheet:', item.id)}
                            title="Download Worksheet"
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </button>
                          <button 
                            className="history-action-btn delete-btn"
                            onClick={() => console.log('Delete worksheet:', item.id)}
                            title="Delete Worksheet"
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorksheetGeneration;
