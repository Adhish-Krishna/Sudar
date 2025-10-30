import { useState, useEffect, useRef } from 'react';
import './WorksheetGeneration.css';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../contexts/AuthContext';
import { sudarAgent, ragService, documents as docsAPI } from '../../api';
import type {
  ChatRequest,
  ChatMessage,
  ChatMetadata,
  SSEEvent,
  MinioDocument,
} from '../../api';
import { IoAdd } from 'react-icons/io5';
import {
  MdHistory,
  MdInsertDriveFile,
  MdAttachFile,
  MdSend,
  MdFullscreen,
  MdFullscreenExit,
  MdDownload,
  MdRefresh,
  MdErrorOutline,
} from 'react-icons/md';
import { AiOutlineClose, AiOutlineLoading3Quarters } from 'react-icons/ai';

interface WorksheetGenerationProps {
  subjectName: string;
}

interface IngestionJob {
  jobId: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

const WorksheetGeneration = ({ subjectName }: WorksheetGenerationProps) => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMetadata[]>([]);
  const [inputDocuments, setInputDocuments] = useState<MinioDocument[]>([]);
  const [outputDocuments, setOutputDocuments] = useState<MinioDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [ingestionJobs, setIngestionJobs] = useState<IngestionJob[]>([]);
  const [completedFiles, setCompletedFiles] = useState<MinioDocument[]>([]);
  const [showAtSuggestions, setShowAtSuggestions] = useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState<string[]>([]);
  const [isFilesRefreshing, setIsFilesRefreshing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const atSuggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize chat on component mount
  useEffect(() => {
    if (user?.teacher_id) {
      initializeChat();
      fetchChatHistory();
    }
  }, [user?.teacher_id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const initializeChat = () => {
    const newChatId = uuidv4();
    setCurrentChatId(newChatId);
    setChatMessages([]);
  };

  const fetchChatHistory = async () => {
    if (!user?.teacher_id) return;
    
    try {
      const response = await sudarAgent.getChats(user.teacher_id, subjectName);
      if (response.chats && Array.isArray(response.chats)) {
        setChatHistory(response.chats);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const fetchDocuments = async () => {
    if (!user?.teacher_id || !currentChatId) return;

    setIsFilesRefreshing(true);
    try {
      const [inputRes, outputRes] = await Promise.all([
        docsAPI.getInputDocuments(user.teacher_id, subjectName, currentChatId),
        docsAPI.getOutputDocuments(user.teacher_id, subjectName, currentChatId),
      ]);

      if (inputRes.documents) {
        setInputDocuments(inputRes.documents);
      }
      if (outputRes.documents) {
        setOutputDocuments(outputRes.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsFilesRefreshing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || !user?.teacher_id || !currentChatId) return;

    const userMessage: ChatMessage = {
      _id: uuidv4(),
      user_id: user.teacher_id,
      chat_id: currentChatId,
      subject_id: subjectName,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatRequest: ChatRequest = {
        user_id: user.teacher_id,
        chat_id: currentChatId,
        subject_id: subjectName,
        query: input,
      };

      const aiMessage: ChatMessage = {
        _id: uuidv4(),
        user_id: user.teacher_id,
        chat_id: currentChatId,
        subject_id: subjectName,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setChatMessages(prev => [...prev, aiMessage]);

      const stopStream = await sudarAgent.streamChat(chatRequest, {
        onEvent: (event: SSEEvent) => {
          if (event.type === 'token') {
            setChatMessages(prev => {
              const updated = [...prev];
              const lastMsg = updated[updated.length - 1];
              if (lastMsg.role === 'assistant') {
                lastMsg.content += event.content;
              }
              return updated;
            });
          } else if (event.type === 'done') {
            setIsLoading(false);
            fetchChatHistory();
          } else if (event.type === 'error') {
            console.error('Chat error:', event.content);
            setIsLoading(false);
          }
        },
        onError: (err) => {
          console.error('Streaming error:', err);
          setIsLoading(false);
        },
      });

      return stopStream;
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    initializeChat();
    fetchChatHistory();
  };

  const handleHistoryClick = (chatMetadata: ChatMetadata) => {
    setCurrentChatId(chatMetadata.chat_id);
    setShowChatHistory(false);
    // Fetch messages for this chat
    fetchChatMessagesForChat(chatMetadata.chat_id);
  };

  const fetchChatMessagesForChat = async (chatId: string) => {
    if (!user?.teacher_id) return;

    try {
      const messages = await sudarAgent.getChatHistory(chatId, user.teacher_id, subjectName);
      if (Array.isArray(messages)) {
        setChatMessages(messages);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  const ALLOWED_FILE_TYPES = ['.pdf', '.docx', '.pptx', '.xlsx', '.md'];

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0]; // Only take first file (single selection)
      
      // Validate file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
        alert(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
        event.target.value = ''; // Reset input
        return;
      }

      setAttachedFiles([file]); // Replace with single file
      uploadFiles([file]);
      event.target.value = ''; // Reset input after selection
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!user?.teacher_id || !currentChatId) return;

    for (const file of files) {
      try {
        const newJob: IngestionJob = {
          jobId: '',
          fileName: file.name,
          status: 'pending',
        };

        const response = await ragService.ingestDocument(
          file,
          user.teacher_id,
          currentChatId,
          subjectName
        );
        
        if (response.job_id) {
          newJob.jobId = response.job_id;
          newJob.status = 'processing';
          setIngestionJobs(prev => [...prev, newJob]);
          
          // Start polling job status
          pollJobStatus(response.job_id);
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
      }
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60; // Max 2 minutes of polling (2 sec intervals)
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await ragService.getJobStatus(jobId);
        const rawStatus = (status?.status ?? '').toString().toLowerCase();

        let normalizedStatus: IngestionJob['status'];
        if (rawStatus === 'completed') {
          normalizedStatus = 'completed';
        } else if (rawStatus === 'failed' || rawStatus === 'error') {
          normalizedStatus = 'failed';
        } else if (rawStatus === 'pending' || rawStatus === 'queued') {
          normalizedStatus = 'pending';
        } else {
          normalizedStatus = 'processing';
        }

        if (normalizedStatus === 'completed') {
          setIngestionJobs(prev => prev.filter(job => job.jobId !== jobId));
          await fetchDocuments();
          setAttachedFiles([]);
          return;
        }

        if (normalizedStatus === 'failed') {
          console.error('Job failed:', jobId);
          setIngestionJobs(prev =>
            prev.map(job =>
              job.jobId === jobId ? { ...job, status: 'failed' } : job
            )
          );
          return;
        }

        setIngestionJobs(prev =>
          prev.map(job =>
            job.jobId === jobId ? { ...job, status: normalizedStatus } : job
          )
        );

        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Error checking job status:', error);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000);
        }
      }
    };

    poll();
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Detect @ symbol for file suggestions
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const textAfterAt = value.substring(atIndex + 1).toLowerCase();
      
      // Get completed files (input documents that have been successfully ingested)
      const completedFilesList = inputDocuments.filter(doc => {
        // Filter by documents that belong to this chat and have been ingested
        return doc.name.toLowerCase().includes(textAfterAt);
      });

      if (completedFilesList.length > 0) {
        setCompletedFiles(completedFilesList);
        setShowAtSuggestions(true);
      } else {
        setShowAtSuggestions(false);
      }
    } else {
      setShowAtSuggestions(false);
    }
  };

  const handleFileSelection = (fileName: string) => {
    const atIndex = input.lastIndexOf('@');
    if (atIndex !== -1) {
      const beforeAt = input.substring(0, atIndex);
      const exactFileName = fileName.split('/').pop()?.trim();
      setInput(`${beforeAt}@${exactFileName} `);
      setShowAtSuggestions(false);
    }
  };

  const getDownloadKey = (bucket: 'input' | 'output', name: string) => `${bucket}:${name}`;

  const isFileDownloading = (bucket: 'input' | 'output', name: string) =>
    downloadingFiles.includes(getDownloadKey(bucket, name));

  const handleDownload = async (bucket: 'input' | 'output', fileDocument: MinioDocument) => {
    if (!user?.teacher_id) return;

    const downloadKey = getDownloadKey(bucket, fileDocument.name);
    setDownloadingFiles(prev => (prev.includes(downloadKey) ? prev : [...prev, downloadKey]));

    try {
      const downloadResponse = await docsAPI.downloadDocument(bucket, fileDocument.name);

      if (downloadResponse?.blob) {
        const blobUrl = window.URL.createObjectURL(downloadResponse.blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = downloadResponse.filename ?? fileDocument.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      } else {
        console.error('Download response did not include a blob:', downloadResponse);
        alert('Unable to download the file. Please try again.');
      }
    } catch (error) {
      console.error(`Error downloading file ${fileDocument.name}:`, error);
      alert('Unable to download the file. Please try again.');
    } finally {
      setDownloadingFiles(prev => prev.filter(key => key !== downloadKey));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || Number.isNaN(bytes)) {
      return '0 KB';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }

    const formatted = size < 10 && unitIndex > 0 ? size.toFixed(1) : Math.round(size).toString();
    return `${formatted} ${units[unitIndex]}`;
  };

  const formatRelativeTime = (isoString: string | null) => {
    if (!isoString) return 'Just now';
    const timestamp = new Date(isoString).getTime();
    if (Number.isNaN(timestamp)) return 'Just now';

    const diffMs = Date.now() - timestamp;
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    }
    if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(diffSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const formatHistoryTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }
    return date.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const handleRefreshFiles = () => {
    fetchDocuments();
  };

  const processingJobs = ingestionJobs.filter(
    (job) => job.status === 'pending' || job.status === 'processing'
  );

  const failedJobs = ingestionJobs.filter((job) => job.status === 'failed');

  return (
    <div className={`chat-container ${isFullscreen ? 'chat-fullscreen' : ''}`}>
      {/* Top Navigation */}
      <div className="chat-header">
        <button className="chat-header-btn" onClick={toggleFullscreen}>
          {isFullscreen ? (
            <>
              <MdFullscreenExit className="chat-header-icon" />
              Exit Fullscreen
            </>
          ) : (
            <>
              <MdFullscreen className="chat-header-icon" />
              Expand
            </>
          )}
        </button>
        <button className="chat-header-btn" onClick={handleNewChat}>
          <IoAdd className="chat-header-icon" />
          New Chat
        </button>
        <button className="chat-header-btn" onClick={() => setShowChatHistory(!showChatHistory)}>
          <MdHistory className="chat-header-icon" />
          History
        </button>
        <button className="chat-header-btn" onClick={() => { fetchDocuments(); setShowFiles(!showFiles); }}>
          <MdInsertDriveFile className="chat-header-icon" />
          Files
        </button>
      </div>

      {/* Chat Content Area */}
      <div className="chat-content" ref={contentRef}>
        {/* Chat History Sidebar */}
        {showChatHistory && (
          <div className="chat-history-panel">
            <div className="chat-history-header">
              <h3>Chat History</h3>
              <p>Pick a previous conversation to continue where you left off.</p>
            </div>
            {chatHistory.length > 0 ? (
              <div className="chat-history-list">
                {chatHistory.map((chat) => (
                  <button
                    key={chat.chat_id}
                    type="button"
                    className={`chat-history-item ${currentChatId === chat.chat_id ? 'active' : ''}`}
                    onClick={() => handleHistoryClick(chat)}
                  >
                    <div className="chat-history-item-top">
                      <MdHistory className="chat-history-item-icon" />
                      <div className="chat-history-item-text">
                        <span className="chat-history-title">{formatHistoryTimestamp(chat.latest_timestamp)}</span>
                        <span className="chat-history-subtitle">#{chat.chat_id.slice(0, 8).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="chat-history-meta">
                      <span>{chat.message_count} message{chat.message_count === 1 ? '' : 's'}</span>
                      <span>{formatRelativeTime(chat.latest_timestamp)}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="chat-history-empty">No chat history</p>
            )}
          </div>
        )}

        {/* Files Panel */}
        {showFiles && (
          <div className="chat-files-panel">
            <div className="chat-files-header">
              <div>
                <h3>Resources</h3>
                <p>Upload source material and download generated worksheets.</p>
              </div>
              <button
                type="button"
                className="chat-files-refresh"
                onClick={handleRefreshFiles}
                disabled={isFilesRefreshing}
              >
                {isFilesRefreshing ? (
                  <AiOutlineLoading3Quarters className="chat-files-refresh-spinner" />
                ) : (
                  <MdRefresh />
                )}
                <span>{isFilesRefreshing ? 'Refreshing' : 'Refresh'}</span>
              </button>
            </div>

            <div className="chat-files-body">
              {processingJobs.length > 0 && (
                <section className="chat-files-section">
                  <div className="chat-files-section-header">
                    <span className="chat-files-section-title">Processing</span>
                    <span className="chat-files-badge">{processingJobs.length}</span>
                  </div>
                  <div className="chat-files-list">
                    {processingJobs.map((job) => (
                      <div key={job.jobId} className="chat-file-card chat-file-card-processing">
                        <div className="chat-file-card-icon">
                          <AiOutlineLoading3Quarters className="chat-file-card-spinner" />
                        </div>
                        <div className="chat-file-card-content">
                          <span className="chat-file-card-name">{job.fileName}</span>
                          <span className="chat-file-card-meta">
                            {job.status === 'pending'
                              ? 'Queued for ingestion'
                              : 'Embedding content into knowledge base'}
                          </span>
                        </div>
                        <span className="chat-file-card-status">Processing</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {failedJobs.length > 0 && (
                <section className="chat-files-section">
                  <div className="chat-files-section-header">
                    <span className="chat-files-section-title">Needs attention</span>
                    <span className="chat-files-badge chat-files-badge-error">{failedJobs.length}</span>
                  </div>
                  <div className="chat-files-list">
                    {failedJobs.map((job) => (
                      <div key={job.jobId} className="chat-file-card chat-file-card-failed">
                        <div className="chat-file-card-icon error">
                          <MdErrorOutline />
                        </div>
                        <div className="chat-file-card-content">
                          <span className="chat-file-card-name">{job.fileName}</span>
                          <span className="chat-file-card-meta">Ingestion failed. Please try uploading again.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="chat-files-section">
                <div className="chat-files-section-header">
                  <span className="chat-files-section-title">Input files</span>
                  <span className="chat-files-badge">{inputDocuments.length}</span>
                </div>
                {inputDocuments.length > 0 ? (
                  <div className="chat-files-list">
                    {inputDocuments.map((doc) => {
                      const downloading = isFileDownloading('input', doc.name);
                      return (
                        <button
                          key={doc.name}
                          type="button"
                          className="chat-file-card"
                          onClick={() => handleDownload('input', doc)}
                          disabled={downloading}
                        >
                          <div className="chat-file-card-icon">
                            <MdInsertDriveFile />
                          </div>
                          <div className="chat-file-card-content">
                            <span className="chat-file-card-name">{doc.name}</span>
                            <span className="chat-file-card-meta">
                              {formatFileSize(doc.size)} • {formatRelativeTime(doc.last_modified)}
                            </span>
                          </div>
                          <div className="chat-file-card-action">
                            {downloading ? (
                              <AiOutlineLoading3Quarters className="chat-file-card-spinner" />
                            ) : (
                              <MdDownload />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="chat-files-empty">No input files yet.</p>
                )}
              </section>

              <section className="chat-files-section">
                <div className="chat-files-section-header">
                  <span className="chat-files-section-title">Output files</span>
                  <span className="chat-files-badge">{outputDocuments.length}</span>
                </div>
                {outputDocuments.length > 0 ? (
                  <div className="chat-files-list">
                    {outputDocuments.map((doc) => {
                      const downloading = isFileDownloading('output', doc.name);
                      return (
                        <button
                          key={doc.name}
                          type="button"
                          className="chat-file-card"
                          onClick={() => handleDownload('output', doc)}
                          disabled={downloading}
                        >
                          <div className="chat-file-card-icon">
                            <MdInsertDriveFile />
                          </div>
                          <div className="chat-file-card-content">
                            <span className="chat-file-card-name">{doc.name}</span>
                            <span className="chat-file-card-meta">
                              {formatFileSize(doc.size)} • {formatRelativeTime(doc.last_modified)}
                            </span>
                          </div>
                          <div className="chat-file-card-action">
                            {downloading ? (
                              <AiOutlineLoading3Quarters className="chat-file-card-spinner" />
                            ) : (
                              <MdDownload />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="chat-files-empty">No output files yet.</p>
                )}
              </section>
            </div>
          </div>
        )}
        {/* File Attachments Display */}
        {attachedFiles.length > 0 && (
          <div className="chat-files-display">
            {attachedFiles.map((file, index) => (
              <div key={index} className="chat-file-item">
                <MdInsertDriveFile className="chat-file-icon" />
                <div className="chat-file-info">
                  <div className="chat-file-name">{file.name}</div>
                  <button 
                    className="chat-file-remove"
                    onClick={() => removeFile(index)}
                  >
                    <AiOutlineClose />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ingestion Status Display */}
        {ingestionJobs.length > 0 && (
          <div className="chat-ingestion-status">
            {ingestionJobs.map((job) => (
              <div key={job.jobId} className={`chat-ingestion-item chat-ingestion-${job.status}`}>
                <MdInsertDriveFile className="chat-ingestion-icon" />
                <div className="chat-ingestion-info">
                  <span className="chat-ingestion-name">{job.fileName}</span>
                  <span className="chat-ingestion-status-text">{job.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chat Messages */}
        <div className="chat-messages">
          {chatMessages.length === 0 ? (
            <div className="chat-empty-state">
              <p>Start a new conversation</p>
            </div>
          ) : (
            chatMessages.map((message) => (
              <div key={message._id} className="chat-message-group">
                {message.role === 'user' ? (
                  <div className="chat-message chat-message-user">
                    {message.content}
                  </div>
                ) : (
                  <div className="chat-message chat-message-ai">
                    {message.content}
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="chat-loading">
              <div className="chat-loading-dot"></div>
              <div className="chat-loading-dot"></div>
              <div className="chat-loading-dot"></div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="chat-input-container">
        <form className="chat-input-wrapper" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="chat-input"
            placeholder="Ask Sudar AI (type @ to attach files)"
            value={input}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <div className="chat-input-actions">
            <label className="chat-attach-btn">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,.xlsx,.md"
                onChange={handleFileAttach}
                style={{ display: 'none' }}
                disabled={isLoading}
              />
              <MdAttachFile />
              Attach Files
            </label>
            <button className="chat-send-btn" type="submit" disabled={isLoading || !input.trim()}>
              <MdSend className="chat-send-icon" />
            </button>
          </div>
          
          {/* @ File Suggestions Dropdown */}
          {showAtSuggestions && completedFiles.length > 0 && (
            <div ref={atSuggestionsRef} className="chat-at-suggestions">
              <div className="chat-suggestions-header">Attach File</div>
              {completedFiles.map((file) => (
                <button
                  key={file.name}
                  type="button"
                  className="chat-suggestion-item"
                  onClick={() => handleFileSelection(file.name)}
                >
                  <MdInsertDriveFile className="chat-suggestion-icon" />
                  <span className="chat-suggestion-name">{file.name}</span>
                </button>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default WorksheetGeneration;
