import { useParams } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { BookOpen, Home as HomeIcon, Users, MessageSquare, Files, History, Plus, Download, FileText, Loader2, Trash2} from "lucide-react";
import { useState, useEffect, useRef} from "react";
import { subjects, classrooms, documents, sudarAgent, ragService, context, type MinioDocument, type SSEEvent, type IndexedFileResponse, type ChatSummary} from "@/api";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import ChatInput from "@/components/ChatInput";
import { useAuth } from "@/contexts/AuthContext";
import { AuroraText } from "@/components/ui/aurora-text";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Response } from "@/components/ai-elements/response";
import FilesAndChat from "@/components/FilesAndChat";
import { Shimmer } from "@/components/ai-elements/shimmer";
import type { Section } from "@/components/FilesAndChat";

const Chat = ()=>{
    // Generate UUID v4
    const generateUUID = (): string => {
        return crypto.randomUUID();
    };

    const {classroom_id, subject_id, color} = useParams<{classroom_id: string, subject_id: string, color: string}>();
    const navigate = useNavigate();
    const [classroomName, setClassroomName] = useState<string>("");
    const [subjectName, setSubjectName] = useState<string>("");
    const isMobile = useIsMobile();
    const [chatId, setChatId] = useState<string | null>(generateUUID());
    const {user} = useAuth();
    
    // Chat messages state
    interface Message {
        role: 'user' | 'assistant';
        content: string;
        metadata?: any;
    }
    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentResponse, setCurrentResponse] = useState("");
    const [streamingMetadata, setStreamingMetadata] = useState<any>(null);
    const [currentPhase, setCurrentPhase] = useState<string>('');
    const [currentFlowType, setCurrentFlowType] = useState<string>('');
    const [streamingStatus, setStreamingStatus] = useState<string>('');
    const abortControllerRef = useRef<(() => void) | null>(null);
    
    // Files state
    const [filesOpen, setFilesOpen] = useState(false);
    const [inputDocs, setInputDocs] = useState<MinioDocument[]>([]);
    const [outputDocs, setOutputDocs] = useState<MinioDocument[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    
    // Chat History state
    const [historyOpen, setHistoryOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatSummary[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
    // const [input, setInput] = useState<string>("");

    // File upload state
    const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
    const [processingFiles, setProcessingFiles] = useState<Map<string, string>>(new Map()); // filename -> job_id
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pollingIntervalsRef = useRef<Map<string, number>>(new Map());

    // Context state
    const [contextOpen, setContextOpen] = useState(false);
    const [indexedFiles, setIndexedFiles] = useState<IndexedFileResponse[]>([]);
    const [loadingContext, setLoadingContext] = useState(false);
    const [selectedContext, setSelectedContext] = useState<Set<string>>(new Set());

    //Flow state
    const [flowType, setFlowType] = useState<"worksheet_generation" | "doubt_clearance">("doubt_clearance");

    // Ref for scroll area
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, currentResponse, streamingStatus]);


    useEffect(()=>{
        const fetchClassroomAndSubject = async ()=>{
            if(!classroom_id || !subject_id) return;
            
            try {
                // Fetch classroom name
                const classroomResponse = await classrooms.getClassroom(classroom_id);
                if (classroomResponse.status && classroomResponse.status !== 200) {
                    toast.error(classroomResponse.message || "Failed to fetch classroom");
                } else if (classroomResponse.classroom_name) {
                    setClassroomName(classroomResponse.classroom_name);
                }

                // Fetch subject name
                const subjectResponse = await subjects.getSubject(classroom_id, subject_id);
                if (subjectResponse.status && subjectResponse.status !== 200) {
                    toast.error(subjectResponse.message || "Failed to fetch subject");
                } else if (subjectResponse.subject_name) {
                    setSubjectName(subjectResponse.subject_name);
                }
            } catch (error: any) {
                toast.error(error.message || "Failed to fetch data");
            }
        }

        fetchClassroomAndSubject();
    }, [classroom_id, subject_id]);

    // Load chat history when chatId changes
    useEffect(() => {
        const loadChatHistory = async () => {
            if (!chatId || !user?.teacher_id || !subject_id) return;
            
            try {
                const response = await sudarAgent.getChatMessages(chatId);
                
                if (response.status && response.status !== 200) {
                    // New chat, no history
                    setMessages([]);
                } else if (response.messages && Array.isArray(response.messages)) {
                    // Convert chat messages to display messages
                    const loadedMessages: Message[] = [];
                    
                    for (const msg of response.messages) {
                        if (msg.messageType === 'user' && msg.userMessage) {
                            loadedMessages.push({
                                role: 'user',
                                content: msg.userMessage.query
                            });
                        } else if (msg.messageType === 'agent' && msg.agentMessage) {
                            loadedMessages.push({
                                role: 'assistant',
                                content: msg.agentMessage.fullResponse,
                                metadata: msg.agentMessage.finalMetadata
                            });
                        }
                    }
                    setMessages(loadedMessages);
                }
            } catch (error: any) {
                console.error("Failed to load chat history:", error);
                setMessages([]);
            }
        };

        loadChatHistory();
        
        // Clear indexed files and selected context when chat changes
        setIndexedFiles([]);
        setSelectedContext(new Set());
    }, [chatId, user?.teacher_id, subject_id]);

    // Cleanup polling intervals on unmount
    useEffect(() => {
        return () => {
            // Clear all polling intervals when component unmounts
            pollingIntervalsRef.current.forEach((intervalId) => {
                clearInterval(intervalId);
            });
            pollingIntervalsRef.current.clear();
        };
    }, []);

    // Fetch files when dialog opens
    useEffect(() => {
        if (filesOpen) {
            fetchFiles();
        }
    }, [filesOpen]);

    // Fetch chat history when dialog opens
    useEffect(() => {
        if (historyOpen) {
            fetchChatHistory();
        }
    }, [historyOpen]);

    // Poll for job status
    const pollJobStatus = async (jobId: string, filename: string) => {
        const pollInterval = setInterval(async () => {
            try {
                const statusResponse = await ragService.getJobStatus(jobId);
                
                if (statusResponse.status === 'completed') {
                    // Job completed successfully
                    clearInterval(pollInterval);
                    pollingIntervalsRef.current.delete(filename);
                    
                    setProcessingFiles(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(filename);
                        return newMap;
                    });
                    
                    toast.success(`${filename} processed successfully!`);
                    
                    // Refresh the files list to show the newly processed file
                    if (filesOpen) {
                        fetchFiles();
                    }
                } else if (statusResponse.status === 'failed') {
                    // Job failed
                    clearInterval(pollInterval);
                    pollingIntervalsRef.current.delete(filename);
                    
                    setProcessingFiles(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(filename);
                        return newMap;
                    });
                    
                    toast.error(`Failed to process ${filename}: ${statusResponse.message || 'Unknown error'}`);
                } else if (typeof statusResponse.status === 'number') {
                    // Error response from API
                    clearInterval(pollInterval);
                    pollingIntervalsRef.current.delete(filename);
                    
                    setProcessingFiles(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(filename);
                        return newMap;
                    });
                    
                    toast.error(`Error checking status for ${filename}`);
                }
                // Otherwise, job is still processing, continue polling
            } catch (error: any) {
                console.error(`Error polling job status for ${filename}:`, error);
            }
        }, 3000); // Poll every 3 seconds

        pollingIntervalsRef.current.set(filename, pollInterval);
    };

    const sendMessage = async (message: string) => {
        
        if (!chatId || !classroom_id || !message.trim()) {
            toast.error("Cannot send message. Please start a new chat.");
            return;
        }

        // Add user message to chat
        const userMessage: Message = { role: 'user', content: message };
        setMessages(prev => [...prev, userMessage]);
        setIsStreaming(true);
        setCurrentResponse("");
        setStreamingMetadata(null);
        setCurrentPhase('');
        setStreamingStatus('');

        let accumulatedResponse = "";
        let metadata: any = {};

        try {
            const abortFn = await sudarAgent.streamChat(
                {
                    chat_id: chatId,
                    classroom_id: classroom_id,
                    subject_id: subject_id,
                    query: message,
                    flow_type: flowType
                },
                {
                    onEvent: (event: SSEEvent) => {
                        console.log('SSE Event:', event); // Debug log
                        
                        // Set flow type and phase from event
                        if (event.flowType) {
                            setCurrentFlowType(event.flowType);
                        }
                        
                        switch (event.type) {
                            case 'start':
                                setStreamingStatus(`Starting ${event.flowType || 'chat'}...`);
                                break;
                                
                            case 'token':
                                accumulatedResponse += event.content;
                                setCurrentResponse(accumulatedResponse);
                                break;
                                
                            case 'status':
                                // Show status messages
                                if (event.content) {
                                    setStreamingStatus(event.content);
                                }
                                break;
                                
                            case 'phase_change':
                                // Handle phase changes (worksheet flow)
                                if (event.metadata?.currentPhase) {
                                    setCurrentPhase(event.metadata.currentPhase);
                                    setStreamingStatus(event.content || `Entering ${event.metadata.currentPhase} phase`);
                                }
                                break;
                                
                            case 'tool_call':
                                // Show tool call information
                                if (event.metadata?.toolName) {
                                    setStreamingStatus(`Calling tool: ${event.metadata.toolName}`);
                                    console.log(`Tool called: ${event.metadata.toolName}`);
                                }
                                break;
                                
                            case 'tool_result':
                                // Tool result received
                                if (event.metadata?.toolName) {
                                    setStreamingStatus(`Completed: ${event.metadata.toolName}`);
                                }
                                console.log(`Tool result from: ${event.metadata?.toolName}`);
                                break;
                                
                            case 'metadata':
                                // Store metadata for final message
                                metadata = { ...metadata, ...event.metadata };
                                setStreamingMetadata(event.metadata);
                                
                                // Show completion messages based on metadata type
                                if (event.metadata?.summaryType === 'research') {
                                    setStreamingStatus(`Research complete: ${event.metadata.findingsLength} characters of findings`);
                                } else if (event.metadata?.summaryType === 'generation_phase') {
                                    setStreamingStatus(`Worksheet generated: ${event.metadata.worksheetTitle}`);
                                }
                                break;
                                
                            case 'phase_complete':
                                // Phase completed
                                setStreamingStatus(event.content || `${event.metadata?.phase} phase completed`);
                                break;
                                
                            case 'done':
                                // Finalize the assistant message
                                setMessages(prev => [...prev, { 
                                    role: 'assistant', 
                                    content: accumulatedResponse,
                                    metadata: metadata
                                }]);
                                setCurrentResponse("");
                                setIsStreaming(false);
                                setCurrentPhase('');
                                setStreamingMetadata(null);
                                setStreamingStatus('');
                                break;
                                
                            case 'error':
                                setStreamingStatus(event.content || "Error during streaming");
                                toast.error(event.content || "Error during streaming");
                                setIsStreaming(false);
                                setCurrentResponse("");
                                setCurrentPhase('');
                                setStreamingMetadata(null);
                                setStreamingStatus('');
                                break;
                                
                            default:
                                // Handle any other event types
                                console.log('Unknown event type:', event.type, event);
                        }
                    },
                    onError: (error: any) => {
                        toast.error(error.message || "Failed to send message");
                        setIsStreaming(false);
                        setCurrentResponse("");
                        setCurrentPhase('');
                        setStreamingMetadata(null);
                        setStreamingStatus('');
                    }
                }
            );

            abortControllerRef.current = abortFn;
        } catch (error: any) {
            toast.error(error.message || "Failed to send message");
            setIsStreaming(false);
            setCurrentResponse("");
        }

    }

    // Fetch files when popover opens
    const fetchFiles = async () => {
        if (!subject_id || !user?.teacher_id || !chatId) return;
        
        setLoadingFiles(true);
        try {
            const [inputResponse, outputResponse] = await Promise.all([
                documents.getInputDocuments(user.teacher_id, classroom_id! , subject_id, chatId),
                documents.getOutputDocuments(user.teacher_id, classroom_id!, subject_id, chatId)
            ]);

            if (inputResponse.status && inputResponse.status !== 200) {
                toast.error("Failed to fetch input documents");
            } else if (inputResponse.documents) {
                setInputDocs(inputResponse.documents);
            }

            if (outputResponse.status && outputResponse.status !== 200) {
                toast.error("Failed to fetch output documents");
            } else if (outputResponse.documents) {
                setOutputDocs(outputResponse.documents);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch documents");
        } finally {
            setLoadingFiles(false);
        }
    };

    // Handle file download
    const handleDownloadFile = async (fileName: string, bucketType: 'input' | 'output') => {
        setDownloadingFile(fileName);
        try {
            const response = await documents.downloadDocument(bucketType, fileName);
            
            if (response.status && response.status !== 200) {
                toast.error(response.message || "Failed to download file");
                return;
            }

            // Create download link
            const url = window.URL.createObjectURL(response.blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = response.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success(`Downloaded ${response.filename}`);
        } catch (error: any) {
            toast.error(error.message || "Failed to download file");
        } finally {
            setDownloadingFile(null);
        }
    };

    // Toggle file selection
    const toggleFileSelection = (fileName: string) => {
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fileName)) {
                newSet.delete(fileName);
            } else {
                newSet.add(fileName);
            }
            return newSet;
        });
    };

    // Handle popover open change
    const handleFilesOpenChange = (open: boolean) => {
        setFilesOpen(open);
        if (open) {
            fetchFiles();
        }
    };

    // Fetch chat history when popover opens
    const fetchChatHistory = async () => {
        if (!subject_id) return;
        
        setLoadingHistory(true);
        try {
            const response = await sudarAgent.getChatsBySubject(subject_id, 1, 50);
            
            if (response.status && response.status !== 200) {
                toast.error("Failed to fetch chat history");
            } else if (response.chats) {
                setChatHistory(response.chats);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch chat history");
        } finally {
            setLoadingHistory(false);
        }
    };

    // Handle chat deletion
    const handleDeleteChat = async (chatIdToDelete: string) => {
        setDeletingChatId(chatIdToDelete);
        try {
            const response = await sudarAgent.deleteChat(chatIdToDelete);
            
            if (response.status && response.status !== 200) {
                toast.error(response.message || "Failed to delete chat");
                return;
            }
            
            toast.success("Chat deleted successfully");
            // Remove the deleted chat from the list
            setChatHistory(prev => prev.filter(chat => chat.chatId !== chatIdToDelete));
            
            // If the deleted chat was the current chat, reset chatId
            if (chatIdToDelete === chatId) {
                setChatId(generateUUID());
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete chat");
        } finally {
            setDeletingChatId(null);
        }
    };

    // Handle history popover open change
    const handleHistoryOpenChange = (open: boolean) => {
        setHistoryOpen(open);
        if (open) {
            fetchChatHistory();
        }
    };

    // Format timestamp for display
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    // Handle new chat creation
    const handleNewChat = () => {
        const newChatId = generateUUID();
        setChatId(newChatId);
        toast.success("New chat created");
    };

    // Handle file upload
    const handleAddFiles = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Handle file selection and upload
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        if (!chatId || !user?.teacher_id || !subject_id) {
            toast.error("Cannot upload files. Please start a new chat.");
            return;
        }

        const acceptedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];

        const filesToUpload = Array.from(files).filter(file => {
            if (!acceptedTypes.includes(file.type)) {
                toast.error(`File ${file.name} is not a supported type. Only .pdf, .docx, and .pptx files are allowed.`);
                return false;
            }
            return true;
        });

        if (filesToUpload.length === 0) return;

        // Upload files one by one
        for (const file of filesToUpload) {
            setUploadingFiles(prev => [...prev, file.name]);
            
            const uploadToast = toast.loading(`Uploading ${file.name}...`);
            
            try {
                const response = await ragService.ingestDocument(
                    file,
                    user.teacher_id,
                    chatId,
                    classroom_id!,
                    subject_id
                );

                // Check if response is an error (has numeric status code)
                if (typeof response.status === 'number' && response.status !== 200) {
                    toast.error(response.message || `Failed to upload ${file.name}`, { id: uploadToast });
                }
                // Success response has string status and job_id
                else if (response.job_id) {
                    toast.success(`${file.name} uploaded successfully. Processing...`, { id: uploadToast });
                    
                    // Add to processing files and start polling
                    setProcessingFiles(prev => {
                        const newMap = new Map(prev);
                        newMap.set(file.name, response.job_id);
                        return newMap;
                    });
                    
                    // Start polling for job status
                    pollJobStatus(response.job_id, file.name);
                }
            } catch (error: any) {
                toast.error(error.message || `Failed to upload ${file.name}`, { id: uploadToast });
            } finally {
                setUploadingFiles(prev => prev.filter(name => name !== file.name));
            }
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Fetch indexed context files
    const fetchIndexedFiles = async () => {
        if (!chatId) return;
        
        setLoadingContext(true);
        try {
            const response = await context.getContext(chatId);
            
            if (response.status && response.status !== 200) {
                // toast.error(response.message || "Failed to fetch indexed files");
            } else if (Array.isArray(response)) {
                setIndexedFiles(response);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch indexed files");
        } finally {
            setLoadingContext(false);
        }
    };

    // Handle context popover open change
    const handleContextOpenChange = (open: boolean) => {
        setContextOpen(open);
        if (open) {
            fetchIndexedFiles();
        }
    };

    // Toggle context file selection
    const toggleContextSelection = (filename: string) => {
        setSelectedContext(prev => {
            const newSet = new Set(prev);
            if (newSet.has(filename)) {
                newSet.delete(filename);
            } else {
                newSet.add(filename);
            }
            return newSet;
        });
    };

    return(
        <>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            {/* Header with Sidebar Trigger and Breadcrumb */}
            <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6 sticky top-0 z-50">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <button 
                                    onClick={() => navigate('/home')}
                                    className="flex items-center gap-1.5"
                                >
                                    <HomeIcon className="h-4 w-4" />
                                    {!isMobile && "Home"}
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <button 
                                    onClick={() => navigate(`/classroom/${classroom_id}`)}
                                    className="flex items-center gap-1.5"
                                >
                                    <Users className="h-4 w-4" />
                                    {!isMobile && (classroomName || "Classroom")}
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <button 
                                    onClick={() => navigate(`/subject/${classroom_id}/${subject_id}/${color}`)}
                                    className="flex items-center gap-1.5"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    {!isMobile && (subjectName || "Subject")}
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            <BreadcrumbPage className="flex items-center gap-1.5">
                                <MessageSquare className="h-4 w-4"/>{!isMobile &&"Chat"}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="w-full h-[94vh] bg-background flex flex-col">
                {/* Chat Header for Files, History, New Chat */}
                <div className="w-full h-[10%] flex justify-end items-center">
                    <div className="flex flex-row gap-2 justify-center items-center h-full px-6">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button 
                                    onClick={handleNewChat}
                                    className="flex flex-row gap-2 items-center px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium border"
                                >
                                    <Plus className="h-4 w-4"/> {!isMobile && "New Chat"}
                                </button>
                            </TooltipTrigger>
                            {isMobile && (
                                <TooltipContent side="bottom">
                                    New Chat
                                </TooltipContent>
                            )}
                        </Tooltip>
                        
                        {/* Files Button */}
                        <button 
                            onClick={() => setFilesOpen(true)}
                            className="flex flex-row gap-2 items-center px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium border relative"
                        >
                            <Files className="h-4 w-4"/> {!isMobile && "Files"}
                            {processingFiles.size > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full animate-pulse">
                                    {processingFiles.size}
                                </span>
                            )}
                        </button>

                        {/* Files Dialog */}
                        <FilesAndChat
                            open={filesOpen}
                            onOpenChange={handleFilesOpenChange}
                            title="Chat Files"
                            description={
                                processingFiles.size > 0 
                                    ? `${processingFiles.size} file(s) processing` 
                                    : selectedFiles.size > 0 
                                        ? `${selectedFiles.size} file(s) selected` 
                                        : "Select files to perform actions"
                            }
                            maxWidth="max-w-3xl"
                            scrollAreaHeight="h-[65vh]"
                            sections={[
                                ...(loadingFiles ? [{
                                    id: "loading",
                                    content: (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    )
                                }] : [
                                    ...(inputDocs.length > 0 ? [{
                                        id: "input-files",
                                        title: "Input Files",
                                        searchableText: inputDocs.map(doc => doc.name.split('/').pop()).join(' '),
                                        content: (
                                            <div className="space-y-1">
                                                {inputDocs.map((doc) => {
                                                    const isProcessing = processingFiles.has(doc.name);
                                                    
                                                    return (
                                                        <div
                                                            key={doc.name}
                                                            className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent transition-colors group"
                                                        >
                                                            {isProcessing ? (
                                                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                                                            ) : (
                                                                <Checkbox
                                                                    checked={selectedFiles.has(doc.name)}
                                                                    onCheckedChange={() => toggleFileSelection(doc.name)}
                                                                    className="shrink-0"
                                                                />
                                                            )}
                                                            <button
                                                                onClick={() => handleDownloadFile(doc.name, 'input')}
                                                                className="flex items-center gap-2 flex-1 text-left min-w-0"
                                                                disabled={downloadingFile === doc.name || isProcessing}
                                                            >
                                                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm truncate">
                                                                        {doc.name.split('/').pop()}
                                                                        {isProcessing && (
                                                                            <span className="ml-2 text-xs text-primary">Processing...</span>
                                                                        )}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {(doc.size / 1024).toFixed(2)} KB
                                                                    </p>
                                                                </div>
                                                                {downloadingFile === doc.name ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                                                ) : (
                                                                    <Download className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )
                                    }] : []),
                                    ...(outputDocs.length > 0 ? [{
                                        id: "output-files",
                                        title: "Output Files",
                                        searchableText: outputDocs.map(doc => doc.name.split('/').pop()).join(' '),
                                        content: (
                                            <div className="space-y-1">
                                                {outputDocs.map((doc) => (
                                                    <div
                                                        key={doc.name}
                                                        className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent transition-colors group"
                                                    >
                                                        <Checkbox
                                                            checked={selectedFiles.has(doc.name)}
                                                            onCheckedChange={() => toggleFileSelection(doc.name)}
                                                            className="shrink-0"
                                                        />
                                                        <button
                                                            onClick={() => handleDownloadFile(doc.name, 'output')}
                                                            className="flex items-center gap-2 flex-1 text-left min-w-0"
                                                            disabled={downloadingFile === doc.name}
                                                        >
                                                            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm truncate">{doc.name.split('/').pop()}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {(doc.size / 1024).toFixed(2)} KB
                                                                </p>
                                                            </div>
                                                            {downloadingFile === doc.name ? (
                                                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                                            ) : (
                                                                <Download className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            )}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }] : []),
                                    ...(!loadingFiles && inputDocs.length === 0 && outputDocs.length === 0 ? [{
                                        id: "empty",
                                        content: (
                                            <div className="py-8 text-center">
                                                <Files className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                                                <p className="text-sm text-muted-foreground">No files found</p>
                                                <p className="text-xs text-muted-foreground mt-1">Upload files to get started</p>
                                            </div>
                                        )
                                    }] : [])
                                ])
                            ] as Section[]}
                        />
                        
                        {/* Chat History Button */}
                        <button 
                            onClick={() => setHistoryOpen(true)}
                            className="flex flex-row gap-2 items-center px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium border"
                        >
                            <History className="h-4 w-4"/> {!isMobile && "History"}
                        </button>

                        {/* Chat History Dialog */}
                        <FilesAndChat
                            open={historyOpen}
                            onOpenChange={handleHistoryOpenChange}
                            title="Chat History"
                            description={`${chatHistory.length} chat${chatHistory.length !== 1 ? 's' : ''} found`}
                            maxWidth="max-w-3xl"
                            scrollAreaHeight="h-[65vh]"
                            sections={[
                                ...(loadingHistory ? [{
                                    id: "loading",
                                    content: (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    )
                                }] : chatHistory.length > 0 ? [{
                                    id: "chats",
                                    searchableText: chatHistory.map(chat => 
                                        `Chat ${chat.chatId.slice(0, 8)} ${chat.totalMessages} messages ${formatTimestamp(chat.lastActivityTime.toString())}`
                                    ).join(' '),
                                    content: (
                                        <div className="space-y-1">
                                            {chatHistory.map((chat) => (
                                                <div
                                                    key={chat.chatId}
                                                    className="flex items-center gap-2 px-3 py-3 rounded-md hover:bg-accent transition-colors group border border-transparent hover:border-border"
                                                >
                                                    <button
                                                        onClick={() => setChatId(chat.chatId)}
                                                        className="flex items-start gap-3 flex-1 text-left min-w-0"
                                                    >
                                                        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <p className="text-sm font-medium truncate">
                                                                    {chat.title || `Chat ${chat.chatId.slice(0, 8)}`}
                                                                </p>
                                                                {chat.chatId === chatId && (
                                                                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                                                        Active
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <span>{chat.totalMessages} message{chat.totalMessages !== 1 ? 's' : ''}</span>
                                                                <span>•</span>
                                                                <span>{formatTimestamp(chat.lastActivityTime.toString())}</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteChat(chat.chatId)}
                                                        disabled={deletingChatId === chat.chatId}
                                                        className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                                                        title="Delete chat"
                                                    >
                                                        {deletingChatId === chat.chatId ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                }] : [{
                                    id: "empty",
                                    content: (
                                        <div className="py-8 text-center">
                                            <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                                            <p className="text-sm text-muted-foreground">No chat history</p>
                                            <p className="text-xs text-muted-foreground mt-1">Start a conversation to see it here</p>
                                        </div>
                                    )
                                }])
                            ] as Section[]}
                        />
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div></div>
                            </TooltipTrigger>
                            {isMobile && (
                                <TooltipContent side="bottom">
                                    History
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </div>
                </div>

                {/*Scrollable area for chat messages*/}
                    {messages.length == 0 ? (
                        <div className="w-full h-[60%] flex flex-col items-center justify-center">
                            <div className="text-center space-y-4 px-4">
                                    <h2 className="text-3xl font-bold">
                                        Hello, <AuroraText>{user?.teacher_name || 'Teacher'}!</AuroraText>
                                    </h2>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Start a new conversation by clicking "New Chat" or select an existing chat from your history.
                                    </p>
                            </div>
                        </div>
                    ) : (
                        <ScrollArea ref={scrollAreaRef} className="w-full h-[60%]">
                            <div className="w-full flex justify-center">
                                <div className="w-full max-w-5xl">
                                    <Conversation>
                                        <ConversationContent>
                                            <div className="space-y-6">
                                                {messages.map((msg, idx) => (
                                            <div
                                                key={idx}
                                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`rounded-lg px-4 py-3 max-w-[80%] ${
                                                        msg.role === 'user'
                                                            ? 'bg-muted text-primary'
                                                            : ''
                                                    }`}
                                                >
                                                    {msg.role === 'user' ? (
                                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                    ) : (
                                                        <Response
                                                         className="text-sm prose prose-sm dark:prose-invert max-w-none"
                                                         parseIncompleteMarkdown={true}
                                                         >
                                                            {msg.content}
                                                        </Response>
                                                    )}
                                                </div>
                                                {msg.role === 'user' && (
                                                    <div className="shrink-0">
                                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                                                            {user?.teacher_name?.charAt(0).toUpperCase() || 'T'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        
                                        {/* Streaming status with Shimmer effect */}
                                        {isStreaming && streamingStatus && (
                                            <div className="flex gap-3 justify-start">
                                                <div className="rounded-lg px-4 py-3 max-w-[80%]">
                                                    <Shimmer className="text-sm" duration={2}>
                                                        {streamingStatus}
                                                    </Shimmer>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Streaming response */}
                                        {isStreaming && currentResponse && (
                                            <div className="flex gap-3 justify-start">
                                                <div className="rounded-lg px-4 py-3 max-w-[80%]">
                                                    <Response className="text-sm prose prose-sm dark:prose-invert max-w-none"
                                                    parseIncompleteMarkdown={true}>
                                                        {currentResponse}
                                                    </Response>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Loading indicator */}
                                        {isStreaming && !currentResponse && (
                                            <div className="flex gap-3 justify-start">
                                                <div className="rounded-lg px-4 py-3 bg-muted">
                                                    <div className="flex gap-1">
                                                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]"></div>
                                                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]"></div>
                                                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ConversationContent>
                                <ConversationScrollButton />
                            </Conversation>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                {/* Div for chat input box */}
                <div className="w-full h-[30%] flex justify-center items-center py-4">
                    <ChatInput
                        maxHeight={100}
                        messageHandler={sendMessage}
                        onAddFiles={handleAddFiles}
                        isUploadingFiles={uploadingFiles.length > 0}
                        onAddContext={handleContextOpenChange}
                        contextOpen={contextOpen}
                        indexedFiles={indexedFiles}
                        loadingContext={loadingContext}
                        selectedContext={selectedContext}
                        onToggleContext={toggleContextSelection}
                        flowType={flowType}
                        onFlowTypeChange={setFlowType}
                    />
                </div>
            </div>
        </>
    )
}

export default Chat;