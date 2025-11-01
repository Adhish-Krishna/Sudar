import {Home, Inbox, LogOut, User, Sun, Moon, Mail, IdCard} from "lucide-react"

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
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner";
import {useTheme} from '../contexts/ThemeProvider';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

const sidebarContentItems = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
  },
]

export function AppSidebar() {

  const {user, logout} = useAuth();

  const {theme, setTheme} = useTheme();

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
      className="glassmorphism"
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
                  <SidebarMenuButton asChild className="h-12">
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="cursor-pointer h-12" onClick={updateTheme}>
              <p>{theme=="light" ? <Sun/> : <Moon/>}Theme</p>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild className="cursor-pointer h-12" onClick={handleLogout}>
              <p><LogOut className="text-red-500 "/>Logout</p>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <HoverCard>
              <HoverCardTrigger asChild>
                <SidebarMenuButton asChild className="cursor-pointer h-12">
                  <p><User/>{user?.teacher_name}</p>
                </SidebarMenuButton>
              </HoverCardTrigger>
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