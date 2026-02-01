import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useGrades, calculateGPA, getGPAStatus, Grade } from '@/hooks/useGrades';
import { AddGradeForm } from './AddGradeForm';
import { Trash2, BookOpen, Search, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const GradeBook = () => {
  const { grades, isLoading, deleteGrade, fetchGrades } = useGrades();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this grade?')) return;
    
    try {
      await deleteGrade(id);
      toast({
        title: 'Grade Deleted',
        description: 'The grade has been removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete grade.',
        variant: 'destructive',
      });
    }
  };

  // Group grades by student
  const groupedByStudent = grades.reduce((acc, grade) => {
    const key = grade.student_id;
    if (!acc[key]) {
      acc[key] = {
        student_name: grade.student_name || grade.student_id,
        student_email: grade.student_email || '',
        grades: [],
      };
    }
    acc[key].grades.push(grade);
    return acc;
  }, {} as Record<string, { student_name: string; student_email: string; grades: Grade[] }>);

  const filteredStudents = Object.entries(groupedByStudent).filter(([_, data]) =>
    data.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    data.student_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGradeColor = (letter: string) => {
    if (letter.startsWith('A')) return 'bg-success text-success-foreground';
    if (letter.startsWith('B')) return 'bg-primary text-primary-foreground';
    if (letter.startsWith('C')) return 'bg-warning text-warning-foreground';
    if (letter.startsWith('D')) return 'bg-orange-500 text-white';
    return 'bg-destructive text-destructive-foreground';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading grades...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Grade Book
          </h2>
          <p className="text-muted-foreground">Manage student grades and GPAs</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Hide Form
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Grade
            </>
          )}
        </Button>
      </div>

      {showAddForm && (
        <AddGradeForm onSuccess={() => {
          fetchGrades();
          setShowAddForm(false);
        }} />
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>All Grades</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {grades.length === 0 ? 'No grades recorded yet.' : 'No students match your search.'}
            </p>
          ) : (
            <div className="space-y-6">
              {filteredStudents.map(([studentId, data]) => {
                const studentGpa = calculateGPA(data.grades);
                const status = getGPAStatus(studentGpa);
                
                return (
                  <Card key={studentId} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <h3 className="font-semibold">{data.student_name}</h3>
                          <p className="text-sm text-muted-foreground">{data.student_email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold">{studentGpa.toFixed(2)}</p>
                            <p className={`text-sm ${status.color}`}>{status.label}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Semester</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Points</TableHead>
                            <TableHead>Credits</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.grades.map((grade) => (
                            <TableRow key={grade.id}>
                              <TableCell className="font-medium">{grade.subject}</TableCell>
                              <TableCell>{grade.semester}</TableCell>
                              <TableCell>
                                <Badge className={getGradeColor(grade.grade_letter)}>
                                  {grade.grade_letter}
                                </Badge>
                              </TableCell>
                              <TableCell>{grade.grade_points.toFixed(1)}</TableCell>
                              <TableCell>{grade.credits}</TableCell>
                              <TableCell className="max-w-[150px] truncate">
                                {grade.remarks || '-'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(grade.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
