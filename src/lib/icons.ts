/**
 * KonvertaOS Icon Library
 * Centralized icon configuration using Lucide React
 */

import {
  LayoutDashboard,
  Kanban,
  Building2,
  Users,
  CheckSquare,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  Calendar,
  ClipboardList,
  StickyNote,
  Target,
  Award,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  MoreHorizontal,
  MoreVertical,
  Eye,
  EyeOff,
  Check,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  User,
  UserPlus,
  UserCheck,
  Briefcase,
  Percent,
  Receipt,
  BarChart3,
  PieChart,
  Activity,
  type LucideIcon,
} from "lucide-react";

// Navigation icons
export const NavigationIcons = {
  Dashboard: LayoutDashboard,
  Pipeline: Kanban,
  Companies: Building2,
  Contacts: Users,
  Activities: CheckSquare,
  Financial: DollarSign,
  Invoices: FileText,
  Reports: BarChart3,
  Settings: Settings,
  Logout: LogOut,
} as const;

// Action icons
export const ActionIcons = {
  Create: Plus,
  Edit: Edit,
  Delete: Trash2,
  Search: Search,
  Filter: Filter,
  Export: Download,
  Refresh: RefreshCw,
  View: Eye,
  Hide: EyeOff,
  More: MoreHorizontal,
  MoreVertical: MoreVertical,
} as const;

// Activity type icons
export const ActivityTypeIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: ClipboardList,
  note: StickyNote,
} as const;

// Metric icons
export const MetricIcons = {
  TrendUp: TrendingUp,
  TrendDown: TrendingDown,
  Target: Target,
  Award: Award,
  Chart: BarChart3,
  Pie: PieChart,
  Activity: Activity,
  Percent: Percent,
} as const;

// Status icons
export const StatusIcons = {
  Success: Check,
  Warning: AlertTriangle,
  Error: AlertCircle,
  Info: Info,
  Pending: Clock,
  Notification: Bell,
} as const;

// Direction icons
export const DirectionIcons = {
  ChevronLeft: ChevronLeft,
  ChevronRight: ChevronRight,
  ChevronDown: ChevronDown,
  ChevronUp: ChevronUp,
  ArrowUp: ArrowUp,
  ArrowDown: ArrowDown,
  ArrowLeft: ArrowLeft,
  ArrowRight: ArrowRight,
} as const;

// User icons
export const UserIcons = {
  User: User,
  UserPlus: UserPlus,
  UserCheck: UserCheck,
  Users: Users,
} as const;

// UI icons
export const UIIcons = {
  Menu: Menu,
  Close: X,
  Briefcase: Briefcase,
  Receipt: Receipt,
} as const;

// Re-export individual icons for direct imports
export {
  LayoutDashboard,
  Kanban,
  Building2,
  Users,
  CheckSquare,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  Calendar,
  ClipboardList,
  StickyNote,
  Target,
  Award,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  MoreHorizontal,
  MoreVertical,
  Eye,
  EyeOff,
  Check,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  User,
  UserPlus,
  UserCheck,
  Briefcase,
  Percent,
  Receipt,
  BarChart3,
  PieChart,
  Activity,
  type LucideIcon,
};
