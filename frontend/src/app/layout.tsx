import { ThemeProvider } from "@/contexts/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import type { ReactNode } from "react";

interface RootLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: RootLayoutProps) {
  return (
    <>
      {children}
    </>
  );
}

export function DashboardLayout({ children }: RootLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      {children}
    </SidebarProvider>
  );
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="sudar-ui-theme">
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
