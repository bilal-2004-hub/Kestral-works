import { useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, Plus, Archive, Send, Trash2, Flag,
  Upload, Download, FileText, CheckCircle2, Calendar, FolderKanban
} from 'lucide-react';
import { useFetch, useAction } from '../../hooks/useApi.js';
import { projectApi, taskApi, commentApi, clientApi, fileApi } from '../../services/endpoints.js';
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
import { formatDate, formatDateTime, fileSize, readableStatus } from '../../utils/format.js';
import { TASK_STATUS, TASK_PRIORITY } from '../../utils/constants.js';

export default function AdminProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const { data, loading, error, refetch } = useFetch(() => projectApi.get(id), [id]);
  const comments = useFetch(() => commentApi.listByProject(id), [id]);
  const clients = useFetch(() => clientApi.list({ limit: 100 }), []);

  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const updateProject = useAction(projectApi.update);
  const archiveProject = useAction(projectApi.archive);
  const addMilestone = useAction(projectApi.addMilestone);
  const removeMilestone = useAction(projectApi.removeMilestone);
  const createTask = useAction(taskApi.create);
  const updateTask = useAction(taskApi.update);
  const removeTask = useAction(taskApi.remove);
  const postComment = useAction(commentApi.create);
  const removeFile = useAction(fileApi.remove);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/admin/projects" className="inline-flex items-center gap-1.5 text-xs text-signal-400 hover:underline">
          <ArrowLeft size={14} /> Back to projects
        </Link>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

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
    run(() => updateProject.execute(id, payload), 'Project updated', () => {
      setEditOpen(false);
      refetch();
    });

  const onCreateTask = (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    run(
      () => createTask.execute({
        ...form,
        project: id,
        weight: Number(form.weight) || 1,
        dueDate: form.dueDate || undefined,
        visibleToClient: form.visibleToClient === 'true',
      }),
      'Task created',
      () => {
        setTaskOpen(false);
        refetch();
      }
    );
  };

  const onCreateMilestone = (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget));
    run(
      () => addMilestone.execute(id, {
        name: form.name,
        description: form.description,
        status: form.status,
        dueDate: form.dueDate || undefined,
      }),
      'Milestone added',
      () => {
        setMilestoneOpen(false);
        refetch();
      }
    );
  };

  const onFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFile(true);
    try {
      await fileApi.upload(files, id);
      toast.success('Files uploaded to project');
      refetch();
    } catch (err) {
      toast.error(err.message || 'File upload failed');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onComment = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    run(() => postComment.execute({ project: id, message }), 'Message posted', () => {
      setMessage('');
      comments.refetch();
    });
  };

  return (
    <div className="space-y-6">
      <Link
        to="/admin/projects"
        className="inline-flex items-center gap-1.5 text-xs font-mono text-marine-100/60 hover:text-white transition-colors"
      >
        <ArrowLeft size={14} /> Back to Projects
      </Link>

      <PageHeader
        title={project.name}
        description={`Client: ${project.client?.name}${project.client?.company ? ` · ${project.client.company}` : ''}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={Pencil} size="sm" onClick={() => setEditOpen(true)}>
              Edit Project
            </Button>
            <Button variant="ghost" icon={Archive} size="sm" onClick={() => setArchiveOpen(true)}>
              Archive
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Status & Progress Card */}
          <Card title="Project Overview">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <StatusBadge status={project.status} />
                <span className="text-xs font-mono text-marine-100/60">
                  {project.dueDate ? `Due ${formatDate(project.dueDate)}` : 'Open deadline'} · {project.isPublic ? 'Public in portfolio' : 'Private workspace'}
                </span>
              </div>
              <span className="text-sm font-mono font-bold text-signal-400">{project.progress}%</span>
            </div>
            <div className="mt-4">
              <ProgressBar value={project.progress} />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-marine-100/80">{project.description}</p>
          </Card>

          {/* Milestones Card */}
          <Card
            title={`Milestones (${project.milestones?.length || 0})`}
            action={
              <Button size="sm" icon={Plus} variant="outline" onClick={() => setMilestoneOpen(true)}>
                Add Milestone
              </Button>
            }
            padded={false}
          >
            {(!project.milestones || project.milestones.length === 0) ? (
              <div className="p-5 text-center text-xs text-marine-100/50">
                No milestones added yet. Add phases so the client can follow along.
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {project.milestones.map((m) => (
                  <li key={m._id || m.id} className="flex items-center justify-between gap-3 p-4 hover:bg-white/[0.02]">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Flag size={14} className="text-signal-400 shrink-0" />
                        <p className="font-semibold text-xs text-white">{m.name}</p>
                      </div>
                      {m.description && (
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-marine-100/60 pl-5">{m.description}</p>
                      )}
                      {m.dueDate && (
                        <p className="mt-0.5 text-[10px] font-mono text-marine-100/40 pl-5">
                          Target: {formatDate(m.dueDate)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={m.status} />
                      <button
                        onClick={() => run(() => removeMilestone.execute(id, m._id || m.id), 'Milestone removed')}
                        className="rounded p-1.5 text-marine-100/40 hover:bg-rose-500/20 hover:text-rose-300"
                        title="Delete milestone"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Tasks List */}
          <Card
            title={`Tasks & Deliverables (${tasks.length})`}
            action={<Button size="sm" icon={Plus} onClick={() => setTaskOpen(true)}>Add Task</Button>}
            padded={false}
          >
            {tasks.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No tasks yet"
                  description="Add tasks to this project. Visible tasks will automatically show up in the client workspace."
                />
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {tasks.map((task) => (
                  <li key={task._id} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-white/[0.02]">
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-xs ${task.status === 'completed' ? 'text-marine-100/40 line-through' : 'text-white'}`}>
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-[11px] font-mono text-marine-100/50">
                        {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
                        {task.visibleToClient === false ? ' · Internal only' : ' · Visible to client'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={task.priority} />
                      <select
                        value={task.status}
                        onChange={(e) => run(() => updateTask.execute(task._id, { status: e.target.value }), 'Task status updated')}
                        className="rounded-lg border border-white/15 bg-marine-950 px-2 py-1 text-xs text-white"
                        aria-label={`Status for ${task.title}`}
                      >
                        {TASK_STATUS.map((s) => (
                          <option key={s} value={s}>{readableStatus(s)}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => run(() => removeTask.execute(task._id), 'Task deleted')}
                        aria-label={`Delete ${task.title}`}
                        className="rounded p-1.5 text-marine-100/40 hover:bg-rose-500/20 hover:text-rose-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Discussion */}
          <Card title="Project Discussion" padded={false}>
            <div className="max-h-96 space-y-4 overflow-y-auto p-5">
              {comments.loading && (
                <div className="py-4 text-center">
                  <Spinner size={20} />
                </div>
              )}
              {!comments.loading && comments.data?.length === 0 && (
                <p className="py-6 text-center text-xs text-marine-100/50">No messages on this project yet.</p>
              )}
              {comments.data?.map((comment) => (
                <div key={comment._id} className="flex gap-3">
                  <Avatar name={comment.author?.name} src={comment.author?.avatar} size={32} />
                  <div className="min-w-0 flex-1 rounded-xl border border-white/5 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{comment.author?.name}</span>
                      <span className="text-[10px] font-mono text-marine-100/40">
                        {comment.author?.role === 'client' ? 'Client' : 'Studio'} · {formatDateTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-marine-100/80 leading-relaxed">{comment.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={onComment} className="flex items-end gap-2 border-t border-white/10 p-4">
              <div className="flex-1">
                <TextArea
                  name="message"
                  rows={2}
                  placeholder="Post an update or reply to the client..."
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

        {/* Right Column: Client details, files, team, tech */}
        <div className="space-y-6">
          {/* Client info card */}
          <Card title="Assigned Client">
            <div className="flex items-center gap-3">
              <Avatar name={project.client?.name} src={project.client?.avatar} size={42} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-sm text-white">{project.client?.name || 'Client'}</p>
                <p className="truncate text-xs text-marine-100/60">{project.client?.email}</p>
                {project.client?.company && (
                  <p className="text-xs font-medium text-signal-400 mt-0.5">{project.client.company}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Project Files Upload and List */}
          <Card
            title={`Files (${project.files?.length || 0})`}
            action={
              <div>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={onFileUpload}
                  className="hidden"
                  id="admin-project-file-upload"
                />
                <Button
                  as="label"
                  htmlFor="admin-project-file-upload"
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
                {project.files.map((file, idx) => (
                  <li key={file._id || idx} className="flex items-center justify-between gap-3 p-4 hover:bg-white/[0.02]">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-signal-400 shrink-0" />
                        <p className="truncate text-xs font-semibold text-white">{file.originalName}</p>
                      </div>
                      <p className="text-[10px] font-mono text-marine-100/40 pl-5">{fileSize(file.size)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded p-1.5 text-marine-100/60 hover:text-white"
                        title="Download file"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => run(() => removeFile.execute(file._id), 'File deleted')}
                        className="rounded p-1.5 text-marine-100/40 hover:bg-rose-500/20 hover:text-rose-300"
                        title="Delete file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5 text-center text-xs text-marine-100/50">
                No files uploaded.
              </div>
            )}
          </Card>

          {/* Team list */}
          <Card title="Assigned Team">
            <ul className="space-y-3">
              {[project.manager, ...(project.team || [])].filter(Boolean).map((member, idx) => (
                <li key={member._id || idx} className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.avatar} size={32} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">{member.name}</p>
                    <p className="truncate text-[11px] text-marine-100/50 font-mono">
                      {member.position || (member.role === 'admin' ? 'Project Lead' : 'Team')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Tech Stack */}
          {project.technologies?.length > 0 && (
            <Card title="Technology Stack">
              <div className="flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <span key={tech} className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-mono text-white/80">
                    {tech}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Project Form Modal */}
      {editOpen && (
        <ProjectForm
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSubmit={onEdit}
          project={project}
          clients={clients.data || []}
          pending={updateProject.pending}
          fieldErrors={updateProject.fieldErrors}
        />
      )}

      {/* Add Task Modal */}
      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Add Task to Project">
        <form onSubmit={onCreateTask} className="space-y-4">
          <Input name="title" label="Task Title" required error={createTask.fieldErrors.title} placeholder="e.g. Implement Cart Checkout API" />
          <TextArea name="description" label="Description" rows={3} placeholder="Task instructions and criteria..." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="priority"
              label="Priority"
              defaultValue="medium"
              options={TASK_PRIORITY.map((p) => ({ value: p, label: readableStatus(p) }))}
            />
            <Select
              name="status"
              label="Initial Status"
              defaultValue="pending"
              options={TASK_STATUS.map((s) => ({ value: s, label: readableStatus(s) }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input name="dueDate" type="date" label="Due Date" />
            <Select
              name="visibleToClient"
              label="Client Visibility"
              defaultValue="true"
              options={[
                { value: 'true', label: 'Visible to Client' },
                { value: 'false', label: 'Internal Staff Only' },
              ]}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setTaskOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createTask.pending}>Add Task</Button>
          </div>
        </form>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal open={milestoneOpen} onClose={() => setMilestoneOpen(false)} title="Add Project Milestone">
        <form onSubmit={onCreateMilestone} className="space-y-4">
          <Input name="name" label="Milestone Name" required placeholder="e.g. Phase 2: Checkout & Payment Engine" />
          <TextArea name="description" label="Milestone Description" rows={3} placeholder="Milestone goals..." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="status"
              label="Status"
              defaultValue="pending"
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
            <Input name="dueDate" type="date" label="Target Date" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setMilestoneOpen(false)}>Cancel</Button>
            <Button type="submit" loading={addMilestone.pending}>Add Milestone</Button>
          </div>
        </form>
      </Modal>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={() =>
          run(
            () => archiveProject.execute(id),
            'Project archived',
            () => navigate('/admin/projects')
          )
        }
        pending={archiveProject.pending}
        title="Archive this project?"
        description="It will disappear from active workspaces for both you and the client."
        confirmLabel="Archive Project"
        tone="danger"
      />
    </div>
  );
}
