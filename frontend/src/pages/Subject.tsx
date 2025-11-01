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
import { BookOpen, Home as HomeIcon, Users, Clock } from "lucide-react";
import { useState } from "react";
import ActivityCard from "@/components/ActivityCard";

const Subject = ()=>{
    const {classroom_id, color} = useParams<{classroom_id: string, subject_id: string, color: string}>();
    const navigate = useNavigate();
    const [classroomName] = useState<string>("");

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
                                    Home
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
                                    {classroomName}
                                </button>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator/>
                        <BreadcrumbItem>
                            <BreadcrumbPage className="flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4"/>{classroomName || "Subject"}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            {/* Main Content */}
            <div className="h-[calc(100vh-3.5rem)] w-full">
                <div className="flex flex-col gap-4 p-4 lg:p-6">
                    <div className={`w-full h-28 ${decodeURIComponent(color || "")} rounded-2xl flex justify-center items-center`}>
                        <p className="text-4xl font-bold text-white">Mathematics</p>
                    </div>
                    <div className="w-full bg-card border rounded-2xl flex flex-col justify-start overflow-hidden" style={{ height: 'calc(70vh)' }}>
                        <div className="flex w-full flex-row items-center gap-3 p-4 border-b shrink-0">
                            <Clock className="h-5 w-5"/>
                            <p className="text-xl font-semibold">Activity</p>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full w-full">
                                <div className="flex flex-col gap-3 p-5">
                                    <ActivityCard
                                        title="Waste Management Worksheet"
                                        type="Content"
                                        created_at={new Date().toUTCString()}
                                        navigateTo={"/home"}
                                    />
                                    <ActivityCard
                                        title="Waste Management Worksheet"
                                        type="Content"
                                        created_at={new Date().toUTCString()}
                                        navigateTo={"/home"}
                                    />
                                    <ActivityCard
                                        title="Waste Management Worksheet"
                                        type="Content"
                                        created_at={new Date().toUTCString()}
                                        navigateTo={"/home"}
                                    />
                                    <ActivityCard
                                        title="Waste Management Worksheet"
                                        type="Content"
                                        created_at={new Date().toUTCString()}
                                        navigateTo={"/home"}
                                    />
                                    <ActivityCard
                                        title="Waste Management Worksheet"
                                        type="Content"
                                        created_at={new Date().toUTCString()}
                                        navigateTo={"/home"}
                                    />
                                    <ActivityCard
                                        title="Waste Management Worksheet"
                                        type="Content"
                                        created_at={new Date().toUTCString()}
                                        navigateTo={"/home"}
                                    />
                                    <ActivityCard
                                        title="Waste Management Worksheet"
                                        type="Content"
                                        created_at={new Date().toUTCString()}
                                        navigateTo={"/home"}
                                    />
                                    <ActivityCard
                                        title="Waste Management Worksheet"
                                        type="Content"
                                        created_at={new Date().toUTCString()}
                                        navigateTo={"/home"}
                                    />
                                    
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </div>

        </>
    )
}

export default Subject;