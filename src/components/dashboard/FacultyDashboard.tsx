import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/cards/StatCard';
import { assignments, subjects, resources } from '@/data/mockData';
import { FileText, Users, CheckCircle, Clock, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

const FacultyDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const mySubjects = subjects.filter(s => s.facultyId === 'faculty-1');
  const myAssignments = assignments.filter(a => a.facultyId === 'faculty-1');
  const pendingGrading = 12; // Mock data
  const totalStudents = 156;

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Faculty Dashboard';
      case 'assignments': return 'Assignment Management';
      case 'submissions': return 'Student Submissions';
      case 'resources': return 'Learning Resources';
      case 'students': return 'Student Overview';
      default: return 'Dashboard';
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={getTitle()}
      subtitle={activeTab === 'dashboard' ? 'Manage your courses and track student progress.' : undefined}
    >
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="My Subjects"
              value={mySubjects.length}
              subtitle="Active courses"
              icon={FileText}
              variant="primary"
            />
            <StatCard
              title="Total Students"
              value={totalStudents}
              subtitle="Enrolled students"
              icon={Users}
              variant="accent"
            />
            <StatCard
              title="Pending Grading"
              value={pendingGrading}
              subtitle="Submissions to review"
              icon={Clock}
              variant="warning"
            />
            <StatCard
              title="Graded This Week"
              value={28}
              subtitle="Assignments evaluated"
              icon={CheckCircle}
              variant="success"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Assignments</span>
                  <Button variant="hero" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Assignment
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {myAssignments.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-foreground">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        Due {format(new Date(assignment.dueDate), 'MMM dd')}
                      </p>
                      <p className="text-xs text-muted-foreground">45 submissions</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Submission Overview</span>
                  <Badge variant="secondary">This Week</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mySubjects.map((subject) => (
                  <div key={subject.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{subject.name}</span>
                      <span className="text-sm text-muted-foreground">78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* My Subjects */}
          <div>
            <h2 className="text-lg font-display font-bold text-foreground mb-4">My Subjects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mySubjects.map((subject) => (
                <Card key={subject.id} className="hover:shadow-lg transition-shadow cursor-pointer">
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
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>52 students</span>
                      <span>3 assignments</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Create and manage assignments for your courses</p>
            </div>
            <Button variant="hero">
              <Plus className="w-4 h-4 mr-2" />
              Create Assignment
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {myAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{assignment.title}</h3>
                      <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{assignment.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="secondary" size="sm">View Submissions</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Upload and manage learning materials</p>
            </div>
            <Button variant="hero">
              <Upload className="w-4 h-4 mr-2" />
              Upload Resource
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{resource.title}</p>
                      <p className="text-xs text-muted-foreground">{resource.fileType.toUpperCase()}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{resource.subjectName}</span>
                    <span>{format(new Date(resource.uploadedAt), 'MMM dd')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default FacultyDashboard;
