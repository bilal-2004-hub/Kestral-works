import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { notificationApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../../components/ui/Skeleton.jsx';
import { timeAgo } from '../../utils/format.js';

export default function Notifications() {
  const { data, loading, error, refetch, meta } = useFetch(() => notificationApi.list({ limit: 40 }), []);
  const markAll = useAction(notificationApi.markAllRead);

  const onMarkAll = async () => { await markAll.execute(); refetch(); };

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Everything that happened on your projects, newest first."
        action={meta?.unread > 0 && <Button variant="outline" icon={Check} loading={markAll.pending} onClick={onMarkAll}>Mark all read</Button>}
      />

      {loading && <Card><SkeletonRows count={6} /></Card>}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && data?.length === 0 && (
        <EmptyState title="Nothing here yet" description="Updates on projects, tasks and feedback will show up here." />
      )}

      {data?.length > 0 && (
        <Card padded={false}>
          <ul className="divide-y divide-mist-100">
            {data.map((item) => (
              <li key={item._id} className={item.isRead ? '' : 'bg-signal-100/40'}>
                <Link
                  to={item.link || '#'}
                  onClick={() => !item.isRead && notificationApi.markRead(item._id)}
                  className="block px-5 py-4 hover:bg-mist-50"
                >
                  <p className="text-sm font-medium text-marine-900">{item.title}</p>
                  {item.body && <p className="mt-0.5 text-sm text-mist-600">{item.body}</p>}
                  <p className="mt-1 text-xs text-mist-400">{timeAgo(item.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
