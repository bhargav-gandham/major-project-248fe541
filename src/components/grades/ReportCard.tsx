import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Grade, calculateGPA } from '@/hooks/useGrades';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Printer, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';

interface ReportCardProps {
  grades: Grade[];
  gpa: number;
  gpaStatus: { label: string; color: string };
}

export const ReportCard = ({ grades, gpa, gpaStatus }: ReportCardProps) => {
  const { user } = useAuth();
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple text-based download for now
    const content = generateReportText();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-card-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportText = () => {
    const lines = [
      '═══════════════════════════════════════════════════════════',
      '                    ACADEMIC REPORT CARD                    ',
      '═══════════════════════════════════════════════════════════',
      '',
      `Student Name: ${user?.name || 'N/A'}`,
      `Email: ${user?.email || 'N/A'}`,
      `Report Date: ${format(new Date(), 'MMMM d, yyyy')}`,
      '',
      '───────────────────────────────────────────────────────────',
      '                        GRADE SUMMARY                       ',
      '───────────────────────────────────────────────────────────',
      '',
    ];

    // Group by semester
    const bySemester = grades.reduce((acc, g) => {
      if (!acc[g.semester]) acc[g.semester] = [];
      acc[g.semester].push(g);
      return acc;
    }, {} as Record<string, Grade[]>);

    Object.entries(bySemester)
      .sort(([a], [b]) => b.localeCompare(a))
      .forEach(([semester, semGrades]) => {
        lines.push(`\n${semester}`);
        lines.push('─'.repeat(55));
        lines.push(
          'Subject'.padEnd(25) +
          'Grade'.padEnd(10) +
          'Points'.padEnd(10) +
          'Credits'
        );
        lines.push('─'.repeat(55));
        
        semGrades.forEach(g => {
          lines.push(
            g.subject.padEnd(25) +
            g.grade_letter.padEnd(10) +
            g.grade_points.toFixed(1).padEnd(10) +
            g.credits.toString()
          );
        });

        const semGpa = calculateGPA(semGrades);
        lines.push('─'.repeat(55));
        lines.push(`Semester GPA: ${semGpa.toFixed(2)}`);
      });

    lines.push('\n═══════════════════════════════════════════════════════════');
    lines.push(`CUMULATIVE GPA: ${gpa.toFixed(2)} (${gpaStatus.label})`);
    lines.push(`Total Credits Earned: ${grades.reduce((sum, g) => sum + g.credits, 0)}`);
    lines.push('═══════════════════════════════════════════════════════════');

    return lines.join('\n');
  };

  const getGradeColor = (letter: string) => {
    if (letter.startsWith('A')) return 'bg-success text-success-foreground';
    if (letter.startsWith('B')) return 'bg-primary text-primary-foreground';
    if (letter.startsWith('C')) return 'bg-warning text-warning-foreground';
    if (letter.startsWith('D')) return 'bg-orange-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  // Group by semester
  const groupedBySemester = grades.reduce((acc, grade) => {
    if (!acc[grade.semester]) acc[grade.semester] = [];
    acc[grade.semester].push(grade);
    return acc;
  }, {} as Record<string, Grade[]>);

  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 print:hidden">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      <Card ref={reportRef} className="print:shadow-none print:border-none">
        <CardHeader className="text-center border-b">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Academic Report Card</CardTitle>
          <p className="text-muted-foreground">
            Generated on {format(new Date(), 'MMMM d, yyyy')}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          {/* Student Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Student Name</p>
              <p className="font-semibold">{user?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{user?.email || 'N/A'}</p>
            </div>
          </div>

          {/* GPA Summary */}
          <div className="flex justify-center">
            <div className="text-center p-6 border-2 border-primary rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Cumulative GPA</p>
              <p className="text-5xl font-bold text-primary">{gpa.toFixed(2)}</p>
              <Badge className={`mt-2 ${gpaStatus.color.replace('text-', 'bg-').replace('-foreground', '')}`}>
                {gpaStatus.label}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {totalCredits} Total Credits
              </p>
            </div>
          </div>

          <Separator />

          {/* Grades by Semester */}
          {Object.entries(groupedBySemester)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([semester, semGrades]) => {
              const semGpa = calculateGPA(semGrades);
              const semCredits = semGrades.reduce((sum, g) => sum + g.credits, 0);
              
              return (
                <div key={semester} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{semester}</h3>
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">Semester GPA: </span>
                      <span className="font-bold">{semGpa.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground ml-2">({semCredits} credits)</span>
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead className="text-center">Points</TableHead>
                        <TableHead className="text-center">Credits</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {semGrades.map((grade) => (
                        <TableRow key={grade.id}>
                          <TableCell className="font-medium">{grade.subject}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={getGradeColor(grade.grade_letter)}>
                              {grade.grade_letter}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">{grade.grade_points.toFixed(1)}</TableCell>
                          <TableCell className="text-center">{grade.credits}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}

          <Separator />

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>This is an official academic record.</p>
            <p>For verification, please contact the administration.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
