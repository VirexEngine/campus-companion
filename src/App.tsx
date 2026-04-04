import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AttendancePage from "./pages/AttendancePage";
import TimetablePage from "./pages/TimetablePage";
import ChatbotPage from "./pages/ChatbotPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import AdminStudentsPage from "./pages/admin/AdminStudentsPage";
import AdminTeachersPage from "./pages/admin/AdminTeachersPage";
import AdminQueriesPage from "./pages/admin/AdminQueriesPage";
import QueriesPage from "./pages/QueriesPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminPage from "./pages/AdminPage";
import QuizzesPage from "./pages/QuizzesPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DocumentVault from "./pages/DocumentVault";
import NotFound from "./pages/NotFound";
import GNGroupLanding from "./pages/GNGroupLanding";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GNGroupLanding />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/chatbot" element={<ChatbotPage />} />
            <Route path="/quizzes" element={<QuizzesPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/queries" element={<QueriesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/documents" element={<DocumentVault />} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><AdminStudentsPage /></ProtectedRoute>} />
            <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['admin']}><AdminTeachersPage /></ProtectedRoute>} />
            <Route path="/admin/queries" element={<ProtectedRoute allowedRoles={['admin']}><AdminQueriesPage /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalyticsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}><AdminPage /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
