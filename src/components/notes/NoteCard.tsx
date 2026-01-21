import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Note } from '@/hooks/useNotes';

interface NoteCardProps {
  note: Note;
  showDelete?: boolean;
  onDelete?: (id: string) => void;
}

export const NoteCard = ({ note, showDelete, onDelete }: NoteCardProps) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{note.title}</CardTitle>
            <Badge variant="secondary" className="mt-1">
              {note.subject}
            </Badge>
          </div>
          <FileText className="h-5 w-5 text-primary shrink-0" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground line-clamp-4 flex-1">
          {note.content}
        </p>
        
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(new Date(note.created_at), 'MMM d, yyyy')}
          </div>
          
          <div className="flex gap-2">
            {note.file_url && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                asChild
              >
                <a href={note.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </a>
              </Button>
            )}
            {showDelete && onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(note.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
