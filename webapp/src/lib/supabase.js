import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==========================================
// CITY CONTEXT
// ==========================================

// Default city slug — will be configurable via URL/selector in future
const DEFAULT_CITY_SLUG = 'gurugram';
let _cityCache = null;

/** Fetch current city config (cached) */
export async function getCurrentCity() {
  if (_cityCache) return _cityCache;

  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('slug', DEFAULT_CITY_SLUG)
    .single();

  if (error) { console.error('getCurrentCity:', error); return null; }
  _cityCache = data;
  return data;
}

/** Fetch all active cities (for future city switcher) */
export async function fetchCities() {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name, state, slug, center_lat, center_lng, default_zoom, is_active')
    .eq('is_active', true)
    .order('name');
  if (error) { console.error('fetchCities:', error); return []; }
  return data || [];
}

// ==========================================
// DEVICE TOKEN (anonymous identity)
// ==========================================
export function getDeviceToken() {
  let token = localStorage.getItem('sn_device_token');
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem('sn_device_token', token);
  }
  return token;
}

// ==========================================
// ISSUES
// ==========================================

/** Fetch all issues for current city and convert to GeoJSON FeatureCollection */
export async function fetchIssuesGeoJSON(filter = 'all') {
  const city = await getCurrentCity();
  if (!city) return { type: 'FeatureCollection', features: [] };

  let query = supabase
    .from('issues')
    .select('id, type, severity, status, description, photo_url, latitude, longitude, address, ward_id, upvotes, created_at')
    .eq('city_id', city.id);

  if (filter === 'resolved') {
    query = query.eq('status', 'resolved');
  } else if (filter !== 'all') {
    query = query.eq('type', filter);
  }

  const { data, error } = await query;
  if (error) { console.error('fetchIssuesGeoJSON:', error); return { type: 'FeatureCollection', features: [] }; }

  const features = (data || []).map(issue => ({
    type: 'Feature',
    properties: {
      id: issue.id,
      type: issue.type,
      severity: issue.severity,
      status: issue.status,
      description: issue.description,
      photo_url: issue.photo_url,
      address: issue.address,
      ward_id: issue.ward_id,
      upvotes: issue.upvotes,
      reports: issue.upvotes,
      days: Math.max(1, Math.floor((Date.now() - new Date(issue.created_at).getTime()) / 86400000)),
      created_at: issue.created_at,
      latitude: issue.latitude,
      longitude: issue.longitude,
    },
    geometry: {
      type: 'Point',
      coordinates: [issue.longitude, issue.latitude],
    },
  }));

  return { type: 'FeatureCollection', features };
}

/** Fetch active/resolved counts for current city */
export async function fetchIssueStats() {
  const city = await getCurrentCity();
  if (!city) return { active: 0, resolved: 0 };

  const [activeRes, resolvedRes] = await Promise.all([
    supabase.from('issues').select('id', { count: 'exact', head: true }).eq('city_id', city.id).neq('status', 'resolved'),
    supabase.from('issues').select('id', { count: 'exact', head: true }).eq('city_id', city.id).eq('status', 'resolved'),
  ]);
  return {
    active: activeRes.count || 0,
    resolved: resolvedRes.count || 0,
  };
}

/** Fetch issues for Reports feed (current city) */
export async function fetchReports(sortBy = 'newest', filterType = 'all') {
  const city = await getCurrentCity();
  if (!city) return [];

  let query = supabase
    .from('issues')
    .select('id, type, severity, status, description, photo_url, address, upvotes, created_at, ward_id')
    .eq('city_id', city.id);

  if (filterType !== 'all') {
    query = query.eq('type', filterType);
  }

  if (sortBy === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sortBy === 'upvoted') {
    query = query.order('upvotes', { ascending: false });
  } else if (sortBy === 'critical') {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) { console.error('fetchReports:', error); return []; }

  let reports = (data || []).map(r => ({
    ...r,
    daysAgo: Math.max(1, Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000)),
  }));

  if (sortBy === 'critical') {
    const order = { critical: 0, medium: 1, low: 2 };
    reports.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));
  }

  return reports;
}

/** Submit a new issue (always to current city) */
export async function submitIssue({ type, severity, description, latitude, longitude, address, wardId, photoFile }) {
  const city = await getCurrentCity();
  if (!city) { console.error('No city context'); return null; }

  let photoUrl = null;

  if (photoFile) {
    const ext = photoFile.name.split('.').pop();
    const filename = `${crypto.randomUUID()}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('issue-photos')
      .upload(filename, photoFile, { contentType: photoFile.type });

    if (uploadError) {
      console.error('Photo upload error:', uploadError);
    } else {
      const { data: urlData } = supabase.storage.from('issue-photos').getPublicUrl(filename);
      photoUrl = urlData.publicUrl;
    }
  }

  const { data, error } = await supabase.from('issues').insert({
    city_id: city.id,
    type,
    severity: severity.toLowerCase(),
    description,
    latitude,
    longitude,
    address,
    ward_id: wardId || null,
    photo_url: photoUrl,
  }).select().single();

  if (error) { console.error('submitIssue:', error); return null; }
  return data;
}

// ==========================================
// UPVOTES
// ==========================================

/** Upvote an issue. Returns true if successful, false if already upvoted. */
export async function upvoteIssue(issueId) {
  const token = getDeviceToken();
  const { error } = await supabase.from('upvotes').insert({
    issue_id: issueId,
    device_token: token,
  });

  if (error) {
    if (error.code === '23505') return false;
    console.error('upvoteIssue:', error);
    return false;
  }
  return true;
}

/** Check if device already upvoted an issue */
export async function hasUpvoted(issueId) {
  const token = getDeviceToken();
  const { data } = await supabase
    .from('upvotes')
    .select('id')
    .eq('issue_id', issueId)
    .eq('device_token', token)
    .maybeSingle();
  return !!data;
}

/** Batch check which issues this device has upvoted */
export async function getUpvotedIssueIds(issueIds) {
  if (!issueIds.length) return new Set();
  const token = getDeviceToken();
  const { data } = await supabase
    .from('upvotes')
    .select('issue_id')
    .eq('device_token', token)
    .in('issue_id', issueIds);
  return new Set((data || []).map(d => d.issue_id));
}

// ==========================================
// WARDS
// ==========================================

/** Fetch all wards for current city with aggregated issue counts */
export async function fetchWards() {
  const city = await getCurrentCity();
  if (!city) return [];

  const { data: wards, error: wErr } = await supabase
    .from('wards')
    .select('id, number, area_name, sector, councillor_name, mla_name, zone')
    .eq('city_id', city.id)
    .order('number');
  if (wErr) { console.error('fetchWards:', wErr); return []; }

  const { data: issues, error: iErr } = await supabase
    .from('issues')
    .select('ward_id, type, status')
    .eq('city_id', city.id);
  if (iErr) { console.error('fetchWards issues:', iErr); return []; }

  return (wards || []).map(w => {
    const wardIssues = (issues || []).filter(i => i.ward_id === w.id);
    const pothole = wardIssues.filter(i => i.type === 'pothole').length;
    const garbage = wardIssues.filter(i => i.type === 'garbage').length;
    const water = wardIssues.filter(i => i.type === 'water').length;
    const total = wardIssues.length;
    const resolved = wardIssues.filter(i => i.status === 'resolved').length;
    const resolvedPct = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      ...w,
      issues: { pothole, garbage, water },
      total,
      resolved: resolvedPct,
    };
  });
}

/** Fetch issues for a specific ward */
export async function fetchWardIssues(wardId) {
  const { data, error } = await supabase
    .from('issues')
    .select('id, type, severity, status, description, address, upvotes, created_at')
    .eq('ward_id', wardId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchWardIssues:', error); return []; }
  return (data || []).map(r => ({
    ...r,
    daysAgo: Math.max(1, Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86400000)),
  }));
}

// ==========================================
// ACCOUNTABILITY CHAIN
// ==========================================

/** Fetch accountability chain + ward info for sidebar */
export async function fetchAccountability(wardId) {
  if (!wardId) return { chain: [], ward: null };

  const [chainRes, wardRes] = await Promise.all([
    supabase.from('accountability_chain').select('*').eq('ward_id', wardId).order('sort_order'),
    supabase.from('wards').select('*').eq('id', wardId).single(),
  ]);

  return {
    chain: chainRes.data || [],
    ward: wardRes.data || null,
  };
}

// ==========================================
// REALTIME
// ==========================================

/** Subscribe to new issues */
export function subscribeToIssues(onInsert) {
  return supabase
    .channel('issues-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'issues' }, payload => {
      onInsert(payload.new);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'issues' }, payload => {
      onInsert(payload.new);
    })
    .subscribe();
}

/** Subscribe to upvote changes */
export function subscribeToUpvotes(onUpvote) {
  return supabase
    .channel('upvotes-realtime')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'upvotes' }, payload => {
      onUpvote(payload.new);
    })
    .subscribe();
}
