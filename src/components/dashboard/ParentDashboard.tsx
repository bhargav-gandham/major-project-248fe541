import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/cards/StatCard';
import AssignmentCard from '@/components/cards/AssignmentCard';
import EligibilityCard from '@/components/cards/EligibilityCard';
import ResourceCard from '@/components/cards/ResourceCard';
import { assignments, examEligibility, resources, studentProgress } from '@/data/mockData';
import { User, TrendingUp, AlertTriangle, CheckCircle, GraduationCap, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const ParentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const student = studentProgress[0];
  const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'overdue');
  const overdueCount = assignments.filter(a => a.status === 'overdue').length;
  const eligibleCount = examEligibility.filter(e => e.isEligible).length;

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Parent Dashboard';
      case 'progress': return 'Academic Progress';
      case 'assignments': return 'Assignment Tracking';
      case 'eligibility': return 'Exam Eligibility';
      case 'resources': return 'Study Resources';
      default: return 'Dashboard';
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={getTitle()}
      subtitle={activeTab === 'dashboard' ? `Monitoring ${student.studentName}'s academic progress` : undefined}
    >
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Student Info */}
          <Card className="border-l-4 border-l-accent">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center text-2xl font-bold text-accent-foreground">
                  {student.studentName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">{student.studentName}</h2>
                  <p className="text-muted-foreground">Student ID: {student.studentId}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-3xl font-display font-bold text-foreground">{student.overallGrade}%</p>
                  <p className="text-sm text-muted-foreground">Overall Grade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Overall Grade"
              value={`${student.overallGrade}%`}
              subtitle="Current semester"
              icon={TrendingUp}
              variant="success"
            />
            <StatCard
              title="Pending Tasks"
              value={student.assignmentsPending}
              subtitle="To be completed"
              icon={BookOpen}
              variant="warning"
            />
            <StatCard
              title="Overdue"
              value={overdueCount}
              subtitle="Need attention"
              icon={AlertTriangle}
              variant="danger"
            />
            <StatCard
              title="Exam Eligibility"
              value={`${eligibleCount}/${examEligibility.length}`}
              subtitle="Subjects eligible"
              icon={GraduationCap}
              variant="accent"
            />
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {examEligibility.map((elig) => (
                  <div key={elig.subjectId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{elig.subjectName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{elig.percentage}%</span>
                        {elig.isEligible ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </div>
                    <Progress 
                      value={elig.percentage} 
                      className={`h-2 ${elig.isEligible ? '[&>div]:bg-success' : '[&>div]:bg-destructive'}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Attention Required</span>
                  <Badge className="bg-destructive">{overdueCount} Overdue</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingAssignments.filter(a => a.status === 'overdue').map((assignment) => (
                  <div key={assignment.id} className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                      </div>
                      <Badge className="bg-destructive">Overdue</Badge>
                    </div>
                  </div>
                ))}
                {overdueCount === 0 && (
                  <div className="p-4 rounded-lg bg-success/10 text-center">
                    <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No overdue assignments!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Eligibility Summary */}
          <div>
            <h2 className="text-lg font-display font-bold text-foreground mb-4">Exam Eligibility Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {examEligibility.map((elig) => (
                <EligibilityCard key={elig.subjectId} eligibility={elig} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Academic Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 rounded-xl bg-muted/50">
                  <p className="text-4xl font-display font-bold text-foreground">{student.overallGrade}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Overall Grade</p>
                </div>
                <div className="text-center p-6 rounded-xl bg-muted/50">
                  <p className="text-4xl font-display font-bold text-foreground">{student.assignmentsCompleted}</p>
                  <p className="text-sm text-muted-foreground mt-1">Completed</p>
                </div>
                <div className="text-center p-6 rounded-xl bg-muted/50">
                  <p className="text-4xl font-display font-bold text-foreground">{student.assignmentsPending}</p>
                  <p className="text-sm text-muted-foreground mt-1">Pending</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {examEligibility.map((elig) => (
                  <div key={elig.subjectId} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{elig.subjectName}</span>
                      <Badge className={elig.isEligible ? 'bg-success' : 'bg-destructive'}>
                        {elig.isEligible ? 'Eligible' : 'At Risk'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{elig.completedAssignments}/{elig.totalAssignments} assignments</span>
                      <span>•</span>
                      <span>{elig.percentage}% completion</span>
                    </div>
                    <Progress value={elig.percentage} className="h-2 mt-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {assignments.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} showAIPriority={false} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'eligibility' && (
        <div className="space-y-6 animate-fade-in">
          <Card className="border-l-4 border-l-warning">
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-foreground mb-2">Understanding Exam Eligibility</h3>
              <p className="text-muted-foreground">
                Students must complete at least <span className="font-semibold text-foreground">75%</span> of 
                assignments in each subject to be eligible for final exams. Late submissions may result in 
                credit reductions that affect eligibility status.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examEligibility.map((elig) => (
              <EligibilityCard key={elig.subjectId} eligibility={elig} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="space-y-4 animate-fade-in">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ParentDashboard;
