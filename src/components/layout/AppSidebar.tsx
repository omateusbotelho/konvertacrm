import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Kanban, 
  DollarSign, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import konvertaLogo from "@/assets/konverta-logo.png";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: string;
  roles?: ('admin' | 'closer' | 'sdr')[];
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Pipeline", href: "/pipeline", icon: Kanban },
  { name: "Contatos", href: "/contacts", icon: Users },
  { name: "Empresas", href: "/companies", icon: Building2 },
  { name: "Financeiro", href: "/financial", icon: DollarSign, roles: ['admin', 'closer'] },
  { name: "Relatórios", href: "/reports", icon: BarChart3, roles: ['admin'] },
];

const bottomNavigation: NavItem[] = [
  { name: "Configurações", href: "/settings", icon: Settings },
];

const roleLabels = {
  admin: { label: 'Admin', color: 'bg-primary/20 text-primary' },
  closer: { label: 'Closer', color: 'bg-chart-4/20 text-chart-4' },
  sdr: { label: 'SDR', color: 'bg-chart-3/20 text-chart-3' },
};

interface SidebarContentProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

function SidebarNavContent({ collapsed, onNavigate }: SidebarContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const canAccessItem = (item: NavItem) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  };

  const filteredNavigation = navigation.filter(canAccessItem);
  const filteredBottomNavigation = bottomNavigation.filter(canAccessItem);

  const handleNavClick = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border px-4",
        collapsed ? "justify-center" : "justify-start"
      )}>
        <img 
          src={konvertaLogo} 
          alt="Konverta" 
          className={cn(
            "object-contain transition-all",
            collapsed ? "h-8 w-8" : "h-10 w-auto max-w-[140px]"
          )}
        />
      </div>

      {/* User info */}
      {!collapsed && profile && role && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent">
              <span className="text-sm font-medium text-sidebar-accent-foreground">
                {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile.full_name}
              </p>
              <Badge className={cn("text-xs mt-0.5", roleLabels[role].color)}>
                {roleLabels[role].label}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {filteredBottomNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
        
        <button
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-collapse on tablet (640-1024px)
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 640 && width < 1024) {
        setCollapsed(true);
      } else if (width >= 1024) {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile: Sheet/Drawer
  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-4 z-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
          <SidebarNavContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  // Tablet & Desktop: Fixed sidebar
  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 hidden sm:block",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarNavContent collapsed={collapsed} />
      
      {/* Collapse button - only on tablet and desktop */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-muted"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </aside>
  );
}

// Export for use in layout
export function useSidebarWidth() {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 640 && width < 1024) {
        setCollapsed(true);
      } else if (width >= 1024) {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isMobile) return 0;
  return collapsed ? 64 : 256; // 16 * 4 = 64, 16 * 16 = 256
}
