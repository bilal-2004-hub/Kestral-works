import { useState } from 'react';
import { Inbox, Trash2, Mail } from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { contactApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../../components/ui/Skeleton.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Select } from '../../components/ui/Field.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime } from '../../utils/format.js';

const STATUSES = ['new', 'read', 'replied', 'archived'];

export default function AdminMessages() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [openId, setOpenId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const toast = useToast();

  const { data, meta, loading, error, refetch } = useFetch(
    () => contactApi.list({ page, limit: 15, status: status || undefined }), [page, status]
  );
  const setMessageStatus = useAction(contactApi.setStatus);
  const removeMessage = useAction(contactApi.remove);

  const open = async (message) => {
    setOpenId(openId === message._id ? null : message._id);
    if (message.status === 'new') {
      try { await setMessageStatus.execute(message._id, 'read'); refetch(); } catch { /* non-critical */ }
    }
  };

  const onDelete = async () => {
    try {
      await removeMessage.execute(confirmId);
      setConfirmId(null);
      toast.success('Enquiry deleted');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Enquiries"
        description="Messages from the contact form on the website."
        action={
          <div className="w-44">
            <Select name="status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All enquiries' }, ...STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))]} />
          </div>
        }
      />

      {loading && <Card><SkeletonRows count={6} /></Card>}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && data?.length === 0 && (
        <EmptyState icon={Inbox} title="No enquiries here" description="New messages from the website contact form land in this list." />
      )}

      <div className="space-y-3">
        {data?.map((message) => (
          <Card key={message._id} padded={false}>
            <button onClick={() => open(message)} className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-mist-50">
              <div className="min-w-0">
                <p className="font-medium text-marine-900">{message.name}{message.company ? ` · ${message.company}` : ''}</p>
                <p className="mt-0.5 truncate text-xs text-mist-600">
                  {message.service || 'General enquiry'} · {formatDateTime(message.createdAt)}
                </p>
              </div>
              <StatusBadge status={message.status} />
            </button>

            {openId === message._id && (
              <div className="border-t border-mist-200 px-5 py-4">
                <p className="whitespace-pre-wrap text-sm text-mist-600">{message.message}</p>
                <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-mist-600">Email</dt><dd>{message.email}</dd></div>
                  <div><dt className="text-xs text-mist-600">Phone</dt><dd>{message.phone || '—'}</dd></div>
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button as="a" href={`mailto:${message.email}`} size="sm" icon={Mail}>Reply by email</Button>
                  <Button size="sm" variant="outline" onClick={() => setMessageStatus.execute(message._id, 'replied').then(refetch)}>Mark replied</Button>
                  <Button size="sm" variant="ghost" onClick={() => setMessageStatus.execute(message._id, 'archived').then(refetch)}>Archive</Button>
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setConfirmId(message._id)}>Delete</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Pagination meta={meta} onChange={setPage} />

      <ConfirmDialog
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        onConfirm={onDelete}
        pending={removeMessage.pending}
        title="Delete this enquiry?"
        description="The message is removed permanently. Archiving keeps it out of the way instead."
        confirmLabel="Delete enquiry"
      />
    </>
  );
}
