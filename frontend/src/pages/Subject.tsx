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
import { BookOpen, Home as HomeIcon, Users, Clock, FolderOpen, Bot } from "lucide-react";
import { useState, useEffect} from "react";
import ActivityCard from "@/components/ActivityCard";
import { activities, subjects, classrooms, type ActivityResponse } from "@/api";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const Subject = ()=>{
    const {classroom_id, subject_id, color} = useParams<{classroom_id: string, subject_id: string, color: string}>();
    const navigate = useNavigate();
    const [classroomName, setClassroomName] = useState<string>("");
    const [subjectName, setSubjectName] = useState<string>("");
    const [activityList, setActivityList] = useState<ActivityResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const isMobile = useIsMobile();

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

    useEffect(()=>{
        const fetchActivities = async ()=>{
            if(!subject_id) return;
            
            setLoading(true);
            try {
                const response = await activities.getActivitiesBySubject(subject_id);
                
                if (response.status && response.status !== 200) {
                    toast.error(response.message || "Failed to fetch activities");
                    setActivityList([]);
                } else if (Array.isArray(response)) {
                    setActivityList(response);
                } else {
                    toast.error("Unexpected response format");
                    setActivityList([]);
                }
            } catch (error: any) {
                toast.error(error.message || "Failed to fetch activities");
                setActivityList([]);
            } finally {
                setLoading(false);
            }
        }

        fetchActivities();
    }, [subject_id])

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
                            <BreadcrumbPage className="flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4"/>{!isMobile &&(subjectName || "Subject")}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            {/* Main Content */}
            <div className="h-[calc(100vh-3.5rem)] w-full">
                <div className="flex flex-col gap-4 p-4 lg:p-6">
                    <div className={`w-full h-28 ${decodeURIComponent(color || "")} rounded-2xl flex justify-center items-center`}>
                        <p className="text-4xl font-bold text-white">{subjectName || "Subject"}</p>
                    </div>
                    <div className="w-full bg-card border rounded-2xl flex flex-col justify-start overflow-hidden" style={{ height: 'calc(70vh)' }}>
                        <div className="flex w-full flex-row items-center gap-3 p-4 border-b shrink-0">
                            <Clock className="h-5 w-5"/>
                            <p className="text-xl font-semibold">Activity</p>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full w-full">
                                <div className="flex flex-col gap-3 p-5">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full py-20">
                                            <Spinner className="size-8"/>
                                        </div>
                                    ) : activityList.length > 0 ? (
                                        activityList.map((activity) => (
                                            <ActivityCard
                                                key={activity.activity_id}
                                                title={activity.title}
                                                type={activity.type}
                                                created_at={activity.created_at}
                                                navigateTo={`/activity/${activity.activity_id}`}
                                            />
                                        ))
                                        
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                                            <FolderOpen className="h-16 w-16 text-muted-foreground" />
                                            <div className="text-center">
                                                <p className="text-lg font-semibold text-muted-foreground">No Activities Found</p>
                                                <p className="text-sm text-muted-foreground mt-1">Create your first activity to get started</p>
                                                <Button className="mt-4 transition-transform hover:scale-110" size={"lg"} onClick={()=>navigate(`/chat/${classroom_id}/${subject_id}/${color}`)}>
                                                    <Bot/> 
                                                    <p className="font-semibold">
                                                        Ask Sudar AI
                                                    </p>
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </div>
            {activityList.length>0 && (
                <Button className="fixed bottom-10 right-10 transition-transform hover:scale-110 shadow-lg z-40" size={"sm"} onClick={()=>navigate(`/chat/${classroom_id}/${subject_id}/${color}`)}>
                    <Bot/> 
                    <p className="font-semibold">
                        Ask Sudar AI
                    </p>
                </Button>
            )}

        </>
    )
}

export default Subject;