import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGrades } from '@/hooks/useGrades';
import { useAuth } from '@/contexts/AuthContext';
import { ReportCard } from './ReportCard';
import { GraduationCap, TrendingUp, Download, Award } from 'lucide-react';
import { useState } from 'react';

export const StudentGrades = () => {
  const { user } = useAuth();
  const { grades, isLoading, gpa, gpaStatus } = useGrades(user?.id);
  const [showReportCard, setShowReportCard] = useState(false);

  const getGradeColor = (letter: string) => {
    if (letter.startsWith('A')) return 'bg-success text-success-foreground';
    if (letter.startsWith('B')) return 'bg-primary text-primary-foreground';
    if (letter.startsWith('C')) return 'bg-warning text-warning-foreground';
    if (letter.startsWith('D')) return 'bg-orange-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  // Group grades by semester
  const groupedBySemester = grades.reduce((acc, grade) => {
    if (!acc[grade.semester]) {
      acc[grade.semester] = [];
    }
    acc[grade.semester].push(grade);
    return acc;
  }, {} as Record<string, typeof grades>);

  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading grades...</p>
        </CardContent>
      </Card>
    );
  }

  if (showReportCard) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowReportCard(false)}>
          ← Back to Grades
        </Button>
        <ReportCard grades={grades} gpa={gpa} gpaStatus={gpaStatus} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            My Grades
          </h2>
          <p className="text-muted-foreground">View your academic performance</p>
        </div>
        <Button onClick={() => setShowReportCard(true)} disabled={grades.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          View Report Card
        </Button>
      </div>

      {/* GPA Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              GPA Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-5xl font-bold">{gpa.toFixed(2)}</p>
                <p className={`text-sm font-medium ${gpaStatus.color}`}>{gpaStatus.label}</p>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to 4.0</span>
                  <span>{((gpa / 4) * 100).toFixed(0)}%</span>
                </div>
                <Progress value={(gpa / 4) * 100} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5" />
              Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Courses</span>
                <span className="font-semibold">{grades.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Credits</span>
                <span className="font-semibold">{totalCredits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Semesters</span>
                <span className="font-semibold">{Object.keys(groupedBySemester).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades by Semester */}
      {grades.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No grades recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedBySemester)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([semester, semesterGrades]) => (
            <Card key={semester}>
              <CardHeader>
                <CardTitle>{semester}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {semesterGrades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium">{grade.subject}</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(grade.grade_letter)}>
                            {grade.grade_letter}
                          </Badge>
                        </TableCell>
                        <TableCell>{grade.grade_points.toFixed(1)}</TableCell>
                        <TableCell>{grade.credits}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {grade.remarks || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
      )}
    </div>
  );
};
