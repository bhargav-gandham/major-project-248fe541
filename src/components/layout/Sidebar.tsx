import React from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  GraduationCap, 
  Users, 
  Bell, 
  Settings, 
  LogOut,
  ClipboardCheck,
  FolderOpen,
  BarChart3,
  Shield
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'subjects', label: 'Subjects', icon: BookOpen },
          { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
          { id: 'settings', label: 'System Settings', icon: Settings },
        ];
      case 'faculty':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'submissions', label: 'Submissions', icon: ClipboardCheck },
          { id: 'resources', label: 'Resources', icon: FolderOpen },
          { id: 'students', label: 'Students', icon: Users },
        ];
      case 'student':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'assignments', label: 'My Assignments', icon: FileText },
          { id: 'eligibility', label: 'Exam Eligibility', icon: GraduationCap },
          { id: 'resources', label: 'Study Materials', icon: FolderOpen },
          { id: 'grades', label: 'My Grades', icon: BarChart3 },
        ];
      case 'parent':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'progress', label: 'Academic Progress', icon: BarChart3 },
          { id: 'assignments', label: 'Assignments', icon: FileText },
          { id: 'eligibility', label: 'Exam Eligibility', icon: GraduationCap },
          { id: 'resources', label: 'Resources', icon: FolderOpen },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin': return 'bg-primary';
      case 'faculty': return 'bg-accent';
      case 'student': return 'bg-success';
      case 'parent': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground">EduManage</h1>
            <p className="text-xs text-muted-foreground">Smart Curriculum</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold", getRoleColor())}>
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === item.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={() => onTabChange('notifications')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === 'notifications'
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Bell className="w-5 h-5" />
          Notifications
          <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">3</span>
        </button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
