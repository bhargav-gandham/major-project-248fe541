import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateAssignmentForm from '@/components/faculty/CreateAssignmentForm';
import { CreateNoteForm } from '@/components/faculty/CreateNoteForm';
import { NoteCard } from '@/components/notes/NoteCard';
import { PlagiarismReportCard } from '@/components/faculty/PlagiarismReportCard';
import SubmissionEvaluationCard from '@/components/faculty/SubmissionEvaluationCard';
import { GradeBook } from '@/components/grades/GradeBook';
import { useAssignments, useSubmissions } from '@/hooks/useAssignments';
import { useNotes } from '@/hooks/useNotes';
import { usePlagiarismCheck, PlagiarismReport } from '@/hooks/usePlagiarismCheck';
import { supabase } from '@/integrations/supabase/client';
import { FileText, ClipboardCheck, Loader2, Trash2, Calendar, Award, BookOpen, Shield, Search, Brain, Users, Mail } from 'lucide-react';
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

interface StudentProfile {
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
}

const FacultyDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { assignments, isLoading, deleteAssignment, fetchAssignments } = useAssignments();
  const {
    submissions,
    gradeSubmission,
    isLoading: submissionsLoading,
    error: submissionsError,
    fetchSubmissions,
  } = useSubmissions();
  const { notes, loading: notesLoading, deleteNote, refetch: refetchNotes } = useNotes();
  const { checkPlagiarism, getAllReports, isAnalyzing } = usePlagiarismCheck();
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<any>(null);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [plagiarismReports, setPlagiarismReports] = useState<Record<string, PlagiarismReport>>({});
  const [allReports, setAllReports] = useState<PlagiarismReport[]>([]);
  
  // Students state
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      const reports = await getAllReports();
      setAllReports(reports);
      const reportMap: Record<string, PlagiarismReport> = {};
      reports.forEach(r => {
        reportMap[r.submission_id] = r;
      });
      setPlagiarismReports(reportMap);
    };
    loadReports();
  }, [submissions]);

  // Fetch students when tab is active
  useEffect(() => {
    if (activeTab === 'students') {
      const fetchStudents = async () => {
        setStudentsLoading(true);
        try {
          // Get all student user_ids from user_roles
          const { data: studentRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'student');
          
          if (rolesError) throw rolesError;
          
          if (studentRoles && studentRoles.length > 0) {
            const studentIds = studentRoles.map(r => r.user_id);
            
            // Get profiles for these students
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('user_id, full_name, email, created_at')
              .in('user_id', studentIds);
            
            if (profilesError) throw profilesError;
            setStudents(profiles || []);
          } else {
            setStudents([]);
          }
        } catch (error) {
          console.error('Error fetching students:', error);
          setStudents([]);
        } finally {
          setStudentsLoading(false);
        }
      };
      fetchStudents();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'submissions') {
      fetchSubmissions();
    }
  }, [activeTab, fetchSubmissions]);

  const handleCheckPlagiarism = async (submissionId: string) => {
    const report = await checkPlagiarism(submissionId);
    if (report) {
      setPlagiarismReports(prev => ({ ...prev, [submissionId]: report }));
      setAllReports(prev => {
        const filtered = prev.filter(r => r.submission_id !== submissionId);
        return [report, ...filtered];
      });
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Faculty Dashboard';
      case 'assignments': return 'Manage Assignments';
      case 'submissions': return 'Student Submissions';
      case 'grades': return 'Grade Book';
      case 'notes': return 'Study Notes';
      case 'integrity': return 'Academic Integrity';
      case 'students': return 'Students';
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
              {submissionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : submissionsError ? (
                <div className="space-y-3 py-6">
                  <p className="text-center text-sm text-muted-foreground">
                    Couldn't load submissions: {submissionsError}
                  </p>
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={fetchSubmissions}>
                      Retry
                    </Button>
                  </div>
                </div>
              ) : assignmentSubmissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No submissions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Integrity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignmentSubmissions.map((sub) => {
                      const assignment = assignments.find(a => a.id === sub.assignment_id);
                      return (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.student_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{sub.student_email}</p>
                            </div>
                          </TableCell>
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
                            {plagiarismReports[sub.id] ? (
                              <PlagiarismReportCard report={plagiarismReports[sub.id]} compact />
                            ) : (
                              <span className="text-xs text-muted-foreground">Not checked</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {sub.typed_content && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCheckPlagiarism(sub.id)}
                                  disabled={isAnalyzing}
                                  title="Check for plagiarism"
                                >
                                  {isAnalyzing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Shield className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setGradingSubmission(sub);
                                  setGradeScore(sub.score?.toString() || '');
                                  setGradeFeedback(sub.feedback || '');
                                }}
                              >
                                {sub.score !== null ? 'Edit' : 'Grade'}
                              </Button>
                            </div>
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

      {activeTab === 'grades' && (
        <div className="animate-fade-in">
          <GradeBook />
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-6 animate-fade-in">
          <CreateNoteForm onSuccess={refetchNotes} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                All Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : notes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No notes created yet. Share your first note above.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      showDelete
                      onDelete={deleteNote}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'integrity' && (
        <div className="space-y-6 animate-fade-in">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Academic Integrity Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Review plagiarism reports and manage academic integrity across all submissions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{allReports.length}</p>
                    <p className="text-sm text-muted-foreground">Total Checks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{allReports.filter(r => r.is_flagged).length}</p>
                    <p className="text-sm text-muted-foreground">Flagged</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{allReports.filter(r => !r.is_flagged).length}</p>
                    <p className="text-sm text-muted-foreground">Clear</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {allReports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No plagiarism checks performed yet.</p>
                <p className="text-sm mt-1">
                  Go to Submissions and click the shield icon to check a submission.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allReports.map((report) => (
                <PlagiarismReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'students' && (
        <div className="space-y-6 animate-fade-in">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Student Directory</h3>
                  <p className="text-sm text-muted-foreground">
                    View all enrolled students and their information
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Students ({students.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : students.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No students enrolled yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const studentSubmissions = submissions.filter(s => s.student_id === student.user_id);
                      return (
                        <TableRow key={student.user_id}>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              {student.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {studentSubmissions.length} submitted
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(student.created_at).toLocaleDateString()}
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

      <Dialog open={!!gradingSubmission} onOpenChange={() => setGradingSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

            {/* AI Evaluation Section - works with typed content or file uploads */}
            {(gradingSubmission?.typed_content || gradingSubmission?.file_url) && (
              <SubmissionEvaluationCard
                submissionId={gradingSubmission.id}
                maxScore={assignments.find(a => a.id === gradingSubmission.assignment_id)?.max_score || 100}
                onScoreSuggested={(score) => setGradeScore(score.toString())}
              />
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
