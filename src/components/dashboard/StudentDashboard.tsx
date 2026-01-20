import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/cards/StatCard';
import AssignmentCard from '@/components/cards/AssignmentCard';
import EligibilityCard from '@/components/cards/EligibilityCard';
import ResourceCard from '@/components/cards/ResourceCard';
import { assignments, examEligibility, resources, calculatePriority } from '@/data/mockData';
import { FileText, CheckCircle, Clock, AlertTriangle, TrendingUp, GraduationCap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'overdue');
  const completedAssignments = assignments.filter(a => a.status === 'graded' || a.status === 'submitted');
  const overdueCount = assignments.filter(a => a.status === 'overdue').length;
  const eligibleCount = examEligibility.filter(e => e.isEligible).length;

  // Sort by AI priority
  const sortedPending = [...pendingAssignments].sort((a, b) => {
    return calculatePriority(b).score - calculatePriority(a).score;
  });

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Student Dashboard';
      case 'assignments': return 'My Assignments';
      case 'eligibility': return 'Exam Eligibility';
      case 'resources': return 'Study Materials';
      case 'grades': return 'My Grades';
      default: return 'Dashboard';
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={getTitle()}
      subtitle={activeTab === 'dashboard' ? 'Welcome back! Here\'s your academic overview.' : undefined}
    >
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Pending Tasks"
              value={pendingAssignments.length}
              subtitle="Assignments to complete"
              icon={Clock}
              variant="primary"
            />
            <StatCard
              title="Completed"
              value={completedAssignments.length}
              subtitle="Assignments submitted"
              icon={CheckCircle}
              variant="success"
            />
            <StatCard
              title="Overdue"
              value={overdueCount}
              subtitle="Need immediate attention"
              icon={AlertTriangle}
              variant="danger"
            />
            <StatCard
              title="Exam Eligibility"
              value={`${eligibleCount}/${examEligibility.length}`}
              subtitle="Subjects eligible"
              icon={GraduationCap}
              variant="accent"
            />
          </div>

          {/* AI Prioritized Tasks */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-foreground">AI-Prioritized Tasks</h2>
                <p className="text-sm text-muted-foreground">Smart recommendations based on deadlines and difficulty</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sortedPending.slice(0, 4).map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} showAIPriority />
              ))}
            </div>
          </div>

          {/* Quick Eligibility Check */}
          <div>
            <h2 className="text-lg font-display font-bold text-foreground mb-4">Exam Eligibility Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {examEligibility.slice(0, 3).map((elig) => (
                <EligibilityCard key={elig.subjectId} eligibility={elig} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-6 animate-fade-in">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList>
              <TabsTrigger value="pending">Pending ({pendingAssignments.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedAssignments.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sortedPending.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} showAIPriority />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {completedAssignments.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} showAIPriority={false} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {activeTab === 'eligibility' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h3 className="font-display font-bold text-foreground mb-2">Eligibility Criteria</h3>
            <p className="text-muted-foreground">
              You must complete at least <span className="font-semibold text-foreground">75%</span> of assignments 
              in each subject to be eligible for the final exam. Late submissions may affect your eligibility.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examEligibility.map((elig) => (
              <EligibilityCard key={elig.subjectId} eligibility={elig} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="space-y-4 animate-fade-in">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Overall Grade"
              value="82%"
              subtitle="Current semester"
              icon={TrendingUp}
              variant="success"
            />
            <StatCard
              title="Assignments Graded"
              value={completedAssignments.filter(a => a.status === 'graded').length}
              subtitle="With feedback"
              icon={CheckCircle}
              variant="accent"
            />
            <StatCard
              title="Average Score"
              value="87/100"
              subtitle="Across all subjects"
              icon={FileText}
              variant="primary"
            />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-foreground mb-4">Recent Grades</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {completedAssignments
                .filter(a => a.status === 'graded')
                .map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} showAIPriority={false} />
                ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentDashboard;
