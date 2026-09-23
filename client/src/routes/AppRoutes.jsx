import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, ListChecks, MessageSquare, Star, Bell, User,
  Users, Inbox, Settings,
} from 'lucide-react';
import PublicLayout from '../layouts/PublicLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Home from '../pages/public/Home.jsx';

/* Dedicated Public Pages */
const AboutPage = lazy(() => import('../pages/public/AboutPage.jsx'));
const ServicesPage = lazy(() => import('../pages/public/ServicesPage.jsx'));
const PortfolioPage = lazy(() => import('../pages/public/PortfolioPage.jsx'));
const ProcessPage = lazy(() => import('../pages/public/ProcessPage.jsx'));
const FAQPage = lazy(() => import('../pages/public/FAQPage.jsx'));
const ContactPage = lazy(() => import('../pages/public/ContactPage.jsx'));

/* Auth pages */
const Login = lazy(() => import('../pages/auth/Login.jsx'));
const Register = lazy(() => import('../pages/auth/Register.jsx'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword.jsx'));
const NotFound = lazy(() => import('../pages/public/NotFound.jsx'));

/* Client Portal pages */
const PortalDashboard = lazy(() => import('../pages/portal/Dashboard.jsx'));
const PortalProjects = lazy(() => import('../pages/portal/Projects.jsx'));
const PortalProjectDetail = lazy(() => import('../pages/portal/ProjectDetail.jsx'));
const PortalTasks = lazy(() => import('../pages/portal/Tasks.jsx'));
const PortalFeedback = lazy(() => import('../pages/portal/Feedback.jsx'));
const PortalReviews = lazy(() => import('../pages/portal/Reviews.jsx'));
const PortalNotifications = lazy(() => import('../pages/portal/Notifications.jsx'));
const Profile = lazy(() => import('../pages/portal/Profile.jsx'));

/* Admin Dashboard pages */
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard.jsx'));
const AdminClients = lazy(() => import('../pages/admin/Clients.jsx'));
const AdminProjects = lazy(() => import('../pages/admin/Projects.jsx'));
const AdminProjectDetail = lazy(() => import('../pages/admin/ProjectDetail.jsx'));
const AdminTasks = lazy(() => import('../pages/admin/Tasks.jsx'));
const AdminFeedback = lazy(() => import('../pages/admin/Feedback.jsx'));
const AdminReviews = lazy(() => import('../pages/admin/Reviews.jsx'));
const AdminMessages = lazy(() => import('../pages/admin/Messages.jsx'));

const portalNav = [
  { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portal/projects', label: 'My projects', icon: FolderKanban },
  { to: '/portal/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/portal/feedback', label: 'Feedback', icon: MessageSquare },
  { to: '/portal/reviews', label: 'Reviews', icon: Star },
  { to: '/portal/notifications', label: 'Notifications', icon: Bell },
  { to: '/portal/profile', label: 'Profile', icon: User },
];

const adminNav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/clients', label: 'Clients', icon: Users },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/messages', label: 'Enquiries', icon: Inbox },
  { to: '/admin/profile', label: 'Settings', icon: Settings },
];

const Loading = () => <div className="grid min-h-[40vh] place-items-center"><Spinner /></div>;

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="work" element={<PortfolioPage />} />
          <Route path="process" element={<ProcessPage />} />
          <Route path="faq" element={<FAQPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute roles={['client']} />}>
          <Route path="/portal" element={<DashboardLayout nav={portalNav} basePath="/portal" area="Client workspace" />}>
            <Route index element={<PortalDashboard />} />
            <Route path="projects" element={<PortalProjects />} />
            <Route path="projects/:id" element={<PortalProjectDetail />} />
            <Route path="tasks" element={<PortalTasks />} />
            <Route path="feedback" element={<PortalFeedback />} />
            <Route path="feedback/:id" element={<PortalFeedback />} />
            <Route path="reviews" element={<PortalReviews />} />
            <Route path="notifications" element={<PortalNotifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['admin', 'manager']} />}>
          <Route path="/admin" element={<DashboardLayout nav={adminNav} basePath="/admin" area="Studio admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="projects/:id" element={<AdminProjectDetail />} />
            <Route path="tasks" element={<AdminTasks />} />
            <Route path="feedback" element={<AdminFeedback />} />
            <Route path="feedback/:id" element={<AdminFeedback />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="notifications" element={<PortalNotifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
