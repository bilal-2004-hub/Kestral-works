import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban } from 'lucide-react';
import { useFetch } from '../../hooks/useApi.js';
import { projectApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonCards } from '../../components/ui/Skeleton.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { formatDate } from '../../utils/format.js';
import { PROJECT_STATUS } from '../../utils/constants.js';
import { readableStatus } from '../../utils/format.js';

export default function PortalProjects() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, meta, loading, error, refetch } = useFetch(
    () => projectApi.list({ page, limit: 9, status: status || undefined }),
    [page, status]
  );

  return (
    <>
      <PageHeader
        title="My projects"
        description="Everything we are building for you, with the current state of each."
        action={
          <div className="w-52">
            <Select
              name="status" value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All statuses' }, ...PROJECT_STATUS.map((s) => ({ value: s, label: readableStatus(s) }))]}
            />
          </div>
        }
      />

      {loading && <SkeletonCards count={6} />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && data?.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No projects have been assigned to you yet"
          description="When a project is set up for your account it shows up here, with progress, tasks and files."
        />
      )}

      {!loading && !error && data?.length > 0 && (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((project) => (
              <li key={project._id}>
                <Link to={`/portal/projects/${project._id}`} className="flex h-full flex-col rounded-xl2 border border-mist-200 bg-white p-5 transition-colors hover:border-marine-300">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-marine-900">{project.name}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-mist-600">{project.description}</p>
                  <p className="mt-3 text-xs text-mist-600">
                    {project.dueDate ? `Due ${formatDate(project.dueDate)}` : 'No due date set'}
                  </p>
                  <div className="mt-3"><ProgressBar value={project.progress} /></div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination meta={meta} onChange={setPage} />
        </>
      )}
    </>
  );
}
