import { useState } from 'react';
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
import { TextArea } from '../../components/ui/Field.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime, timeAgo } from '../../utils/format.js';

export default function PortalFeedback() {
  const { data, loading, error, refetch } = useFetch(() => feedbackApi.list({ limit: 30 }), []);
  const [openId, setOpenId] = useState(null);
  const [reply, setReply] = useState('');
  const { execute, pending } = useAction(feedbackApi.reply);
  const toast = useToast();

  const onReply = async (id) => {
    if (!reply.trim()) return;
    try {
      await execute(id, reply);
      setReply('');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Feedback" description="Change requests and questions you have raised, and what the team said back." />

      {loading && <Card><SkeletonRows count={5} /></Card>}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && data?.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="You have not sent any feedback yet"
          description="Open a project and use “Give feedback” to raise a change request the team can act on."
        />
      )}

      <div className="space-y-4">
        {data?.map((item) => {
          const expanded = openId === item._id;
          return (
            <Card key={item._id} padded={false}>
              <button
                onClick={() => setOpenId(expanded ? null : item._id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-mist-50"
                aria-expanded={expanded}
              >
                <div className="min-w-0">
                  <p className="font-medium text-marine-900">{item.subject}</p>
                  <p className="mt-0.5 text-xs text-mist-600">
                    {item.project?.name} · raised {timeAgo(item.createdAt)} · {item.replies?.length || 0} replies
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </button>

              {expanded && (
                <div className="border-t border-mist-200 px-5 py-4">
                  <p className="whitespace-pre-wrap text-sm text-mist-600">{item.message}</p>

                  <ul className="mt-4 space-y-4 border-t border-mist-100 pt-4">
                    {item.replies?.map((r, i) => (
                      <li key={i} className="flex gap-3">
                        <Avatar name={r.author?.name} src={r.author?.avatar} size={32} />
                        <div>
                          <p className="text-sm">
                            <span className="font-medium text-marine-900">{r.author?.name}</span>
                            <span className="ml-2 text-xs text-mist-400">{formatDateTime(r.createdAt)}</span>
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-mist-600">{r.message}</p>
                        </div>
                      </li>
                    ))}
                    {!item.replies?.length && <li className="text-sm text-mist-600">No reply yet.</li>}
                  </ul>

                  {item.status !== 'resolved' && (
                    <div className="mt-4 flex items-end gap-2">
                      <div className="flex-1">
                        <TextArea name="reply" rows={2} placeholder="Add to this thread"
                          value={reply} onChange={(e) => setReply(e.target.value)} />
                      </div>
                      <Button icon={Send} loading={pending} onClick={() => onReply(item._id)}>Reply</Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
