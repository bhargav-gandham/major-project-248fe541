import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GraduationCap, User, BookOpen, Users, Shield, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { id: 'admin' as UserRole, label: 'Administrator', icon: Shield, color: 'bg-primary', desc: 'System management' },
    { id: 'faculty' as UserRole, label: 'Faculty', icon: BookOpen, color: 'bg-accent', desc: 'Course management' },
    { id: 'student' as UserRole, label: 'Student', icon: GraduationCap, color: 'bg-success', desc: 'Learning portal' },
    { id: 'parent' as UserRole, label: 'Parent', icon: Users, color: 'bg-warning', desc: 'Progress monitoring' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password, selectedRole);
      if (success) {
        onLogin();
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-primary-foreground">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <GraduationCap className="w-9 h-9" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold">EduManage</h1>
              <p className="text-primary-foreground/70">Smart Curriculum Platform</p>
            </div>
          </div>

          <h2 className="text-4xl font-display font-bold leading-tight mb-6">
            Intelligent Academic<br />Activity Management
          </h2>

          <p className="text-lg text-primary-foreground/80 mb-8 max-w-md">
            Streamline curriculum activities with AI-driven task prioritization, 
            strict compliance enforcement, and real-time progress monitoring.
          </p>

          <div className="space-y-4">
            {[
              'AI-Powered Task Prioritization',
              'Automated Exam Eligibility',
              'Parental Control Dashboard',
              'Real-time Progress Tracking'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-3 h-3" />
                </div>
                <span className="text-primary-foreground/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute top-20 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">EduManage</h1>
              <p className="text-sm text-muted-foreground">Smart Curriculum</p>
            </div>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-display">Welcome back</CardTitle>
              <CardDescription>Select your role and sign in to continue</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                      selectedRole === role.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", role.color)}>
                      <role.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">{role.label}</p>
                    <p className="text-xs text-muted-foreground">{role.desc}</p>
                  </button>
                ))}
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={!selectedRole || isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Demo: Use any email with 4+ character password
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
