import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Search, Filter, Calendar, User, Mail, Phone,
  Building, CheckCircle2, Clock, Zap, ArrowRight, Eye, RefreshCw
} from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { projectRequestApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Table from '../../components/ui/Table.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../../components/ui/Skeleton.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, timeAgo } from '../../utils/format.js';

export default function AdminProjectRequests() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [serviceField, setServiceField] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const toast = useToast();

  const { data, meta, loading, error, refetch } = useFetch(
    () => projectRequestApi.adminList({
      page,
      limit: 15,
      status: status || undefined,
      serviceField: serviceField || undefined,
    }),
    [page, status, serviceField]
  );

  const columns = [
    {
      key: 'projectTitle',
      header: 'Project Title',
      render: (r) => (
        <div>
          <button
            onClick={() => setSelectedRequest(r)}
            className="font-semibold text-white hover:text-signal-300 text-left transition-colors"
          >
            {r.projectTitle}
          </button>
          <div className="text-[11px] font-mono text-marine-100/50 mt-0.5">
            {timeAgo(r.createdAt)}
          </div>
        </div>
      ),
    },
    {
      key: 'serviceField',
      header: 'Service / Field',
      render: (r) => (
        <span className="rounded-lg bg-signal-500/15 border border-signal-500/30 px-2.5 py-1 text-[11px] font-mono font-bold text-signal-400">
          {r.serviceField}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (r) => (
        <div className="text-xs">
          <div className="font-medium text-white">{r.customerName}</div>
          <div className="text-marine-100/60">{r.customerEmail}</div>
          {r.companyName && <div className="text-[11px] text-marine-100/40">{r.companyName}</div>}
        </div>
      ),
    },
    {
      key: 'budget',
      header: 'Budget / Deadline',
      render: (r) => (
        <div className="text-xs font-mono">
          <div className="text-emerald-300 font-bold">{r.budget || '—'}</div>
          <div className="text-marine-100/50">{r.deadline ? formatDate(r.deadline) : 'Open'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono font-bold ${
          r.status === 'available'
            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
            : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${r.status === 'available' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
          {r.status === 'available' ? 'Available' : 'Claimed'}
        </span>
      ),
    },
    {
      key: 'claimedBy',
      header: 'Claimed By',
      render: (r) => (
        r.claimedByUser ? (
          <div className="text-xs">
            <span className="font-semibold text-signal-400">{r.claimedByUser.name}</span>
            <div className="text-marine-100/50 text-[11px]">{r.claimedByUser.email}</div>
          </div>
        ) : (
          <span className="text-xs text-marine-100/40 italic">Unclaimed</span>
        )
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          {r.projectId && (
            <Link
              to={`/admin/projects/${r.projectId}`}
              className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-white hover:bg-white/20 transition-colors font-mono"
            >
              View Project →
            </Link>
          )}
          <button
            onClick={() => setSelectedRequest(r)}
            className="rounded-lg border border-white/10 p-1.5 text-marine-100/70 hover:bg-white/10 hover:text-white transition-colors"
            title="View Details"
          >
            <Eye size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Incoming Project Requests"
        description="Public project submissions matched with registered clients based on expertise."
        action={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={() => refetch()}>
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-marine-900/60 p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setStatus(''); setPage(1); }}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              status === '' ? 'bg-signal-500 text-marine-950 font-bold' : 'text-marine-100/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            All ({meta?.total || 0})
          </button>
          <button
            onClick={() => { setStatus('available'); setPage(1); }}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              status === 'available' ? 'bg-signal-500 text-marine-950 font-bold' : 'text-marine-100/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            Available / Unclaimed
          </button>
          <button
            onClick={() => { setStatus('claimed'); setPage(1); }}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              status === 'claimed' ? 'bg-signal-500 text-marine-950 font-bold' : 'text-marine-100/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            Claimed & Active
          </button>
        </div>
      </div>

      {/* Table / Content */}
      <Card>
        {loading && <SkeletonRows rows={6} cols={6} />}
        {error && !loading && <ErrorState message={error} onRetry={refetch} />}
        {!loading && !error && (!data || data.length === 0) && (
          <EmptyState
            icon={Sparkles}
            title="No project requests found"
            description="When visitors submit requests via 'Start a Project', they will appear here and be matched with registered clients."
          />
        )}
        {!loading && !error && data && data.length > 0 && (
          <>
            <Table columns={columns} data={data} keyField="_id" />
            <Pagination meta={meta} onChange={setPage} />
          </>
        )}
      </Card>

      {/* Details Drawer / Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedRequest(null)}
          />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-marine-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-lg bg-signal-500/15 border border-signal-500/30 px-2.5 py-1 text-xs font-mono font-bold text-signal-400">
                  {selectedRequest.serviceField}
                </span>
                <h3 className="mt-2 text-xl font-bold text-white">{selectedRequest.projectTitle}</h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="rounded-full p-1.5 text-marine-100/60 hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-marine-900/60 p-4 space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-marine-100/60">Customer Info</h4>
                <div className="text-sm font-semibold text-white">{selectedRequest.customerName}</div>
                <div className="text-xs text-marine-100/70">{selectedRequest.customerEmail}</div>
                {selectedRequest.customerPhone && <div className="text-xs text-marine-100/70">{selectedRequest.customerPhone}</div>}
                {selectedRequest.companyName && <div className="text-xs text-signal-400">{selectedRequest.companyName}</div>}
              </div>

              <div className="rounded-xl border border-white/10 bg-marine-900/60 p-4 space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-marine-100/60">Matching & Status</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-marine-100/60">Status:</span>
                  <span className="font-bold text-emerald-400 capitalize">{selectedRequest.status}</span>
                </div>
                {selectedRequest.claimedByUser ? (
                  <div>
                    <span className="text-xs text-marine-100/60">Claimed By:</span>
                    <div className="font-semibold text-white text-xs mt-0.5">{selectedRequest.claimedByUser.name} ({selectedRequest.claimedByUser.email})</div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-300">Unclaimed · Visible to registered {selectedRequest.serviceField} clients</div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-white/10 bg-marine-900/60 p-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-marine-100/60 mb-1">Project Description</h4>
                <p className="text-xs text-white leading-relaxed">{selectedRequest.projectDescription || 'None provided'}</p>
              </div>

              {selectedRequest.goals && (
                <div className="rounded-xl border border-white/10 bg-marine-900/60 p-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-marine-100/60 mb-1">Project Goals</h4>
                  <p className="text-xs text-white leading-relaxed">{selectedRequest.goals}</p>
                </div>
              )}

              {selectedRequest.additionalRequirements && (
                <div className="rounded-xl border border-white/10 bg-marine-900/60 p-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-marine-100/60 mb-1">Additional Requirements</h4>
                  <p className="text-xs text-white leading-relaxed">{selectedRequest.additionalRequirements}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {selectedRequest.projectId && (
                <Button
                  as={Link}
                  to={`/admin/projects/${selectedRequest.projectId}`}
                  variant="primary"
                  size="sm"
                >
                  Go to Project Workspace →
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
