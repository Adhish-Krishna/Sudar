import { useState } from 'react';
import './ContentCreation.css';

interface ContentCreationProps {
  subjectName: string;
}

const ContentCreation = ({ subjectName }: ContentCreationProps) => {
  const [contentTitle, setContentTitle] = useState('');
  const [contentBody, setContentBody] = useState('');

  const handleSaveContent = () => {
    // TODO: API call to save content
    console.log('Saving content:', {
      subject: subjectName,
      title: contentTitle,
      body: contentBody
    });
    
    // Reset form after save (for demo)
    setContentTitle('');
    setContentBody('');
    alert('Content saved successfully!');
  };

  return (
    <div className="content-creation">
      <div className="content-creation-container">
        <div className="greeting-section">
          <h2 className="greeting-title">
            Hi, <span className="educator-highlight">Educator</span> !
          </h2>
        </div>

        <div className="input-section">
          <div className="title-input-container">
            <input
              type="text"
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
              placeholder="Enter content title..."
              className="title-input"
            />
          </div>

          <div className="content-input-container">
            <textarea
              value={contentBody}
              onChange={(e) => setContentBody(e.target.value)}
              placeholder="Write your content here... (This will be enhanced with a rich text editor)"
              className="content-textarea"
              rows={8}
            />
            
            <div className="input-actions">
              <button 
                onClick={() => alert('File attachment feature coming soon!')}
                className="attach-button"
                title="Attach Files"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="attach-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                Attach Files
              </button>
              
              <button 
                onClick={handleSaveContent}
                disabled={!contentTitle.trim() || !contentBody.trim()}
                className="save-button"
                title="Save Content"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="save-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
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

export default ContentCreation;
