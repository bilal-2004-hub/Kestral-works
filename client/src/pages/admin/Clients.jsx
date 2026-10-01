import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Users } from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { clientApi } from '../../services/endpoints.js';
import useDebounce from '../../hooks/useDebounce.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../../components/ui/Skeleton.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Input } from '../../components/ui/Field.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/format.js';

export default function AdminClients() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const toast = useToast();

  const { data, meta, loading, error, refetch } = useFetch(
    () => clientApi.list({ page, limit: 12, search: debounced || undefined }),
    [page, debounced]
  );
  const createClient = useAction(clientApi.create);
  const toggleActive = useAction(clientApi.setActive);

  const onCreate = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createClient.execute(Object.fromEntries(form));
      setCreateOpen(false);
      toast.success('Client created');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onToggle = async () => {
    try {
      await toggleActive.execute(confirm.client._id, !confirm.client.isActive);
      toast.success(confirm.client.isActive ? 'Client deactivated' : 'Client reactivated');
      setConfirm(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: 'name', header: 'Client', render: (c) => (
      <span className="flex items-center gap-2">
        <Avatar name={c.name} src={c.avatar} size={30} />
        <span>
          <Link to={`/admin/clients`} className="font-semibold text-white hover:text-signal-400">{c.name}</Link>
          <span className="block text-xs text-marine-100/60 font-mono">{c.email}</span>
        </span>
      </span>
    ) },
    { key: 'company', header: 'Company', render: (c) => c.company || '—' },
    { key: 'createdAt', header: 'Joined', render: (c) => formatDate(c.createdAt) },
    { key: 'isActive', header: 'Status', render: (c) => (
      <span className={c.isActive ? 'text-state-ok' : 'text-mist-600'}>{c.isActive ? 'Active' : 'Deactivated'}</span>
    ) },
    { key: 'actions', header: '', render: (c) => (
      <Button size="sm" variant="ghost" onClick={() => setConfirm({ client: c })}>
        {c.isActive ? 'Deactivate' : 'Reactivate'}
      </Button>
    ) },
  ];

  return (
    <>
      <PageHeader
        title="Clients"
        description="Everyone with access to a workspace."
        action={<Button icon={UserPlus} onClick={() => setCreateOpen(true)}>Add client</Button>}
      />

      <div className="mb-4 max-w-sm">
        <Input name="search" placeholder="Search by name, email or company"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <Card padded={data?.length ? false : true}>
        {loading && <SkeletonRows count={6} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && (
          <Table
            columns={columns}
            rows={data || []}
            empty={<EmptyState icon={Users} title="No clients match" description="Try a different search, or add a client to get started." />}
          />
        )}
      </Card>
      <Pagination meta={meta} onChange={setPage} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add a client">
        <form onSubmit={onCreate} className="space-y-4">
          <Input name="name" label="Full name" required error={createClient.fieldErrors.name} />
          <Input name="email" type="email" label="Email" required error={createClient.fieldErrors.email} />
          <Input name="company" label="Company" error={createClient.fieldErrors.company} />
          <Input name="phone" label="Phone" />
          <Input name="password" type="password" label="Temporary password" required
            hint="Share it securely; they can change it from their profile."
            error={createClient.fieldErrors.password} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createClient.pending}>Create client</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={onToggle}
        pending={toggleActive.pending}
        title={confirm?.client.isActive ? 'Deactivate this client?' : 'Reactivate this client?'}
        description={confirm?.client.isActive
          ? 'They lose access to their workspace immediately. Their projects and history stay intact.'
          : 'They will be able to sign in again straight away.'}
        confirmLabel={confirm?.client.isActive ? 'Deactivate' : 'Reactivate'}
        tone={confirm?.client.isActive ? 'danger' : 'primary'}
      />
    </>
  );
}
