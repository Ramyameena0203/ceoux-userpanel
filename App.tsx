import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LoginPage from '@/pages/LoginPage';
import DashboardLayout, { type DashboardView } from '@/components/DashboardLayout';
import UploadExam from '@/pages/UploadExam';
import HmRegistration from '@/pages/HmRegistration';
import StudentList from '@/pages/StudentList';

function Dashboard() {
  const [view, setView] = useState<DashboardView>('upload-exam');

  return (
    <DashboardLayout active={view} onNavigate={setView}>
      {view === 'upload-exam' && <UploadExam />}
      {view === 'hm-registration' && <HmRegistration />}
      {view === 'student-list' && <StudentList />}
    </DashboardLayout>
  );
}

function AppContent() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return session ? <Dashboard /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
