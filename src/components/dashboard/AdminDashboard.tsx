import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/cards/StatCard';
import { subjects } from '@/data/mockData';
import { Users, BookOpen, FileText, Settings, Shield, TrendingUp, UserPlus, AlertCircle } from 'lucide-react';
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

  const mockUsers = [
    { id: '1', name: 'Prof. James Anderson', email: 'james@edu.com', role: 'faculty', status: 'active' },
    { id: '2', name: 'Dr. Emily Chen', email: 'emily@edu.com', role: 'faculty', status: 'active' },
    { id: '3', name: 'Alex Thompson', email: 'alex@edu.com', role: 'student', status: 'active' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@edu.com', role: 'student', status: 'inactive' },
    { id: '5', name: 'Michael Brown', email: 'michael@edu.com', role: 'parent', status: 'active' },
  ];

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
              value={1284}
              subtitle="Active accounts"
              icon={Users}
              variant="primary"
              trend={{ value: 12, isPositive: true }}
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

          {/* Overview Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>User Distribution</span>
                  <Button variant="ghost" size="sm">View All</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Students</span>
                    <span className="font-medium">1,024</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Faculty</span>
                    <span className="font-medium">86</span>
                  </div>
                  <Progress value={7} className="h-2 [&>div]:bg-accent" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Parents</span>
                    <span className="font-medium">168</span>
                  </div>
                  <Progress value={13} className="h-2 [&>div]:bg-success" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Admins</span>
                    <span className="font-medium">6</span>
                  </div>
                  <Progress value={0.5} className="h-2 [&>div]:bg-warning" />
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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.slice(0, 5).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={user.status === 'active' ? 'bg-success' : 'bg-muted'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Manage all system users</p>
            <Button variant="hero">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={user.status === 'active' ? 'bg-success' : 'bg-muted'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">Edit</Button>
                          <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                    <Badge className={
                      subject.difficulty === 'hard' ? 'bg-destructive' :
                      subject.difficulty === 'medium' ? 'bg-warning' : 'bg-success'
                    }>
                      {subject.difficulty}
                    </Badge>
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
