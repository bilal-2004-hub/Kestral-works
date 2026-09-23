import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';

/* Route guarding is a convenience for the person, not a security control —
   every API call is authorised again on the server. */
export default function ProtectedRoute({ roles }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <div className="grid min-h-screen place-items-center"><Spinner label="Checking your session" /></div>;
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'client' ? '/portal' : '/admin'} replace />;
  }
  return <Outlet />;
}
