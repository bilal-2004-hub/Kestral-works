import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { notificationApi } from '../../services/endpoints.js';
import { timeAgo } from '../../utils/format.js';

export default function NotificationBell({ basePath }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = async () => {
    try {
      const res = await notificationApi.list({ limit: 8 });
      setItems(res.data);
      setUnread(res.meta?.unread ?? 0);
    } catch { /* silent */ }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAll = async () => {
    await notificationApi.markAllRead();
    setUnread(0);
    setItems((all) => all.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-xl p-2.5 text-marine-100/80 hover:bg-white/10 hover:text-white transition-colors"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
      >
        <Bell size={19} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-signal-500 px-1 text-[10px] font-bold text-marine-950">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[min(90vw,22rem)] overflow-hidden rounded-2xl border border-white/15 bg-marine-900 shadow-2xl backdrop-blur-2xl text-white">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-marine-950/40">
            <p className="text-sm font-bold">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="inline-flex items-center gap-1 text-xs text-signal-400 hover:underline">
                <Check size={13} /> Mark all read
              </button>
            )}
          </header>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-marine-100/60">Nothing yet. Updates on your projects land here.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-white/5 overflow-y-auto">
              {items.map((item) => (
                <li key={item._id} className={item.isRead ? '' : 'bg-white/[0.04]'}>
                  <Link
                    to={item.link || `${basePath}/notifications`}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 hover:bg-white/[0.06] transition-colors"
                  >
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    {item.body && <p className="mt-0.5 line-clamp-2 text-xs text-marine-100/70">{item.body}</p>}
                    <p className="mt-1 text-[11px] font-mono text-marine-100/40">{timeAgo(item.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link to={`${basePath}/notifications`} onClick={() => setOpen(false)}
            className="block border-t border-white/10 px-4 py-3 text-center text-xs font-mono font-bold uppercase tracking-wider text-signal-400 hover:bg-white/[0.04] transition-colors">
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
