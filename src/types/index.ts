export type UserRole = 'admin' | 'faculty' | 'student' | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export type Priority = 'high' | 'medium' | 'low';

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: Date;
  createdAt: Date;
  facultyId: string;
  facultyName: string;
  priority: Priority;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  maxScore: number;
  score?: number;
  feedback?: string;
  isLateSubmission?: boolean;
  creditReduction?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  facultyId: string;
  facultyName: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ExamEligibility {
  subjectId: string;
  subjectName: string;
  isEligible: boolean;
  completedAssignments: number;
  totalAssignments: number;
  percentage: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  createdAt: Date;
  isRead: boolean;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  fileUrl: string;
  fileType: 'pdf' | 'doc' | 'ppt' | 'video' | 'link';
  uploadedBy: string;
  uploadedAt: Date;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  overallGrade: number;
  assignmentsCompleted: number;
  assignmentsPending: number;
  examEligibility: ExamEligibility[];
}
