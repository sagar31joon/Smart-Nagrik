import { MapPin, LayoutDashboard, Building2, FileText, LandPlot, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, emoji: '📊' },
  { key: 'cities', label: 'Cities', icon: Building2, emoji: '🏙️' },
  { key: 'wards', label: 'Wards', icon: LandPlot, emoji: '🏛️' },
  { key: 'issues', label: 'Issues', icon: FileText, emoji: '📋' },
];

export default function Sidebar({ activePage, onNavigate, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="icon" style={{ flexShrink: 0 }}><MapPin size={20} color="#E8600A" fill="#E8600A" stroke="white" /></span>
          <h1>Smart Nagrik</h1>
        </div>
        <div className="sidebar-brand-tag">Admin Panel</div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              className={`sidebar-link ${activePage === item.key ? 'active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <span className="icon"><Icon size={18} /></span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <span className="icon" style={{ flexShrink: 0, width: '24px', display: 'flex', justifyContent: 'center' }}><LogOut size={18} /></span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
