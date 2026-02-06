import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuizzes } from '@/hooks/useQuizzes';
import { Eye, EyeOff, Trash2, Loader2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QuizListProps {
  onViewQuiz?: (quizId: string) => void;
}

const QuizList: React.FC<QuizListProps> = ({ onViewQuiz }) => {
  const { quizzes, isLoading, togglePublish, deleteQuiz } = useQuizzes();

  const handleTogglePublish = async (quizId: string, isPublished: boolean) => {
    try {
      await togglePublish(quizId, isPublished);
      toast.success(isPublished ? 'Quiz unpublished' : 'Quiz published to students');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await deleteQuiz(quizId);
      toast.success('Quiz deleted');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          All Quizzes ({quizzes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : quizzes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No quizzes created yet. Use the AI generator above to create your first quiz.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Time Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell className="font-medium">{quiz.title}</TableCell>
                  <TableCell>{quiz.subject}</TableCell>
                  <TableCell>{quiz.topic}</TableCell>
                  <TableCell>{quiz.time_limit_minutes} min</TableCell>
                  <TableCell>
                    {quiz.is_published ? (
                      <Badge className="bg-success">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTogglePublish(quiz.id, quiz.is_published)}
                        title={quiz.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {quiz.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(quiz.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizList;
