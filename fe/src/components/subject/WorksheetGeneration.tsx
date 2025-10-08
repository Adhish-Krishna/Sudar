import { useState } from 'react';
import './WorksheetGeneration.css';

interface WorksheetGenerationProps {
  subjectName: string;
}

const WorksheetGeneration = ({ subjectName }: WorksheetGenerationProps) => {
  const [topics, setTopics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topics.trim()) return;
    
    setIsGenerating(true);
    
    // TODO: API call to generate worksheet
    console.log('Generating worksheet for topics:', topics);
    console.log('Subject:', subjectName);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsGenerating(false);
      alert('Worksheet generation feature coming soon!');
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
        </div>

        <div className="input-section">
          <div className="chat-input-container">
            <textarea
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="List down the topics to generate the worksheet."
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
                title="Generate Worksheet"
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
        </div>
      </div>
    </div>
  );
};

export default WorksheetGeneration;
