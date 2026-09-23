import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { taskApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../../components/ui/Skeleton.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, readableStatus } from '../../utils/format.js';
import { TASK_STATUS, TASK_PRIORITY } from '../../utils/constants.js';

export default function AdminTasks() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const toast = useToast();

  const { data, meta, loading, error, refetch } = useFetch(
    () => taskApi.list({ page, limit: 20, status: status || undefined, priority: priority || undefined }),
    [page, status, priority]
  );
  const updateTask = useAction(taskApi.update);

  const onStatusChange = async (task, nextStatus) => {
    try {
      await updateTask.execute(task._id, { status: nextStatus });
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'title', header: 'Task', render: (t) => <span className="font-medium text-marine-900">{t.title}</span> },
    { key: 'project', header: 'Project', render: (t) => (
      <Link to={`/admin/projects/${t.project?._id}`} className="text-marine-700 hover:underline">{t.project?.name}</Link>
    ) },
    { key: 'assignee', header: 'Assigned to', render: (t) => t.assignee?.name || 'Unassigned' },
    { key: 'dueDate', header: 'Due', render: (t) => formatDate(t.dueDate) },
    { key: 'priority', header: 'Priority', render: (t) => <StatusBadge status={t.priority} /> },
    { key: 'status', header: 'Status', render: (t) => (
      <select
        value={t.status}
        onChange={(e) => onStatusChange(t, e.target.value)}
        className="rounded-lg border border-mist-200 bg-white px-2 py-1.5 text-xs"
        aria-label={`Status for ${t.title}`}
      >
        {TASK_STATUS.map((s) => <option key={s} value={s}>{readableStatus(s)}</option>)}
      </select>
    ) },
  ];

  return (
    <>
      <PageHeader title="Tasks" description="Work in progress across every project." />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-48">
          <Select name="status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={[{ value: '', label: 'All statuses' }, ...TASK_STATUS.map((s) => ({ value: s, label: readableStatus(s) }))]} />
        </div>
        <div className="w-44">
          <Select name="priority" value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            options={[{ value: '', label: 'All priorities' }, ...TASK_PRIORITY.map((p) => ({ value: p, label: readableStatus(p) }))]} />
        </div>
      </div>

      <Card padded={data?.length ? false : true}>
        {loading && <SkeletonRows count={8} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && (
          <Table
            columns={columns}
            rows={data || []}
            empty={<EmptyState icon={ListChecks} title="No tasks match these filters" description="Clear the filters, or add tasks from a project page." />}
          />
        )}
      </Card>
      <Pagination meta={meta} onChange={setPage} />
    </>
  );
}
