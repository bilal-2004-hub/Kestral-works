import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ListChecks, Search, Calendar, FolderKanban, CheckCircle2,
  Clock, ArrowRight, Eye, AlertCircle, Sparkles
} from 'lucide-react';
import { useFetch } from '../../hooks/useApi.js';
import { taskApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../../components/ui/Skeleton.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import { formatDate, formatDateTime, readableStatus } from '../../utils/format.js';

const STATUS_TABS = [
  { value: '', label: 'All Tasks' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'In Review' },
  { value: 'completed', label: 'Completed' },
];

export default function PortalTasks() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const { data, meta, loading, error, refetch } = useFetch(
    () => taskApi.list({ page, limit: 15, status: status || undefined }),
    [page, status]
  );

  const filteredTasks = useMemo(() => {
    if (!data) return [];
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (t) =>
        t.title?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.project?.name?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const columns = [
    {
      key: 'title',
      header: 'Task Name',
      render: (t) => (
        <div className="max-w-md">
          <p className={`font-semibold ${t.status === 'completed' ? 'text-marine-100/50 line-through' : 'text-white'}`}>
            {t.title}
          </p>
          {t.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-marine-100/60">{t.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'project',
      header: 'Project',
      render: (t) => (
        <Link
          to={`/portal/projects/${t.project?._id || t.project?.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-signal-400 hover:underline"
        >
          <FolderKanban size={13} /> {t.project?.name || 'Project'}
        </Link>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => <StatusBadge status={t.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <StatusBadge status={t.status} />,
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (t) => (
        <span className="text-xs font-mono text-marine-100/70">
          {t.dueDate ? formatDate(t.dueDate) : 'No due date'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (t) => (
        <button
          onClick={() => setSelectedTask(t)}
          className="rounded-lg p-1.5 text-marine-100/60 hover:bg-white/10 hover:text-white transition-colors"
          title="View task details"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks & Deliverables"
        description="Every deliverable across your active projects, including timeline deadlines and status tracking."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-marine-900/60 p-4 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatus(tab.value);
                setPage(1);
              }}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                status === tab.value
                  ? 'bg-signal-500 text-marine-950 shadow-md font-bold'
                  : 'text-marine-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-marine-100/40" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-marine-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder:text-marine-100/30 focus:border-signal-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-marine-100/40 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Tasks Table / Card */}
      <Card padded={false}>
        {loading && (
          <div className="p-6">
            <SkeletonRows count={6} />
          </div>
        )}

        {error && !loading && (
          <div className="p-6">
            <ErrorState message={error} onRetry={refetch} />
          </div>
        )}

        {!loading && !error && (
          <Table
            columns={columns}
            rows={filteredTasks}
            onRowClick={(row) => setSelectedTask(row)}
            empty={
              <div className="p-8">
                <EmptyState
                  icon={ListChecks}
                  title={searchTerm ? 'No matching tasks' : 'No tasks to show'}
                  description={
                    searchTerm
                      ? `No deliverables found matching "${searchTerm}".`
                      : status
                      ? `No tasks currently marked as "${readableStatus(status)}".`
                      : 'Deliverables and roadmap items will appear here once the studio team creates tasks.'
                  }
                  action={
                    searchTerm || status ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setStatus('');
                        }}
                      >
                        Reset filters
                      </Button>
                    ) : null
                  }
                />
              </div>
            }
          />
        )}
      </Card>

      <Pagination meta={meta} onChange={setPage} />

      {/* Task Details Modal */}
      {selectedTask && (
        <Modal
          open={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title={selectedTask.title}
          footer={
            <div className="flex justify-between items-center w-full">
              <Link
                to={`/portal/projects/${selectedTask.project?._id || selectedTask.project?.id}`}
                className="text-xs font-semibold text-signal-400 hover:underline flex items-center gap-1"
              >
                Go to project workspace <ArrowRight size={13} />
              </Link>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTask(null)}>
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Status & Priority Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selectedTask.status} />
              <StatusBadge status={selectedTask.priority} />
              {selectedTask.weight && selectedTask.weight > 1 && (
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-mono text-signal-400">
                  Weight: {selectedTask.weight}x
                </span>
              )}
            </div>

            {/* Task Description */}
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-marine-100/50">Details</span>
              <p className="mt-1 whitespace-pre-wrap text-sm text-marine-100/80 leading-relaxed">
                {selectedTask.description || 'No detailed instructions recorded for this deliverable.'}
              </p>
            </div>

            {/* Project & Timeline Meta */}
            <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs font-mono sm:grid-cols-2">
              <div>
                <span className="text-marine-100/50">Project:</span>
                <p className="mt-0.5 font-semibold text-white">
                  {selectedTask.project?.name || 'Assigned Project'}
                </p>
              </div>
              <div>
                <span className="text-marine-100/50">Due Date:</span>
                <p className="mt-0.5 font-semibold text-white">
                  {selectedTask.dueDate ? formatDate(selectedTask.dueDate) : 'No deadline'}
                </p>
              </div>
              <div>
                <span className="text-marine-100/50">Created Date:</span>
                <p className="mt-0.5 text-marine-100/70">
                  {selectedTask.createdAt ? formatDateTime(selectedTask.createdAt) : 'N/A'}
                </p>
              </div>
              {selectedTask.completedAt && (
                <div>
                  <span className="text-emerald-400">Completed On:</span>
                  <p className="mt-0.5 text-emerald-300">
                    {formatDateTime(selectedTask.completedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
