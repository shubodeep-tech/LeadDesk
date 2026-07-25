import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import {
  Users,
  UserPlus,
  PhoneCall,
  CheckCircle2,
  Search,
  RefreshCw,
  Trash2,
  LogOut,
  ChevronDown,
  CalendarDays,
  Mail,
  DollarSign,
  MessageSquare,
  LayoutDashboard,
} from "lucide-react";

const STATUSES = ['New', 'Contacted', 'Closed'];

const statusStyles = {
  New:       'badge badge-new',
  Contacted: 'badge badge-contacted',
  Closed:    'badge badge-closed',
};

const statusDot = {
  New:       'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)]',
  Contacted: 'bg-amber-400',
  Closed:    'bg-emerald-400',
};

function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const [leads,      setLeads]      = useState([]);
  const [stats,      setStats]      = useState({ Total: 0, New: 0, Contacted: 0, Closed: 0 });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null); // { id, name }
  const [lastUpdated, setLastUpdated] = useState(null);

  const searchTimer = useRef(null);

  // ── Fetch leads ──────────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async (page = 1, q = search, s = filter, skeleton = true) => {
    if (skeleton) setLoading(true);
    try {
      const { data } = await api.get('/leads/admin', { params: { search: q, status: s, page, limit: 15 } });
      if (data.success) {
        setLeads(data.data);
        setStats(data.stats);
        setPagination(data.pagination);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        toast.error('Failed to load leads. Is the server running?');
      }
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => { fetchLeads(1, '', '', true); }, []);  // eslint-disable-line

  // ── Search debounce ──────────────────────────────────────────────────────────
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchLeads(1, val, filter, false), 350);
  };

  // ── Filter ───────────────────────────────────────────────────────────────────
  const handleFilter = (val) => {
    setFilter(val);
    fetchLeads(1, search, val, false);
  };

  // ── Stat card click filter ───────────────────────────────────────────────────
  const toggleStatFilter = (s) => {
    const next = filter === s ? '' : s;
    setFilter(next);
    fetchLeads(1, search, next, false);
  };

  // ── Update status ────────────────────────────────────────────────────────────
  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.patch(`/leads/admin/${id}/status`, { status });
      setLeads((prev) => prev.map((l) => l._id === id ? { ...l, status } : l));
      // Refresh stats silently
      const { data } = await api.get('/leads/admin', { params: { search, status: filter, page: pagination.page, limit: 15 } });
      if (data.success) setStats(data.stats);
      toast.success(`Marked as "${status}"`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Delete lead ──────────────────────────────────────────────────────────────
  const deleteLead = async () => {
    if (!deleteModal) return;
    const { id } = deleteModal;
    setDeleteModal(null);
    try {
      await api.delete(`/leads/admin/${id}`);
      toast.success('Lead deleted.');
      fetchLeads(pagination.page <= 1 || leads.length > 1 ? pagination.page : pagination.page - 1, search, filter, false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete lead.');
    }
  };

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully.');
    navigate('/admin/login', { replace: true });
  };

  // ── Stat card definitions (moved out of JSX — was previously an invalid
  //    `const` declaration nested inside a JSX expression) ────────────────────
  const statCards = [
    {
      key: "Total",
      label: "Total Leads",
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      clickable: false,
    },
    {
      key: "New",
      label: "New Leads",
      icon: UserPlus,
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/20",
      clickable: true,
    },
    {
      key: "Contacted",
      label: "Contacted",
      icon: PhoneCall,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      clickable: true,
    },
    {
      key: "Closed",
      label: "Closed",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      clickable: true,
    },
  ];

  // ── Skeleton rows ────────────────────────────────────────────────────────────
  const SkeletonRows = () => (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          {[...Array(6)].map((__, j) => (
            <td key={j} className="px-5 py-4">
              <div className="skeleton h-4 rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-[#080c18] flex">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="fixed top-0 left-0 h-full w-56 bg-[#0b0e1a] border-r border-white/[0.06] flex flex-col z-40">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-6 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span className="font-bold text-base tracking-tight">LeadDesk</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 pt-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-2">Main</p>
          <a href="#" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-brand-500/10 text-brand-400 text-sm font-medium relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-500 rounded-r-full" />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            All Leads
            <span className="ml-auto bg-brand-500/20 text-brand-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{stats.Total}</span>
          </a>
        </nav>

        {/* Admin + logout */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.03] mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{admin?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 truncate">{admin?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="ml-56 flex-1 p-8 flex flex-col gap-7 min-h-screen">

        {/* Topbar */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight ">Lead Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : 'Loading…'}
            </p>
          </div>
          <button onClick={() => fetchLeads(pagination.page, search, filter, false)}
            className="btn-ghost text-xs px-3 py-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(
            ({ key, label, icon: Icon, color, bg, border, clickable }) => (
              <button
                key={key}
                onClick={() => clickable && toggleStatFilter(key)}
                disabled={!clickable}
                className={`glass-card p-5 flex items-center gap-4 transition-all duration-300
                ${
                  clickable
                    ? "hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                    : "cursor-default"
                }
                ${
                  filter === key
                    ? "border-brand-500/40 bg-brand-500/[0.06]"
                    : ""
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${bg} ${border}`}
                >
                  <Icon className={`w-7 h-7 ${color}`} />
                </div>

                <div>
                  <h2 className="text-3xl font-black">{stats[key]}</h2>
                  <p className="text-sm text-slate-400">{label}</p>
                </div>
              </button>
            )
          )}
        </div>

        {/* Toolbar */}
        <div className="flex gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text" value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name, email, or message…"
              className="input-field pl-9 text-sm"
            />
            {search && (
              <button onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          {/* Status filter */}
          <div className="relative">
            <select value={filter} onChange={(e) => handleFilter(e.target.value)}
              className="input-field pr-8 text-sm appearance-none cursor-pointer min-w-[160px]">
              <option value="">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6,9 12,15 18,9"/></svg>
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  {['Lead', 'Budget', 'Message', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? <SkeletonRows /> : leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-500">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-3xl">👥</div>
                        <div>
                          <p className="font-semibold text-slate-300">{search || filter ? 'No matches found' : 'No leads yet'}</p>
                          <p className="text-xs mt-1">{search || filter ? 'Try adjusting your search or filter.' : 'Submit the contact form to see leads here.'}</p>
                        </div>
                        {!search && !filter && (
                          <a href="/" target="_blank" rel="noreferrer"
                            className="btn-primary text-xs px-4 py-2.5">Go to Public Form</a>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Lead info */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-sm text-slate-100">{lead.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{lead.email}</p>
                    </td>
                    {/* Budget */}
                    <td className="px-5 py-4">
                      <span className="bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                        {lead.budgetRange}
                      </span>
                    </td>
                    {/* Message excerpt */}
                    <td className="px-5 py-4 max-w-[200px]">
                      <p className="text-xs text-slate-400 truncate" title={lead.message}>{lead.message}</p>
                    </td>
                    {/* Status badge */}
                    <td className="px-5 py-4">
                      <span className={statusStyles[lead.status]}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[lead.status]}`} />
                        {lead.status}
                      </span>
                    </td>
                    {/* Date */}
                    <td className="px-5 py-4">
                      <p className="text-xs text-slate-500 whitespace-nowrap">{formatDate(lead.createdAt)}</p>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* Status select */}
                        <div className="relative">
                          <select
                            value={lead.status}
                            disabled={updatingId === lead._id}
                            onChange={(e) => updateStatus(lead._id, e.target.value)}
                            className="text-xs bg-white/[0.04] border border-white/[0.08] text-slate-300 rounded-lg pl-2.5 pr-7 py-1.5 appearance-none cursor-pointer hover:border-white/[0.14] transition-colors focus:outline-none focus:border-brand-500/50 disabled:opacity-50">
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                            {updatingId === lead._id
                              ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6,9 12,15 18,9"/></svg>
                            }
                          </span>
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={() => setDeleteModal({ id: lead._id, name: lead.name })}
                          className="w-7 h-7 rounded-lg border border-white/[0.06] flex items-center justify-center text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all opacity-0 group-hover:opacity-100">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="border-t border-white/[0.06] px-5 py-4 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Showing {leads.length} of {pagination.total} leads
              </p>
              <div className="flex items-center gap-1.5">
                <button disabled={pagination.page <= 1}
                  onClick={() => fetchLeads(pagination.page - 1, search, filter, false)}
                  className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400 flex items-center justify-center hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
                </button>
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button key={p}
                    onClick={() => fetchLeads(p, search, filter, false)}
                    className={`w-8 h-8 rounded-lg border text-xs font-semibold transition-all
                      ${pagination.page === p
                        ? 'bg-brand-500/20 border-brand-500/40 text-brand-400'
                        : 'border-white/[0.08] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08]'}`}>
                    {p}
                  </button>
                ))}
                <button disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchLeads(pagination.page + 1, search, filter, false)}
                  className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400 flex items-center justify-center hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Delete Modal ─────────────────────────────────────────────────── */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setDeleteModal(null)}>
          <div className="bg-[#0f1525] border border-white/[0.08] rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center gap-4 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">Delete Lead</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-slate-200">"{deleteModal.name}"</span>? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 w-full mt-1">
              <button onClick={() => setDeleteModal(null)}
                className="flex-1 btn-ghost">Cancel</button>
              <button onClick={deleteLead}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-rose-500/30">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}