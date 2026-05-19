import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, X, Share2, AlertTriangle, Trash2, Droplets, Map as MapIcon, FileText, Building2 } from 'lucide-react';
import MapGL, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';
import ReportModal from './ReportModal';
import ReportsFeed from './ReportsFeed';
import WardsDashboard from './WardsDashboard';
import gurugramBoundaryGeometry from './gurugram_boundary.json';
import { fetchIssuesGeoJSON, fetchIssueStats, fetchAccountability, subscribeToIssues, getCurrentCity } from './lib/supabase';

// --- CONFIG ---
const GURGAON_CENTER = { latitude: 28.4595, longitude: 77.0266, zoom: 11 };

const GURGAON_BOUNDARY = {
  type: 'Feature',
  geometry: gurugramBoundaryGeometry
};

const GURGAON_MASK = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [[-180, 85], [180, 85], [180, -85], [-180, -85], [-180, 85]],
      GURGAON_BOUNDARY.geometry.coordinates[0]
    ]
  }
};

// --- MAP LAYER STYLES ---
const clusterLayer = {
  id: 'clusters', type: 'circle', source: 'issues',
  filter: ['has', 'point_count'],
  paint: {
    'circle-color': ['step', ['get', 'point_count'], '#D7CCC8', 10, '#A1887F', 50, '#5D4037'],
    'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 50, 40],
    'circle-stroke-width': 2, 'circle-stroke-color': '#fff'
  }
};

const clusterCountLayer = {
  id: 'cluster-count', type: 'symbol', source: 'issues',
  filter: ['has', 'point_count'],
  layout: { 'text-field': '{point_count_abbreviated}', 'text-font': ['Open Sans Bold'], 'text-size': 14 },
  paint: { 'text-color': '#fff' }
};

const unclusteredPointLayer = {
  id: 'unclustered-point', type: 'circle', source: 'issues',
  filter: ['!', ['has', 'point_count']],
  paint: {
    'circle-color': ['match', ['get', 'type'], 'garbage', '#D97706', 'water', '#3B82F6', 'pothole', '#EF4444', '#ccc'],
    'circle-radius': 8, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff'
  }
};

// --- TAB CONFIG ---
const TABS = [
  { key: 'map', label: 'Map', icon: MapIcon, emoji: '🗺️' },
  { key: 'reports', label: 'Reports', icon: FileText, emoji: '📋' },
  { key: 'wards', label: 'Wards', icon: Building2, emoji: '🏛️' },
];

const MAP_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pothole', label: '🚧 Pothole' },
  { key: 'garbage', label: '🗑️ Garbage' },
  { key: 'water', label: '💧 Waterlogging' },
  { key: 'resolved', label: '✅ Resolved' },
];

// --- MAIN APP ---
export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [mapFilter, setMapFilter] = useState('all');
  const [issuesData, setIssuesData] = useState({ type: 'FeatureCollection', features: [] });
  const [stats, setStats] = useState({ active: 0, resolved: 0 });
  const [accountability, setAccountability] = useState({ chain: [], ward: null });
  const [currentCity, setCurrentCity] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    getCurrentCity().then(setCurrentCity);
  }, []);

  // Fetch issues from Supabase
  const loadIssues = useCallback(async () => {
    const data = await fetchIssuesGeoJSON(mapFilter);
    setIssuesData(data);
    setLoading(false);
  }, [mapFilter]);

  // Initial load + filter changes
  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Fetch stats
  useEffect(() => {
    fetchIssueStats().then(setStats);
  }, []);

  // Realtime subscription for new issues
  useEffect(() => {
    const channel = subscribeToIssues(() => {
      loadIssues();
      fetchIssueStats().then(setStats);
    });
    return () => { channel.unsubscribe(); };
  }, [loadIssues]);

  // Fetch accountability when an issue is selected
  useEffect(() => {
    if (selectedIssue?.ward_id) {
      fetchAccountability(selectedIssue.ward_id).then(setAccountability);
    }
  }, [selectedIssue]);

  const onMapClick = useCallback((event) => {
    const feature = event.features?.[0];
    if (!feature) return;

    if (feature.layer.id === 'clusters') {
      const clusterId = feature.properties.cluster_id;
      const mapboxSource = mapRef.current.getSource('issues');
      mapboxSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        mapRef.current.easeTo({ center: feature.geometry.coordinates, zoom, duration: 500 });
      });
    } else {
      setSelectedIssue(feature.properties);
    }
  }, []);

  const handleIssueSubmitted = useCallback(() => {
    loadIssues();
    fetchIssueStats().then(setStats);
  }, [loadIssues]);

  const roleConfig = {
    municipal_corporation: { icon: '🏛️', color: '#E5E7EB' },
    commissioner: { icon: 'CM', color: '#DBEAFE' },
    additional_commissioner: { icon: 'AC', color: '#DBEAFE' },
    jhi: { icon: 'JHI', color: '#DBEAFE', active: true },
  };

  return (
    <div className="app-shell">
      
      {/* DESKTOP NAVBAR */}
      <header className="desktop-navbar">
        <div className="navbar-left">
          <MapPin fill="var(--primary)" color="white" size={22} />
          <span className="navbar-brand">Smart Nagrik <span className="version-tag">v1.0.0</span></span>
        </div>

        <nav className="desktop-tabs">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                className={`desktop-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.key); setSelectedIssue(null); }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="navbar-right">
          <button className="digest-btn">Join Gurgaon digest ✉️</button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="main-content">
        
        {/* TAB: MAP */}
        {activeTab === 'map' && (
          <div className="map-tab">
            <div className="map-filter-bar">
              {MAP_FILTERS.map(f => (
                <button
                  key={f.key}
                  className={`map-filter-pill ${mapFilter === f.key ? 'active' : ''}`}
                  onClick={() => setMapFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="map-stats-overlay">
              <div className="stat-chip">
                <span className="stat-number" style={{ color: 'var(--issue-pothole)' }}>{stats.active.toLocaleString()}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-chip">
                <span className="stat-number" style={{ color: 'var(--issue-resolved)' }}>{stats.resolved.toLocaleString()}</span>
                <span className="stat-label">Resolved</span>
              </div>
            </div>

            <MapGL
              ref={mapRef}
              initialViewState={GURGAON_CENTER}
              style={{ width: '100%', height: '100%' }}
              mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"
              interactiveLayerIds={['clusters', 'unclustered-point']}
              onClick={onMapClick}
              cursor="pointer"
            >
              <NavigationControl position="top-right" />

              <Source id="boundary" type="geojson" data={GURGAON_BOUNDARY}>
                <Layer id="boundary-line" type="line" paint={{ 'line-color': '#991B1B', 'line-width': 2, 'line-dasharray': [2, 2] }} />
              </Source>

              <Source id="mask" type="geojson" data={GURGAON_MASK}>
                <Layer id="mask-fill" type="fill" paint={{ 'fill-color': '#1A1F2E', 'fill-opacity': 0.6 }} />
              </Source>

              <Source id="issues" type="geojson" data={issuesData} cluster={true} clusterMaxZoom={14} clusterRadius={50}>
                <Layer {...clusterLayer} />
                <Layer {...clusterCountLayer} />
                <Layer {...unclusteredPointLayer} />
              </Source>
            </MapGL>

            <div style={{
              position: 'absolute', bottom: '4rem', right: '0.5rem', zIndex: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '0.2rem 0.5rem',
              borderRadius: '0.25rem', fontSize: '0.65rem', color: 'var(--text-muted)',
              pointerEvents: 'none', backdropFilter: 'blur(2px)'
            }}>
              Powered by <strong>MapLibre</strong> • Map data &copy; <strong>OpenStreetMap</strong> contributors • Style &copy; <strong>CARTO</strong>
            </div>

            <div className="map-report-bar" onClick={() => setIsModalOpen(true)}>
              <Plus size={20} /> Report an Issue Anonymously
            </div>
          </div>
        )}

        {activeTab === 'reports' && <ReportsFeed />}
        {activeTab === 'wards' && <WardsDashboard />}
      </main>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="mobile-tabbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`mobile-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.key); setSelectedIssue(null); }}
            >
              <Icon size={22} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* DETAIL SIDEBAR */}
      <AnimatePresence>
        {selectedIssue && activeTab === 'map' && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="detail-sidebar"
          >
            <div className="sidebar-header">
               <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--issue-pothole)', textTransform: 'uppercase' }}>• {selectedIssue.severity}</span>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      color: selectedIssue.status === 'resolved' ? 'var(--issue-resolved)' : 'var(--issue-garbage)',
                      backgroundColor: selectedIssue.status === 'resolved' ? '#F0FDF4' : '#FEF3C7',
                      padding: '0.1rem 0.5rem', borderRadius: '4px'
                    }}>
                      {selectedIssue.status === 'resolved' ? 'Resolved' : selectedIssue.status === 'in_progress' ? 'In Progress' : 'Unresolved'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0' }}>{selectedIssue.address}</h3>
                  <button 
                    onClick={() => {
                      if (window.confirm("Open this location in Google Maps?")) {
                        window.open(`https://www.google.com/maps?q=${selectedIssue.latitude},${selectedIssue.longitude}`, '_blank');
                      }
                    }}
                    style={{ fontSize: '0.875rem', color: 'var(--primary)', textAlign: 'left', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                  >
                    📍 {currentCity?.name || 'City'}, {selectedIssue.address}
                  </button>
               </div>
               <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <button style={{ padding: '0.25rem', color: 'var(--text-muted)' }}><Share2 size={18} /></button>
                 <button onClick={() => setSelectedIssue(null)} style={{ padding: '0.25rem', color: 'var(--text-muted)' }}><X size={18} /></button>
               </div>
            </div>
            
            <div className="sidebar-body">
              {selectedIssue.photo_url ? (
                <div 
                  onClick={() => setLightboxImage(selectedIssue.photo_url)}
                  style={{ height: '180px', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', marginBottom: '1rem', backgroundImage: `url(${selectedIssue.photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', cursor: 'zoom-in' }}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); /* TODO: upvote */ }}
                    style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', backgroundColor: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    👍 I've seen this
                  </button>
                </div>
              ) : (
                <div style={{ height: '120px', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No photo provided
                </div>
              )}

              {selectedIssue.description && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: '0.5rem' }}>
                  {selectedIssue.description}
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                 <div style={{ border: '1px solid var(--border-light)', borderRadius: '0.5rem', padding: '0.5rem' }}>
                   <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{selectedIssue.upvotes || 0}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upvotes</div>
                 </div>
                 <div style={{ border: '1px solid var(--border-light)', borderRadius: '0.5rem', padding: '0.5rem' }}>
                   <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--issue-pothole)' }}>{selectedIssue.days || '—'}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Days</div>
                 </div>
                 <div style={{ border: '1px solid var(--border-light)', borderRadius: '0.5rem', padding: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                   <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--issue-water)' }}>{selectedIssue.type?.toUpperCase()}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Type</div>
                 </div>
              </div>

              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.05em' }}>ACCOUNTABILITY TIMELINE</h4>
              
              <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                <div style={{ position: 'absolute', left: '0.75rem', top: 0, bottom: 0, width: '2px', backgroundColor: 'var(--border-light)' }}></div>
                
                {accountability.chain.length > 0 ? (
                  accountability.chain.map(node => {
                    const conf = roleConfig[node.role] || { icon: '•', color: '#E5E7EB' };
                    return <TimelineNode key={node.id} title={node.name} desc={node.description} color={conf.color} icon={conf.icon} active={conf.active} />;
                  })
                ) : (
                  <>
                    <TimelineNode title="Municipal Corporation" desc="Reports to State Govt" color="#E5E7EB" icon="🏛️" />
                    <TimelineNode title="Commissioner" desc="City Head - Top of chain" color="#DBEAFE" icon="CM" />
                    <TimelineNode title="Additional Commissioner" desc="Zone oversight" color="#DBEAFE" icon="AC" />
                    <TimelineNode title="Junior Health Inspector" desc="Frontline ward officer (JHI)" color="#DBEAFE" icon="JHI" active />
                  </>
                )}
              </div>

              {accountability.ward && (
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textAlign: 'center' }}>ELECTED REPRESENTATIVES FOR THIS WARD</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', margin: '0 auto 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>
                        MLA
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{accountability.ward.mla_name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--primary)' }}>MLA</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#3B82F6', margin: '0 auto 0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.65rem' }}>
                        CR
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{accountability.ward.councillor_name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--primary)' }}>Councillor • Ward {accountability.ward.number}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="sidebar-footer">
               <button style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'white', border: '1px solid var(--border-light)', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                  <Share2 size={16} /> File an official complaint
               </button>
               <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>All reports are anonymous</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReportModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmitted={handleIssueSubmitted} />

      {/* LIGHTBOX FOR IMAGE */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 9999,
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              padding: '1rem', cursor: 'zoom-out'
            }}
          >
            <button
              onClick={() => setLightboxImage(null)}
              style={{
                position: 'absolute', top: '1rem', right: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white',
                border: 'none', borderRadius: '50%', padding: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>
            <img 
              src={lightboxImage} 
              alt="Issue Photo Fullscreen" 
              style={{
                maxWidth: '100%', maxHeight: '100%',
                objectFit: 'contain', borderRadius: '8px'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TimelineNode = ({ title, desc, color, icon, active }) => (
  <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
    <div style={{ 
      position: 'absolute', left: '-2rem', width: '24px', height: '24px', borderRadius: '50%', 
      backgroundColor: active ? 'var(--primary)' : color, color: active ? 'white' : 'var(--text-main)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.65rem', fontWeight: 'bold',
      boxShadow: '0 0 0 4px white', zIndex: 2
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
    </div>
  </div>
);
