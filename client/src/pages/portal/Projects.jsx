import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderKanban, Search, Calendar, CheckSquare, Flag, ArrowRight,
  Filter, Clock, Sparkles, FileText, Zap, DollarSign, Target,
  CheckCircle2, AlertCircle, HelpCircle, User, Loader2
} from 'lucide-react';
import { useFetch } from '../../hooks/useApi.js';
import { projectApi, projectRequestApi } from '../../services/endpoints.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import PageHeader from '../../components/portal/PageHeader.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonCards } from '../../components/ui/Skeleton.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Button from '../../components/ui/Button.jsx';
import { formatDate, timeAgo } from '../../utils/format.js';

const STATUS_FILTERS = [
  { value: '', label: 'All Projects' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'planning', label: 'Planning' },
  { value: 'completed', label: 'Completed' },
  { value: 'revision', label: 'Revision' },
];

export default function PortalProjects() {
  const [activeTab, setActiveTab] = useState('my_projects'); // 'my_projects' | 'available'
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [claimingId, setClaimingId] = useState(null);
  const [claimModalProject, setClaimModalProject] = useState(null);

  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { projectClaimedCount } = useSocket();

  // 1. Fetch My Projects
  const {
    data: myProjects,
    meta,
    loading: myProjectsLoading,
    error: myProjectsError,
    refetch: refetchMyProjects,
  } = useFetch(
    () => projectApi.list({ page, limit: 12, status: status || undefined }),
    [page, status]
  );

  // 2. State & fetcher for Available Projects
  const [availableProjects, setAvailableProjects] = useState([]);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [availableError, setAvailableError] = useState(null);
  const [clientField, setClientField] = useState(user?.professionalField || '');

  const loadAvailableProjects = useCallback(async () => {
    setAvailableLoading(true);
    setAvailableError(null);
    try {
      const res = await projectRequestApi.getAvailable();
      const payload = res?.data || res;
      const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.items) ? payload.items : []);
      const field = payload?.field || user?.professionalField || '';
      setAvailableProjects(items);
      setClientField(field);
    } catch (err) {
      setAvailableError(err?.message || 'Failed to load available projects');
    } finally {
      setAvailableLoading(false);
    }
  }, [user?.professionalField]);

  useEffect(() => {
    loadAvailableProjects();
  }, [loadAvailableProjects, activeTab]);

  const refetchAvailable = loadAvailableProjects;

  // When the server confirms a project:claimed socket event (e.g. socket fires
  // while this page is already mounted), refresh both lists automatically.
  useEffect(() => {
    if (projectClaimedCount > 0) {
      refetchMyProjects();
      refetchAvailable();
    }
    // refetchMyProjects identity is stable across renders (useCallback in useFetch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectClaimedCount]);

  // Filter My Projects in-memory for live search query
  const filteredMyProjects = useMemo(() => {
    if (!myProjects) return [];
    if (!searchTerm.trim()) return myProjects;
    const term = searchTerm.toLowerCase();
    return myProjects.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term)
    );
  }, [myProjects, searchTerm]);

  // Filter Available Projects in-memory for search query
  const filteredAvailableProjects = useMemo(() => {
    if (!availableProjects) return [];
    if (!searchTerm.trim()) return availableProjects;
    const term = searchTerm.toLowerCase();
    return availableProjects.filter(
      (p) =>
        p.projectTitle?.toLowerCase().includes(term) ||
        p.projectDescription?.toLowerCase().includes(term) ||
        p.serviceField?.toLowerCase().includes(term) ||
        p.goals?.toLowerCase().includes(term)
    );
  }, [availableProjects, searchTerm]);

  // Handle Project Claiming
  const handleClaim = async (project) => {
    setClaimingId(project._id || project.id);
    try {
      const res = await projectRequestApi.claim(project._id || project.id);
      toast.success(res?.message || 'Project claimed successfully!');
      setClaimModalProject(null);
      await Promise.all([refetchAvailable(), refetchMyProjects()]);
      setActiveTab('my_projects');
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to claim project';
      toast.error(msg);
      refetchAvailable();
      setClaimModalProject(null);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Workspace"
        description="Browse assigned client deliverables or claim newly matched public project requests."
      />

      {/* Primary Tabs: My Projects vs Available Projects */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('my_projects')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              activeTab === 'my_projects'
                ? 'bg-signal-500 text-marine-950 shadow-lg shadow-signal-500/20'
                : 'border border-white/10 bg-white/5 text-marine-100/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FolderKanban size={16} />
            <span>My Projects</span>
            {myProjects?.length > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-mono font-bold ${
                activeTab === 'my_projects' ? 'bg-marine-950/20 text-marine-950' : 'bg-white/10 text-white'
              }`}>
                {myProjects.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('available')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              activeTab === 'available'
                ? 'bg-signal-500 text-marine-950 shadow-lg shadow-signal-500/20'
                : 'border border-white/10 bg-white/5 text-marine-100/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Zap size={16} className={availableProjects.length > 0 ? 'text-amber-400' : ''} />
            <span>Available Projects</span>
            {availableProjects.length > 0 && (
              <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-xs font-mono font-black text-marine-950 animate-pulse">
                {availableProjects.length} new
              </span>
            )}
          </button>
        </div>

        {/* Skill / Field Badge for Current Client */}
        {clientField ? (
          <div className="flex items-center gap-2 rounded-xl border border-signal-500/30 bg-signal-500/10 px-3.5 py-1.5 text-xs font-mono text-signal-400">
            <span className="h-2 w-2 rounded-full bg-signal-400 animate-ping" />
            <span>Matched Field: <strong>{clientField}</strong></span>
          </div>
        ) : (
          <Link
            to="/portal/profile"
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <AlertCircle size={14} />
            <span>Set your Professional Field to receive matched projects</span>
          </Link>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: MY PROJECTS                                                         */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'my_projects' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-marine-900/60 p-4 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {STATUS_FILTERS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setStatus(tab.value);
                    setPage(1);
                  }}
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
                placeholder="Search my projects..."
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
          {myProjectsLoading && <SkeletonCards count={6} />}

          {/* Error State */}
          {myProjectsError && !myProjectsLoading && (
            <ErrorState message={myProjectsError} onRetry={refetchMyProjects} />
          )}

          {/* Empty State */}
          {!myProjectsLoading && !myProjectsError && filteredMyProjects.length === 0 && (
            <EmptyState
              icon={FolderKanban}
              title={searchTerm ? 'No projects match your search' : 'No active projects'}
              description={
                searchTerm
                  ? `We couldn't find any projects matching "${searchTerm}". Try clearing your search.`
                  : status
                  ? `No projects currently match status: ${status.replace('_', ' ')}.`
                  : 'You have not claimed or been assigned any projects yet. Check the Available Projects tab to claim new work!'
              }
              action={
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab('available')}
                >
                  Browse Available Projects
                </Button>
              }
            />
          )}

          {/* Projects Grid */}
          {!myProjectsLoading && !myProjectsError && filteredMyProjects.length > 0 && (
            <>
              <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredMyProjects.map((project) => {
                  const projectId = project._id || project.id;
                  const taskStats = project.taskStats || { total: 0, completed: 0, pending: 0 };
                  const currentMilestone = project.currentMilestone;

                  return (
                    <li key={projectId} className="flex">
                      <div className="group relative flex w-full flex-col justify-between rounded-2xl border border-white/10 bg-marine-900/70 p-6 shadow-2xl backdrop-blur-md transition-all duration-200 hover:border-signal-500/40 hover:bg-marine-900/90">
                        <div>
                          {/* Card Header: Category & Status */}
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-signal-400">
                              {project.category || project.serviceField || 'Development'}
                            </span>
                            <StatusBadge status={project.status} />
                          </div>

                          {/* Title & Description */}
                          <h3 className="mt-3 font-display text-lg font-bold text-white transition-colors group-hover:text-signal-300">
                            <Link to={`/portal/projects/${projectId}`}>
                              {project.name}
                            </Link>
                          </h3>
                          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-marine-100/70">
                            {project.description || 'No description provided.'}
                          </p>

                          {/* Progress Bar */}
                          <div className="mt-5">
                            <ProgressBar value={project.progress || 0} size="md" />
                          </div>

                          {/* Key Project Meta Items */}
                          <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-marine-100/70 font-mono">
                            {/* Start Date */}
                            {project.startDate && (
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-marine-100/50">
                                  <Calendar size={13} className="text-signal-400" /> Start Date
                                </span>
                                <span className="text-white">
                                  {formatDate(project.startDate)}
                                </span>
                              </div>
                            )}

                            {/* Task Count */}
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-marine-100/50">
                                <CheckSquare size={13} className="text-signal-400" /> Deliverables
                              </span>
                              <span className="font-semibold text-white">
                                {taskStats.completed} / {taskStats.total} tasks done
                              </span>
                            </div>

                            {/* Current Milestone */}
                            {currentMilestone && (
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-marine-100/50">
                                  <Flag size={13} className="text-signal-400" /> Milestone
                                </span>
                                <span className="truncate max-w-[170px] text-right font-medium text-white" title={currentMilestone.name}>
                                  {currentMilestone.name}
                                </span>
                              </div>
                            )}

                            {/* Client / Customer */}
                            {(project.customerName || project.customerEmail || project.client?.name) && (
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-marine-100/50">
                                  <User size={13} className="text-signal-400" /> Client / Customer
                                </span>
                                <span className="truncate max-w-[170px] text-right font-medium text-white" title={project.customerName || project.client?.name}>
                                  {project.customerName || project.client?.name || project.customerEmail}
                                </span>
                              </div>
                            )}

                            {/* Dates */}
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-marine-100/50">
                                <Calendar size={13} className="text-signal-400" /> Deadline
                              </span>
                              <span className="text-white">
                                {project.dueDate ? formatDate(project.dueDate) : 'Open Timeline'}
                              </span>
                            </div>

                            {/* Last activity */}
                            <div className="flex items-center justify-between text-[11px] text-marine-100/40">
                              <span className="flex items-center gap-1.5">
                                <Clock size={12} /> Last activity
                              </span>
                              <span>{timeAgo(project.updatedAt || project.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* View Project Button */}
                        <div className="mt-6 border-t border-white/10 pt-4">
                          <Button
                            as={Link}
                            to={`/portal/projects/${projectId}`}
                            variant="primary"
                            size="sm"
                            icon={ArrowRight}
                            className="w-full justify-center"
                          >
                            View Project
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <Pagination meta={meta} onChange={setPage} />
            </>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: AVAILABLE PROJECTS (MATCHED & CLAIMABLE)                            */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          {/* Missing Field Banner */}
          {!clientField && (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 shrink-0 text-amber-400" size={20} />
                <div>
                  <h4 className="font-semibold text-white">No Professional Field configured</h4>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    Select your primary expertise in your profile (e.g. Web Development, UI/UX Design) to view matching incoming projects.
                  </p>
                </div>
              </div>
              <Button as={Link} to="/portal/profile" size="sm" variant="primary">
                Update Profile
              </Button>
            </div>
          )}

          {/* Search & Action Bar for Available Projects */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-marine-900/60 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-marine-100/70 font-mono">
              <Sparkles size={14} className="text-signal-400" />
              <span>
                Showing projects matching <strong className="text-white">{clientField || 'your field'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative min-w-[200px] sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-marine-100/40" />
                <input
                  type="text"
                  placeholder="Search available..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-marine-950/80 py-1.5 pl-8 pr-4 text-xs text-white placeholder:text-marine-100/30 focus:border-signal-400 focus:outline-none"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchAvailable()}
                className="py-1.5 text-xs font-mono"
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {availableLoading && <SkeletonCards count={3} />}

          {/* Error State */}
          {availableError && !availableLoading && (
            <ErrorState message={availableError} onRetry={refetchAvailable} />
          )}

          {/* Empty State */}
          {!availableLoading && !availableError && filteredAvailableProjects.length === 0 && (
            <EmptyState
              icon={Zap}
              title="No Available Projects Right Now"
              description={
                clientField
                  ? `There are currently no unclaimed project requests in ${clientField}. As soon as a customer submits a new ${clientField} request, it will appear here in real-time!`
                  : 'Please configure your professional field in your profile settings.'
              }
              action={
                <Button variant="outline" size="sm" onClick={() => refetchAvailable()}>
                  Refresh Marketplace
                </Button>
              }
            />
          )}

          {/* Available Projects Cards Grid */}
          {!availableLoading && !availableError && filteredAvailableProjects.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredAvailableProjects.map((req) => {
                const reqId = req._id || req.id;
                const isClaiming = claimingId === reqId;

                return (
                  <div
                    key={reqId}
                    className="group relative flex flex-col justify-between rounded-2xl border border-signal-500/20 bg-gradient-to-b from-marine-900/90 to-marine-950 p-6 shadow-2xl backdrop-blur-md transition-all duration-200 hover:border-signal-500/60 hover:shadow-signal-500/10"
                  >
                    <div>
                      {/* Top Header: Badge & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-lg bg-signal-500/15 border border-signal-500/30 px-2.5 py-1 text-[11px] font-mono font-bold text-signal-400">
                          {req.serviceField}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Available
                        </span>
                      </div>

                      {/* Project Title */}
                      <h3 className="mt-3 font-display text-lg font-bold text-white group-hover:text-signal-300 transition-colors">
                        {req.projectTitle}
                      </h3>

                      {/* Description */}
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-marine-100/80">
                        {req.projectDescription || 'No description provided.'}
                      </p>

                      {/* Project Goals */}
                      {req.goals && (
                        <div className="mt-3 rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-marine-100/70">
                          <div className="flex items-center gap-1.5 font-semibold text-white mb-1">
                            <Target size={13} className="text-signal-400" />
                            <span>Primary Goals:</span>
                          </div>
                          <p className="line-clamp-2 text-xs italic">{req.goals}</p>
                        </div>
                      )}

                      {/* Meta Tags: Budget, Deadline, Created */}
                      <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs font-mono text-marine-100/70">
                        {req.budget && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-marine-100/50">
                              <DollarSign size={13} className="text-emerald-400" /> Budget
                            </span>
                            <span className="font-bold text-emerald-300">{req.budget}</span>
                          </div>
                        )}

                        {req.deadline && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-marine-100/50">
                              <Calendar size={13} className="text-signal-400" /> Target Deadline
                            </span>
                            <span className="text-white">{formatDate(req.deadline)}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-marine-100/40">
                          <span className="flex items-center gap-1.5">
                            <Clock size={12} /> Posted
                          </span>
                          <span>{timeAgo(req.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Claim Button */}
                    <div className="mt-6 border-t border-white/10 pt-4">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Zap}
                        loading={isClaiming}
                        onClick={() => setClaimModalProject(req)}
                        className="w-full justify-center shadow-lg shadow-signal-500/20 font-bold"
                      >
                        Claim Project
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Claim Confirmation Modal ────────────────────────────────────────── */}
      {claimModalProject && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setClaimModalProject(null)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-marine-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-signal-500/20 text-signal-400">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Claim this Project?</h3>
                <p className="text-xs text-marine-100/60 font-mono">{claimModalProject.serviceField}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-marine-900/60 p-4 space-y-2">
              <h4 className="font-semibold text-white text-sm">{claimModalProject.projectTitle}</h4>
              <p className="text-xs text-marine-100/70">{claimModalProject.projectDescription}</p>
              {claimModalProject.budget && (
                <p className="text-xs font-mono text-emerald-400">Budget: {claimModalProject.budget}</p>
              )}
            </div>

            <p className="mt-4 text-xs text-marine-100/60 leading-relaxed">
              Claiming this project will atomically assign it to your account, create your dedicated workspace, and remove it from other clients' available feeds.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClaimModalProject(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Zap}
                loading={claimingId === (claimModalProject._id || claimModalProject.id)}
                onClick={() => handleClaim(claimModalProject)}
              >
                Confirm & Claim
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
