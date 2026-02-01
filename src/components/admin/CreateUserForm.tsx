import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Parent {
  user_id: string;
  full_name: string;
  email: string;
}

interface CreateUserFormProps {
  onUserCreated?: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onUserCreated }) => {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Parent linking states
  const [parents, setParents] = useState<Parent[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [createNewParent, setCreateNewParent] = useState(false);
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentName, setParentName] = useState('');

  // Fetch available parents when role is student
  useEffect(() => {
    if (role === 'student') {
      fetchParents();
    }
  }, [role]);

  const fetchParents = async () => {
    try {
      // Get all parent user_ids
      const { data: parentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'parent');
      
      if (rolesError) throw rolesError;
      
      if (parentRoles && parentRoles.length > 0) {
        const parentIds = parentRoles.map(r => r.user_id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', parentIds);
        
        if (profilesError) throw profilesError;
        setParents(profiles || []);
      } else {
        setParents([]);
      }
    } catch (error) {
      console.error('Error fetching parents:', error);
      setParents([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.access_token) {
      toast.error('You must be logged in to create users');
      return;
    }

    if (!email || !password || !fullName || !role) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Validate parent info if creating new parent
    if (role === 'student' && createNewParent) {
      if (!parentEmail || !parentPassword || !parentName) {
        toast.error('Please fill in all parent fields');
        return;
      }
      if (parentPassword.length < 6) {
        toast.error('Parent password must be at least 6 characters');
        return;
      }
    }

    setIsLoading(true);

    try {
      const requestBody: any = {
        email,
        password,
        full_name: fullName,
        role,
      };

      // Add parent linking info for students
      if (role === 'student') {
        if (selectedParentId && selectedParentId !== 'none') {
          requestBody.parent_id = selectedParentId;
        } else if (createNewParent) {
          requestBody.create_parent = true;
          requestBody.parent_email = parentEmail;
          requestBody.parent_password = parentPassword;
          requestBody.parent_name = parentName;
        }
      }

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: requestBody,
      });

      if (error) {
        toast.error(error.message || 'Failed to create user');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      let successMessage = `User ${fullName} created successfully!`;
      if (data?.parent) {
        successMessage += ` Parent account created for ${data.parent.full_name}.`;
      }
      toast.success(successMessage);
      
      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('');
      setSelectedParentId('');
      setCreateNewParent(false);
      setParentEmail('');
      setParentPassword('');
      setParentName('');
      
      // Callback to refresh user list
      onUserCreated?.();
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          Create New User
        </CardTitle>
        <CardDescription>
          Add a new user to the system with their role
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parent Linking Section - Only shown when creating a student */}
          {role === 'student' && (
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Parent/Guardian Assignment
                </CardTitle>
                <CardDescription>
                  Link this student to an existing parent or create a new parent account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Parent Selection */}
                {parents.length > 0 && !createNewParent && (
                  <div className="space-y-2">
                    <Label>Select Existing Parent</Label>
                    <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No parent</SelectItem>
                        {parents.map((parent) => (
                          <SelectItem key={parent.user_id} value={parent.user_id}>
                            {parent.full_name} ({parent.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Toggle to create new parent */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Create New Parent Account</Label>
                    <p className="text-sm text-muted-foreground">
                      Create a new parent account linked to this student
                    </p>
                  </div>
                  <Switch
                    checked={createNewParent}
                    onCheckedChange={(checked) => {
                      setCreateNewParent(checked);
                      if (checked) setSelectedParentId('');
                    }}
                  />
                </div>

                {/* New Parent Form */}
                {createNewParent && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="parentName">Parent Name</Label>
                      <Input
                        id="parentName"
                        type="text"
                        placeholder="Parent's full name"
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentEmail">Parent Email</Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        placeholder="Parent's email"
                        value={parentEmail}
                        onChange={(e) => setParentEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="parentPassword">Parent Password</Label>
                      <Input
                        id="parentPassword"
                        type="password"
                        placeholder="Min 6 characters"
                        value={parentPassword}
                        onChange={(e) => setParentPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateUserForm;
