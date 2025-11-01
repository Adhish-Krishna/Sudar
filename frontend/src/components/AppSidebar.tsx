import {Home, Inbox, LogOut, User, Sun, Moon} from "lucide-react"

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
            <SidebarMenuButton asChild className="cursor-pointer h-12">
              <p>
                <User/>
                {user?.teacher_name}
              </p>
            </SidebarMenuButton>
          </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  )
}