import { Assignment, Subject, ExamEligibility, Notification, Resource, StudentProgress } from '@/types';

export const subjects: Subject[] = [
  { id: 's1', name: 'Advanced Mathematics', code: 'MATH401', facultyId: 'faculty-1', facultyName: 'Prof. James Anderson', difficulty: 'hard' },
  { id: 's2', name: 'Data Structures', code: 'CS301', facultyId: 'faculty-2', facultyName: 'Dr. Emily Chen', difficulty: 'medium' },
  { id: 's3', name: 'Physics', code: 'PHY201', facultyId: 'faculty-3', facultyName: 'Prof. Robert Wilson', difficulty: 'hard' },
  { id: 's4', name: 'English Literature', code: 'ENG101', facultyId: 'faculty-4', facultyName: 'Dr. Maria Garcia', difficulty: 'easy' },
  { id: 's5', name: 'Database Systems', code: 'CS401', facultyId: 'faculty-1', facultyName: 'Prof. James Anderson', difficulty: 'medium' },
];

export const assignments: Assignment[] = [
  {
    id: 'a1',
    title: 'Calculus Integration Problems',
    subject: 'Advanced Mathematics',
    description: 'Solve the given integration problems using various techniques including substitution and partial fractions.',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    facultyId: 'faculty-1',
    facultyName: 'Prof. James Anderson',
    priority: 'high',
    status: 'pending',
    maxScore: 100,
  },
  {
    id: 'a2',
    title: 'Binary Tree Implementation',
    subject: 'Data Structures',
    description: 'Implement a binary search tree with insert, delete, and search operations.',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    facultyId: 'faculty-2',
    facultyName: 'Dr. Emily Chen',
    priority: 'medium',
    status: 'pending',
    maxScore: 100,
  },
  {
    id: 'a3',
    title: 'Quantum Mechanics Essay',
    subject: 'Physics',
    description: 'Write a 2000-word essay on the principles of quantum mechanics and their applications.',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    facultyId: 'faculty-3',
    facultyName: 'Prof. Robert Wilson',
    priority: 'low',
    status: 'pending',
    maxScore: 100,
  },
  {
    id: 'a4',
    title: 'Shakespeare Analysis',
    subject: 'English Literature',
    description: 'Analyze the themes of power and ambition in Macbeth.',
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (overdue)
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    facultyId: 'faculty-4',
    facultyName: 'Dr. Maria Garcia',
    priority: 'high',
    status: 'overdue',
    maxScore: 100,
  },
  {
    id: 'a5',
    title: 'SQL Query Optimization',
    subject: 'Database Systems',
    description: 'Optimize the given SQL queries for better performance.',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    facultyId: 'faculty-1',
    facultyName: 'Prof. James Anderson',
    priority: 'high',
    status: 'pending',
    maxScore: 100,
  },
  {
    id: 'a6',
    title: 'Linear Algebra Proofs',
    subject: 'Advanced Mathematics',
    description: 'Prove the given theorems related to vector spaces.',
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    facultyId: 'faculty-1',
    facultyName: 'Prof. James Anderson',
    priority: 'medium',
    status: 'graded',
    maxScore: 100,
    score: 87,
    feedback: 'Excellent work on the proofs. Minor notation issues.',
  },
];

export const examEligibility: ExamEligibility[] = [
  { subjectId: 's1', subjectName: 'Advanced Mathematics', isEligible: true, completedAssignments: 4, totalAssignments: 5, percentage: 80 },
  { subjectId: 's2', subjectName: 'Data Structures', isEligible: true, completedAssignments: 3, totalAssignments: 4, percentage: 75 },
  { subjectId: 's3', subjectName: 'Physics', isEligible: false, completedAssignments: 2, totalAssignments: 5, percentage: 40 },
  { subjectId: 's4', subjectName: 'English Literature', isEligible: true, completedAssignments: 5, totalAssignments: 5, percentage: 100 },
  { subjectId: 's5', subjectName: 'Database Systems', isEligible: true, completedAssignments: 3, totalAssignments: 4, percentage: 75 },
];

export const notifications: Notification[] = [
  { id: 'n1', title: 'Assignment Due Soon', message: 'Calculus Integration Problems is due in 2 days', type: 'warning', createdAt: new Date(), isRead: false },
  { id: 'n2', title: 'Grade Posted', message: 'Your grade for Linear Algebra Proofs has been posted', type: 'success', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), isRead: false },
  { id: 'n3', title: 'Exam Eligibility Warning', message: 'You may not be eligible for Physics exam. Complete pending assignments.', type: 'error', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), isRead: true },
  { id: 'n4', title: 'New Resource Available', message: 'Prof. Anderson uploaded new study materials for Database Systems', type: 'info', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), isRead: true },
];

export const resources: Resource[] = [
  { id: 'r1', title: 'Integration Techniques Guide', description: 'Comprehensive guide to integration methods', subjectId: 's1', subjectName: 'Advanced Mathematics', fileUrl: '/resources/integration.pdf', fileType: 'pdf', uploadedBy: 'Prof. James Anderson', uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { id: 'r2', title: 'BST Video Tutorial', description: 'Video explanation of Binary Search Trees', subjectId: 's2', subjectName: 'Data Structures', fileUrl: '/resources/bst.mp4', fileType: 'video', uploadedBy: 'Dr. Emily Chen', uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { id: 'r3', title: 'SQL Optimization Slides', description: 'Presentation on query optimization techniques', subjectId: 's5', subjectName: 'Database Systems', fileUrl: '/resources/sql.ppt', fileType: 'ppt', uploadedBy: 'Prof. James Anderson', uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
];

export const studentProgress: StudentProgress[] = [
  {
    studentId: 'student-1',
    studentName: 'Alex Thompson',
    overallGrade: 82,
    assignmentsCompleted: 17,
    assignmentsPending: 6,
    examEligibility: examEligibility,
  },
];

// AI Priority calculation
export const calculatePriority = (assignment: Assignment): { score: number; level: 'high' | 'medium' | 'low'; reason: string } => {
  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get subject difficulty
  const subject = subjects.find(s => s.name === assignment.subject);
  const difficultyWeight = subject?.difficulty === 'hard' ? 30 : subject?.difficulty === 'medium' ? 20 : 10;
  
  // Calculate score (higher = more urgent)
  let score = 0;
  let reason = '';
  
  if (daysUntilDue <= 0) {
    score = 100;
    reason = 'Overdue! Submit immediately to minimize credit loss.';
  } else if (daysUntilDue <= 2) {
    score = 90 + difficultyWeight;
    reason = `Due very soon (${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}). High difficulty subject.`;
  } else if (daysUntilDue <= 5) {
    score = 60 + difficultyWeight;
    reason = `Due in ${daysUntilDue} days. ${subject?.difficulty === 'hard' ? 'Complex subject - start early.' : 'Moderate urgency.'}`;
  } else {
    score = 30 + difficultyWeight;
    reason = `Due in ${daysUntilDue} days. Plan ahead for best results.`;
  }
  
  const level = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';
  
  return { score, level, reason };
};
