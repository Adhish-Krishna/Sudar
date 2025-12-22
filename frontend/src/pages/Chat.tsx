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
import { BookOpen, Home as HomeIcon, Users, MessageSquare, Files, History, Plus, Download, FileText, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { subjects, classrooms, documents, sudarAgent, ragService, context, type MinioDocument, type IndexedFileResponse, type ChatSummary } from "@/api";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import ChatInput from "@/components/ChatInput";
import { useAuth } from "@/contexts/AuthContext";
import { AuroraText } from "@/components/ui/aurora-text";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import FilesAndChat from "@/components/FilesAndChat";
import type { Section } from "@/components/FilesAndChat";
import { useLoadChatHistory } from '../hooks/useLoadChatHistory';
import { StreamingMessageRenderer } from '../components/chat/StreamingMessageRenderer';
import { useStreamingChat, type ProcessedMessage } from '../hooks/useStreamingChat';
import CreateActivityDialog from "@/components/CreateActivityDialog";
import { Button } from "@/components/ui/button";

const Chat = () => {
    // Generate UUID v4
    const generateUUID = (): string => {
        return crypto.randomUUID();
    };

    // Clean filename by replacing spaces with underscores
    const cleanFileName = (filename: string): string => {
        return filename.replace(/\s+/g, '_');
    };

    const { classroom_id, subject_id, color } = useParams<{ classroom_id: string, subject_id: string, color: string }>();
    const navigate = useNavigate();
    const [classroomName, setClassroomName] = useState<string>("");
    const [subjectName, setSubjectName] = useState<string>("");
    const isMobile = useIsMobile();
    const [chatId, setChatId] = useState<string | null>(generateUUID());
    const { user } = useAuth();
    const [chatHistoryLoading, setChatHistoryLoading] = useState<boolean>(false);

    const { messages: historyMessages, loading: loadingHistory, setMessages } = useLoadChatHistory({
        chatId: chatId,
        subjectId: subject_id,
        userId: user?.teacher_id,
    });

    const { streamingState, sendMessage, stopStreaming } = useStreamingChat({
        chatId: chatId!,
        classroomId: classroom_id!,
        subjectId: subject_id!,
        onMessageComplete: (message) => {
            // Add completed message to history
            setMessages(prev => [...prev, message]);
        },
        onError: (error) => {
            console.error('Stream error:', error);
        }
    });

    const handleSendMessage = async (messageText: string) => {
        // Add user message immediately
        const userMessage: ProcessedMessage = {
            role: 'user',
            content: messageText
        };
        setMessages(prev => [...prev, userMessage]);

        // Start streaming
        await sendMessage(messageText, flowType, researchMode);
    };

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
    const [flowType, setFlowType] = useState<"worksheet_generation" | "doubt_clearance" | "content_creation">("doubt_clearance");
    const [researchMode, setResearchMode] = useState<"simple" | "moderate" | "deep">("moderate");

    // Activity creation dialog state
    const [activityDialogOpen, setActivityDialogOpen] = useState(false);


    // Ref for scroll area
    const scrollAreaRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        const fetchClassroomAndSubject = async () => {
            if (!classroom_id || !subject_id) return;

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

    // Fetch files when popover opens
    const fetchFiles = async () => {
        if (!subject_id || !user?.teacher_id || !chatId) return;

        setLoadingFiles(true);
        try {
            const [inputResponse, outputResponse] = await Promise.all([
                documents.getInputDocuments(user.teacher_id, classroom_id!, subject_id, chatId),
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

        setChatHistoryLoading(true);
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
            setChatHistoryLoading(false);
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
        setMessages([]);
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
            const cleanedFileName = cleanFileName(file.name);
            setUploadingFiles(prev => [...prev, cleanedFileName]);

            const uploadToast = toast.loading(`Uploading ${cleanedFileName}...`);

            try {
                // Create a new File object with cleaned filename
                const cleanedFile = new File([file], cleanedFileName, { type: file.type });

                const response = await ragService.ingestDocument(
                    cleanedFile,
                    user.teacher_id,
                    chatId,
                    classroom_id!,
                    subject_id
                );

                // Check if response is an error (has numeric status code)
                if (typeof response.status === 'number' && response.status !== 200) {
                    toast.error(response.message || `Failed to upload ${cleanedFileName}`, { id: uploadToast });
                }
                // Success response has string status and job_id
                else if (response.job_id) {
                    toast.success(`${cleanedFileName} uploaded successfully. Processing...`, { id: uploadToast });

                    // Add to processing files and start polling
                    setProcessingFiles(prev => {
                        const newMap = new Map(prev);
                        newMap.set(cleanedFileName, response.job_id);
                        return newMap;
                    });

                    // Start polling for job status
                    pollJobStatus(response.job_id, cleanedFileName);
                }
            } catch (error: any) {
                toast.error(error.message || `Failed to upload ${cleanedFileName}`, { id: uploadToast });
            } finally {
                setUploadingFiles(prev => prev.filter(name => name !== cleanedFileName));
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
                setIndexedFiles([]);
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

    return (
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
                        <BreadcrumbSeparator />
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
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="flex items-center gap-1.5">
                                <MessageSquare className="h-4 w-4" />{!isMobile && "Chat"}
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
                                    <Plus className="h-4 w-4" /> {!isMobile && "New Chat"}
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
                            <Files className="h-4 w-4" /> {!isMobile && "Files"}
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
                                                                    checked={selectedFiles.has(`input:${doc.name}`)}
                                                                    onCheckedChange={() => toggleFileSelection(`input:${doc.name}`)}
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
                                                            checked={selectedFiles.has(`output:${doc.name}`)}
                                                            onCheckedChange={() => toggleFileSelection(`output:${doc.name}`)}
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
                            footerContent={
                                selectedFiles.size > 0 && (
                                    <div className="flex justify-end">
                                        <Button onClick={() => setActivityDialogOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Activity ({selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''})
                                        </Button>
                                    </div>
                                )
                            }
                        />

                        {/* Create Activity Dialog */}
                        <CreateActivityDialog
                            open={activityDialogOpen}
                            onOpenChange={setActivityDialogOpen}
                            selectedFiles={Array.from(selectedFiles)}
                            subjectId={subject_id!}
                            onSuccess={() => {
                                setSelectedFiles(new Set());
                                setActivityDialogOpen(false);
                                setFilesOpen(false);
                            }}
                        />

                        {/* Chat History Button */}
                        <button
                            onClick={() => setHistoryOpen(true)}
                            className="flex flex-row gap-2 items-center px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium border"
                        >
                            <History className="h-4 w-4" /> {!isMobile && "History"}
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
                                ...(chatHistoryLoading ? [{
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
                                                        onClick={() => {
                                                            if (chat.chatId !== chatId) {
                                                                setChatId(chat.chatId);
                                                                setHistoryOpen(false);
                                                            } else {
                                                                setHistoryOpen(false);
                                                            }
                                                        }}
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
                {loadingHistory ? (
                    <div className="w-full h-[60%] flex flex-col items-center justify-center">
                        <div className="text-center space-y-4 px-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="text-muted-foreground">Loading chat messages...</p>
                        </div>
                    </div>
                ) : historyMessages.length == 0 ? (
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
                                            {historyMessages.map((msg, idx) => (
                                                <div key={idx} className="space-y-4">
                                                    {msg.role === 'user' ? (
                                                        <div className="flex gap-3 justify-end">
                                                            <div className="rounded-lg px-4 py-3 max-w-[80%] bg-muted text-primary">
                                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                            </div>
                                                            <div className="shrink-0">
                                                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                                                                    {user?.teacher_name?.charAt(0).toUpperCase() || 'T'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4">
                                                            {msg.steps && msg.steps.length > 0 ? (
                                                                <StreamingMessageRenderer
                                                                    steps={msg.steps}
                                                                    isStreaming={false}
                                                                />
                                                            ) : (
                                                                <p className="text-sm">{msg.content}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {streamingState.isStreaming && (
                                                <div className="p-4 border-primary">
                                                    <StreamingMessageRenderer
                                                        steps={streamingState.accumulatedSteps}
                                                        isStreaming={true}
                                                        currentPhase={streamingState.currentPhase}
                                                    />
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
                        messageHandler={handleSendMessage}
                        onStopStreaming={stopStreaming}
                        onAddFiles={handleAddFiles}
                        isUploadingFiles={uploadingFiles.length > 0}
                        isStreaming={streamingState.isStreaming}
                        onAddContext={handleContextOpenChange}
                        contextOpen={contextOpen}
                        indexedFiles={indexedFiles}
                        loadingContext={loadingContext}
                        selectedContext={selectedContext}
                        onToggleContext={toggleContextSelection}
                        flowType={flowType}
                        onFlowTypeChange={setFlowType}
                        researchMode={researchMode}
                        onResearchModeChange={setResearchMode}
                    />
                </div>
            </div>
        </>
    )
}

export default Chat;