import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SubmitAssignmentForm from '@/components/student/SubmitAssignmentForm';
import { useAssignments, useSubmissions, Assignment } from '@/hooks/useAssignments';
import { FileText, GraduationCap, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { assignments, isLoading: assignmentsLoading } = useAssignments();
  const { fetchMySubmission } = useSubmissions();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [mySubmissions, setMySubmissions] = useState<Record<string, any>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  useEffect(() => {
    const fetchAllSubmissions = async () => {
      if (assignments.length === 0) {
        setLoadingSubmissions(false);
        return;
      }
      
      setLoadingSubmissions(true);
      const submissionMap: Record<string, any> = {};
      for (const assignment of assignments) {
        const sub = await fetchMySubmission(assignment.id);
        if (sub) {
          submissionMap[assignment.id] = sub;
        }
      }
      setMySubmissions(submissionMap);
      setLoadingSubmissions(false);
    };
    
    fetchAllSubmissions();
  }, [assignments]);

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Student Dashboard';
      case 'assignments': return 'My Assignments';
      case 'eligibility': return 'Exam Eligibility';
      case 'grades': return 'My Grades';
      default: return 'Dashboard';
    }
  };

  const pendingAssignments = assignments.filter(a => !mySubmissions[a.id]);
  const submittedAssignments = assignments.filter(a => mySubmissions[a.id]);
  const gradedSubmissions = Object.values(mySubmissions).filter((s: any) => s.score !== null);
  
  const submissionRate = assignments.length > 0 
    ? (submittedAssignments.length / assignments.length) * 100 
    : 0;
  const isEligible = submissionRate >= 75;

  const getAssignmentStatus = (assignment: Assignment) => {
    const submission = mySubmissions[assignment.id];
    const isPastDue = new Date() > new Date(assignment.due_date);
    
    if (submission) {
      if (submission.score !== null) return 'graded';
      return 'submitted';
    }
    if (isPastDue) return 'overdue';
    return 'pending';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <Badge className="bg-success">Graded</Badge>;
      case 'submitted':
        return <Badge className="bg-primary">Submitted</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive">Overdue</Badge>;
      default:
        return <Badge className="bg-warning">Pending</Badge>;
    }
  };

  if (selectedAssignment) {
    return (
      <DashboardLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title="Submit Assignment"
        subtitle={selectedAssignment.title}
      >
        <SubmitAssignmentForm
          assignment={selectedAssignment}
          onSubmitted={() => {
            setSelectedAssignment(null);
            window.location.reload();
          }}
          onCancel={() => setSelectedAssignment(null)}
        />
      </DashboardLayout>
    );
  }

  const isLoading = assignmentsLoading || loadingSubmissions;

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={getTitle()}
      subtitle={activeTab === 'dashboard' ? 'Track your assignments and academic progress' : undefined}
    >
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{assignments.length}</p>
                    <p className="text-sm text-muted-foreground">Total Assignments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingAssignments.length}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{submittedAssignments.length}</p>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isEligible ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    <GraduationCap className={`w-6 h-6 ${isEligible ? 'text-success' : 'text-destructive'}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{submissionRate.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">Completion</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className={`border-l-4 ${isEligible ? 'border-l-success' : 'border-l-destructive'}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {isEligible ? (
                  <CheckCircle className="w-8 h-8 text-success" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-destructive" />
                )}
                <div>
                  <h3 className="font-semibold text-lg">
                    {isEligible ? 'You are eligible for exams!' : 'Complete more assignments to be eligible'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You need to complete at least 75% of assignments. Current: {submissionRate.toFixed(0)}%
                  </p>
                </div>
              </div>
              <Progress value={submissionRate} className="mt-4 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : pendingAssignments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {assignments.length === 0 ? 'No assignments available yet.' : 'No pending assignments. Great job!'}
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingAssignments.map((assignment) => {
                    const isPastDue = new Date() > new Date(assignment.due_date);
                    return (
                      <div
                        key={assignment.id}
                        className={`p-4 rounded-lg border ${isPastDue ? 'border-destructive/50 bg-destructive/5' : 'border-border'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{assignment.title}</h4>
                            <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                            <p className="text-sm mt-1">
                              Due: {new Date(assignment.due_date).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPastDue && <Badge className="bg-destructive">Overdue</Badge>}
                            <Button size="sm" onClick={() => setSelectedAssignment(assignment)}>
                              Submit
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6 animate-fade-in">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : assignments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No assignments available yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const status = getAssignmentStatus(assignment);
                const submission = mySubmissions[assignment.id];
                
                return (
                  <Card key={assignment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{assignment.title}</h3>
                            {getStatusBadge(status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{assignment.subject}</p>
                          <p className="text-sm mt-2">{assignment.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
                            <span>Max Score: {assignment.max_score}</span>
                            {submission?.score !== null && submission?.score !== undefined && (
                              <span className="font-medium text-foreground">
                                Your Score: {submission.score}/{assignment.max_score}
                              </span>
                            )}
                          </div>
                          {submission?.feedback && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <strong>Feedback:</strong> {submission.feedback}
                            </div>
                          )}
                        </div>
                        {status === 'pending' && (
                          <Button onClick={() => setSelectedAssignment(assignment)}>
                            Submit
                          </Button>
                        )}
                        {status === 'overdue' && (
                          <Button variant="destructive" onClick={() => setSelectedAssignment(assignment)}>
                            Submit Late
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'eligibility' && (
        <div className="space-y-6 animate-fade-in">
          <Card className={`border-l-4 ${isEligible ? 'border-l-success' : 'border-l-warning'}`}>
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-foreground mb-2">Understanding Exam Eligibility</h3>
              <p className="text-muted-foreground">
                Students must complete at least <span className="font-semibold text-foreground">75%</span> of 
                assignments to be eligible for final exams.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Assignments Completed</span>
                  <span className="font-semibold">{submittedAssignments.length} / {assignments.length}</span>
                </div>
                <Progress value={submissionRate} className="h-3" />
                <div className="flex items-center gap-2">
                  {isEligible ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="text-success font-medium">You are eligible for exams</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-warning" />
                      <span className="text-warning font-medium">
                        {assignments.length === 0 
                          ? 'No assignments available yet'
                          : `Complete ${Math.ceil(assignments.length * 0.75) - submittedAssignments.length} more assignment(s) to be eligible`
                        }
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="space-y-6 animate-fade-in">
          {gradedSubmissions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No grades available yet. Submit your assignments to receive grades.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const submission = mySubmissions[assignment.id];
                if (!submission || submission.score === null) return null;

                const percentage = (submission.score / assignment.max_score) * 100;
                
                return (
                  <Card key={assignment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{assignment.title}</h3>
                          <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{submission.score}/{assignment.max_score}</p>
                          <p className={`text-sm ${percentage >= 50 ? 'text-success' : 'text-destructive'}`}>
                            {percentage.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      {submission.feedback && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium">Teacher's Feedback:</p>
                          <p className="text-sm text-muted-foreground">{submission.feedback}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
