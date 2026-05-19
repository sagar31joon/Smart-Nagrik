import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Trash2, Droplets, ChevronDown, ChevronUp, ArrowUpDown, Clock, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWards, fetchWardIssues } from './lib/supabase';

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

export default function WardsDashboard() {
  const [sortBy, setSortBy] = useState('most-issues');
  const [expandedWard, setExpandedWard] = useState(null);
  const [wards, setWards] = useState([]);
  const [wardIssues, setWardIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingIssues, setLoadingIssues] = useState(false);

  useEffect(() => {
    fetchWards().then(data => { setWards(data); setLoading(false); });
  }, []);

  // Load issues when a ward is expanded
  useEffect(() => {
    if (expandedWard) {
      setLoadingIssues(true);
      fetchWardIssues(expandedWard).then(data => { setWardIssues(data); setLoadingIssues(false); });
    } else {
      setWardIssues([]);
    }
  }, [expandedWard]);

  const sorted = [...wards].sort((a, b) => {
    const totalA = a.issues.pothole + a.issues.garbage + a.issues.water;
    const totalB = b.issues.pothole + b.issues.garbage + b.issues.water;
    if (sortBy === 'most-issues') return totalB - totalA;
    if (sortBy === 'least-resolved') return a.resolved - b.resolved;
    return 0;
  });

  const getBarColor = (pct) => {
    if (pct < 30) return 'var(--issue-pothole)';
    if (pct < 60) return 'var(--issue-garbage)';
    return 'var(--issue-resolved)';
  };

  return (
    <div className="wards-dashboard">
      <div className="wards-header">
        <h1 className="wards-title">Gurgaon Wards</h1>
        <p className="wards-subtitle">Know your area. Know who's responsible.</p>
        <div className="wards-sort-row">
          <ArrowUpDown size={16} color="var(--text-muted)" />
          <button className={`sort-btn ${sortBy === 'most-issues' ? 'active' : ''}`} onClick={() => setSortBy('most-issues')}>
            Most Issues
          </button>
          <button className={`sort-btn ${sortBy === 'least-resolved' ? 'active' : ''}`} onClick={() => setSortBy('least-resolved')}>
            Least Resolved
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading wards...</div>
      )}

      <div className="wards-grid">
        {sorted.map(ward => {
          const isExpanded = expandedWard === ward.id;

          return (
            <div key={ward.id} className="ward-card-wrapper">
              <div
                className={`ward-card ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedWard(isExpanded ? null : ward.id)}
              >
                <div className="ward-card-top">
                  <div>
                    <h3 className="ward-name">Ward {ward.number} — {ward.area_name}</h3>
                    <p className="ward-area">{ward.sector}</p>
                  </div>
                  {isExpanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
                </div>

                <div className="ward-officials">
                  <span>Councillor: <strong>{ward.councillor_name}</strong></span>
                  <span>MLA: <strong>{ward.mla_name}</strong></span>
                </div>

                <div className="ward-issue-pills">
                  <span className="issue-pill" style={{ backgroundColor: '#FEF2F2', color: 'var(--issue-pothole)' }}>
                    🚧 {ward.issues.pothole}
                  </span>
                  <span className="issue-pill" style={{ backgroundColor: '#FFFBEB', color: 'var(--issue-garbage)' }}>
                    🗑️ {ward.issues.garbage}
                  </span>
                  <span className="issue-pill" style={{ backgroundColor: '#EFF6FF', color: 'var(--issue-water)' }}>
                    💧 {ward.issues.water}
                  </span>
                </div>

                <div className="ward-resolution">
                  <div className="resolution-bar-bg">
                    <div
                      className="resolution-bar-fill"
                      style={{ width: `${ward.resolved}%`, backgroundColor: getBarColor(ward.resolved) }}
                    />
                  </div>
                  <span className="resolution-pct" style={{ color: getBarColor(ward.resolved) }}>
                    {ward.resolved}% resolved
                  </span>
                </div>
              </div>

              {/* Expanded Detail View */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="ward-expanded-reports">
                      <h4 className="ward-reports-title">Issues in Ward {ward.number}</h4>
                      
                      {loadingIssues && (
                        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>
                      )}
                      
                      {!loadingIssues && wardIssues.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No issues reported in this ward.</div>
                      )}
                      
                      {!loadingIssues && wardIssues.map(report => {
                        const typeConf = TYPE_CONFIG[report.type] || TYPE_CONFIG.pothole;
                        const Icon = typeConf.icon;
                        const sevColor = SEVERITY_COLORS[report.severity] || SEVERITY_COLORS.medium;
                        const statConf = STATUS_MAP[report.status] || STATUS_MAP.open;

                        return (
                          <div key={report.id} className="report-card compact">
                            <div className="report-card-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                <div className="report-type-icon" style={{ backgroundColor: typeConf.bg, color: typeConf.color }}>
                                  <Icon size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                    <span className="report-type-badge" style={{ backgroundColor: typeConf.bg, color: typeConf.color }}>{typeConf.label}</span>
                                    <span className="report-severity-badge" style={{ backgroundColor: sevColor.bg, color: sevColor.color }}>
                                      {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                                    </span>
                                    <span className="report-status-badge" style={{ backgroundColor: statConf.bg, color: statConf.color }}>{statConf.label}</span>
                                  </div>
                                  <p className="report-address">{report.address}</p>
                                </div>
                              </div>
                              <span className="report-time"><Clock size={12} /> {report.daysAgo}d</span>
                            </div>
                            {report.description && <p className="report-desc">{report.description}</p>}
                            <div className="report-card-footer">
                              <button className="upvote-btn">
                                <ThumbsUp size={14} />
                                <span>{report.upvotes}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
