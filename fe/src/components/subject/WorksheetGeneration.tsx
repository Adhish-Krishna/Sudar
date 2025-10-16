import { useState } from 'react';
import './WorksheetGeneration.css';

interface WorksheetGenerationProps {
  subjectName: string;
}

type Mode = 'worksheet' | 'content';

const WorksheetGeneration = ({ subjectName }: WorksheetGenerationProps) => {
  const [topics, setTopics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<Mode>('worksheet');
  const [showHistory, setShowHistory] = useState(false);

  const handleViewHistory = () => {
    // TODO: Implement history viewing functionality
    setShowHistory(!showHistory);
    console.log('View worksheet history clicked');
    alert('Previous worksheet history feature coming soon!');
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
      </div>
    </div>
  );
};

export default WorksheetGeneration;
