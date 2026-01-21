import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Note {
  id: string;
  title: string;
  subject: string;
  content: string;
  file_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching notes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (
    title: string,
    subject: string,
    content: string,
    file?: File
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let file_url: string | null = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('notes')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('notes')
          .getPublicUrl(fileName);

        file_url = publicUrl;
      }

      const { error } = await supabase
        .from('notes')
        .insert({
          title,
          subject,
          content,
          file_url,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Note created',
        description: 'Your note has been shared with students.',
      });

      await fetchNotes();
      return true;
    } catch (error: any) {
      toast({
        title: 'Error creating note',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Note deleted',
        description: 'The note has been removed.',
      });

      await fetchNotes();
      return true;
    } catch (error: any) {
      toast({
        title: 'Error deleting note',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  return {
    notes,
    loading,
    createNote,
    deleteNote,
    refetch: fetchNotes,
  };
};
