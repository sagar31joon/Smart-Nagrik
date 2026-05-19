import { useState, useEffect, useCallback } from 'react';
import { Plus, Loader, X } from 'lucide-react';
import { fetchAllCities, insertCity, updateCity } from '../lib/supabase';

export default function Cities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formState, setFormState] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllCities();
    setCities(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const fetchFromNominatim = async (name, state) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(name)}&state=${encodeURIComponent(state)}&country=India&polygon_geojson=1&format=json`;
      const res = await fetch(url, { headers: { 'User-Agent': 'SmartNagrikAdmin/1.0' } });
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        return {
          center_lat: parseFloat(result.lat),
          center_lng: parseFloat(result.lon),
          boundary_geojson: result.geojson || null,
        };
      }
    } catch (e) {
      console.error('Nominatim fetch failed:', e);
    }
    return { center_lat: 0, center_lng: 0, boundary_geojson: null };
  };

  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formState.trim()) return;
    setSaving(true);
    try {
      const geo = await fetchFromNominatim(formName, formState);
      await insertCity({
        name: formName.trim(),
        state: formState.trim(),
        slug: generateSlug(formName.trim()),
        center_lat: geo.center_lat,
        center_lng: geo.center_lng,
        boundary_geojson: geo.boundary_geojson,
        is_active: false,
      });
      setShowModal(false);
      setFormName('');
      setFormState('');
      await load();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setSaving(false);
  };

  const handleToggle = async (city) => {
    setTogglingId(city.id);
    try {
      const newActive = !city.is_active;
      const updates = { is_active: newActive };

      // If activating and no boundary, fetch it
      if (newActive && !city.boundary_geojson) {
        const geo = await fetchFromNominatim(city.name, city.state);
        updates.boundary_geojson = geo.boundary_geojson;
        if (geo.center_lat) updates.center_lat = geo.center_lat;
        if (geo.center_lng) updates.center_lng = geo.center_lng;
      }

      await updateCity(city.id, updates);
      await load();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setTogglingId(null);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Cities</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add City
        </button>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>City Name</th>
              <th>State</th>
              <th>Slug</th>
              <th>Wards</th>
              <th>Boundary</th>
              <th>Status</th>
              <th>Toggle</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : cities.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No cities added yet</td></tr>
            ) : cities.map(city => (
              <tr key={city.id}>
                <td style={{ fontWeight: 600 }}>{city.name}</td>
                <td>{city.state}</td>
                <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{city.slug}</td>
                <td>{city.ward_count}</td>
                <td>
                  {city.boundary_geojson ? (
                    <span className="badge badge-resolved">✓ Loaded</span>
                  ) : (
                    <span className="badge badge-locked">Missing</span>
                  )}
                </td>
                <td>
                  <span className={`badge badge-${city.is_active ? 'active' : 'locked'}`}>
                    {city.is_active ? 'Active' : 'Locked'}
                  </span>
                </td>
                <td>
                  <button
                    className={`toggle ${city.is_active ? 'active' : ''}`}
                    onClick={() => handleToggle(city)}
                    disabled={togglingId === city.id}
                    title={city.is_active ? 'Lock city' : 'Activate city'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD CITY MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleAddCity}>
            <div className="modal-header">
              <h3>Add City</h3>
              <button type="button" onClick={() => setShowModal(false)}><X size={20} color="var(--text-muted)" /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                The boundary GeoJSON and center coordinates will be auto-fetched from Nominatim on save.
              </p>
              <div className="form-group">
                <label>City Name</label>
                <input className="form-input" placeholder="e.g. Faridabad" value={formName} onChange={e => setFormName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>State</label>
                <input className="form-input" placeholder="e.g. Haryana" value={formState} onChange={e => setFormState(e.target.value)} required />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</> : 'Add City'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
