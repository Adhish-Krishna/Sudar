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
        <h2 className="page-title">Create New Content</h2>
        
        <div className="form-section">
          <div className="input-group">
            <label htmlFor="content-title" className="input-label">
              Content Title
            </label>
            <input
              id="content-title"
              type="text"
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
              placeholder="Enter content title..."
              className="title-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="content-body" className="input-label">
              Content Body
            </label>
            <textarea
              id="content-body"
              value={contentBody}
              onChange={(e) => setContentBody(e.target.value)}
              placeholder="Write your content here... (This will be replaced with a rich text editor later)"
              className="content-textarea"
              rows={12}
            />
          </div>

          <div className="form-actions">
            <button 
              onClick={handleSaveContent}
              className="save-button"
              disabled={!contentTitle.trim() || !contentBody.trim()}
            >
              Save Content
            </button>
          </div>
        </div>

        <div className="info-section">
          <p className="info-text">
            <strong>Subject:</strong> {subjectName}
          </p>
          <p className="info-text">
            💡 <em>This content creation interface will be enhanced with a rich text editor in future updates.</em>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContentCreation;
