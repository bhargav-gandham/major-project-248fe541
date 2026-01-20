import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/cards/StatCard';
import CreateUserForm from '@/components/admin/CreateUserForm';
import { useUsers } from '@/hooks/useUsers';
import { subjects } from '@/data/mockData';
import { Users, BookOpen, FileText, Settings, Shield, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { users, isLoading: usersLoading, refetch } = useUsers();

  const userCounts = {
    admin: users.filter(u => u.role === 'admin').length,
    faculty: users.filter(u => u.role === 'faculty').length,
    student: users.filter(u => u.role === 'student').length,
    parent: users.filter(u => u.role === 'parent').length,
  };

  const totalUsers = users.length;

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Admin Dashboard';
      case 'users': return 'User Management';
      case 'subjects': return 'Subject Management';
      case 'reports': return 'Reports & Analytics';
      case 'settings': return 'System Settings';
      default: return 'Dashboard';
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary';
      case 'faculty': return 'bg-accent';
      case 'student': return 'bg-success';
      case 'parent': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={getTitle()}
      subtitle={activeTab === 'dashboard' ? 'System overview and management' : undefined}
    >
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Users"
              value={totalUsers}
              subtitle="Active accounts"
              icon={Users}
              variant="primary"
            />
            <StatCard
              title="Active Subjects"
              value={subjects.length}
              subtitle="This semester"
              icon={BookOpen}
              variant="accent"
            />
            <StatCard
              title="Assignments"
              value={342}
              subtitle="Created this month"
              icon={FileText}
              variant="success"
              trend={{ value: 8, isPositive: true }}
            />
            <StatCard
              title="System Health"
              value="99.9%"
              subtitle="Uptime"
              icon={Shield}
              variant="primary"
            />
          </div>

          {/* Create User Form */}
          <CreateUserForm onUserCreated={refetch} />

          {/* Overview Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>User Distribution</span>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('users')}>View All</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Students</span>
                    <span className="font-medium">{userCounts.student}</span>
                  </div>
                  <Progress value={totalUsers > 0 ? (userCounts.student / totalUsers) * 100 : 0} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Faculty</span>
                    <span className="font-medium">{userCounts.faculty}</span>
                  </div>
                  <Progress value={totalUsers > 0 ? (userCounts.faculty / totalUsers) * 100 : 0} className="h-2 [&>div]:bg-accent" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Parents</span>
                    <span className="font-medium">{userCounts.parent}</span>
                  </div>
                  <Progress value={totalUsers > 0 ? (userCounts.parent / totalUsers) * 100 : 0} className="h-2 [&>div]:bg-success" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Admins</span>
                    <span className="font-medium">{userCounts.admin}</span>
                  </div>
                  <Progress value={totalUsers > 0 ? (userCounts.admin / totalUsers) * 100 : 0} className="h-2 [&>div]:bg-warning" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>System Alerts</span>
                  <Badge variant="secondary">3 New</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Storage Usage High</p>
                    <p className="text-xs text-muted-foreground">85% of allocated storage used</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Peak Usage Detected</p>
                    <p className="text-xs text-muted-foreground">1,200 concurrent users at 2:30 PM</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-success/10 border border-success/20 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Security Scan Complete</p>
                    <p className="text-xs text-muted-foreground">No vulnerabilities found</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Users */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.slice(0, 5).map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white capitalize ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6 animate-fade-in">
          <CreateUserForm onUserCreated={refetch} />
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users found. Create your first user above.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white capitalize ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Manage academic subjects and courses</p>
            <Button variant="hero">
              <BookOpen className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <Card key={subject.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-display font-semibold text-foreground">{subject.name}</p>
                      <p className="text-sm text-muted-foreground">{subject.code}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${
                      subject.difficulty === 'hard' ? 'bg-destructive' :
                      subject.difficulty === 'medium' ? 'bg-warning' : 'bg-success'
                    }`}>
                      {subject.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Instructor: {subject.facultyName}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground">Late Submission Policy</p>
                  <p className="text-sm text-muted-foreground">Configure credit reduction for late submissions</p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground">Exam Eligibility Threshold</p>
                  <p className="text-sm text-muted-foreground">Current: 75% assignment completion required</p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground">Notification Settings</p>
                  <p className="text-sm text-muted-foreground">Manage email and push notifications</p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div>
                  <p className="font-medium text-foreground">Backup & Recovery</p>
                  <p className="text-sm text-muted-foreground">Last backup: 2 hours ago</p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
