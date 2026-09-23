import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Activity, CheckCircle2, ListChecks, Eye, MessageSquare } from 'lucide-react';
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
import { SkeletonCards, SkeletonRows } from '../../components/ui/Skeleton.jsx';
import Button from '../../components/ui/Button.jsx';
import { formatDate, timeAgo } from '../../utils/format.js';

export default function PortalDashboard() {
  const { data, loading, error, refetch } = useFetch(() => dashboardApi.client(), []);
  const { socket } = useSocket();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    if (data?.recentProjects) {
      setProjects(data.recentProjects);
    }
  }, [data]);

  // Listen to any progress updates
  useEffect(() => {
    if (!socket) return;
    const onProgress = (evt) => {
      setProjects((prev) =>
        prev.map((p) =>
          p._id === evt.projectId ? { ...p, progress: evt.progress, status: evt.status || p.status } : p
        )
      );
    };
    socket.on('project:progressUpdated', onProgress);
    return () => socket.off('project:progressUpdated', onProgress);
  }, [socket]);

  if (loading) return <><PageHeader title="Dashboard" /><SkeletonCards count={4} /></>;
  if (error) return <><PageHeader title="Dashboard" /><ErrorState message={error} onRetry={refetch} /></>;

  const { totals, notifications } = data;
  const recentProjects = projects.length ? projects : data.recentProjects;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="Dashboard" description="Where each of your projects stands today." />
        <ConnectionStatus />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projects" value={totals.projects} icon={FolderKanban} tone="marine" />
        <StatCard label="Active" value={totals.active} icon={Activity} />
        <StatCard label="Completed" value={totals.completed} icon={CheckCircle2} />
        <StatCard label="Waiting on you" value={totals.tasksAwaitingReview} hint="Tasks needing your review" icon={Eye} tone="accent" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Your projects" action={<Button as={Link} to="/portal/projects" variant="ghost" size="sm">See all</Button>} padded={false}>
          {recentProjects.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Once a project is set up for your account, it appears here with live progress."
              />
            </div>
          ) : (
            <ul className="divide-y divide-mist-100">
              {recentProjects.map((project) => (
                <li key={project._id}>
                  <Link to={`/portal/projects/${project._id}`} className="block px-5 py-4 hover:bg-mist-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-marine-900">{project.name}</p>
                        <p className="mt-0.5 text-xs text-mist-600">
                          {project.dueDate ? `Due ${formatDate(project.dueDate)}` : 'No due date set'} · updated {timeAgo(project.updatedAt)}
                        </p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="mt-3"><ProgressBar value={project.progress} /></div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Open items">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-mist-600"><ListChecks size={16} /> Tasks in progress</span>
                <span className="font-medium">{totals.pendingTasks}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-mist-600"><MessageSquare size={16} /> Feedback threads open</span>
                <span className="font-medium">{totals.openFeedback}</span>
              </li>
            </ul>
            <Button as={Link} to="/portal/feedback" variant="outline" size="sm" className="mt-4 w-full">Open feedback</Button>
          </Card>

          <Card title="Recent activity" padded={false}>
            {notifications.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-mist-600">Nothing has happened yet.</p>
            ) : (
              <ul className="divide-y divide-mist-100">
                {notifications.map((item) => (
                  <li key={item._id} className="px-5 py-3">
                    <p className="text-sm text-marine-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-mist-400">{timeAgo(item.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
