import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, MapPin, AlertTriangle, Trash2, Droplets, CheckCircle2, Upload, Loader } from 'lucide-react';
import { submitIssue } from './lib/supabase';

export default function ReportModal({ isOpen, onClose, onSubmitted }) {
  const [step, setStep] = useState(1);
  const [issueType, setIssueType] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef(null);

  // Get user's location on mount
  useEffect(() => {
    async function getAddress(lat, lon) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
        const data = await res.json();
        if (data && data.display_name) {
          // Keep it reasonably short
          const parts = data.display_name.split(', ');
          return parts.slice(0, 3).join(', ');
        }
      } catch (e) { console.error('Geocoding error:', e); }
      return `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
    }

    if (isOpen && !location) {
      setLocationLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const addr = await getAddress(lat, lon);
            setLocation({ latitude: lat, longitude: lon, address: addr });
            setLocationLoading(false);
          },
          () => {
            // Fallback to Gurgaon center
            setLocation({ latitude: 28.4595, longitude: 77.0266, address: 'Gurugram' });
            setLocationLoading(false);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        setLocation({ latitude: 28.4595, longitude: 77.0266, address: 'Gurugram' });
        setLocationLoading(false);
      }
    }
  }, [isOpen, location]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File too large. Max 5MB.');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!issueType || !location) return;
    setSubmitting(true);

    const result = await submitIssue({
      type: issueType,
      severity,
      description,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      wardId: null, // could be auto-assigned by proximity
      photoFile,
    });

    setSubmitting(false);
    if (result) {
      setSubmitted(true);
      setStep(3);
      onSubmitted?.();
    }
  };

  const handleNext = () => {
    if (step === 2) {
      handleSubmit();
    } else {
      setStep(s => s + 1);
    }
  };
  const handleBack = () => setStep(s => s - 1);
  const handleClose = () => {
    setStep(1);
    setIssueType('');
    setSeverity('Medium');
    setDescription('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setLocation(null);
    setSubmitted(false);
    setSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
              zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center',
              padding: '1rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                backgroundColor: 'white', borderRadius: '1.5rem', width: '100%', maxWidth: '500px',
                boxShadow: 'var(--shadow-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                maxHeight: '90vh'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  {step === 1 ? 'Location & Photo' : step === 2 ? 'Issue Details' : 'Confirm'}
                </h2>
                <button onClick={handleClose} style={{ color: 'var(--text-muted)', padding: '0.25rem' }}>
                  <X size={24} />
                </button>
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    {/* Location */}
                    <div style={{ backgroundColor: '#EFF6FF', color: 'var(--issue-water)', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                      <MapPin size={24} style={{ flexShrink: 0 }} />
                      <div>
                        {locationLoading ? (
                          <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Loader size={16} className="spin" /> Detecting location...
                          </p>
                        ) : location ? (
                          <>
                            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>📍 {location.address}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                            </p>
                          </>
                        ) : (
                          <p style={{ fontWeight: 600 }}>Location unavailable</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Photo Upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoSelect}
                      style={{ display: 'none' }}
                    />

                    {photoPreview ? (
                      <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <img
                          src={photoPreview}
                          alt="Preview"
                          style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '1rem' }}
                        />
                        <button
                          onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                          style={{
                            position: 'absolute', top: '0.5rem', right: '0.5rem',
                            backgroundColor: 'rgba(0,0,0,0.6)', color: 'white',
                            borderRadius: '50%', width: '28px', height: '28px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            position: 'absolute', bottom: '0.5rem', right: '0.5rem',
                            backgroundColor: 'white', padding: '0.25rem 0.75rem',
                            borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600
                          }}
                        >
                          Change photo
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          border: '2px dashed var(--border-light)', borderRadius: '1rem', padding: '3rem 1rem',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                          backgroundColor: 'var(--bg-main)', cursor: 'pointer', transition: 'border-color 0.2s'
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                      >
                        <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '50%', boxShadow: 'var(--shadow-sm)' }}>
                          <Camera size={32} color="var(--primary)" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Upload photo or take one</p>
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>JPG, PNG up to 5MB</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem' }}>Select Issue Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      <TypeSelect icon={<AlertTriangle/>} label="Broken Road / Pothole" selected={issueType === 'pothole'} onClick={() => setIssueType('pothole')} color="var(--issue-pothole)" />
                      <TypeSelect icon={<Trash2/>} label="Garbage Dump" selected={issueType === 'garbage'} onClick={() => setIssueType('garbage')} color="var(--issue-garbage)" />
                      <TypeSelect icon={<Droplets/>} label="Waterlogging" selected={issueType === 'water'} onClick={() => setIssueType('water')} color="var(--issue-water)" />
                    </div>

                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem' }}>Severity</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', backgroundColor: 'var(--bg-main)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                      <SeverityPill label="Low" selected={severity === 'Low'} onClick={() => setSeverity('Low')} />
                      <SeverityPill label="Medium" selected={severity === 'Medium'} onClick={() => setSeverity('Medium')} />
                      <SeverityPill label="Critical" selected={severity === 'Critical'} onClick={() => setSeverity('Critical')} />
                    </div>

                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem' }}>Description (Optional)</label>
                    <textarea 
                      placeholder="Add more details about the issue..."
                      maxLength={200}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      style={{
                        width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-light)',
                        minHeight: '100px', resize: 'vertical', fontFamily: 'inherit', outline: 'none'
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border-light)'}
                    />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                      style={{ display: 'inline-flex', backgroundColor: '#ECFDF5', color: 'var(--issue-resolved)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
                      <CheckCircle2 size={48} />
                    </motion.div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.75rem' }}>Reported!</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                      This is now public on the map. Ward councillor and MLA details are visible to everyone.
                    </p>
                    <div style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '0.75rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>Issue: {issueType || 'Pothole'} • {severity}</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Location: {location?.address || 'Gurgaon'}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer Actions */}
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '1rem', backgroundColor: 'var(--bg-main)' }}>
                {step > 1 && step < 3 && (
                  <button onClick={handleBack} style={{
                    padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600, color: 'var(--text-main)',
                    border: '1px solid var(--border-light)', backgroundColor: 'white'
                  }}>
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={(step === 2 && !issueType) || submitting}
                    style={{
                      flexGrow: 1, padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 600,
                      backgroundColor: (step === 2 && !issueType) ? 'var(--text-muted)' : 'var(--primary)', 
                      color: 'white', border: 'none', transition: 'background-color 0.2s',
                      opacity: (step === 2 && !issueType) ? 0.5 : 1,
                      cursor: (step === 2 && !issueType) ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                  >
                    {submitting ? (
                      <><Loader size={18} className="spin" /> Submitting...</>
                    ) : (
                      step === 1 ? 'Next Step' : 'Submit Report'
                    )}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                    <button onClick={handleClose} style={{
                      flexGrow: 1, padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 600,
                      backgroundColor: 'var(--primary)', color: 'white'
                    }}>
                      Done
                    </button>
                    <button style={{
                      flexGrow: 1, padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 600,
                      backgroundColor: 'black', color: 'white'
                    }}>
                      Share on X
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const TypeSelect = ({ icon, label, selected, onClick, color }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '0.75rem',
    border: '2px solid', borderColor: selected ? color : 'var(--border-light)',
    backgroundColor: selected ? `${color}10` : 'white',
    transition: 'all 0.2s', textAlign: 'left'
  }}>
    <div style={{ color: selected ? color : 'var(--text-muted)' }}>{icon}</div>
    <span style={{ fontWeight: 600, color: selected ? 'var(--text-main)' : 'var(--text-muted)' }}>{label}</span>
  </button>
);

const SeverityPill = ({ label, selected, onClick }) => {
  const getColors = () => {
    if (!selected) return { bg: 'transparent', color: 'var(--text-muted)' };
    if (label === 'Low') return { bg: 'white', color: 'var(--text-main)', shadow: 'var(--shadow-sm)' };
    if (label === 'Medium') return { bg: 'white', color: 'var(--issue-garbage)', shadow: 'var(--shadow-sm)' };
    if (label === 'Critical') return { bg: 'var(--issue-pothole)', color: 'white', shadow: 'var(--shadow-sm)' };
  };
  const colors = getColors();
  return (
    <button onClick={onClick} style={{
      flexGrow: 1, padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 600,
      backgroundColor: colors.bg, color: colors.color, boxShadow: colors.shadow,
      transition: 'all 0.2s'
    }}>
      {label}
    </button>
  );
};
