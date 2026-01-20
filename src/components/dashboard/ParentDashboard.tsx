import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EligibilityCard from '@/components/cards/EligibilityCard';
import { examEligibility, studentProgress } from '@/data/mockData';
import { GraduationCap, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const ParentDashboard: React.FC = () => {
  const student = studentProgress[0];

  return (
    <DashboardLayout
      activeTab="dashboard"
      onTabChange={() => {}}
      title="Parent Dashboard"
      subtitle={`Monitoring ${student.studentName}'s academic progress`}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Student Info with Overall Grade */}
        <Card className="border-l-4 border-l-accent">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center text-2xl font-bold text-accent-foreground">
                {student.studentName.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">{student.studentName}</h2>
                <p className="text-muted-foreground">Student ID: {student.studentId}</p>
              </div>
              <div className="ml-auto text-right">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-accent" />
                  <p className="text-3xl font-display font-bold text-foreground">{student.overallGrade}%</p>
                </div>
                <p className="text-sm text-muted-foreground">Overall Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Marks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Subject Marks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {examEligibility.map((elig) => (
              <div key={elig.subjectId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{elig.subjectName}</span>
                  <span className="text-sm font-semibold text-foreground">{elig.percentage}%</span>
                </div>
                <Progress 
                  value={elig.percentage} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Exam Eligibility */}
        <div>
          <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Exam Eligibility Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examEligibility.map((elig) => (
              <EligibilityCard key={elig.subjectId} eligibility={elig} />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParentDashboard;
