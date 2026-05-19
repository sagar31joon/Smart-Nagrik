import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, Trash2, X, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { fetchActiveCities, fetchWardsByCity, insertWard, updateWard, deleteWard, fetchChainByWard, upsertChain } from '../lib/supabase';

const CHAIN_ROLES = [
  { role: 'municipal_corporation', label: 'Municipal Corp.' },
  { role: 'commissioner', label: 'Commissioner' },
  { role: 'additional_commissioner', label: 'Addl. Commissioner' },
  { role: 'jhi', label: 'JHI' },
];

export default function Wards() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [expandedWard, setExpandedWard] = useState(null);
  const [chainData, setChainData] = useState([]);
  const [chainEdits, setChainEdits] = useState({});
  const [savingChain, setSavingChain] = useState(false);

  // Add ward form
  const [form, setForm] = useState({ number: '', area_name: '', sector: '', councillor_name: '', mla_name: '', zone: 'Zone 1' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchActiveCities().then(data => {
      setCities(data);
      if (data.length > 0) setSelectedCity(data[0].id);
    });
  }, []);

  const loadWards = useCallback(async () => {
    if (!selectedCity) return;
    setLoading(true);
    const data = await fetchWardsByCity(selectedCity);
    setWards(data);
    setLoading(false);
  }, [selectedCity]);

  useEffect(() => { loadWards(); }, [loadWards]);

  const handleAddWard = async (e) => {
    e.preventDefault();
    if (!selectedCity) return;
    setSaving(true);
    try {
      await insertWard({ ...form, number: parseInt(form.number), city_id: selectedCity });
      setShowAddModal(false);
      setForm({ number: '', area_name: '', sector: '', councillor_name: '', mla_name: '', zone: 'Zone 1' });
      await loadWards();
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  };

  const handleDelete = async (ward) => {
    if (!window.confirm(`Delete Ward ${ward.number} — ${ward.area_name}? This also deletes its issues and accountability chain.`)) return;
    try {
      await deleteWard(ward.id);
      await loadWards();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const startEdit = (ward) => {
    setEditingWard(ward.id);
    setEditValues({
      area_name: ward.area_name,
      sector: ward.sector,
      councillor_name: ward.councillor_name,
      mla_name: ward.mla_name,
      zone: ward.zone,
    });
  };

  const saveEdit = async (wardId) => {
    try {
      await updateWard(wardId, editValues);
      setEditingWard(null);
      await loadWards();
    } catch (err) { alert('Error: ' + err.message); }
  };

  const cancelEdit = () => { setEditingWard(null); setEditValues({}); };

  // Accountability chain
  const toggleChain = async (wardId) => {
    if (expandedWard === wardId) {
      setExpandedWard(null);
      return;
    }
    setExpandedWard(wardId);
    const chain = await fetchChainByWard(wardId);
    setChainData(chain);
    const edits = {};
    CHAIN_ROLES.forEach((cr, i) => {
      const existing = chain.find(c => c.role === cr.role);
      edits[cr.role] = {
        name: existing?.name || '',
        description: existing?.description || '',
      };
    });
    setChainEdits(edits);
  };

  const saveChain = async (wardId) => {
    setSavingChain(true);
    const ward = wards.find(w => w.id === wardId);
    try {
      const entries = CHAIN_ROLES.map((cr, i) => ({
        city_id: selectedCity,
        ward_id: wardId,
        role: cr.role,
        name: chainEdits[cr.role]?.name || cr.label,
        description: chainEdits[cr.role]?.description || '',
        sort_order: i + 1,
      }));
      await upsertChain(entries);
      setExpandedWard(null);
    } catch (err) { alert('Error: ' + err.message); }
    setSavingChain(false);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Wards</h2>
        <div className="page-header-actions">
          <select className="form-select" value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={{ minWidth: '180px' }}>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)} disabled={!selectedCity}>
            <Plus size={16} /> Add Ward
          </button>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ward</th>
              <th>Area</th>
              <th>Sector</th>
              <th>Councillor</th>
              <th>MLA</th>
              <th>Zone</th>
              <th>Chain</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : wards.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>{selectedCity ? 'No wards — add one above' : 'Select a city'}</td></tr>
            ) : wards.map(ward => (
              <>
                <tr key={ward.id}>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#{ward.number}</td>
                  {editingWard === ward.id ? (
                    <>
                      <td><input className="inline-input" value={editValues.area_name} onChange={e => setEditValues({ ...editValues, area_name: e.target.value })} /></td>
                      <td><input className="inline-input" value={editValues.sector} onChange={e => setEditValues({ ...editValues, sector: e.target.value })} /></td>
                      <td><input className="inline-input" value={editValues.councillor_name} onChange={e => setEditValues({ ...editValues, councillor_name: e.target.value })} /></td>
                      <td><input className="inline-input" value={editValues.mla_name} onChange={e => setEditValues({ ...editValues, mla_name: e.target.value })} /></td>
                      <td><input className="inline-input" value={editValues.zone} onChange={e => setEditValues({ ...editValues, zone: e.target.value })} /></td>
                    </>
                  ) : (
                    <>
                      <td>{ward.area_name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{ward.sector}</td>
                      <td>{ward.councillor_name}</td>
                      <td>{ward.mla_name}</td>
                      <td><span className="badge badge-locked">{ward.zone}</span></td>
                    </>
                  )}
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleChain(ward.id)} style={{ padding: '0.25rem 0.5rem' }}>
                      {expandedWard === ward.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {editingWard === ward.id ? (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => saveEdit(ward.id)} style={{ padding: '0.25rem 0.5rem' }}><Save size={14} /></button>
                          <button className="btn btn-secondary btn-sm" onClick={cancelEdit} style={{ padding: '0.25rem 0.5rem' }}><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => startEdit(ward)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ward)} style={{ padding: '0.25rem 0.5rem' }}><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedWard === ward.id && (
                  <tr key={`chain-${ward.id}`}>
                    <td colSpan={8} style={{ padding: 0 }}>
                      <div className="chain-editor">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>ACCOUNTABILITY CHAIN — Ward #{ward.number}</span>
                          <button className="btn btn-primary btn-sm" onClick={() => saveChain(ward.id)} disabled={savingChain}>
                            {savingChain ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />} Save
                          </button>
                        </div>
                        {CHAIN_ROLES.map(cr => (
                          <div className="chain-row" key={cr.role}>
                            <span className="chain-role">{cr.label}</span>
                            <input
                              className="inline-input"
                              placeholder="Name"
                              value={chainEdits[cr.role]?.name || ''}
                              onChange={e => setChainEdits({ ...chainEdits, [cr.role]: { ...chainEdits[cr.role], name: e.target.value } })}
                            />
                            <input
                              className="inline-input"
                              placeholder="Description"
                              value={chainEdits[cr.role]?.description || ''}
                              onChange={e => setChainEdits({ ...chainEdits, [cr.role]: { ...chainEdits[cr.role], description: e.target.value } })}
                            />
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* ADD WARD MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <form className="modal" onClick={e => e.stopPropagation()} onSubmit={handleAddWard}>
            <div className="modal-header">
              <h3>Add Ward</h3>
              <button type="button" onClick={() => setShowAddModal(false)}><X size={20} color="var(--text-muted)" /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Ward Number</label>
                  <input className="form-input" type="number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Zone</label>
                  <input className="form-input" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Area Name</label>
                <input className="form-input" placeholder="e.g. Jacobpura" value={form.area_name} onChange={e => setForm({ ...form, area_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Sector</label>
                <input className="form-input" placeholder="e.g. Sector 12" value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Councillor Name</label>
                <input className="form-input" value={form.councillor_name} onChange={e => setForm({ ...form, councillor_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>MLA Name</label>
                <input className="form-input" value={form.mla_name} onChange={e => setForm({ ...form, mla_name: e.target.value })} required />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Add Ward'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
