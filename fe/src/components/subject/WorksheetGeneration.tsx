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
import { MdHistory, MdInsertDriveFile, MdAttachFile, MdSend, MdFullscreen, MdFullscreenExit } from 'react-icons/md';
import { AiOutlineClose } from 'react-icons/ai';

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
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('worksheet');
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
  const contentRef = useRef<HTMLDivElement>(null);

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

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setAttachedFiles(prev => [...prev, ...filesArray]);
      uploadFiles(filesArray);
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (!user?.teacher_id || !currentChatId) return;

    for (const file of files) {
      try {
        const response = await ragService.ingestDocument(
          file,
          user.teacher_id,
          currentChatId,
          subjectName
        );
        
        if (response.job_id) {
          // Check job status periodically
          checkJobStatus(response.job_id);
        }
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
      }
    }
  };

  const checkJobStatus = async (jobId: string) => {
    try {
      const status = await ragService.getJobStatus(jobId);
      if (status.status === 'completed') {
        fetchDocuments();
      } else if (status.status === 'failed') {
        console.error('Job failed:', jobId);
      }
    } catch (error) {
      console.error('Error checking job status:', error);
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

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
            <h3>Chat History</h3>
            {chatHistory.length > 0 ? (
              <div className="chat-history-list">
                {chatHistory.map((chat) => (
                  <button
                    key={chat.chat_id}
                    className={`chat-history-item ${currentChatId === chat.chat_id ? 'active' : ''}`}
                    onClick={() => handleHistoryClick(chat)}
                  >
                    <span className="chat-history-title">{new Date(chat.latest_timestamp).toLocaleString()}</span>
                    <span className="chat-history-count">{chat.message_count} messages</span>
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
            <h3>Files</h3>
            <div className="chat-files-section">
              <h4>Input Files</h4>
              {inputDocuments.length > 0 ? (
                <div className="chat-files-list">
                  {inputDocuments.map((doc) => (
                    <div key={doc.name} className="chat-file-list-item">
                      <MdInsertDriveFile />
                      <span>{doc.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="chat-files-empty">No input files</p>
              )}
            </div>
            <div className="chat-files-section">
              <h4>Output Files</h4>
              {outputDocuments.length > 0 ? (
                <div className="chat-files-list">
                  {outputDocuments.map((doc) => (
                    <div key={doc.name} className="chat-file-list-item">
                      <MdInsertDriveFile />
                      <span>{doc.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="chat-files-empty">No output files</p>
              )}
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
            placeholder="Ask Sudar AI"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <div className="chat-input-actions">
            <label className="chat-attach-btn">
              <input
                type="file"
                multiple
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
        </form>
      </div>
    </div>
  );
};

export default WorksheetGeneration;
