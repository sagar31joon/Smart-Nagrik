import { useState, useEffect, useCallback } from 'react';
import { Eye, Trash2, X, Loader, ImageOff } from 'lucide-react';
import { fetchAllIssues, fetchActiveCities, updateIssueStatus, deleteIssue, bulkUpdateStatus, bulkDeleteIssues, fetchChainByWard } from '../lib/supabase';

export default function Issues() {
  const [issues, setIssues] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ cityId: '', type: '', status: '', severity: '' });
  const [selected, setSelected] = useState(new Set());
  const [detailIssue, setDetailIssue] = useState(null);
  const [detailChain, setDetailChain] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [fullscreenPhoto, setFullscreenPhoto] = useState(null);

  useEffect(() => { fetchActiveCities().then(setCities); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllIssues({
      cityId: filters.cityId || undefined,
      type: filters.type || undefined,
      status: filters.status || undefined,
      severity: filters.severity || undefined,
    });
    setIssues(data);
    setSelected(new Set());
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (issue, newStatus) => {
    setUpdatingId(issue.id);
    try {
      await updateIssueStatus(issue.id, newStatus);
      setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, status: newStatus } : i));
    } catch (err) { alert('Error: ' + err.message); }
    setUpdatingId(null);
  };

  const handleDelete = async (issue) => {
    if (!window.confirm(`Delete this ${issue.type} issue at "${issue.address}"?`)) return;
    try {
      await deleteIssue(issue.id, issue.photo_url);
      setIssues(prev => prev.filter(i => i.id !== issue.id));
    } catch (err) { alert('Error: ' + err.message); }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === issues.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(issues.map(i => i.id)));
    }
  };

  const handleBulkStatus = async (status) => {
    if (!window.confirm(`Change ${selected.size} issues to "${status}"?`)) return;
    try {
      await bulkUpdateStatus([...selected], status);
      await load();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selected.size} issues?`)) return;
    try {
      const toDelete = issues.filter(i => selected.has(i.id));
      await bulkDeleteIssues(toDelete);
      await load();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const openDetail = async (issue) => {
    setDetailIssue(issue);
    if (issue.ward_id) {
      const chain = await fetchChainByWard(issue.ward_id);
      setDetailChain(chain);
    } else {
      setDetailChain([]);
    }
  };

  const openGoogleMaps = (lat, lng) => {
    if (window.confirm('Open this location in Google Maps?')) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Issues</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{issues.length} total</span>
      </div>

      {/* FILTERS */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>City</label>
          <select className="form-select" value={filters.cityId} onChange={e => setFilters({ ...filters, cityId: e.target.value })}>
            <option value="">All Cities</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Type</label>
          <select className="form-select" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
            <option value="">All</option>
            <option value="pothole">Pothole</option>
            <option value="garbage">Garbage</option>
            <option value="water">Waterlogging</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select className="form-select" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Severity</label>
          <select className="form-select" value={filters.severity} onChange={e => setFilters({ ...filters, severity: e.target.value })}>
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* BULK BAR */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <div className="bulk-bar-left">{selected.size} selected</div>
          <div className="bulk-bar-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkStatus('open')}>→ Open</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkStatus('in_progress')}>→ In Progress</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkStatus('resolved')}>→ Resolved</button>
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <button className="checkbox" style={{ width: '14px', height: '14px' }} onClick={toggleAll}>
                  {selected.size === issues.length && issues.length > 0 && <span style={{ color: 'var(--primary)', fontSize: '8px' }}>✓</span>}
                </button>
              </th>
              <th>Photo</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Location</th>
              <th>Ward</th>
              <th>City</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading...</td></tr>
            ) : issues.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No issues found</td></tr>
            ) : issues.map(issue => (
              <tr key={issue.id}>
                <td>
                  <button className={`checkbox ${selected.has(issue.id) ? 'checked' : ''}`} onClick={() => toggleSelect(issue.id)} />
                </td>
                <td>
                  {issue.photo_url ? (
                    <img src={issue.photo_url} alt="" className="photo-thumb" />
                  ) : (
                    <div className="photo-thumb-placeholder"><ImageOff size={14} /></div>
                  )}
                </td>
                <td><span className={`badge badge-${issue.type}`}>{issue.type}</span></td>
                <td><span className={`badge badge-${issue.severity}`}>{issue.severity}</span></td>
                <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                  {issue.address}
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {issue.wards ? `#${issue.wards.number}` : '—'}
                </td>
                <td style={{ fontSize: '0.8rem' }}>{issue.cities?.name || '—'}</td>
                <td>
                  <select
                    className="status-select"
                    value={issue.status}
                    onChange={e => handleStatusChange(issue, e.target.value)}
                    disabled={updatingId === issue.id}
                    style={{
                      color: issue.status === 'resolved' ? '#10B981' : issue.status === 'in_progress' ? '#F59E0B' : '#EF4444'
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {new Date(issue.created_at).toLocaleDateString()}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openDetail(issue)} style={{ padding: '0.25rem 0.5rem' }}>
                      <Eye size={14} />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(issue)} style={{ padding: '0.25rem 0.5rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      {detailIssue && (
        <div className="modal-overlay" onClick={() => setDetailIssue(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Issue Detail</h3>
              <button onClick={() => setDetailIssue(null)}><X size={20} color="var(--text-muted)" /></button>
            </div>
            <div className="modal-body">
              {detailIssue.photo_url && (
                <img 
                  src={detailIssue.photo_url} 
                  alt="Issue" 
                  className="detail-photo" 
                  style={{ cursor: 'zoom-in' }}
                  onClick={() => setFullscreenPhoto(detailIssue.photo_url)}
                />
              )}
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Type</label>
                  <span><span className={`badge badge-${detailIssue.type}`}>{detailIssue.type}</span></span>
                </div>
                <div className="detail-item">
                  <label>Severity</label>
                  <span><span className={`badge badge-${detailIssue.severity}`}>{detailIssue.severity}</span></span>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <span><span className={`badge badge-${detailIssue.status}`}>{detailIssue.status.replace('_', ' ')}</span></span>
                </div>
                <div className="detail-item">
                  <label>Upvotes</label>
                  <span>{detailIssue.upvotes}</span>
                </div>
                <div className="detail-item">
                  <label>City</label>
                  <span>{detailIssue.cities?.name || '—'}</span>
                </div>
                <div className="detail-item">
                  <label>Ward</label>
                  <span>{detailIssue.wards ? `#${detailIssue.wards.number} — ${detailIssue.wards.area_name}` : '—'}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  <span 
                    style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => openGoogleMaps(detailIssue.latitude, detailIssue.longitude)}
                  >
                    {detailIssue.address}
                  </span>
                </div>
              </div>
              {detailIssue.description && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Description</label>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{detailIssue.description}</p>
                </div>
              )}
              {detailChain.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Accountability Chain</label>
                  <div style={{ background: 'var(--bg-body)', borderRadius: 'var(--radius)', padding: '0.75rem' }}>
                    {detailChain.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{c.role.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PHOTO */}
      {fullscreenPhoto && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
          onClick={() => setFullscreenPhoto(null)}
        >
          <img src={fullscreenPhoto} style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} alt="Fullscreen" />
        </div>
      )}
    </div>
  );
}
