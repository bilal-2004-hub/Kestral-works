import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Paperclip, Send, MessageSquarePlus, Calendar, Clock,
  Upload, Download, FileText, CheckCircle2, User, Sparkles, Layers,
  ChevronRight, RefreshCw, AlertCircle, Plus, Trash2
} from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { projectApi, commentApi, feedbackApi, progressApi, fileApi } from '../../services/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProjectSocket } from '../../hooks/useProjectSocket.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Input, TextArea, Select } from '../../components/ui/Field.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, formatDateTime, fileSize, timeAgo } from '../../utils/format.js';
import LiveProgressCard from '../../components/portal/LiveProgressCard.jsx';
import MilestoneTimeline from '../../components/portal/MilestoneTimeline.jsx';
import ActivityFeed from '../../components/portal/ActivityFeed.jsx';

export default function PortalProjectDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const { data, loading, error, refetch } = useFetch(() => projectApi.get(id), [id]);
  const comments = useFetch(() => commentApi.listByProject(id), [id]);
  const history = useFetch(() => progressApi.getHistory(id), [id]);
  const feedbackList = useFetch(() => feedbackApi.list({ project: id }), [id]);

  const [projectState, setProjectState] = useState(null);
  const [tasksState, setTasksState] = useState([]);
  const [activities, setActivities] = useState([]);
  const [lastReason, setLastReason] = useState('');
  const [message, setMessage] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState(null);

  const postComment = useAction(commentApi.create);
  const sendFeedback = useAction(feedbackApi.create);

  // Sync initial fetch with local state
  useEffect(() => {
    if (data?.project) setProjectState(data.project);
    if (data?.tasks) setTasksState(data.tasks);
  }, [data]);

  useEffect(() => {
    if (history?.data) setActivities(history.data);
  }, [history?.data]);

  // Real-time socket handlers
  const handleProgressUpdated = useCallback((evt) => {
    setProjectState((prev) => (prev ? { ...prev, progress: evt.progress, status: evt.status, lastProgressAt: evt.lastProgressAt } : prev));
    setLastReason(evt.reason || 'Progress recalculated');
    setActivities((prev) => [
      {
        _id: 'live-' + Date.now(),
        reason: evt.reason || 'Live progress updated',
        previousProgress: evt.previousProgress,
        newProgress: evt.progress,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    toast.success(`Progress updated to ${evt.progress}%`);
  }, [toast]);

  const handleStatusChanged = useCallback((evt) => {
    setProjectState((prev) => (prev ? { ...prev, status: evt.status } : prev));
    toast.info(`Project status changed to ${evt.status?.replace('_', ' ')}`);
  }, [toast]);

  const handleTaskCreated = useCallback((evt) => {
    if (evt.task) {
      setTasksState((prev) => [evt.task, ...prev]);
    }
  }, []);

  const handleTaskUpdated = useCallback((evt) => {
    if (evt.task) {
      setTasksState((prev) =>
        prev.map((t) => ((t._id === evt.task._id || t.id === evt.task._id) ? { ...t, ...evt.task } : t))
      );
    }
  }, []);

  const handleTaskDeleted = useCallback((evt) => {
    if (evt.task?._id || evt.taskId) {
      const targetId = evt.task?._id || evt.taskId;
      setTasksState((prev) => prev.filter((t) => t._id !== targetId && t.id !== targetId));
    }
  }, []);

  const handleMilestoneUpdated = useCallback(() => {
    refetch();
  }, [refetch]);

  useProjectSocket(id, {
    onProgressUpdated: handleProgressUpdated,
    onStatusChanged: handleStatusChanged,
    onTaskCreated: handleTaskCreated,
    onTaskUpdated: handleTaskUpdated,
    onTaskDeleted: handleTaskDeleted,
    onMilestoneUpdated: handleMilestoneUpdated,
  });

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Spinner size={36} />
        <p className="text-sm text-marine-100/60 font-mono">Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/portal/projects" className="inline-flex items-center gap-1.5 text-xs text-signal-400 hover:underline">
          <ArrowLeft size={14} /> Back to Projects
        </Link>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  const project = projectState || data?.project;
  const tasks = tasksState || data?.tasks || [];

  if (!project) return null;

  const onComment = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      await postComment.execute({ project: id, message });
      setMessage('');
      comments.refetch();
      toast.success('Message sent');
    } catch (err) {
      toast.error(err.message);
    }
  };

      const onFeedback = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await sendFeedback.execute({
        project: id,
        subject: form.get('subject'),
        message: form.get('message'),
        type: form.get('type'),
      });
      setFeedbackOpen(false);
      toast.success('Feedback sent to the team');
      feedbackList.refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFile(true);
    try {
      await fileApi.upload(files, id);
      toast.success('Files uploaded successfully');
      refetch();
    } catch (err) {
      toast.error(err.message || 'File upload failed');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileDelete = async (file) => {
    const fileId = file._id || file.id;
    if (!fileId) return;
    if (!window.confirm(`Delete "${file.originalName}"? This cannot be undone.`)) return;
    setDeletingFileId(fileId);
    try {
      await fileApi.remove(fileId);
      toast.success('File deleted successfully');
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to delete file');
    } finally {
      setDeletingFileId(null);
    }
  };

  // Helper: check if current user uploaded this file (or is staff/admin)
  const isFileOwner = (file) => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'staff') return true;
    const currentId = user._id || user.uid || user.id;
    const uploadedBy = typeof file.uploadedBy === 'object'
      ? (file.uploadedBy?._id || file.uploadedBy?.uid || file.uploadedBy?.id)
      : file.uploadedBy;
    return Boolean(currentId && uploadedBy && String(currentId) === String(uploadedBy));
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/portal/projects"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-marine-100/60 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} /> All Projects
        </Link>
        <StatusBadge status={project.status} />
      </div>

      {/* Project Header */}
      <PageHeader
        title={project.name}
        description={project.description || 'Custom project workspace and live milestone delivery tracker.'}
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => {
                refetch();
                comments.refetch();
                history.refetch();
                feedbackList.refetch();
                toast.info('Workspace refreshed');
              }}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={MessageSquarePlus}
              onClick={() => setFeedbackOpen(true)}
            >
              Give Feedback
            </Button>
          </div>
        }
      />

      {/* Project Overview Card with Metadata Pills */}
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-marine-900/60 p-6 shadow-xl backdrop-blur-md sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-marine-100/50">Category</span>
          <p className="mt-1 text-sm font-semibold text-white">{project.category || 'Web Application'}</p>
        </div>
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-marine-100/50">Start Date</span>
          <p className="mt-1 text-sm font-semibold text-white">
            {project.startDate ? formatDate(project.startDate) : 'Not specified'}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-marine-100/50">Target Deadline</span>
          <p className="mt-1 text-sm font-semibold text-white">
            {project.dueDate ? formatDate(project.dueDate) : 'Open Timeline'}
          </p>
        </div>
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-marine-100/50">Technologies</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {project.technologies?.length ? (
              project.technologies.map((t, idx) => (
                <span key={idx} className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-mono text-marine-100/80">
                  {t}
                </span>
              ))
            ) : (
              <span className="text-xs text-marine-100/50">Standard Stack</span>
            )}
          </div>
        </div>
      </div>

      {/* Customer & Requirements Brief (if present from claimed request) */}
      {(project.goals || project.additionalRequirements || project.customerName) && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {project.goals && (
            <Card title="Project Goals & Scope">
              <p className="whitespace-pre-line text-xs leading-relaxed text-marine-100/80">
                {project.goals}
              </p>
            </Card>
          )}

          {project.additionalRequirements && (
            <Card title="Customer Requirements">
              <p className="whitespace-pre-line text-xs leading-relaxed text-marine-100/80">
                {project.additionalRequirements}
              </p>
            </Card>
          )}

          {project.customerName && (
            <Card title="Client / Customer Info">
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-marine-100/50">Contact Person</span>
                  <span className="text-white font-medium">{project.customerName}</span>
                </div>
                {project.customerEmail && (
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-marine-100/50">Email</span>
                    <span className="text-signal-400">{project.customerEmail}</span>
                  </div>
                )}
                {project.budget && (
                  <div className="flex items-center justify-between">
                    <span className="text-marine-100/50">Budget Range</span>
                    <span className="text-emerald-400 font-semibold">{project.budget}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Real-Time Live Progress Card */}
      <LiveProgressCard
        progress={project.progress || 0}
        status={project.status}
        tasks={tasks}
        lastProgressAt={project.lastProgressAt}
        lastReason={lastReason}
      />

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Milestones Timeline */}
          <MilestoneTimeline milestones={project.milestones || []} />

          {/* Project Tasks List */}
          <Card
            title={`Project Deliverables & Tasks (${tasks.length})`}
            action={
              <span className="text-xs font-mono text-marine-100/50">
                {tasks.filter((t) => t.status === 'completed').length} completed
              </span>
            }
            padded={false}
          >
            {tasks.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No deliverables planned yet"
                  description="Tasks and sprints will appear here as soon as the team defines the next phase."
                />
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {tasks.map((task) => {
                  const isDone = task.status === 'completed';
                  return (
                    <li key={task._id || task.id} className="flex flex-wrap items-center justify-between gap-3 p-5 transition-colors hover:bg-white/[0.02]">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {isDone && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
                          <p className={`font-semibold text-sm ${isDone ? 'text-marine-100/50 line-through' : 'text-white'}`}>
                            {task.title}
                          </p>
                        </div>
                        {task.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-marine-100/60 leading-relaxed pl-6">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 pl-6 text-xs font-mono text-marine-100/40">
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-marine-100/60">
                              <Calendar size={12} /> Due {formatDate(task.dueDate)}
                            </span>
                          )}
                          {task.assignee?.name && (
                            <span>Assigned: {task.assignee.name}</span>
                          )}
                          {task.weight && task.weight > 1 && (
                            <span className="text-signal-400">Weight: {task.weight}x</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Project Discussion & Messages */}
          <Card title="Project Discussion" padded={false}>
            <div className="max-h-96 space-y-4 overflow-y-auto p-5">
              {comments.loading && (
                <div className="py-4 text-center">
                  <Spinner size={24} />
                </div>
              )}
              {!comments.loading && comments.data?.length === 0 && (
                <p className="py-8 text-center text-xs text-marine-100/50">
                  No messages on this project yet. Start a discussion or ask questions below.
                </p>
              )}
              {comments.data?.map((comment) => (
                <div key={comment._id || comment.id} className="flex gap-3">
                  <Avatar name={comment.author?.name} src={comment.author?.avatar} size={36} />
                  <div className="min-w-0 flex-1 rounded-xl bg-white/[0.03] border border-white/5 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">
                        {comment.author?.name || 'Studio Member'}
                      </span>
                      <span className="text-[11px] font-mono text-marine-100/40">
                        {comment.author?.role === 'client' ? 'Client' : 'Studio'} · {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-xs text-marine-100/80 leading-relaxed">
                      {comment.message}
                    </p>
                    {comment.attachments?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 border-t border-white/5 pt-2">
                        {comment.attachments.map((file, idx) => (
                          <a
                            key={file._id || idx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-signal-400 hover:bg-white/10"
                          >
                            <Paperclip size={12} /> {file.originalName} ({fileSize(file.size)})
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Comment Post Form */}
            <form onSubmit={onComment} className="flex items-end gap-2 border-t border-white/10 p-4">
              <div className="flex-1">
                <TextArea
                  name="message"
                  rows={2}
                  placeholder="Write a message or question about this project..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <Button type="submit" icon={Send} loading={postComment.pending} className="h-11">
                Send
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Activity Feed, Files, Assigned Team */}
        <div className="space-y-6">
          {/* Live Progress & Activity Feed */}
          <ActivityFeed activities={activities} />

          {/* Project Feedback & Revisions */}
          <Card
            title={`Project Feedback (${feedbackList.data?.length || 0})`}
            action={
              <Button
                variant="ghost"
                size="sm"
                icon={Plus}
                onClick={() => setFeedbackOpen(true)}
              >
                Submit
              </Button>
            }
            padded={false}
          >
            {feedbackList.loading && (
              <div className="py-4 text-center">
                <Spinner size={20} />
              </div>
            )}
            {!feedbackList.loading && (!feedbackList.data || feedbackList.data.length === 0) && (
              <p className="p-5 text-center text-xs text-marine-100/50">
                No feedback submitted on this project yet. Use &ldquo;Give Feedback&rdquo; to request revisions or report issues.
              </p>
            )}
            {feedbackList.data?.length > 0 && (
              <ul className="divide-y divide-white/10 max-h-72 overflow-y-auto">
                {feedbackList.data.map((fb) => (
                  <li key={fb._id || fb.id} className="p-4 space-y-1.5 hover:bg-white/[0.02]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white truncate">{fb.subject}</span>
                      <StatusBadge status={fb.status || 'open'} />
                    </div>
                    <p className="text-xs text-marine-100/70 line-clamp-2 leading-relaxed">
                      {fb.message}
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-marine-100/40 pt-1">
                      <span className="capitalize">{fb.type?.replace('_', ' ')}</span>
                      <span>{fb.createdAt ? formatDate(fb.createdAt) : ''}</span>
                    </div>
                    {fb.replies?.length > 0 && (
                      <div className="mt-2 rounded-lg bg-white/5 p-2 text-xs text-marine-100/80">
                        <span className="font-bold text-signal-400">Team reply:</span>{' '}
                        {fb.replies[fb.replies.length - 1].message}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Project Files */}
          <Card
            title={`Project Files (${project.files?.length || 0})`}
            action={
              <div>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={onFileUpload}
                  className="hidden"
                  id="project-file-upload"
                />
                <Button
                  as="label"
                  htmlFor="project-file-upload"
                  variant="outline"
                  size="sm"
                  icon={Upload}
                  loading={uploadingFile}
                  className="cursor-pointer"
                >
                  Upload
                </Button>
              </div>
            }
            padded={false}
          >
            {project.files?.length ? (
              <ul className="divide-y divide-white/10">
                {project.files.map((file, idx) => {
                  const fileId = file._id || file.id || idx;
                  const isDeleting = deletingFileId === (file._id || file.id);
                  const canDelete = isFileOwner(file);
                  return (
                    <li key={fileId} className="flex items-center justify-between gap-3 p-4 hover:bg-white/[0.02]">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-signal-400 shrink-0" />
                          <p className="truncate text-xs font-semibold text-white">{file.originalName}</p>
                        </div>
                        <p className="mt-0.5 text-[11px] font-mono text-marine-100/40 pl-6">
                          {fileSize(file.size)} · {file.createdAt ? formatDate(file.createdAt) : 'Uploaded'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="rounded-lg border border-white/10 bg-white/5 p-2 text-marine-100/70 hover:bg-signal-500 hover:text-marine-950 transition-colors"
                          title="Download file"
                        >
                          <Download size={14} />
                        </a>
                        {canDelete && (
                          <button
                            onClick={() => onFileDelete(file)}
                            disabled={isDeleting}
                            title="Delete file"
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-marine-100/50 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {isDeleting ? (
                              <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-6 text-center text-xs text-marine-100/50">
                <p>No project documents uploaded yet.</p>
                <p className="mt-1 text-[11px] text-marine-100/40">You can upload assets, specs, or contracts above.</p>
              </div>
            )}
          </Card>

          {/* Assigned Studio Team */}
          <Card title="Assigned Team">
            <ul className="space-y-3.5">
              {[project.manager, ...(project.team || [])].filter(Boolean).map((member, idx) => (
                <li key={member._id || idx} className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.avatar} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{member.name}</p>
                    <p className="truncate text-xs text-marine-100/60 font-mono">
                      {member.position || (member.role === 'admin' ? 'Project Lead' : 'Specialist')}
                    </p>
                  </div>
                </li>
              ))}
              {!project.manager && !project.team?.length && (
                <p className="text-xs text-marine-100/50">Dedicated team members are being assigned to this project.</p>
              )}
            </ul>
          </Card>
        </div>
      </div>

      {/* Give Feedback Modal */}
      <Modal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        title="Submit Project Feedback"
        footer={null}
      >
        <form onSubmit={onFeedback} className="space-y-4">
          <Select
            name="type"
            label="Feedback Type"
            defaultValue="change_request"
            options={[
              { value: 'change_request', label: 'Change Request / Revision' },
              { value: 'bug', label: 'Bug / Issue' },
              { value: 'question', label: 'General Question' },
              { value: 'approval', label: 'Milestone Approval' },
            ]}
          />
          <Input
            name="subject"
            label="Subject"
            required
            placeholder="e.g. Update Hero Section copy and button"
            error={sendFeedback.fieldErrors.subject}
          />
          <TextArea
            name="message"
            label="Description & Details"
            rows={5}
            required
            placeholder="Please detail your feedback, specific pages, or desired changes..."
            error={sendFeedback.fieldErrors.message}
          />
          <div className="flex justify-end gap-2.5 pt-2">
            <Button type="button" variant="ghost" onClick={() => setFeedbackOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={sendFeedback.pending}>
              Send Feedback
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
