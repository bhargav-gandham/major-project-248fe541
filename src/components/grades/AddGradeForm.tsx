import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useGrades, GRADE_LETTERS, GRADE_POINTS, GradeInput } from '@/hooks/useGrades';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';

interface Student {
  user_id: string;
  full_name: string;
  email: string;
}

const SUBJECTS = [
  'Mathematics',
  'English',
  'Science',
  'History',
  'Geography',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Art',
  'Music',
  'Physical Education',
];

const SEMESTERS = [
  'Fall 2025',
  'Spring 2025',
  'Fall 2024',
  'Spring 2024',
];

interface AddGradeFormProps {
  onSuccess?: () => void;
}

export const AddGradeForm = ({ onSuccess }: AddGradeFormProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<GradeInput>({
    student_id: '',
    subject: '',
    semester: '',
    grade_letter: '',
    grade_points: 0,
    credits: 3,
    remarks: '',
  });

  const { addGrade } = useGrades();
  const { toast } = useToast();

  useEffect(() => {
    const fetchStudents = async () => {
      // Get all users with student role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (roles && roles.length > 0) {
        const studentIds = roles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', studentIds);

        setStudents(profiles || []);
      }
    };

    fetchStudents();
  }, []);

  const handleGradeChange = (letter: string) => {
    setFormData(prev => ({
      ...prev,
      grade_letter: letter,
      grade_points: GRADE_POINTS[letter] || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.subject || !formData.semester || !formData.grade_letter) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await addGrade(formData);
      toast({
        title: 'Grade Added',
        description: 'The grade has been recorded successfully.',
      });
      setFormData({
        student_id: '',
        subject: '',
        semester: '',
        grade_letter: '',
        grade_points: 0,
        credits: 3,
        remarks: '',
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add grade.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Grade
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student">Student *</Label>
              <Select
                value={formData.student_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.user_id} value={student.user_id}>
                      {student.full_name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select
                value={formData.subject}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subject: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Select
                value={formData.semester}
                onValueChange={(value) => setFormData(prev => ({ ...prev, semester: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {SEMESTERS.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">Grade *</Label>
              <Select
                value={formData.grade_letter}
                onValueChange={handleGradeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LETTERS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade} ({GRADE_POINTS[grade].toFixed(1)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                min={1}
                max={6}
                value={formData.credits}
                onChange={(e) => setFormData(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              placeholder="Optional remarks about the grade..."
              value={formData.remarks || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Adding...' : 'Add Grade'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
