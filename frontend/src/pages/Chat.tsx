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
import { BookOpen, Home as HomeIcon, Users, MessageSquare, Bot, Files, History, Plus} from "lucide-react";
import { useState, useEffect} from "react";
import { subjects, classrooms, ragService, documents, sudarAgent} from "@/api";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import ChatInput from "@/components/ChatInput";

const Chat = ()=>{
    const {classroom_id, subject_id, color} = useParams<{classroom_id: string, subject_id: string, color: string}>();
    const navigate = useNavigate();
    const [classroomName, setClassroomName] = useState<string>("");
    const [subjectName, setSubjectName] = useState<string>("");
    const isMobile = useIsMobile();
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
                                <button className="flex flex-row gap-2 items-center px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium border">
                                    <Plus className="h-4 w-4"/> {!isMobile && "New Chat"}
                                </button>
                            </TooltipTrigger>
                            {isMobile && (
                                <TooltipContent side="bottom">
                                    New Chat
                                </TooltipContent>
                            )}
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="flex flex-row gap-2 items-center px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium border">
                                    <Files className="h-4 w-4"/> {!isMobile && "Files"}
                                </button>
                            </TooltipTrigger>
                            {isMobile && (
                                <TooltipContent side="bottom">
                                    Files
                                </TooltipContent>
                            )}
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button className="flex flex-row gap-2 items-center px-4 py-2 rounded-lg hover:bg-accent transition-colors text-sm font-medium border">
                                    <History className="h-4 w-4"/> {!isMobile && "History"}
                                </button>
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
                <ScrollArea className="w-full h-[60%] flex flex-col">

                </ScrollArea>
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