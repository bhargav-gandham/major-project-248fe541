import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Link2, Unlink, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface UserInfo {
  user_id: string;
  full_name: string;
  email: string;
}

interface LinkInfo {
  id: string;
  parent_id: string;
  student_id: string;
  parent_name: string;
  parent_email: string;
  student_name: string;
  student_email: string;
}

const ParentStudentLinkManager: React.FC = () => {
  const [parents, setParents] = useState<UserInfo[]>([]);
  const [students, setStudents] = useState<UserInfo[]>([]);
  const [links, setLinks] = useState<LinkInfo[]>([]);
  const [selectedParent, setSelectedParent] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch roles, profiles, and links in parallel
      const [rolesRes, profilesRes, linksRes] = await Promise.all([
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('profiles').select('user_id, full_name, email'),
        supabase.from('parent_student_links').select('*'),
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (linksRes.error) throw linksRes.error;

      const profileMap = new Map(
        (profilesRes.data || []).map(p => [p.user_id, p])
      );

      const parentIds = (rolesRes.data || []).filter(r => r.role === 'parent').map(r => r.user_id);
      const studentIds = (rolesRes.data || []).filter(r => r.role === 'student').map(r => r.user_id);

      setParents(parentIds.map(id => profileMap.get(id)).filter(Boolean) as UserInfo[]);
      setStudents(studentIds.map(id => profileMap.get(id)).filter(Boolean) as UserInfo[]);

      const enrichedLinks: LinkInfo[] = (linksRes.data || []).map(link => {
        const parent = profileMap.get(link.parent_id);
        const student = profileMap.get(link.student_id);
        return {
          id: link.id,
          parent_id: link.parent_id,
          student_id: link.student_id,
          parent_name: parent?.full_name || 'Unknown',
          parent_email: parent?.email || '',
          student_name: student?.full_name || 'Unknown',
          student_email: student?.email || '',
        };
      });

      setLinks(enrichedLinks);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLink = async () => {
    if (!selectedParent || !selectedStudent) {
      toast.error('Please select both a parent and a student');
      return;
    }

    const exists = links.some(l => l.parent_id === selectedParent && l.student_id === selectedStudent);
    if (exists) {
      toast.error('This link already exists');
      return;
    }

    setIsLinking(true);
    try {
      const { error } = await supabase.from('parent_student_links').insert({
        parent_id: selectedParent,
        student_id: selectedStudent,
      });

      if (error) throw error;

      toast.success('Parent linked to student successfully');
      setSelectedParent('');
      setSelectedStudent('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create link');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async (linkId: string) => {
    try {
      const { error } = await supabase.from('parent_student_links').delete().eq('id', linkId);
      if (error) throw error;
      toast.success('Link removed successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove link');
    }
  };

  return (
    <div className="space-y-6">
      {/* Link Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Link Parent to Student
          </CardTitle>
          <CardDescription>
            Assign a parent account to monitor an existing student
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label>Parent</Label>
              <Select value={selectedParent} onValueChange={setSelectedParent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a parent" />
                </SelectTrigger>
                <SelectContent>
                  {parents.map(p => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.full_name} ({p.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.user_id} value={s.user_id}>
                      {s.full_name} ({s.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleLink} disabled={isLinking || !selectedParent || !selectedStudent}>
              {isLinking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
              Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Existing Parent-Student Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : links.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No parent-student links found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map(link => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{link.parent_name}</p>
                        <p className="text-sm text-muted-foreground">{link.parent_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{link.student_name}</p>
                        <p className="text-sm text-muted-foreground">{link.student_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleUnlink(link.id)}>
                        <Unlink className="w-4 h-4 mr-1" />
                        Unlink
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
                }
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParentStudentLinkManager;
