import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Trash2, Droplets, ThumbsUp, Clock, ArrowUpDown } from 'lucide-react';
import { fetchReports, upvoteIssue, getUpvotedIssueIds, subscribeToUpvotes, subscribeToIssues } from './lib/supabase';

const TYPE_CONFIG = {
  pothole: { icon: AlertTriangle, color: 'var(--issue-pothole)', label: 'Pothole', bg: '#FEF2F2' },
  garbage: { icon: Trash2, color: 'var(--issue-garbage)', label: 'Garbage', bg: '#FFFBEB' },
  water: { icon: Droplets, color: 'var(--issue-water)', label: 'Waterlogging', bg: '#EFF6FF' },
};

const SEVERITY_COLORS = {
  low: { bg: '#F0FDF4', color: '#16A34A' },
  medium: { bg: '#FFFBEB', color: '#D97706' },
  critical: { bg: '#FEF2F2', color: '#DC2626' },
};

const STATUS_MAP = {
  open: { label: 'Open', bg: '#FEF2F2', color: '#DC2626' },
  in_progress: { label: 'In Progress', bg: '#FFFBEB', color: '#D97706' },
  resolved: { label: 'Resolved', bg: '#F0FDF4', color: '#16A34A' },
};

export default function ReportsFeed() {
  const [sortBy, setSortBy] = useState('newest');
  const [filterType, setFilterType] = useState('all');
  const [reports, setReports] = useState([]);
  const [upvotedSet, setUpvotedSet] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const data = await fetchReports(sortBy, filterType);
    setReports(data);
    // Check which issues this device has upvoted
    const ids = data.map(r => r.id);
    const voted = await getUpvotedIssueIds(ids);
    setUpvotedSet(voted);
    setLoading(false);
  }, [sortBy, filterType]);

  useEffect(() => { loadReports(); }, [loadReports]);

  // Realtime: refresh on new issues or upvotes
  useEffect(() => {
    const ch1 = subscribeToIssues(() => loadReports());
    const ch2 = subscribeToUpvotes(() => loadReports());
    return () => { ch1.unsubscribe(); ch2.unsubscribe(); };
  }, [loadReports]);

  const handleUpvote = async (id) => {
    if (upvotedSet.has(id)) return; // already upvoted
    const ok = await upvoteIssue(id);
    if (ok) {
      setUpvotedSet(prev => new Set([...prev, id]));
      setReports(prev => prev.map(r => r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
    }
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pothole', label: '🚧 Pothole' },
    { key: 'garbage', label: '🗑️ Garbage' },
    { key: 'water', label: '💧 Waterlogging' },
  ];

  const sorts = [
    { key: 'newest', label: 'Newest' },
    { key: 'upvoted', label: 'Most Upvoted' },
    { key: 'critical', label: 'Critical First' },
  ];

  return (
    <div className="reports-feed">
      {/* TOP BAR */}
      <div className="reports-topbar">
        <div className="reports-sort-row">
          <ArrowUpDown size={16} color="var(--text-muted)" />
          {sorts.map(s => (
            <button
              key={s.key}
              className={`sort-btn ${sortBy === s.key ? 'active' : ''}`}
              onClick={() => setSortBy(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="reports-filter-row">
          {filters.map(f => (
            <button
              key={f.key}
              className={`filter-pill ${filterType === f.key ? 'active' : ''}`}
              onClick={() => setFilterType(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* CARDS */}
      <div className="reports-list">
        {loading && reports.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading reports...</div>
        )}
        {!loading && reports.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No reports found.</div>
        )}
        {reports.map(report => {
          const typeConf = TYPE_CONFIG[report.type] || TYPE_CONFIG.pothole;
          const Icon = typeConf.icon;
          const sevColor = SEVERITY_COLORS[report.severity] || SEVERITY_COLORS.medium;
          const statConf = STATUS_MAP[report.status] || STATUS_MAP.open;
          const isUpvoted = upvotedSet.has(report.id);

          return (
            <div key={report.id} className="report-card">
              <div className="report-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <div className="report-type-icon" style={{ backgroundColor: typeConf.bg, color: typeConf.color }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <span className="report-type-badge" style={{ backgroundColor: typeConf.bg, color: typeConf.color }}>
                        {typeConf.label}
                      </span>
                      <span className="report-severity-badge" style={{ backgroundColor: sevColor.bg, color: sevColor.color }}>
                        {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                      </span>
                      <span className="report-status-badge" style={{ backgroundColor: statConf.bg, color: statConf.color }}>
                        {statConf.label}
                      </span>
                    </div>
                    <p className="report-address">{report.address}</p>
                  </div>
                </div>
                <span className="report-time">
                  <Clock size={12} /> {report.daysAgo}d ago
                </span>
              </div>

              {report.description && <p className="report-desc">{report.description}</p>}

              <div className="report-card-footer">
                <button
                  className={`upvote-btn ${isUpvoted ? 'upvoted' : ''}`}
                  onClick={() => handleUpvote(report.id)}
                  title={isUpvoted ? 'Already upvoted' : 'Upvote this issue'}
                >
                  <ThumbsUp size={16} />
                  <span>{report.upvotes}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
