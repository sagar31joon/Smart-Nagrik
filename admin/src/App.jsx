import { useState, useEffect } from 'react';
import { getSession, onAuthStateChange, signOut } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cities from './pages/Cities';
import Wards from './pages/Wards';
import Issues from './pages/Issues';

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    getSession().then(s => setSession(s));
    const { data: { subscription } } = onAuthStateChange(s => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setSession(null);
  };

  // Loading state
  if (session === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return <Login onLogin={() => getSession().then(setSession)} />;
  }

  // Authenticated
  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard onNavigate={setPage} />;
      case 'cities': return <Cities />;
      case 'wards': return <Wards />;
      case 'issues': return <Issues />;
      default: return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar activePage={page} onNavigate={setPage} onLogout={handleLogout} />
      <main className="admin-main">
        {renderPage()}
      </main>
    </div>
  );
}
