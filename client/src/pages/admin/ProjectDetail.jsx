import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, Archive, Send, Trash2 } from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { projectApi, taskApi, commentApi, clientApi } from '../../services/endpoints.js';
import PageHeader from '../../components/portal/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Modal from '../../components/ui/Modal.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { Input, TextArea, Select } from '../../components/ui/Field.jsx';
import ProjectForm from './ProjectForm.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate, formatDateTime, readableStatus } from '../../utils/format.js';
import { TASK_STATUS, TASK_PRIORITY } from '../../utils/constants.js';

export default function AdminProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch(() => projectApi.get(id), [id]);
  const comments = useFetch(() => commentApi.listByProject(id), [id]);
  const clients = useFetch(() => clientApi.list({ limit: 100 }), []);

  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [message, setMessage] = useState('');

  const updateProject = useAction(projectApi.update);
  const archiveProject = useAction(projectApi.archive);
  const createTask = useAction(taskApi.create);
  const updateTask = useAction(taskApi.update);
  const removeTask = useAction(taskApi.remove);
  const postComment = useAction(commentApi.create);

  if (loading) return <Spinner label="Loading project" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const { project, tasks } = data;

  const run = async (fn, successMessage, after = refetch) => {
    try {
      await fn();
      if (successMessage) toast.success(successMessage);
      after?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onEdit = (payload) =>
    run(() => updateProject.execute(id, payload), 'Project updated', () => { setEditOpen(false); refetch(); });

  const onCreateTask = (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    run(
      () => createTask.execute({ ...form, project: id, dueDate: form.dueDate || undefined }),
      'Task created',
      () => { setTaskOpen(false); refetch(); }
    );
  };

  const onComment = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    run(() => postComment.execute({ project: id, message }), null, () => { setMessage(''); comments.refetch(); });
  };

  return (
    <>
      <Link to="/admin/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-mist-600 hover:text-marine-900">
        <ArrowLeft size={15} /> All projects
      </Link>

      <PageHeader
        title={project.name}
        description={`${project.client?.name}${project.client?.company ? ` · ${project.client.company}` : ''}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" icon={Pencil} onClick={() => setEditOpen(true)}>Edit</Button>
            <Button variant="ghost" icon={Archive} onClick={() => setArchiveOpen(true)}>Archive</Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card title="Status">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={project.status} />
              <span className="text-sm text-mist-600">
                {project.dueDate ? `Due ${formatDate(project.dueDate)}` : 'No due date'} · {project.isPublic ? 'Public in portfolio' : 'Private'}
              </span>
            </div>
            <div className="mt-4"><ProgressBar value={project.progress} /></div>
            <p className="mt-4 text-sm text-mist-600">{project.description}</p>
          </Card>

          <Card
            title={`Tasks (${tasks.length})`}
            action={<Button size="sm" icon={Plus} onClick={() => setTaskOpen(true)}>Add task</Button>}
            padded={false}
          >
            {tasks.length === 0 ? (
              <div className="p-5"><EmptyState title="No tasks yet" description="Break the work down so the client can follow it." /></div>
            ) : (
              <ul className="divide-y divide-mist-100">
                {tasks.map((task) => (
                  <li key={task._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-medium text-marine-900">{task.title}</p>
                      <p className="mt-0.5 text-xs text-mist-600">
                        {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
                        {task.visibleToClient ? '' : ' · internal only'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={task.priority} />
                      <select
                        value={task.status}
                        onChange={(e) => run(() => updateTask.execute(task._id, { status: e.target.value }), 'Task updated')}
                        className="rounded-lg border border-mist-200 bg-white px-2 py-1.5 text-xs"
                        aria-label={`Status for ${task.title}`}
                      >
                        {TASK_STATUS.map((s) => <option key={s} value={s}>{readableStatus(s)}</option>)}
                      </select>
                      <button
                        onClick={() => run(() => removeTask.execute(task._id), 'Task deleted')}
                        aria-label={`Delete ${task.title}`}
                        className="rounded p-1.5 text-mist-400 hover:bg-red-50 hover:text-state-bad"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Discussion" padded={false}>
            <div className="max-h-96 space-y-4 overflow-y-auto px-5 py-4">
              {comments.loading && <Spinner label="Loading messages" />}
              {!comments.loading && comments.data?.length === 0 && (
                <p className="py-6 text-center text-sm text-mist-600">No messages on this project yet.</p>
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
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={onComment} className="flex items-end gap-2 border-t border-mist-200 px-5 py-4">
              <div className="flex-1">
                <TextArea name="message" rows={2} placeholder="Reply to the client"
                  value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
              <Button type="submit" icon={Send} loading={postComment.pending}>Send</Button>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Client">
            <div className="flex items-center gap-3">
              <Avatar name={project.client?.name} src={project.client?.avatar} size={42} />
              <div className="min-w-0">
                <p className="truncate font-medium text-marine-900">{project.client?.name}</p>
                <p className="truncate text-xs text-mist-600">{project.client?.email}</p>
              </div>
            </div>
          </Card>

          <Card title="Team">
            <ul className="space-y-3">
              {[project.manager, ...(project.team || [])].filter(Boolean).map((member) => (
                <li key={member._id} className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.avatar} size={34} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{member.name}</p>
                    <p className="truncate text-xs text-mist-600">{member.position || 'Team'}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {project.technologies?.length > 0 && (
            <Card title="Stack">
              <ul className="flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <li key={tech} className="rounded bg-mist-100 px-2 py-0.5 text-xs text-mist-600">{tech}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      {editOpen && (
        <ProjectForm
          open={editOpen} onClose={() => setEditOpen(false)} onSubmit={onEdit}
          project={project} clients={clients.data || []}
          pending={updateProject.pending} fieldErrors={updateProject.fieldErrors}
        />
      )}

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Add a task">
        <form onSubmit={onCreateTask} className="space-y-4">
          <Input name="title" label="Task title" required error={createTask.fieldErrors.title} />
          <TextArea name="description" label="Description" rows={3} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select name="priority" label="Priority" defaultValue="medium"
              options={TASK_PRIORITY.map((p) => ({ value: p, label: readableStatus(p) }))} />
            <Select name="status" label="Status" defaultValue="pending"
              options={TASK_STATUS.map((s) => ({ value: s, label: readableStatus(s) }))} />
          </div>
          <Input name="dueDate" type="date" label="Due date" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setTaskOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createTask.pending}>Add task</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={() => run(
          () => archiveProject.execute(id),
          'Project archived',
          () => navigate('/admin/projects')
        )}
        pending={archiveProject.pending}
        title="Archive this project?"
        description="It disappears from active lists for you and the client. Nothing is deleted."
        confirmLabel="Archive project"
      />
    </>
  );
}
