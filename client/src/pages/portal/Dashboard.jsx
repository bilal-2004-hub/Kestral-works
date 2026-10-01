import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Activity, CheckCircle2, ListChecks, MessageSquare,
  Star, Bell, ArrowRight, Clock, Plus, Sparkles, TrendingUp, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFetch } from '../../hooks/useApi.js';
import { dashboardApi } from '../../services/endpoints.js';
import { useSocket } from '../../context/SocketContext.jsx';
import PageHeader from '../../components/portal/PageHeader.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Card from '../../components/ui/Card.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import ConnectionStatus from '../../components/ui/ConnectionStatus.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonCards } from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';
import { formatDate, timeAgo } from '../../utils/format.js';

export default function PortalDashboard() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch(() => dashboardApi.client(), []);
  const { socket, projectClaimedCount } = useSocket();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (data?.recentProjects) {
      setProjects(data.recentProjects);
    }
  }, [data]);

  // Refetch full dashboard data when a project is successfully claimed.
  // projectClaimedCount increments in SocketContext on the confirmed server event.
  useEffect(() => {
    if (projectClaimedCount > 0) {
      refetch();
    }
  }, [projectClaimedCount, refetch]);

  // Real-time live updates
  useEffect(() => {
    if (!socket) return;
    const onProgress = (evt) => {
      setProjects((prev) =>
        prev.map((p) =>
          (p._id === evt.projectId || p.id === evt.projectId)
            ? { ...p, progress: evt.progress, status: evt.status || p.status, lastProgressAt: new Date().toISOString() }
            : p
        )
      );
    };

    const onNotification = () => {
      refetch();
    };

    socket.on('project:progressUpdated', onProgress);
    socket.on('notification:new', onNotification);

    return () => {
      socket.off('project:progressUpdated', onProgress);
      socket.off('notification:new', onNotification);
    };
  }, [socket, refetch]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Welcome back, ${user?.name || 'Client'}`}
          description="Loading your workspace overview..."
        />
        <SkeletonCards count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Welcome back, ${user?.name || 'Client'}`}
          description="Overview of your active projects and deliverables."
        />
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  const totals = data?.totals || {
    projects: 0,
    active: 0,
    completed: 0,
    pendingTasks: 0,
    completedTasks: 0,
    tasksAwaitingReview: 0,
    openFeedback: 0,
    overallProgress: 0,
  };

  const recentProjects = projects.length > 0 ? projects : (data?.recentProjects || []);
  const upcomingTasks = data?.upcomingTasks || [];
  const recentActivities = data?.recentActivities || [];
  const recentFeedback = data?.recentFeedback || [];
  const notifications = data?.notifications || [];

  return (
    <div className="space-y-8">
      {/* Welcome Banner & Connection Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Welcome back, {user?.name || 'Client'}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-signal-500/10 border border-signal-500/30 px-2.5 py-0.5 text-xs font-mono font-medium text-signal-400">
              <Sparkles size={12} /> Active Workspace
            </span>
          </div>
          <p className="mt-1.5 text-sm text-marine-100/70">
            {user?.company ? `${user.company} · ` : ''}Real-time view of your design, development, and progress milestones.
          </p>
        </div>
        <ConnectionStatus />
      </div>

      {/* Quick Action Hub */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-mono uppercase tracking-wider text-marine-100/50 mr-1">Quick actions:</span>
        <Button as={Link} to="/portal/projects" variant="outline" size="sm" icon={FolderKanban}>
          View Projects
        </Button>
        <Button as={Link} to="/portal/tasks" variant="outline" size="sm" icon={ListChecks}>
          View Tasks
        </Button>
        <Button as={Link} to="/portal/feedback" variant="outline" size="sm" icon={MessageSquare}>
          Send Feedback
        </Button>
        <Button as={Link} to="/portal/reviews" variant="outline" size="sm" icon={Star}>
          Leave Review
        </Button>
      </div>

      {/* Key Metric Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Projects"
          value={totals.active}
          hint={`${totals.completed} completed overall`}
          icon={FolderKanban}
          tone="marine"
        />
        <StatCard
          label="Overall Progress"
          value={`${totals.overallProgress || 0}%`}
          hint="Average across active projects"
          icon={TrendingUp}
          tone="accent"
        />
        <StatCard
          label="Pending Tasks"
          value={totals.pendingTasks}
          hint={totals.tasksAwaitingReview > 0 ? `${totals.tasksAwaitingReview} waiting on review` : 'Tasks in flight'}
          icon={ListChecks}
        />
        <StatCard
          label="Tasks Completed"
          value={totals.completedTasks || 0}
          hint="Deliverables completed"
          icon={CheckCircle2}
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          {/* Active Projects List */}
          <Card
            title="Your Projects"
            action={
              <Button as={Link} to="/portal/projects" variant="ghost" size="sm" icon={ArrowRight}>
                All projects
              </Button>
            }
            padded={false}
          >
            {recentProjects.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={FolderKanban}
                  title="No active projects yet"
                  description="When a project is assigned to your account, you will be able to track live progress and deliverables right here."
                  action={
                    <Button as={Link} to="/portal/feedback" variant="outline" size="sm">
                      Contact Team
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {recentProjects.map((project) => (
                  <li key={project._id || project.id}>
                    <Link
                      to={`/portal/projects/${project._id || project.id}`}
                      className="block p-5 transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-semibold text-white group-hover:text-signal-400">
                            {project.name}
                          </h4>
                          <p className="mt-0.5 line-clamp-1 text-xs text-marine-100/60">
                            {project.description || 'No description provided'}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-marine-100/50">
                            {project.dueDate ? (
                              <span className="flex items-center gap-1 text-marine-100/70">
                                <Clock size={12} /> Due {formatDate(project.dueDate)}
                              </span>
                            ) : (
                              <span>No deadline set</span>
                            )}
                            <span>·</span>
                            <span>Updated {timeAgo(project.updatedAt || project.createdAt)}</span>
                          </div>
                        </div>
                        <StatusBadge status={project.status} />
                      </div>

                      <div className="mt-4">
                        <ProgressBar value={project.progress || 0} size="md" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Upcoming & In-Progress Tasks */}
          <Card
            title="Upcoming Deliverables & Tasks"
            action={
              <Button as={Link} to="/portal/tasks" variant="ghost" size="sm" icon={ArrowRight}>
                View all
              </Button>
            }
            padded={false}
          >
            {upcomingTasks.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={ListChecks}
                  title="No pending tasks"
                  description="All visible project tasks are currently up to date!"
                />
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {upcomingTasks.map((task) => (
                  <li key={task._id || task.id} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-white/[0.02]">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white text-sm">{task.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-marine-100/60 font-mono">
                        {task.project?.name && (
                          <span className="text-signal-400">{task.project.name}</span>
                        )}
                        {task.dueDate && (
                          <span>· Due {formatDate(task.dueDate)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Recent Project Activity Log */}
          <Card title="Recent Project Updates" padded={false}>
            {recentActivities.length === 0 ? (
              <div className="p-6">
                <p className="text-center text-sm text-marine-100/50">No live activities recorded yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {recentActivities.map((act, index) => (
                  <li key={act._id || index} className="p-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {act.reason || 'Progress updated'}
                      </span>
                      <span className="font-mono text-marine-100/40">
                        {timeAgo(act.createdAt)}
                      </span>
                    </div>
                    {act.previousProgress !== undefined && act.newProgress !== undefined && (
                      <div className="mt-1 flex items-center gap-1.5 font-mono text-marine-100/70">
                        <span>Progress:</span>
                        <span className="text-marine-100/40">{act.previousProgress}%</span>
                        <span>→</span>
                        <span className="font-bold text-signal-400">{act.newProgress}%</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Quick Overview Card */}
          <Card title="Workspace Overview">
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-marine-100/70">
                  <FolderKanban size={16} className="text-signal-400" /> Active projects
                </span>
                <span className="font-mono font-bold text-white">{totals.active}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-marine-100/70">
                  <ListChecks size={16} className="text-signal-400" /> Tasks in progress
                </span>
                <span className="font-mono font-bold text-white">{totals.pendingTasks}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-marine-100/70">
                  <MessageSquare size={16} className="text-signal-400" /> Open feedback threads
                </span>
                <span className="font-mono font-bold text-white">{totals.openFeedback}</span>
              </li>
            </ul>

            <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4">
              <Button as={Link} to="/portal/feedback" variant="outline" size="sm" className="w-full justify-center">
                Open Feedback Hub
              </Button>
            </div>
          </Card>

          {/* Recent Feedback & Comments */}
          <Card
            title="Feedback & Requests"
            action={
              <Button as={Link} to="/portal/feedback" variant="ghost" size="sm" icon={Plus}>
                New
              </Button>
            }
            padded={false}
          >
            {recentFeedback.length === 0 ? (
              <div className="p-6 text-center text-sm text-marine-100/50">
                <p>No feedback raised yet.</p>
                <Link to="/portal/feedback" className="mt-2 inline-block text-xs font-semibold text-signal-400 hover:underline">
                  Submit a request →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {recentFeedback.map((fb) => (
                  <li key={fb._id || fb.id}>
                    <Link to="/portal/feedback" className="block p-4 hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-white">{fb.subject}</p>
                        <StatusBadge status={fb.status} />
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-marine-100/60">{fb.message}</p>
                      <p className="mt-1 text-[11px] font-mono text-marine-100/40">{timeAgo(fb.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Recent Notifications */}
          <Card
            title="Notifications"
            action={
              <Button as={Link} to="/portal/notifications" variant="ghost" size="sm">
                View all
              </Button>
            }
            padded={false}
          >
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-marine-100/50">
                <p>You're all caught up! No new notifications.</p>
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {notifications.map((item) => (
                  <li key={item._id || item.id} className="p-4 hover:bg-white/[0.04] transition-colors">
                    <Link to={item.link || '/portal/notifications'} className="block">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      {item.body && <p className="mt-0.5 line-clamp-2 text-xs text-marine-100/70">{item.body}</p>}
                      <p className="mt-1 text-[11px] font-mono text-marine-100/40">{timeAgo(item.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
