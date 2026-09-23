import { Link } from 'react-router-dom';
import { Users, FolderKanban, MessageSquare, Star, Inbox } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useFetch } from '../../hooks/useApi.js';
import { dashboardApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Card from '../../components/ui/Card.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonCards } from '../../components/ui/Skeleton.jsx';
import { readableStatus, timeAgo } from '../../utils/format.js';

export default function AdminDashboard() {
  const { data, loading, error, refetch } = useFetch(() => dashboardApi.admin(), []);

  if (loading) return <><PageHeader title="Overview" /><SkeletonCards count={4} /></>;
  if (error) return <><PageHeader title="Overview" /><ErrorState message={error} onRetry={refetch} /></>;

  const { totals, projectsByStatus, recentProjects, projectsPerMonth } = data;
  const statusData = Object.entries(projectsByStatus).map(([status, count]) => ({
    name: readableStatus(status), count,
  }));

  return (
    <>
      <PageHeader title="Overview" description="The state of the studio today." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clients" value={totals.clients} hint={`${totals.activeClients} active`} icon={Users} tone="marine" />
        <StatCard label="Projects" value={totals.projects} hint={`${totals.activeProjects} in flight`} icon={FolderKanban} />
        <StatCard label="Open feedback" value={totals.openFeedback} icon={MessageSquare} tone={totals.openFeedback ? 'accent' : 'default'} />
        <StatCard label="Reviews to moderate" value={totals.pendingReviews} icon={Star} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Projects by status">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DFE6E4" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={54} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#EEF2F1' }} />
                <Bar dataKey="count" fill="#0F5261" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="New projects per month">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectsPerMonth} margin={{ left: -20, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DFE6E4" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#EEF2F1' }} />
                <Bar dataKey="count" fill="#EBB61F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card title="Recently updated projects" padded={false}>
          <ul className="divide-y divide-mist-100">
            {recentProjects.map((project) => (
              <li key={project._id}>
                <Link to={`/admin/projects/${project._id}`} className="block px-5 py-4 hover:bg-mist-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-marine-900">{project.name}</p>
                      <p className="mt-0.5 text-xs text-mist-600">
                        {project.client?.company || project.client?.name} · updated {timeAgo(project.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="mt-3"><ProgressBar value={project.progress} /></div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Needs attention">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <Link to="/admin/feedback" className="flex items-center gap-2 text-mist-600 hover:text-marine-900">
                <MessageSquare size={16} /> Feedback threads open
              </Link>
              <span className="font-medium">{totals.openFeedback}</span>
            </li>
            <li className="flex items-center justify-between">
              <Link to="/admin/reviews" className="flex items-center gap-2 text-mist-600 hover:text-marine-900">
                <Star size={16} /> Reviews awaiting moderation
              </Link>
              <span className="font-medium">{totals.pendingReviews}</span>
            </li>
            <li className="flex items-center justify-between">
              <Link to="/admin/messages" className="flex items-center gap-2 text-mist-600 hover:text-marine-900">
                <Inbox size={16} /> Unread enquiries
              </Link>
              <span className="font-medium">{totals.newMessages}</span>
            </li>
          </ul>
        </Card>
      </div>
    </>
  );
}
