import { useState } from 'react';
import Modal from '../../components/ui/Modal.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input, TextArea, Select } from '../../components/ui/Field.jsx';
import { PROJECT_STATUS, SERVICES } from '../../utils/constants.js';
import { readableStatus } from '../../utils/format.js';

/* Used for both create and edit: `project` decides which. */
export default function ProjectForm({ open, onClose, onSubmit, project, clients, pending, fieldErrors = {} }) {
  const [form, setForm] = useState(() => ({
    name: project?.name || '',
    description: project?.description || '',
    client: project?.client?._id || project?.client || '',
    category: project?.category || SERVICES[0].name,
    technologies: (project?.technologies || []).join(', '),
    status: project?.status || 'planning',
    progress: project?.progress ?? 0,
    dueDate: project?.dueDate ? project.dueDate.slice(0, 10) : '',
    demoUrl: project?.demoUrl || '',
    isPublic: project?.isPublic || false,
  }));

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      progress: Number(form.progress),
      technologies: form.technologies.split(',').map((t) => t.trim()).filter(Boolean),
      dueDate: form.dueDate || undefined,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={project ? 'Edit project' : 'New project'} size="lg">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input name="name" label="Project name" required value={form.name} onChange={update('name')} error={fieldErrors.name} />
        </div>
        <div className="sm:col-span-2">
          <TextArea name="description" label="Description" required rows={3} value={form.description}
            onChange={update('description')} error={fieldErrors.description} />
        </div>
        <Select
          name="client" label="Client" required value={form.client} onChange={update('client')} error={fieldErrors.client}
          options={[{ value: '', label: 'Select a client' }, ...clients.map((c) => ({ value: c._id, label: `${c.name}${c.company ? ` — ${c.company}` : ''}` }))]}
        />
        <Select
          name="category" label="Category" value={form.category} onChange={update('category')}
          options={SERVICES.map((s) => ({ value: s.name, label: s.name }))}
        />
        <Select
          name="status" label="Status" value={form.status} onChange={update('status')}
          options={PROJECT_STATUS.map((s) => ({ value: s, label: readableStatus(s) }))}
        />
        <Input name="progress" type="number" min="0" max="100" label="Progress (%)" value={form.progress} onChange={update('progress')} error={fieldErrors.progress} />
        <Input name="dueDate" type="date" label="Due date" value={form.dueDate} onChange={update('dueDate')} error={fieldErrors.dueDate} />
        <Input name="demoUrl" label="Live URL" placeholder="https://" value={form.demoUrl} onChange={update('demoUrl')} />
        <div className="sm:col-span-2">
          <Input name="technologies" label="Technologies" hint="Comma separated, e.g. React, Node.js, Firebase"
            value={form.technologies} onChange={update('technologies')} />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={form.isPublic} onChange={update('isPublic')} className="h-4 w-4 rounded border-mist-200" />
          Show this project in the public portfolio
        </label>

        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={pending}>{project ? 'Save changes' : 'Create project'}</Button>
        </div>
      </form>
    </Modal>
  );
}
