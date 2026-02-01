import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Award, FileText, Loader2, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LinkedStudent {
  user_id: string;
  full_name: string;
  email: string;
}

interface StudentGrade {
  id: string;
  subject: string;
  grade_letter: string;
  grade_points: number;
  credits: number;
  semester: string;
}

interface StudentSubmission {
  id: string;
  assignment_id: string;
  submitted_at: string;
  score: number | null;
  is_late: boolean;
  assignment_title?: string;
  assignment_subject?: string;
  max_score?: number;
}

const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<LinkedStudent | null>(null);
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch linked students
  useEffect(() => {
    const fetchLinkedStudents = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Get student IDs linked to this parent
        const { data: links, error: linksError } = await supabase
          .from('parent_student_links')
          .select('student_id')
          .eq('parent_id', user.id);

        if (linksError) throw linksError;

        if (links && links.length > 0) {
          const studentIds = links.map(l => l.student_id);
          
          // Get student profiles
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, full_name, email')
            .in('user_id', studentIds);

          if (profilesError) throw profilesError;
          
          setLinkedStudents(profiles || []);
          if (profiles && profiles.length > 0) {
            setSelectedStudent(profiles[0]);
          }
        } else {
          setLinkedStudents([]);
        }
      } catch (error) {
        console.error('Error fetching linked students:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLinkedStudents();
  }, [user]);

  // Fetch selected student's data
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!selectedStudent) return;

      try {
        // Fetch grades
        const { data: gradesData } = await supabase
          .from('grades')
          .select('*')
          .eq('student_id', selectedStudent.user_id)
          .order('semester', { ascending: false });

        setGrades(gradesData || []);

        // Fetch submissions with assignment details
        const { data: submissionsData } = await supabase
          .from('submissions')
          .select('*')
          .eq('student_id', selectedStudent.user_id)
          .order('submitted_at', { ascending: false });

        if (submissionsData && submissionsData.length > 0) {
          // Get assignment details
          const assignmentIds = [...new Set(submissionsData.map(s => s.assignment_id))];
          const { data: assignments } = await supabase
            .from('assignments')
            .select('id, title, subject, max_score')
            .in('id', assignmentIds);

          const assignmentMap = new Map(assignments?.map(a => [a.id, a]) || []);
          
          const enrichedSubmissions = submissionsData.map(sub => ({
            ...sub,
            assignment_title: assignmentMap.get(sub.assignment_id)?.title,
            assignment_subject: assignmentMap.get(sub.assignment_id)?.subject,
            max_score: assignmentMap.get(sub.assignment_id)?.max_score,
          }));
          
          setSubmissions(enrichedSubmissions);
        } else {
          setSubmissions([]);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };

    fetchStudentData();
  }, [selectedStudent]);

  // Calculate GPA
  const calculateGPA = () => {
    if (grades.length === 0) return 0;
    const totalPoints = grades.reduce((sum, g) => sum + (g.grade_points * g.credits), 0);
    const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
  };

  // Calculate submission stats
  const submissionStats = {
    total: submissions.length,
    graded: submissions.filter(s => s.score !== null).length,
    avgScore: submissions.filter(s => s.score !== null).length > 0
      ? (submissions.filter(s => s.score !== null).reduce((sum, s) => sum + (s.score || 0), 0) / 
         submissions.filter(s => s.score !== null).length).toFixed(1)
      : '0',
  };

  if (isLoading) {
    return (
      <DashboardLayout
        activeTab="dashboard"
        onTabChange={() => {}}
        title="Parent Dashboard"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (linkedStudents.length === 0) {
    return (
      <DashboardLayout
        activeTab="dashboard"
        onTabChange={() => {}}
        title="Parent Dashboard"
      >
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <UserX className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Students Linked</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your account is not linked to any student yet. Please contact the administrator to link your child's account.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeTab="dashboard"
      onTabChange={() => {}}
      title="Parent Dashboard"
      subtitle={`Monitoring ${selectedStudent?.full_name}'s academic progress`}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Student Selector (if multiple children) */}
        {linkedStudents.length > 1 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">Viewing:</span>
                <div className="flex gap-2">
                  {linkedStudents.map((student) => (
                    <button
                      key={student.user_id}
                      onClick={() => setSelectedStudent(student)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedStudent?.user_id === student.user_id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {student.full_name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Student Info Card */}
        <Card className="border-l-4 border-l-accent">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center text-2xl font-bold text-accent-foreground">
                {selectedStudent?.full_name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">{selectedStudent?.full_name}</h2>
                <p className="text-muted-foreground">{selectedStudent?.email}</p>
              </div>
              <div className="ml-auto text-right">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-accent" />
                  <p className="text-3xl font-display font-bold text-foreground">{calculateGPA()}</p>
                </div>
                <p className="text-sm text-muted-foreground">GPA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{submissionStats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{submissionStats.graded}</p>
                  <p className="text-sm text-muted-foreground">Graded</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{submissionStats.avgScore}%</p>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grades Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Subject Grades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grades.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No grades recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.subject}</TableCell>
                      <TableCell>{grade.semester}</TableCell>
                      <TableCell>
                        <Badge variant={grade.grade_letter.startsWith('A') ? 'default' : 'secondary'}>
                          {grade.grade_letter}
                        </Badge>
                      </TableCell>
                      <TableCell>{grade.grade_points}</TableCell>
                      <TableCell>{grade.credits}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Assignment Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No submissions yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.assignment_title || 'Unknown'}</TableCell>
                      <TableCell>{sub.assignment_subject || '-'}</TableCell>
                      <TableCell>{new Date(sub.submitted_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {sub.is_late ? (
                          <Badge variant="destructive">Late</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-success/10 text-success">On Time</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {sub.score !== null ? (
                          <span className="font-semibold">{sub.score}/{sub.max_score || 100}</span>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;