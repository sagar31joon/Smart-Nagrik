import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// AUTH
// ==========================================

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

// ==========================================
// CITIES
// ==========================================

export async function fetchAllCities() {
  const { data, error } = await supabase
    .from('cities')
    .select('*, wards(count)')
    .order('name');
  if (error) { console.error('fetchAllCities:', error); return []; }
  return (data || []).map(c => ({
    ...c,
    ward_count: c.wards?.[0]?.count || 0,
  }));
}

export async function fetchActiveCities() {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name, slug')
    .eq('is_active', true)
    .order('name');
  if (error) { console.error('fetchActiveCities:', error); return []; }
  return data || [];
}

export async function insertCity({ name, state, slug, center_lat, center_lng, default_zoom, boundary_geojson, is_active }) {
  const { data, error } = await supabase.from('cities').insert({
    name, state, slug,
    center_lat: center_lat || 0,
    center_lng: center_lng || 0,
    default_zoom: default_zoom || 11,
    boundary_geojson: boundary_geojson || null,
    is_active: is_active ?? false,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateCity(id, updates) {
  const { data, error } = await supabase.from('cities').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCity(id) {
  const { error } = await supabase.from('cities').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// WARDS
// ==========================================

export async function fetchWardsByCity(cityId) {
  const { data, error } = await supabase
    .from('wards')
    .select('*')
    .eq('city_id', cityId)
    .order('number');
  if (error) { console.error('fetchWardsByCity:', error); return []; }
  return data || [];
}

export async function insertWard(ward) {
  const { data, error } = await supabase.from('wards').insert(ward).select().single();
  if (error) throw error;
  return data;
}

export async function updateWard(id, updates) {
  const { data, error } = await supabase.from('wards').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteWard(id) {
  const { error } = await supabase.from('wards').delete().eq('id', id);
  if (error) throw error;
}

// ==========================================
// ACCOUNTABILITY CHAIN
// ==========================================

export async function fetchChainByWard(wardId) {
  const { data, error } = await supabase
    .from('accountability_chain')
    .select('*')
    .eq('ward_id', wardId)
    .order('sort_order');
  if (error) { console.error('fetchChainByWard:', error); return []; }
  return data || [];
}

export async function upsertChain(entries) {
  // Delete existing then re-insert
  if (entries.length === 0) return;
  const wardId = entries[0].ward_id;
  await supabase.from('accountability_chain').delete().eq('ward_id', wardId);
  const { error } = await supabase.from('accountability_chain').insert(entries);
  if (error) throw error;
}

// ==========================================
// ISSUES
// ==========================================

export async function fetchAllIssues({ cityId, type, status, severity } = {}) {
  let query = supabase
    .from('issues')
    .select('*, wards(number, area_name), cities(name)')
    .order('created_at', { ascending: false });

  if (cityId) query = query.eq('city_id', cityId);
  if (type) query = query.eq('type', type);
  if (status) query = query.eq('status', status);
  if (severity) query = query.eq('severity', severity);

  const { data, error } = await query;
  if (error) { console.error('fetchAllIssues:', error); return []; }
  return data || [];
}

export async function updateIssueStatus(id, status) {
  const { error } = await supabase.from('issues').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteIssue(id, photoUrl) {
  // Delete photo from storage if exists
  if (photoUrl) {
    try {
      const filename = photoUrl.split('/').pop();
      await supabase.storage.from('issue-photos').remove([filename]);
    } catch (e) {
      console.error('Failed to delete photo:', e);
    }
  }
  const { error } = await supabase.from('issues').delete().eq('id', id);
  if (error) throw error;
}

export async function bulkUpdateStatus(ids, status) {
  const { error } = await supabase.from('issues').update({ status }).in('id', ids);
  if (error) throw error;
}

export async function bulkDeleteIssues(issues) {
  // Delete photos first
  const photoPaths = issues.filter(i => i.photo_url).map(i => i.photo_url.split('/').pop());
  if (photoPaths.length > 0) {
    await supabase.storage.from('issue-photos').remove(photoPaths);
  }
  const ids = issues.map(i => i.id);
  const { error } = await supabase.from('issues').delete().in('id', ids);
  if (error) throw error;
}

// ==========================================
// DASHBOARD STATS
// ==========================================

export async function fetchDashboardStats() {
  const [citiesRes, wardsRes, issuesRes, openRes, resolvedRes] = await Promise.all([
    supabase.from('cities').select('id', { count: 'exact', head: true }),
    supabase.from('wards').select('id', { count: 'exact', head: true }),
    supabase.from('issues').select('id', { count: 'exact', head: true }),
    supabase.from('issues').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('issues').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
  ]);

  return {
    cities: citiesRes.count || 0,
    wards: wardsRes.count || 0,
    issues: issuesRes.count || 0,
    open: openRes.count || 0,
    resolved: resolvedRes.count || 0,
  };
}

export async function fetchRecentIssues(limit = 10) {
  const { data, error } = await supabase
    .from('issues')
    .select('id, type, severity, status, address, created_at, cities(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('fetchRecentIssues:', error); return []; }
  return data || [];
}
