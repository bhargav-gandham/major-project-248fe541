import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateAssignmentForm from '@/components/faculty/CreateAssignmentForm';
import { useAssignments, useSubmissions } from '@/hooks/useAssignments';
import { FileText, ClipboardCheck, Loader2, Trash2, Calendar, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const FacultyDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { assignments, isLoading, deleteAssignment, fetchAssignments } = useAssignments();
  const { submissions, gradeSubmission } = useSubmissions();
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Faculty Dashboard';
      case 'assignments': return 'Manage Assignments';
      case 'submissions': return 'Student Submissions';
      default: return 'Dashboard';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await deleteAssignment(id);
      toast.success('Assignment deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleGrade = async () => {
    if (!gradingSubmission || !gradeScore) return;
    
    setIsGrading(true);
    try {
      await gradeSubmission(gradingSubmission.id, parseInt(gradeScore), gradeFeedback);
      toast.success('Submission graded successfully');
      setGradingSubmission(null);
      setGradeScore('');
      setGradeFeedback('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsGrading(false);
    }
  };

  const assignmentSubmissions = selectedAssignment 
    ? submissions.filter(s => s.assignment_id === selectedAssignment)
    : submissions;

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={getTitle()}
      subtitle={activeTab === 'dashboard' ? 'Manage your courses and assignments' : undefined}
    >
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <ClipboardCheck className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{submissions.length}</p>
                    <p className="text-sm text-muted-foreground">Total Submissions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{submissions.filter(s => s.score === null).length}</p>
                    <p className="text-sm text-muted-foreground">Pending Grading</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <CreateAssignmentForm onCreated={fetchAssignments} />

          <Card>
            <CardHeader>
              <CardTitle>Recent Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : assignments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No assignments yet. Create your first assignment above.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Max Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.slice(0, 5).map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.title}</TableCell>
                        <TableCell>{assignment.subject}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(assignment.due_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{assignment.max_score}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(assignment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {activeTab === 'assignments' && (
        <div className="space-y-6 animate-fade-in">
          <CreateAssignmentForm onCreated={fetchAssignments} />
          
          <Card>
            <CardHeader>
              <CardTitle>All Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : assignments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No assignments created yet.</p>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{assignment.title}</h3>
                            <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                            <p className="text-sm mt-2">{assignment.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
                              <span>Max Score: {assignment.max_score}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAssignment(assignment.id);
                                setActiveTab('submissions');
                              }}
                            >
                              View Submissions
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDelete(assignment.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <select
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedAssignment || ''}
              onChange={(e) => setSelectedAssignment(e.target.value || null)}
            >
              <option value="">All Assignments</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {assignmentSubmissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No submissions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignmentSubmissions.map((sub) => {
                      const assignment = assignments.find(a => a.id === sub.assignment_id);
                      return (
                        <TableRow key={sub.id}>
                          <TableCell>{assignment?.title || 'Unknown'}</TableCell>
                          <TableCell>{new Date(sub.submitted_at).toLocaleString()}</TableCell>
                          <TableCell>
                            {sub.is_late ? (
                              <Badge className="bg-destructive">Late</Badge>
                            ) : (
                              <Badge className="bg-success">On Time</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {sub.score !== null ? (
                              <span>{sub.score}/{assignment?.max_score || 100}</span>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setGradingSubmission(sub);
                                setGradeScore(sub.score?.toString() || '');
                                setGradeFeedback(sub.feedback || '');
                              }}
                            >
                              {sub.score !== null ? 'Edit Grade' : 'Grade'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grading Dialog */}
      <Dialog open={!!gradingSubmission} onOpenChange={() => setGradingSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {gradingSubmission?.typed_content && (
              <div>
                <Label>Student's Answer</Label>
                <div className="mt-2 p-3 bg-muted rounded-lg text-sm max-h-48 overflow-y-auto">
                  {gradingSubmission.typed_content}
                </div>
              </div>
            )}
            {gradingSubmission?.file_url && (
              <div>
                <Label>Attached File</Label>
                <a 
                  href={gradingSubmission.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline text-sm block mt-1"
                >
                  View Attachment
                </a>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="score">Score</Label>
              <Input
                id="score"
                type="number"
                min="0"
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                placeholder="Enter score"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Enter feedback for the student"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGrade} disabled={isGrading}>
                {isGrading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Grade
              </Button>
              <Button variant="outline" onClick={() => setGradingSubmission(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
