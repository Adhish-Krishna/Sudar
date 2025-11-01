import {Home, Inbox, LogOut, User, Sun, Moon, Mail, IdCard, ChevronRight, Users, BookOpen} from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner";
import {useTheme} from '../contexts/ThemeProvider';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useState, useEffect } from "react"
import { classrooms, subjects } from "@/api"
import type { ClassroomResponse, SubjectResponse } from "@/api"
import { useClassroomRefresh } from "@/contexts/ClassroomContext"

const sidebarContentItems = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
]

export function AppSidebar() {

  const navigate = useNavigate();

  const {user, logout} = useAuth();

  const {theme, setTheme} = useTheme();

  const { refreshTrigger } = useClassroomRefresh();

  const { state } = useSidebar();

  const [classroomList, setClassroomList] = useState<ClassroomResponse[]>([]);
  const [isClassroomsOpen, setIsClassroomsOpen] = useState(false);
  const [openClassrooms, setOpenClassrooms] = useState<Record<string, boolean>>({});
  const [classroomSubjects, setClassroomSubjects] = useState<Record<string, SubjectResponse[]>>({});

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const response = await classrooms.getClassrooms();
        if (Array.isArray(response)) {
          setClassroomList(response);
          
          // Refresh subjects for all open classrooms
          Object.keys(openClassrooms).forEach(classroomId => {
            if (openClassrooms[classroomId]) {
              fetchSubjectsForClassroom(classroomId, true);
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch classrooms:", error);
      }
    };

    fetchClassrooms();
  }, [refreshTrigger]);

  const fetchSubjectsForClassroom = async (classroomId: string, forceRefresh = false) => {
    if (classroomSubjects[classroomId] && !forceRefresh) return;
    try {
      const response = await subjects.getSubjects(classroomId);
      if (Array.isArray(response)) {
        setClassroomSubjects(prev => ({
          ...prev,
          [classroomId]: response
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch subjects for classroom ${classroomId}:`, error);
    }
  };

  const toggleClassroom = (classroomId: string) => {
    const newState = !openClassrooms[classroomId];
    setOpenClassrooms(prev => ({
      ...prev,
      [classroomId]: newState
    }));

    // Fetch subjects when opening
    if (newState) {
      fetchSubjectsForClassroom(classroomId);
    }
  };

  const updateTheme = ()=>{
    if(theme == "light"){
      setTheme("dark");
    }
    else{
      setTheme("light");
    }
  }

  const handleLogout = async ()=>{
    try{
      await logout();
      toast.success("Successfully logged out");
    }catch(err){
      toast.error("Logout failed");
    }
  }

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarHeader>
          <SidebarGroupLabel className="font-bold text-3xl text-blue-400 mb-2.5">Sudar</SidebarGroupLabel>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarContentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild className="h-12">
                        <button onClick={()=>navigate(item.url)}>
                          <item.icon />
                          <span>{item.title}</span>
                        </button>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {state === "collapsed" && (
                      <TooltipContent side="right">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
              
              {/* Collapsible Classrooms Section */}
              <Collapsible
                open={isClassroomsOpen}
                onOpenChange={setIsClassroomsOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="h-12">
                          <Users/>
                          <span>Classrooms</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </TooltipTrigger>
                    {state === "collapsed" && (
                      <TooltipContent side="right">
                        Classrooms
                      </TooltipContent>
                    )}
                  </Tooltip>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {classroomList.length > 0 ? (
                        classroomList.map((classroom) => (
                          <Collapsible
                            key={classroom.classroom_id}
                            open={openClassrooms[classroom.classroom_id] || false}
                            onOpenChange={() => toggleClassroom(classroom.classroom_id)}
                            className="group/classroom-collapsible"
                          >
                            <SidebarMenuSubItem>
                              <div className="flex items-center w-full h-10 relative">
                                <CollapsibleTrigger asChild>
                                  <button 
                                    className="flex items-center justify-center w-8 h-10 hover:bg-accent/50 rounded-sm transition-colors z-10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/classroom-collapsible:rotate-90" />
                                  </button>
                                </CollapsibleTrigger>
                                <SidebarMenuSubButton 
                                  asChild 
                                  className="h-10 flex-1 ml-0 pl-2"
                                >
                                  <button
                                    onClick={() => navigate(`/classroom/${classroom.classroom_id}`)}
                                  >
                                    <span>{classroom.classroom_name}</span>
                                  </button>
                                </SidebarMenuSubButton>
                              </div>
                              <CollapsibleContent>
                                <SidebarMenuSub className="ml-4 border-l-2 border-muted pl-2">
                                  {classroomSubjects[classroom.classroom_id]?.length > 0 ? (
                                    classroomSubjects[classroom.classroom_id].map((subject) => (
                                      <SidebarMenuSubItem key={subject.subject_id}>
                                        <SidebarMenuSubButton asChild>
                                          <button 
                                            onClick={() => navigate(`/subject/${subject.subject_id}`)}
                                            className="flex items-center gap-2"
                                          >
                                            <BookOpen className="h-3.5 w-3.5" />
                                            <span>{subject.subject_name}</span>
                                          </button>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    ))
                                  ) : (
                                    <SidebarMenuSubItem>
                                      <SidebarMenuSubButton>
                                        <span className="text-muted-foreground text-xs">No subjects</span>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  )}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </SidebarMenuSubItem>
                          </Collapsible>
                        ))
                      ) : (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton>
                            <span className="text-muted-foreground text-xs">No classrooms</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton asChild className="cursor-pointer h-12" onClick={updateTheme}>
                  <p>{theme=="light" ? <Sun/> : <Moon/>}Theme</p>
                </SidebarMenuButton>
              </TooltipTrigger>
              {state === "collapsed" && (
                <TooltipContent side="right">
                  Theme
                </TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton asChild className="cursor-pointer h-12" onClick={handleLogout}>
                  <p><LogOut className="text-red-500 "/>Logout</p>
                </SidebarMenuButton>
              </TooltipTrigger>
              {state === "collapsed" && (
                <TooltipContent side="right">
                  Logout
                </TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <HoverCard>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HoverCardTrigger asChild>
                    <SidebarMenuButton asChild className="cursor-pointer h-12">
                      <p><User/>{user?.teacher_name}</p>
                    </SidebarMenuButton>
                  </HoverCardTrigger>
                </TooltipTrigger>
                {state === "collapsed" && (
                  <TooltipContent side="right">
                    {user?.teacher_name}
                  </TooltipContent>
                )}
              </Tooltip>
              <HoverCardContent className="w-80 ml-2.5 mb-2.5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 pb-2 border-b">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold">{user?.teacher_name}</h4>
                      <p className="text-xs text-muted-foreground">Teacher Account</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <IdCard className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Teacher ID</p>
                        <p className="text-sm font-medium">{user?.teacher_id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium break-all">{user?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  )
}