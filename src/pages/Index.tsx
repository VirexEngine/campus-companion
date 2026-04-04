import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/" replace />;
}
