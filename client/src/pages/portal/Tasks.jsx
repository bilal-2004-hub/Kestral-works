import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
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
import { Select } from '../../components/ui/Field.jsx';
import { formatDate, readableStatus } from '../../utils/format.js';
import { TASK_STATUS } from '../../utils/constants.js';

export default function PortalTasks() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, meta, loading, error, refetch } = useFetch(
    () => taskApi.list({ page, limit: 15, status: status || undefined }),
    [page, status]
  );

  const columns = [
    { key: 'title', header: 'Task', render: (t) => <span className="font-medium text-marine-900">{t.title}</span> },
    { key: 'project', header: 'Project', render: (t) => (
      <Link to={`/portal/projects/${t.project?._id}`} className="text-marine-700 hover:underline">{t.project?.name}</Link>
    ) },
    { key: 'dueDate', header: 'Due', render: (t) => formatDate(t.dueDate) },
    { key: 'priority', header: 'Priority', render: (t) => <StatusBadge status={t.priority} /> },
    { key: 'status', header: 'Status', render: (t) => <StatusBadge status={t.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Every task across your projects that we have made visible to you."
        action={
          <div className="w-48">
            <Select
              name="status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All statuses' }, ...TASK_STATUS.map((s) => ({ value: s, label: readableStatus(s) }))]}
            />
          </div>
        }
      />

      <Card padded={data?.length ? false : true}>
        {loading && <SkeletonRows count={6} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && (
          <Table
            columns={columns}
            rows={data || []}
            empty={<EmptyState icon={ListChecks} title="No tasks to show" description="Tasks appear here as soon as the team plans work on your projects." />}
          />
        )}
      </Card>
      <Pagination meta={meta} onChange={setPage} />
    </>
  );
}
