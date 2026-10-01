import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Check, CheckCheck, FolderKanban, MessageSquare, ListChecks,
  Clock, Sparkles, Filter, AlertCircle
} from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { notificationApi } from '../../services/endpoints.js';
import { useSocket } from '../../context/SocketContext.jsx';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../../components/ui/Skeleton.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime, timeAgo } from '../../utils/format.js';

export default function Notifications() {
  const toast = useToast();
  const { socket } = useSocket();
  const [filterUnread, setFilterUnread] = useState(false);

  const { data, loading, error, refetch, meta } = useFetch(
    () => notificationApi.list({ limit: 50 }),
    []
  );

  const markAllAction = useAction(notificationApi.markAllRead);

  // Real-time socket listener for incoming notifications
  useEffect(() => {
    if (!socket) return;
    const onNewNotif = (notif) => {
      refetch();
      toast.info(`New notification: ${notif.title || 'Update received'}`);
    };
    socket.on('notification:new', onNewNotif);
    return () => socket.off('notification:new', onNewNotif);
  }, [socket, refetch, toast]);

  const onMarkAll = async () => {
    try {
      await markAllAction.execute();
      toast.success('All notifications marked as read');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to mark all as read');
    }
  };

  const onMarkSingle = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await notificationApi.markRead(id);
      refetch();
    } catch { /* silent */ }
  };

  const filteredItems = useMemo(() => {
    if (!data) return [];
    if (!filterUnread) return data;
    return data.filter((n) => !n.isRead);
  }, [data, filterUnread]);

  const unreadCount = meta?.unread ?? (data?.filter((n) => !n.isRead).length || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Real-time updates regarding your project milestones, deliverables, comments, and feedback responses."
        action={
          unreadCount > 0 && (
            <Button
              variant="outline"
              icon={CheckCheck}
              loading={markAllAction.pending}
              onClick={onMarkAll}
            >
              Mark all as read
            </Button>
          )
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterUnread(false)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              !filterUnread
                ? 'bg-signal-500 text-marine-950 font-bold'
                : 'text-marine-100/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            All Updates ({data?.length || 0})
          </button>
          <button
            onClick={() => setFilterUnread(true)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filterUnread
                ? 'bg-signal-500 text-marine-950 font-bold'
                : 'text-marine-100/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${filterUnread ? 'bg-marine-950 text-signal-400' : 'bg-signal-500 text-marine-950'}`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {unreadCount > 0 && (
          <span className="text-xs font-mono text-signal-400">
            {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
          </span>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <SkeletonRows count={6} />
        </Card>
      )}

      {/* Error State */}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {/* Empty State */}
      {!loading && !error && filteredItems.length === 0 && (
        <EmptyState
          icon={Bell}
          title={filterUnread ? 'No unread notifications' : 'No notifications yet'}
          description={
            filterUnread
              ? 'You are all caught up! You have no pending unread notifications.'
              : 'Updates on your projects, feedback replies, and milestone status changes will appear here.'
          }
          action={
            filterUnread ? (
              <Button variant="outline" size="sm" onClick={() => setFilterUnread(false)}>
                View all updates
              </Button>
            ) : null
          }
        />
      )}

      {/* Notifications Feed */}
      {!loading && !error && filteredItems.length > 0 && (
        <Card padded={false}>
          <ul className="divide-y divide-white/10">
            {filteredItems.map((item) => {
              const isUnread = !item.isRead;
              return (
                <li
                  key={item._id || item.id}
                  className={`transition-colors ${
                    isUnread ? 'bg-signal-500/[0.06] hover:bg-signal-500/[0.09]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <Link
                    to={item.link || '#'}
                    onClick={() => {
                      if (isUnread) notificationApi.markRead(item._id || item.id);
                    }}
                    className="flex flex-wrap items-start justify-between gap-4 p-5"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Unread indicator dot */}
                      <div className="pt-1 shrink-0">
                        {isUnread ? (
                          <span className="block h-2.5 w-2.5 rounded-full bg-signal-400 animate-pulse shadow-sm" />
                        ) : (
                          <span className="block h-2.5 w-2.5 rounded-full bg-white/20" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold ${isUnread ? 'text-white' : 'text-marine-100/90'}`}>
                          {item.title}
                        </p>
                        {item.body && (
                          <p className="mt-1 text-xs text-marine-100/70 leading-relaxed">
                            {item.body}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-mono text-marine-100/40">
                          <span>{timeAgo(item.createdAt)}</span>
                          <span>·</span>
                          <span>{formatDateTime(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {isUnread && (
                      <button
                        onClick={(e) => onMarkSingle(e, item._id || item.id)}
                        className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-marine-100/60 hover:bg-signal-500 hover:text-marine-950 transition-colors"
                        title="Mark as read"
                      >
                        Mark read
                      </button>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
