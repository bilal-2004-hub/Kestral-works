import { useState, useMemo } from 'react';
import {
  MessageSquare, Send, Plus, ChevronDown, ChevronUp, FolderKanban,
  CheckCircle2, Clock, Sparkles, Filter, Search, User, AlertCircle
} from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { feedbackApi, projectApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonRows } from '../../components/ui/Skeleton.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Input, TextArea, Select } from '../../components/ui/Field.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime, timeAgo, readableStatus } from '../../utils/format.js';

const STATUS_TABS = [
  { value: '', label: 'All Feedback' },
  { value: 'open', label: 'Open' },
  { value: 'in_review', label: 'In Review' },
  { value: 'resolved', label: 'Resolved' },
];

export default function PortalFeedback() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [openId, setOpenId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, loading, error, refetch } = useFetch(
    () => feedbackApi.list({ limit: 40, status: status || undefined }),
    [status]
  );

  const projectsFetch = useFetch(() => projectApi.list({ limit: 50 }), []);

  const { execute: submitReply, pending: replying } = useAction(feedbackApi.reply);
  const { execute: createFeedback, pending: creating, fieldErrors } = useAction(feedbackApi.create);

  const filteredFeedback = useMemo(() => {
    if (!data) return [];
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (f) =>
        f.subject?.toLowerCase().includes(term) ||
        f.message?.toLowerCase().includes(term) ||
        f.project?.name?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const onReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      await submitReply(id, replyText);
      setReplyText('');
      toast.success('Reply submitted to the studio team');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to submit reply');
    }
  };

  const onCreateFeedback = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await createFeedback({
        project: form.get('project'),
        type: form.get('type'),
        subject: form.get('subject'),
        message: form.get('message'),
      });
      setNewModalOpen(false);
      toast.success('Feedback submitted successfully!');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback & Revisions"
        description="Raise change requests, report issues, or ask questions directly to our design and engineering team."
        action={
          <Button icon={Plus} onClick={() => setNewModalOpen(true)}>
            New Feedback Request
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-marine-900/60 p-4 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                status === tab.value
                  ? 'bg-signal-500 text-marine-950 shadow-md font-bold'
                  : 'text-marine-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px] sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-marine-100/40" />
          <input
            type="text"
            placeholder="Search feedback threads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-marine-950/80 py-2 pl-9 pr-4 text-xs text-white placeholder:text-marine-100/30 focus:border-signal-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-marine-100/40 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <SkeletonRows count={5} />
        </Card>
      )}

      {/* Error State */}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {/* Empty State */}
      {!loading && !error && filteredFeedback.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title={searchTerm ? 'No matching feedback' : 'No feedback requests submitted'}
          description={
            searchTerm
              ? `No requests match "${searchTerm}".`
              : status
              ? `No feedback threads currently in "${readableStatus(status)}" state.`
              : 'Whenever you need changes or want to ask a question regarding any project, submit feedback here.'
          }
          action={
            <Button icon={Plus} onClick={() => setNewModalOpen(true)}>
              Submit First Request
            </Button>
          }
        />
      )}

      {/* Feedback List */}
      {!loading && !error && filteredFeedback.length > 0 && (
        <div className="space-y-4">
          {filteredFeedback.map((item) => {
            const isExpanded = openId === (item._id || item.id);
            const repliesCount = item.replies?.length || 0;

            return (
              <Card key={item._id || item.id} padded={false} className="overflow-hidden transition-all">
                {/* Accordion Header */}
                <button
                  onClick={() => setOpenId(isExpanded ? null : (item._id || item.id))}
                  className="flex w-full flex-wrap items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-white/[0.03]"
                  aria-expanded={isExpanded}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono uppercase text-signal-400">
                        {item.type?.replace('_', ' ') || 'Change Request'}
                      </span>
                      {item.project?.name && (
                        <span className="text-xs font-mono text-marine-100/50">
                          {item.project.name}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 text-base font-bold text-white group-hover:text-signal-300">
                      {item.subject}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-marine-100/50">
                      <span>Submitted {timeAgo(item.createdAt)}</span>
                      <span>·</span>
                      <span>{repliesCount} {repliesCount === 1 ? 'response' : 'responses'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.status} />
                    <span className="rounded-lg p-1.5 text-marine-100/40 hover:bg-white/10">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </div>
                </button>

                {/* Expanded Thread Content */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-marine-950/40 p-5 space-y-6">
                    {/* Original Request Body */}
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-marine-100/40">
                        Original Request:
                      </span>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-marine-100/90 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {/* Replies Timeline */}
                    <div className="space-y-3">
                      <span className="text-xs font-mono uppercase tracking-wider text-marine-100/60 block">
                        Discussion & Studio Responses ({repliesCount})
                      </span>

                      {repliesCount === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-marine-100/40">
                          Awaiting initial response from the studio team.
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {item.replies.map((r, idx) => (
                            <li key={r._id || idx} className="flex gap-3">
                              <Avatar name={r.author?.name} src={r.author?.avatar} size={34} />
                              <div className="flex-1 rounded-xl border border-white/5 bg-white/[0.03] p-3.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-white">
                                    {r.author?.name || 'Team Member'}
                                  </span>
                                  <span className="text-[11px] font-mono text-marine-100/40">
                                    {r.author?.role === 'client' ? 'Client' : 'Studio'} · {formatDateTime(r.createdAt)}
                                  </span>
                                </div>
                                <p className="mt-1 whitespace-pre-wrap text-xs text-marine-100/80 leading-relaxed">
                                  {r.message}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Reply Input Form (If not resolved) */}
                    {item.status !== 'resolved' ? (
                      <div className="border-t border-white/10 pt-4">
                        <label className="mb-2 block text-xs font-mono uppercase text-marine-100/60">
                          Add response / comment to this thread:
                        </label>
                        <div className="flex items-end gap-2.5">
                          <div className="flex-1">
                            <TextArea
                              name="reply"
                              rows={2}
                              placeholder="Type your message to the team..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                            />
                          </div>
                          <Button
                            icon={Send}
                            loading={replying}
                            onClick={() => onReply(item._id || item.id)}
                            className="h-11"
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center text-xs font-medium text-emerald-300">
                        This feedback thread has been resolved. If you need further assistance, please open a new request.
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* New Feedback Modal */}
      <Modal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="Submit New Feedback Request"
        footer={null}
      >
        <form onSubmit={onCreateFeedback} className="space-y-4">
          <Select
            name="project"
            label="Related Project"
            required
            error={fieldErrors?.project}
            options={[
              { value: '', label: 'Select project...' },
              ...(projectsFetch.data || []).map((p) => ({
                value: p._id || p.id,
                label: p.name,
              })),
            ]}
          />

          <Select
            name="type"
            label="Feedback Category"
            defaultValue="change_request"
            options={[
              { value: 'change_request', label: 'Change Request / Revision' },
              { value: 'bug', label: 'Bug / Issue Encountered' },
              { value: 'question', label: 'General Project Question' },
              { value: 'approval', label: 'Approval Confirmation' },
            ]}
          />

          <Input
            name="subject"
            label="Subject"
            required
            placeholder="e.g. Update typography on pricing page"
            error={fieldErrors?.subject}
          />

          <TextArea
            name="message"
            label="Detailed Feedback & Instructions"
            rows={5}
            required
            placeholder="Describe exactly what needs to be added, changed, or fixed..."
            error={fieldErrors?.message}
          />

          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="ghost" onClick={() => setNewModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
