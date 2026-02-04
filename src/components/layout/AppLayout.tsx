import { ReactNode, useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarWidth, setSidebarWidth] = useState(256);

  // Calculate sidebar width based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setSidebarWidth(0); // Mobile: no sidebar offset
      } else if (width < 1024) {
        setSidebarWidth(64); // Tablet: collapsed (w-16 = 64px)
      } else {
        setSidebarWidth(256); // Desktop: full (w-64 = 256px)
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div 
        className={cn(
          "transition-all duration-300",
          !isMobile && "pl-16 lg:pl-64"
        )}
        style={{ 
          paddingLeft: isMobile ? 0 : undefined 
        }}
      >
        <AppHeader title={title} subtitle={subtitle} />
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
