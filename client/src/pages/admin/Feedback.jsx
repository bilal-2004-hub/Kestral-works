import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send } from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { feedbackApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../../components/ui/Skeleton.jsx';
import { TextArea, Select } from '../../components/ui/Field.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime, timeAgo, readableStatus } from '../../utils/format.js';
import { FEEDBACK_STATUS } from '../../utils/constants.js';

export default function AdminFeedback() {
  const [status, setStatus] = useState('');
  const { data, loading, error, refetch } = useFetch(
    () => feedbackApi.list({ limit: 30, status: status || undefined }), [status]
  );
  const [openId, setOpenId] = useState(null);
  const [reply, setReply] = useState('');
  const sendReply = useAction(feedbackApi.reply);
  const setFeedbackStatus = useAction(feedbackApi.setStatus);
  const toast = useToast();

  const onReply = async (id) => {
    if (!reply.trim()) return;
    try {
      await sendReply.execute(id, reply);
      setReply('');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onStatus = async (id, next) => {
    try {
      await setFeedbackStatus.execute(id, next);
      toast.success(`Marked ${readableStatus(next).toLowerCase()}`);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader
        title="Client feedback"
        description="Change requests and questions raised from client workspaces."
        action={
          <div className="w-48">
            <Select name="status" value={status} onChange={(e) => setStatus(e.target.value)}
              options={[{ value: '', label: 'All statuses' }, ...FEEDBACK_STATUS.map((s) => ({ value: s, label: readableStatus(s) }))]} />
          </div>
        }
      />

      {loading && <Card><SkeletonRows count={5} /></Card>}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && data?.length === 0 && (
        <EmptyState icon={MessageSquare} title="No feedback right now" description="When a client raises something, it lands here." />
      )}

      <div className="space-y-4">
        {data?.map((item) => {
          const expanded = openId === item._id;
          return (
            <Card key={item._id} padded={false}>
              <button
                onClick={() => setOpenId(expanded ? null : item._id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
                aria-expanded={expanded}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white">{item.subject}</p>
                  <p className="mt-0.5 text-xs text-marine-100/60 font-mono">
                    {item.client?.name} · {item.project?.name} · {timeAgo(item.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.type === 'bug' ? 'urgent' : 'medium'} />
                  <StatusBadge status={item.status} />
                </div>
              </button>

              {expanded && (
                <div className="border-t border-white/10 px-5 py-4">
                  <p className="whitespace-pre-wrap text-sm text-marine-100/80">{item.message}</p>
                  <Link to={`/admin/projects/${item.project?._id || item.project?.id}`} className="mt-2 inline-block text-xs font-medium text-signal-400 hover:underline">
                    Open the project
                  </Link>

                  <ul className="mt-4 space-y-4 border-t border-white/10 pt-4">
                    {item.replies?.map((r, i) => (
                      <li key={i} className="flex gap-3">
                        <Avatar name={r.author?.name} src={r.author?.avatar} size={32} />
                        <div>
                          <p className="text-sm">
                            <span className="font-semibold text-white">{r.author?.name}</span>
                            <span className="ml-2 text-xs text-marine-100/40 font-mono">{formatDateTime(r.createdAt)}</span>
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-marine-100/80">{r.message}</p>
                        </div>
                      </li>
                    ))}
                    {!item.replies?.length && <li className="text-sm text-marine-100/50">No reply yet.</li>}
                  </ul>

                  <div className="mt-4 flex items-end gap-2">
                    <div className="flex-1">
                      <TextArea name="reply" rows={2} placeholder="Reply to the client"
                        value={reply} onChange={(e) => setReply(e.target.value)} />
                    </div>
                    <Button icon={Send} loading={sendReply.pending} onClick={() => onReply(item._id)}>Reply</Button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {FEEDBACK_STATUS.filter((s) => s !== item.status).map((s) => (
                      <Button key={s} size="sm" variant="outline" onClick={() => onStatus(item._id, s)}>
                        Mark {readableStatus(s).toLowerCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
