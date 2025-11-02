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
import { BookOpen, Home as HomeIcon, Users, MessageSquare, Bot, Files, History, Plus, Download, FileText, Loader2, Trash2} from "lucide-react";
import { useState, useEffect} from "react";
import { subjects, classrooms, ragService, documents, sudarAgent, type MinioDocument, type ChatMetadata} from "@/api";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import ChatInput from "@/components/ChatInput";
import { useAuth } from "@/contexts/AuthContext";
import { AuroraText } from "@/components/ui/aurora-text";

const Chat = ()=>{
    const {classroom_id, subject_id, color} = useParams<{classroom_id: string, subject_id: string, color: string}>();
    const navigate = useNavigate();
    const [classroomName, setClassroomName] = useState<string>("");
    const [subjectName, setSubjectName] = useState<string>("");
    const isMobile = useIsMobile();
    const [chatId, setChatId] = useState<string | null>(null);
    const {user} = useAuth();
    
    // Files state
    const [filesOpen, setFilesOpen] = useState(false);
    const [inputDocs, setInputDocs] = useState<MinioDocument[]>([]);
    const [outputDocs, setOutputDocs] = useState<MinioDocument[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    
    // Chat History state
    const [historyOpen, setHistoryOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMetadata[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
    // const [input, setInput] = useState<string>("");

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

    const sendMessage = ()=>{

    }

    // Fetch files when popover opens
    const fetchFiles = async () => {
        if (!subject_id || !user?.teacher_id || !chatId) return;
        
        setLoadingFiles(true);
        try {
            const [inputResponse, outputResponse] = await Promise.all([
                documents.getInputDocuments(user.teacher_id, subject_id, chatId),
                documents.getOutputDocuments(user.teacher_id, subject_id, chatId)
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
        if (!subject_id || !user?.teacher_id) return;
        
        setLoadingHistory(true);
        try {
            const response = await sudarAgent.getChats(user.teacher_id, subject_id);
            
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
        if (!user?.teacher_id || !subject_id) return;
        
        setDeletingChatId(chatIdToDelete);
        try {
            const response = await sudarAgent.deleteChat(chatIdToDelete, user.teacher_id, subject_id);
            
            if (response.status && response.status !== 200) {
                toast.error(response.message || "Failed to delete chat");
                return;
            }
            
            toast.success("Chat deleted successfully");
            // Remove the deleted chat from the list
            setChatHistory(prev => prev.filter(chat => chat.chat_id !== chatIdToDelete));
            
            // If the deleted chat was the current chat, reset chatId
            if (chatIdToDelete === chatId) {
                setChatId("default_chat");
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

    // Generate UUID v4
    const generateUUID = (): string => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    // Handle new chat creation
    const handleNewChat = () => {
        const newChatId = generateUUID();
        setChatId(newChatId);
        toast.success("New chat created");
    };



    return(
        <>
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
                        <Popover open={filesOpen} onOpenChange={handleFilesOpenChange}>
                            <PopoverTrigger asChild>
                                <button className="flex flex-row gap-2 items-center px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium border">
                                    <Files className="h-4 w-4"/> {!isMobile && "Files"}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 max-h-[500px] p-0 mt-3" align="end">
                                <div className="flex flex-col">
                                    <div className="px-4 py-3 border-b">
                                        <h3 className="font-semibold text-sm">Chat Files</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {selectedFiles.size > 0 ? `${selectedFiles.size} file(s) selected` : "Select files to perform actions"}
                                        </p>
                                    </div>
                                    
                                    <ScrollArea className="max-h-[400px]">
                                        {loadingFiles ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : (
                                            <div className="p-2">
                                                {/* Input Documents */}
                                                {inputDocs.length > 0 && (
                                                    <div className="mb-4">
                                                        <div className="px-2 py-1.5">
                                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Input Files</h4>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {inputDocs.map((doc) => (
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
                                                                        onClick={() => handleDownloadFile(doc.name, 'input')}
                                                                        className="flex items-center gap-2 flex-1 text-left min-w-0"
                                                                        disabled={downloadingFile === doc.name}
                                                                    >
                                                                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm truncate">{doc.name}</p>
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
                                                    </div>
                                                )}

                                                {/* Separator if both types exist */}
                                                {inputDocs.length > 0 && outputDocs.length > 0 && (
                                                    <Separator className="my-2" />
                                                )}

                                                {/* Output Documents */}
                                                {outputDocs.length > 0 && (
                                                    <div>
                                                        <div className="px-2 py-1.5">
                                                            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Output Files</h4>
                                                        </div>
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
                                                                            <p className="text-sm truncate">{doc.name}</p>
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
                                                    </div>
                                                )}

                                                {/* Empty state */}
                                                {!loadingFiles && inputDocs.length === 0 && outputDocs.length === 0 && (
                                                    <div className="py-8 text-center">
                                                        <Files className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                                                        <p className="text-sm text-muted-foreground">No files found</p>
                                                        <p className="text-xs text-muted-foreground mt-1">Upload files to get started</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Popover open={historyOpen} onOpenChange={handleHistoryOpenChange}>
                            <PopoverTrigger asChild>
                                <button className="flex flex-row gap-2 items-center px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium border">
                                    <History className="h-4 w-4"/> {!isMobile && "History"}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 max-h-[500px] p-0 mt-3" align="end">
                                <div className="flex flex-col">
                                    <div className="px-4 py-3 border-b">
                                        <h3 className="font-semibold text-sm">Chat History</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {chatHistory.length} chat{chatHistory.length !== 1 ? 's' : ''} found
                                        </p>
                                    </div>
                                    
                                    <ScrollArea className="max-h-[400px]">
                                        {loadingHistory ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : (
                                            <div className="p-2">
                                                {chatHistory.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {chatHistory.map((chat) => (
                                                            <div
                                                                key={chat.chat_id}
                                                                className="flex items-center gap-2 px-3 py-3 rounded-md hover:bg-accent transition-colors group border border-transparent hover:border-border"
                                                            >
                                                                <button
                                                                    onClick={() => setChatId(chat.chat_id)}
                                                                    className="flex items-start gap-3 flex-1 text-left min-w-0"
                                                                >
                                                                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <p className="text-sm font-medium truncate">
                                                                                Chat {chat.chat_id.slice(0, 8)}
                                                                            </p>
                                                                            {chat.chat_id === chatId && (
                                                                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                                                                    Active
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                            <span>{chat.message_count} message{chat.message_count !== 1 ? 's' : ''}</span>
                                                                            <span>•</span>
                                                                            <span>{formatTimestamp(chat.latest_timestamp)}</span>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteChat(chat.chat_id)}
                                                                    disabled={deletingChatId === chat.chat_id}
                                                                    className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                                                                    title="Delete chat"
                                                                >
                                                                    {deletingChatId === chat.chat_id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-8 text-center">
                                                        <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                                                        <p className="text-sm text-muted-foreground">No chat history</p>
                                                        <p className="text-xs text-muted-foreground mt-1">Start a conversation to see it here</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </div>
                            </PopoverContent>
                        </Popover>
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
                    {!chatId ? (
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
                        
                        <ScrollArea className="w-full h-[60%]">
                        </ScrollArea>
                    )}
                {/* Div for chat input box */}
                <div className="w-full h-[30%] flex justify-center items-center py-4">
                    <ChatInput
                        maxHeight={100}
                        messageHandler={sendMessage}
                    />
                </div>
            </div>
        </>
    )
}

export default Chat;