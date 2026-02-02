import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  GraduationCap, 
  Award, 
  FileText, 
  Loader2, 
  UserX, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Star,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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

// Simple grade to performance mapping
const getGradeStatus = (grade: string) => {
  if (grade.startsWith('A')) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100', icon: Star, points: 4 };
  if (grade.startsWith('B')) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100', icon: TrendingUp, points: 3 };
  if (grade.startsWith('C')) return { label: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: CheckCircle2, points: 2 };
  if (grade.startsWith('D')) return { label: 'Needs Work', color: 'text-orange-600', bg: 'bg-orange-100', icon: TrendingDown, points: 1 };
  return { label: 'Failing', color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle, points: 0 };
};

const getGPAMessage = (gpa: number) => {
  if (gpa >= 3.5) return { message: "🌟 Excellent! Your child is doing great!", color: 'text-green-600' };
  if (gpa >= 3.0) return { message: "👍 Good job! Keep it up!", color: 'text-blue-600' };
  if (gpa >= 2.0) return { message: "📚 Satisfactory. Some improvement needed.", color: 'text-yellow-600' };
  return { message: "⚠️ Needs attention. Please meet with teachers.", color: 'text-red-600' };
};

// Simple circular progress component
const CircularProgress: React.FC<{ value: number; label: string; color: string; icon: React.ReactNode }> = ({ 
  value, label, color, icon 
}) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted/30"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={color}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon}
          <span className="text-2xl font-bold mt-1">{Math.round(value)}%</span>
        </div>
      </div>
      <p className="text-lg font-medium text-muted-foreground mt-2 text-center">{label}</p>
    </div>
  );
};

// Simple bar for subject performance
const SubjectBar: React.FC<{ subject: string; grade: string; points: number }> = ({ subject, grade, points }) => {
  const percentage = (points / 4) * 100;
  const getBarColor = () => {
    if (points >= 3.5) return 'bg-green-500';
    if (points >= 2.5) return 'bg-blue-500';
    if (points >= 1.5) return 'bg-yellow-500';
    if (points >= 0.5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium text-foreground truncate flex-1">{subject}</span>
        <span className="font-bold text-lg ml-2">{grade}</span>
      </div>
      <div className="h-4 bg-muted/50 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getBarColor()} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

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
        const { data: links, error: linksError } = await supabase
          .from('parent_student_links')
          .select('student_id')
          .eq('parent_id', user.id);

        if (linksError) throw linksError;

        if (links && links.length > 0) {
          const studentIds = links.map(l => l.student_id);
          
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
        const { data: gradesData } = await supabase
          .from('grades')
          .select('*')
          .eq('student_id', selectedStudent.user_id)
          .order('semester', { ascending: false });

        setGrades(gradesData || []);

        const { data: submissionsData } = await supabase
          .from('submissions')
          .select('*')
          .eq('student_id', selectedStudent.user_id)
          .order('submitted_at', { ascending: false });

        if (submissionsData && submissionsData.length > 0) {
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
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  };

  const gpa = calculateGPA();
  const gpaMessage = getGPAMessage(gpa);
  const gpaPercentage = (gpa / 4) * 100;

  // Simple stats
  const totalAssignments = submissions.length;
  const completedOnTime = submissions.filter(s => !s.is_late).length;
  const lateSubmissions = submissions.filter(s => s.is_late).length;

  if (isLoading) {
    return (
      <DashboardLayout activeTab="dashboard" onTabChange={() => {}} title="My Child's Progress">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <span className="ml-4 text-xl text-muted-foreground">Loading...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (linkedStudents.length === 0) {
    return (
      <DashboardLayout activeTab="dashboard" onTabChange={() => {}} title="My Child's Progress">
        <Card className="border-2 border-dashed border-muted">
          <CardContent className="py-16 text-center">
            <UserX className="w-20 h-20 mx-auto mb-6 text-muted-foreground" />
            <h3 className="text-2xl font-bold mb-4">No Child Connected</h3>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Your account is not connected to any student yet. 
              Please contact the school administrator to link your child's account.
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
      title="My Child's Progress"
      subtitle={`Viewing ${selectedStudent?.full_name}'s school performance`}
    >
      <div className="space-y-8 animate-fade-in">
        {/* Child Selector - Only show if multiple children */}
        {linkedStudents.length > 1 && (
          <Card className="border-2 border-primary/20">
            <CardContent className="p-6">
              <p className="text-lg font-semibold mb-4">Select Child:</p>
              <div className="flex flex-wrap gap-3">
                {linkedStudents.map((student) => (
                  <button
                    key={student.user_id}
                    onClick={() => setSelectedStudent(student)}
                    className={`px-6 py-3 rounded-xl text-lg font-semibold transition-all ${
                      selectedStudent?.user_id === student.user_id
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {student.full_name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Performance Card - Simple and Clear */}
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Student Avatar */}
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-4xl font-bold text-primary-foreground shadow-lg">
                {selectedStudent?.full_name.charAt(0)}
              </div>
              
              {/* Student Name */}
              <div className="text-center md:text-left flex-1">
                <h2 className="text-3xl font-bold text-foreground">{selectedStudent?.full_name}</h2>
                <p className="text-lg text-muted-foreground mt-1">Student</p>
              </div>

              {/* Overall Score - Big and Clear */}
              <div className="text-center p-6 rounded-2xl bg-card shadow-lg border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="w-8 h-8 text-primary" />
                  <span className="text-5xl font-bold text-foreground">{gpa.toFixed(1)}</span>
                  <span className="text-2xl text-muted-foreground">/4.0</span>
                </div>
                <p className="text-lg font-medium text-muted-foreground">Overall Score</p>
                <Progress value={gpaPercentage} className="mt-3 h-3" />
              </div>
            </div>

            {/* Simple Message */}
            <div className={`mt-6 p-4 rounded-xl bg-card border-2 text-center ${gpaMessage.color}`}>
              <p className="text-xl font-semibold">{gpaMessage.message}</p>
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview - Visual Charts */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Target className="w-8 h-8 text-primary" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* On-Time Rate */}
              <CircularProgress 
                value={totalAssignments > 0 ? (completedOnTime / totalAssignments) * 100 : 0}
                label="On-Time Rate"
                color="text-success"
                icon={<CheckCircle2 className="w-6 h-6 text-success" />}
              />
              
              {/* Overall Score */}
              <CircularProgress 
                value={gpaPercentage}
                label="Overall Score"
                color="text-primary"
                icon={<Award className="w-6 h-6 text-primary" />}
              />
              
              {/* Homework Done */}
              <CircularProgress 
                value={totalAssignments > 0 ? 100 : 0}
                label={`${totalAssignments} Homework Done`}
                color="text-info"
                icon={<FileText className="w-6 h-6 text-info" />}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats - Very Simple */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-info/20 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-info" />
              </div>
              <p className="text-4xl font-bold text-foreground">{totalAssignments}</p>
              <p className="text-lg text-muted-foreground mt-2">Total Homework</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <p className="text-4xl font-bold text-success">{completedOnTime}</p>
              <p className="text-lg text-muted-foreground mt-2">On Time ✓</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-warning/20 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-warning" />
              </div>
              <p className="text-4xl font-bold text-warning">{lateSubmissions}</p>
              <p className="text-lg text-muted-foreground mt-2">Late ⚠️</p>
            </CardContent>
          </Card>
        </div>

        {/* Subject Performance Bars */}
        {grades.length > 0 && (
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <TrendingUp className="w-8 h-8 text-primary" />
                Subject Performance
              </CardTitle>
              <p className="text-muted-foreground">How your child is doing in each subject</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {grades.map((grade) => (
                  <SubjectBar 
                    key={grade.id}
                    subject={grade.subject}
                    grade={grade.grade_letter}
                    points={grade.grade_points}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subject Grades - Simple Cards */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <GraduationCap className="w-8 h-8 text-primary" />
              Subject Grades
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grades.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No grades yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grades.map((grade) => {
                  const status = getGradeStatus(grade.grade_letter);
                  const IconComponent = status.icon;
                  return (
                    <div 
                      key={grade.id} 
                      className={`p-5 rounded-xl border-2 ${status.bg} transition-all hover:scale-102 hover:shadow-md`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-foreground">{grade.subject}</span>
                        <IconComponent className={`w-6 h-6 ${status.color}`} />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-4xl font-bold ${status.color}`}>{grade.grade_letter}</span>
                        <span className={`text-lg font-medium ${status.color}`}>{status.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{grade.semester}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Homework - Simple List */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <FileText className="w-8 h-8 text-primary" />
              Recent Homework
            </CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-xl text-muted-foreground">No homework submitted yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.slice(0, 5).map((sub) => (
                  <div 
                    key={sub.id} 
                    className="p-5 rounded-xl border-2 bg-card hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-foreground">
                          {sub.assignment_title || 'Homework'}
                        </h4>
                        <p className="text-muted-foreground">{sub.assignment_subject || 'Subject'}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(sub.submitted_at).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Status */}
                        {sub.is_late ? (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-warning/20 text-warning">
                            <Clock className="w-5 h-5" />
                            <span className="font-semibold">Late</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 text-success">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-semibold">On Time</span>
                          </div>
                        )}
                        
                        {/* Score */}
                        {sub.score !== null ? (
                          <div className="text-center px-4 py-2 rounded-xl bg-primary/10 min-w-[80px]">
                            <p className="text-2xl font-bold text-primary">{sub.score}</p>
                            <p className="text-xs text-muted-foreground">out of {sub.max_score || 100}</p>
                          </div>
                        ) : (
                          <div className="px-4 py-2 rounded-xl bg-muted text-center">
                            <p className="text-sm font-medium text-muted-foreground">Waiting</p>
                            <p className="text-xs text-muted-foreground">for grade</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
