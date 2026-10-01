import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban } from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { projectApi, clientApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../../components/ui/Skeleton.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Select } from '../../components/ui/Field.jsx';
import ProjectForm from './ProjectForm.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, readableStatus } from '../../utils/format.js';
import { PROJECT_STATUS } from '../../utils/constants.js';

export default function AdminProjects() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const { data, meta, loading, error, refetch } = useFetch(
    () => projectApi.list({ page, limit: 12, status: status || undefined }),
    [page, status]
  );
  const clients = useFetch(() => clientApi.list({ limit: 100 }), []);
  const createProject = useAction(projectApi.create);

  const onCreate = async (payload) => {
    try {
      const res = await createProject.execute(payload);
      setFormOpen(false);
      toast.success('Project created');
      navigate(`/admin/projects/${res.data._id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'name', header: 'Project', render: (p) => <span className="font-semibold text-white">{p.name}</span> },
    { key: 'client', header: 'Client', render: (p) => p.client?.company || p.client?.name || '—' },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    { key: 'progress', header: 'Progress', render: (p) => <div className="w-32"><ProgressBar value={p.progress} label="" /></div> },
    { key: 'dueDate', header: 'Due', render: (p) => formatDate(p.dueDate) },
  ];

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every project in the studio, across all clients."
        action={<Button icon={Plus} onClick={() => setFormOpen(true)}>New project</Button>}
      />

      <div className="mb-4 w-52">
        <Select
          name="status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          options={[{ value: '', label: 'All statuses' }, ...PROJECT_STATUS.map((s) => ({ value: s, label: readableStatus(s) }))]}
        />
      </div>

      <Card padded={data?.length ? false : true}>
        {loading && <SkeletonRows count={6} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && (
          <Table
            columns={columns}
            rows={data || []}
            onRowClick={(p) => navigate(`/admin/projects/${p._id}`)}
            empty={<EmptyState icon={FolderKanban} title="No projects yet" description="Create the first project and assign it to a client." action={<Button className="mt-2" onClick={() => setFormOpen(true)}>New project</Button>} />}
          />
        )}
      </Card>
      <Pagination meta={meta} onChange={setPage} />

      {formOpen && (
        <ProjectForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSubmit={onCreate}
          clients={clients.data || []}
          pending={createProject.pending}
          fieldErrors={createProject.fieldErrors}
        />
      )}
    </>
  );
}
