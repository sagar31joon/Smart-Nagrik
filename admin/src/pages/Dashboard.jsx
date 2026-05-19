import { useState, useEffect } from 'react';
import { Building2, LandPlot, FileText, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
import { fetchDashboardStats, fetchRecentIssues } from '../lib/supabase';

const STAT_CARDS = [
  { key: 'cities', label: 'Total Cities', icon: Building2, color: '#3B82F6' },
  { key: 'wards', label: 'Total Wards', icon: LandPlot, color: '#8B5CF6' },
  { key: 'issues', label: 'Total Issues', icon: FileText, color: '#E8600A' },
  { key: 'open', label: 'Open Issues', icon: AlertCircle, color: '#EF4444' },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2, color: '#10B981' },
];

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState({ cities: 0, wards: 0, issues: 0, open: 0, resolved: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchDashboardStats(), fetchRecentIssues()]).then(([s, r]) => {
      setStats(s);
      setRecent(r);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <div className="page-header-actions">
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('cities')}>
            <Plus size={16} /> Add City
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('wards')}>
            <Plus size={16} /> Add Ward
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {STAT_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="stat-card">
              <div className="stat-card-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Icon size={14} color={card.color} />
                {card.label}
              </div>
              <div className="stat-card-value" style={{ color: card.color }}>
                {loading ? '—' : stats[card.key]}
              </div>
            </div>
          );
        })}
      </div>

      <div className="data-table-wrapper">
        <div className="data-table-header">
          <h3>Recent Issues</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('issues')}>View All</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Severity</th>
              <th>Location</th>
              <th>City</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : recent.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No issues yet</td></tr>
            ) : recent.map(issue => (
              <tr key={issue.id}>
                <td><span className={`badge badge-${issue.type}`}>{issue.type}</span></td>
                <td><span className={`badge badge-${issue.severity}`}>{issue.severity}</span></td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.address}</td>
                <td>{issue.cities?.name || '—'}</td>
                <td><span className={`badge badge-${issue.status}`}>{issue.status.replace('_', ' ')}</span></td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(issue.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
