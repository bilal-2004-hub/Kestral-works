import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Paperclip, Send, MessageSquarePlus } from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { projectApi, commentApi, feedbackApi, progressApi } from '../../services/endpoints.js';
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
import { formatDate, formatDateTime, fileSize } from '../../utils/format.js';
import LiveProgressCard from '../../components/portal/LiveProgressCard.jsx';
import MilestoneTimeline from '../../components/portal/MilestoneTimeline.jsx';
import ActivityFeed from '../../components/portal/ActivityFeed.jsx';

export default function PortalProjectDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch(() => projectApi.get(id), [id]);
  const comments = useFetch(() => commentApi.listByProject(id), [id]);
  const history = useFetch(() => progressApi.getHistory(id), [id]);

  const [projectState, setProjectState] = useState(null);
  const [tasksState, setTasksState] = useState([]);
  const [activities, setActivities] = useState([]);
  const [lastReason, setLastReason] = useState('');
  const [message, setMessage] = useState('');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
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
    toast.info(`Project status changed to ${evt.status.replace('_', ' ')}`);
  }, [toast]);

  const handleTaskCreated = useCallback((evt) => {
    if (evt.task) {
      setTasksState((prev) => [evt.task, ...prev]);
    }
  }, []);

  const handleTaskUpdated = useCallback((evt) => {
    if (evt.task) {
      setTasksState((prev) =>
        prev.map((t) => (t._id === evt.task._id ? { ...t, ...evt.task } : t))
      );
    }
  }, []);

  const handleTaskDeleted = useCallback((evt) => {
    if (evt.task?._id) {
      setTasksState((prev) => prev.filter((t) => t._id !== evt.task._id));
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

  if (loading) return <Spinner label="Loading project" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

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
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <Link to="/portal/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-mist-600 hover:text-marine-900">
        <ArrowLeft size={15} /> All projects
      </Link>

      <PageHeader
        title={project.name}
        description={project.description}
        action={<Button icon={MessageSquarePlus} onClick={() => setFeedbackOpen(true)}>Give feedback</Button>}
      />

      {/* Real-Time Live Progress Card */}
      <div className="mb-6">
        <LiveProgressCard
          progress={project.progress || 0}
          status={project.status}
          tasks={tasks}
          lastProgressAt={project.lastProgressAt}
          lastReason={lastReason}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Milestones Timeline */}
          <MilestoneTimeline milestones={project.milestones || []} />

          {/* Tasks List */}
          <Card title={`Tasks (${tasks.length})`} padded={false}>
            {tasks.length === 0 ? (
              <div className="p-5"><EmptyState title="No tasks yet" description="Tasks appear here as the team plans the next stage." /></div>
            ) : (
              <ul className="divide-y divide-mist-100">
                {tasks.map((task) => (
                  <li key={task._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className={`font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-marine-900'}`}>
                        {task.title}
                      </p>
                      {task.description && <p className="mt-0.5 line-clamp-2 text-sm text-mist-600">{task.description}</p>}
                      <p className="mt-1 text-xs text-mist-400">
                        {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
                        {task.assignee ? ` · ${task.assignee.name}` : ''}
                        {task.weight && task.weight > 1 ? ` · Weight: ${task.weight}x` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Discussion */}
          <Card title="Discussion" padded={false}>
            <div className="max-h-96 space-y-4 overflow-y-auto px-5 py-4">
              {comments.loading && <Spinner label="Loading messages" />}
              {!comments.loading && comments.data?.length === 0 && (
                <p className="py-6 text-center text-sm text-mist-600">No messages yet. Ask anything about this project here.</p>
              )}
              {comments.data?.map((comment) => (
                <div key={comment._id} className="flex gap-3">
                  <Avatar name={comment.author?.name} src={comment.author?.avatar} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium text-marine-900">{comment.author?.name}</span>
                      <span className="ml-2 text-xs text-mist-400">
                        {comment.author?.role === 'client' ? 'Client' : 'Studio'} · {formatDateTime(comment.createdAt)}
                      </span>
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-mist-600">{comment.message}</p>
                    {comment.attachments?.map((file) => (
                      <a key={file._id} href={file.url} target="_blank" rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-marine-700 hover:underline">
                        <Paperclip size={12} /> {file.originalName} ({fileSize(file.size)})
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={onComment} className="flex items-end gap-2 border-t border-mist-200 px-5 py-4">
              <div className="flex-1">
                <TextArea
                  name="message" rows={2} placeholder="Write a message to the team"
                  value={message} onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <Button type="submit" icon={Send} loading={postComment.pending}>Send</Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Live Activity Feed */}
          <ActivityFeed activities={activities} />

          {/* Team */}
          <Card title="Your team">
            <ul className="space-y-3">
              {[project.manager, ...(project.team || [])].filter(Boolean).map((member) => (
                <li key={member._id} className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.avatar} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{member.name}</p>
                    <p className="truncate text-xs text-mist-600">{member.position || 'Project team'}</p>
                  </div>
                </li>
              ))}
              {!project.manager && !project.team?.length && <p className="text-sm text-mist-600">Team is being assigned.</p>}
            </ul>
          </Card>

          {/* Files */}
          <Card title="Files">
            {project.files?.length ? (
              <ul className="space-y-2">
                {project.files.map((file) => (
                  <li key={file._id}>
                    <a href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-marine-700 hover:underline">
                      <Paperclip size={14} /> <span className="truncate">{file.originalName}</span>
                      <span className="ml-auto text-xs text-mist-400">{fileSize(file.size)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mist-600">No files shared yet.</p>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        title="Give feedback"
        footer={null}
      >
        <form onSubmit={onFeedback} className="space-y-4">
          <Select
            name="type" label="What kind of feedback?" defaultValue="change_request"
            options={[
              { value: 'change_request', label: 'Change request' },
              { value: 'bug', label: 'Something is broken' },
              { value: 'question', label: 'Question' },
              { value: 'approval', label: 'Approval' },
            ]}
          />
          <Input name="subject" label="Subject" required error={sendFeedback.fieldErrors.subject} />
          <TextArea name="message" label="Details" rows={5} required error={sendFeedback.fieldErrors.message}
            placeholder="Describe what you would like changed, and where you saw it." />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setFeedbackOpen(false)}>Cancel</Button>
            <Button type="submit" loading={sendFeedback.pending}>Send feedback</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
