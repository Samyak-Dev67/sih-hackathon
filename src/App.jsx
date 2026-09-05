import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './utils/supabase';
import { DEMO_ACCOUNTS } from './data/mockData';
import { Navbar } from './components/Navbar';

/* ── Scroll-reveal hook ─────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ── Typed text hook ────────────────────────────────────────── */
function useTypedText(words, speed = 120, pause = 1800) {
  const [display, setDisplay] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIdx];
    const t = setTimeout(() => {
      if (!deleting) {
        setDisplay(current.slice(0, charIdx + 1));
        if (charIdx + 1 === current.length) setTimeout(() => setDeleting(true), pause);
        else setCharIdx((c) => c + 1);
      } else {
        setDisplay(current.slice(0, charIdx - 1));
        if (charIdx - 1 === 0) { setDeleting(false); setWordIdx((i) => (i + 1) % words.length); setCharIdx(0); }
        else setCharIdx((c) => c - 1);
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(t);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  return display;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('fl_theme') || 'dark');
  const [currentUser, setCurrentUser] = useState(() => {
    const s = localStorage.getItem('fl_active_account');
    return s ? JSON.parse(s) : null;
  });

  /* ── Refs for cursor-driven animation ── */
  const mainRef    = useRef(null);  // CSS vars spotlight on the whole page
  const heroRef    = useRef(null);  // 3D tilt on hero content
  const shapeARef  = useRef(null);  // parallax shape A
  const shapeBRef  = useRef(null);  // parallax shape B
  const shapeCRef  = useRef(null);  // parallax shape C
  const rafRef     = useRef(null);
  const mouseRef   = useRef({ x: 0, y: 0 });

  const onMouseMove = useCallback((e) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };

    // Cancel any pending frame
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const { x, y } = mouseRef.current;

      /* 1. Spotlight — CSS custom props on the main container */
      if (mainRef.current) {
        mainRef.current.style.setProperty('--mx', x + 'px');
        mainRef.current.style.setProperty('--my', y + 'px');
      }

      /* 2. Hero 3D tilt */
      if (heroRef.current) {
        const r = heroRef.current.closest('.lp-hero')?.getBoundingClientRect();
        if (r) {
          const cx = r.left + r.width / 2;
          const cy = r.top  + r.height / 2;
          const dx = (x - cx) / (r.width  / 2); // -1 to 1
          const dy = (y - cy) / (r.height / 2); // -1 to 1
          heroRef.current.style.transform =
            `perspective(900px) rotateY(${dx * 5}deg) rotateX(${-dy * 5}deg)`;
        }
      }

      /* 3. Parallax shapes — move gently opposite to cursor */
      const nx = (x / window.innerWidth  - 0.5);  // -0.5 to 0.5
      const ny = (y / window.innerHeight - 0.5);
      if (shapeARef.current) shapeARef.current.style.transform = `translate(${-nx * 30}px, ${-ny * 20}px) rotate(${nx * 8}deg)`;
      if (shapeBRef.current) shapeBRef.current.style.transform = `translate(${nx * 20}px, ${ny * 28}px)`;
      if (shapeCRef.current) shapeCRef.current.style.transform = `translate(${-nx * 16}px, ${-ny * 14}px)`;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    return () => { window.removeEventListener('mousemove', onMouseMove); cancelAnimationFrame(rafRef.current); };
  }, [onMouseMove]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fl_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === 'light' ? 'dark' : 'light'));

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); } catch (_) {}
    localStorage.removeItem('fl_active_account');
    setCurrentUser(null);
  };

  /* auth modal state */
  const [isAuthOpen,   setIsAuthOpen]   = useState(false);
  const [authMode,     setAuthMode]     = useState('login');
  const [selectedRole, setSelectedRole] = useState('citizen');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [name,         setName]         = useState('');
  const [statusMsg,    setStatusMsg]    = useState({ type: '', text: '' });
  const [loading,      setLoading]      = useState(false);

  const openAuthModal = (mode = 'login', role = 'citizen') => {
    setAuthMode(mode); setSelectedRole(role);
    setStatusMsg({ type: '', text: '' }); setIsAuthOpen(true);
  };

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const a = p.get('auth');
    if (a === 'login' || a === 'signup') {
      openAuthModal(a, p.get('role') || 'citizen');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useScrollReveal();

  const typedWord = useTypedText(['Progress', 'Solutions', 'Change', 'Action'], 110, 1600);

  const handleAuthSubmit = async (e) => {
    e.preventDefault(); setStatusMsg({ type: '', text: '' }); setLoading(true);
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { first_name: name.trim() || email.split('@')[0], role: selectedRole } },
        });
        if (error) throw error;
        const dn = name.trim() || email.split('@')[0];
        const u = { id: data?.user?.id || `user-${Date.now()}`, name: dn, email: email.trim(), role: selectedRole, token: data?.session?.access_token || '', initials: dn.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() };
        localStorage.setItem('fl_active_account', JSON.stringify(u)); setCurrentUser(u);
        setStatusMsg({ type: 'success', text: `Account created! Redirecting…` });
        setTimeout(() => { window.location.href = `/${selectedRole}.html`; }, 700);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        const meta = data?.user?.user_metadata || {};
        const role = meta.role || selectedRole;
        const dn = meta.first_name || data.user.email.split('@')[0];
        const u = { id: data.user.id, name: dn, email: data.user.email, role, token: data?.session?.access_token || '', initials: dn.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() };
        localStorage.setItem('fl_active_account', JSON.stringify(u)); setCurrentUser(u);
        setStatusMsg({ type: 'success', text: `Welcome back! Redirecting…` });
        setTimeout(() => { window.location.href = `/${role}.html`; }, 700);
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Authentication error.' });
    } finally { setLoading(false); }
  };

  const handleEnterDemo = (roleKey) => {
    localStorage.setItem('fl_active_account', JSON.stringify(DEMO_ACCOUNTS[roleKey]));
    window.location.href = `/${roleKey}.html`;
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className={`app-shell lp-root lp-${theme}`}>
      <Navbar
        currentUser={currentUser}
        activePage="landing"
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => openAuthModal('login')}
        onLogout={handleLogout}
      />

      <main className="lp-main" ref={mainRef}>

        {/* ═══ HERO ══════════════════════════════════════════ */}
        <section className="lp-hero">
          {/* animated grid */}
          <div className="lp-hero-grid" aria-hidden="true" />

          {/* cursor-driven spotlight overlay */}
          <div className="lp-spotlight" aria-hidden="true" />

          {/* floating parallax shapes */}
          <div className="lp-hero-shapes" aria-hidden="true">
            <div className="lp-shape lp-shape-a" ref={shapeARef} />
            <div className="lp-shape lp-shape-b" ref={shapeBRef} />
            <div className="lp-shape lp-shape-c" ref={shapeCRef} />
          </div>

          {/* hero content — tilts with cursor */}
          <div className="lp-hero-content" ref={heroRef}>
            <div className="lp-eyebrow-wrap reveal">
              <span className="lp-eyebrow-dot" />
              <span className="lp-eyebrow-text">A PLATFORM FOR PUBLIC PROBLEMS</span>
            </div>

            <h1 className="lp-hero-heading reveal">
              Real Problems.<br />
              Collective{' '}
              <span className="lp-typed-wrap">
                <span className="lp-typed-text">{typedWord}</span>
                <span className="lp-cursor">|</span>
              </span>
            </h1>

            <p className="lp-hero-sub reveal">
              Citizens surface what matters. Universities investigate what is possible.<br />
              Industry helps deliver what lasts.
            </p>

            <div className="lp-hero-btns reveal">
              {currentUser ? (
                <>
                  <a href={`/${currentUser.role}.html`} className="lp-btn-primary" style={{ textDecoration: 'none' }}>
                    Enter Dashboard <span className="lp-btn-icon">→</span>
                  </a>
                  <button className="lp-btn-ghost" onClick={handleLogout}>Sign Out</button>
                </>
              ) : (
                <>
                  <button className="lp-btn-primary" onClick={() => openAuthModal('signup')}>
                    Join the Platform <span className="lp-btn-icon">→</span>
                  </button>
                  <button className="lp-btn-ghost" onClick={() => openAuthModal('login')}>Sign In</button>
                </>
              )}
            </div>

            <div className="lp-tag-strip reveal">
              {['Mobility', 'Safety', 'Climate', 'Infrastructure', 'Health'].map((t) => (
                <span key={t} className="lp-tag">{t}</span>
              ))}
            </div>
          </div>

          <div className="lp-scroll-hint" aria-hidden="true">
            <div className="lp-scroll-line" />
          </div>
        </section>

        {/* ═══ ROLES ═════════════════════════════════════════ */}
        <section className="lp-section lp-roles-section">
          <div className="lp-section-inner">
            <div className="lp-section-label reveal">
              <span className="lp-label-line" /><span>CHOOSE YOUR ROLE</span><span className="lp-label-line" />
            </div>
            <h2 className="lp-section-h reveal">Every problem needs more than one perspective.</h2>
            <p className="lp-section-sub reveal">Start where you are, then connect with people who can move the work forward.</p>

            <div className="lp-roles-grid">
              {[
                { role: 'citizen',    label: 'Citizen',    color: '#f472b6', delay: 1,
                  desc: 'Raise lived problems, add local context, and keep the work accountable to real community needs.',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                { role: 'university', label: 'University', color: '#c084fc', delay: 2,
                  desc: 'Turn community questions into research, prototypes, and evidence people can actually use.',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> },
                { role: 'industry',   label: 'Industry',   color: '#818cf8', delay: 3,
                  desc: 'Bring practical capacity, expertise, and responsible pathways to scale real solutions.',
                  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
              ].map(({ role, label, color, delay, desc, icon }) => (
                <div key={role} className={`lp-role-card reveal reveal-delay-${delay}`} style={{ '--card-accent': color }}>
                  <div className="lp-role-icon">{icon}</div>
                  <h3>{label}</h3>
                  <p>{desc}</p>
                  <button className="lp-role-link" onClick={() => openAuthModal('signup', role)}>
                    Explore as {label.toLowerCase()} <span>→</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ══════════════════════════════════ */}
        <section className="lp-section lp-how-section">
          <div className="lp-section-inner">
            <div className="lp-section-label reveal">
              <span className="lp-label-line" /><span>FROM ISSUE TO ACTION</span><span className="lp-label-line" />
            </div>
            <h2 className="lp-section-h reveal">A clearer path from concern to contribution.</h2>

            <div className="lp-steps-row">
              {[
                { n: '01', title: 'Surface the Problem', body: 'Citizens post real challenges — organized by need, place, and urgency.', delay: 1 },
                { n: '02', title: 'Community Adds Context', body: 'Others validate, upvote, and discuss — making the evidence stronger.', delay: 2 },
                { n: '03', title: 'Partners Act', body: 'Universities and industry propose solutions and deliver lasting change.', delay: 3 },
              ].map(({ n, title, body, delay }) => (
                <div key={n} className={`lp-step reveal reveal-delay-${delay}`}>
                  <span className="lp-step-num">{n}</span>
                  <h4>{title}</h4>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ STATS ═════════════════════════════════════════ */}
        <section className="lp-stats-section reveal">
          <div className="lp-stats-inner">
            {[{ val: '3', label: 'Stakeholder Groups' }, { val: '1', label: 'Shared Platform' }, { val: '∞', label: 'Possibilities' }].map(({ val, label }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <div className="lp-stat-divider" />}
                <div className="lp-stat">
                  <span className="lp-stat-val">{val}</span>
                  <span className="lp-stat-lbl">{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ═══ CTA ═══════════════════════════════════════════ */}
        <section className="lp-cta-section">
          <div className="lp-cta-glow" aria-hidden="true" />
          <div className="lp-cta-inner reveal">
            <h2 className="lp-cta-h">Ready to make your first look count?</h2>
            <p className="lp-cta-sub">Join citizens, universities, and industries solving real problems together.</p>
            <button className="lp-btn-primary lp-btn-lg" onClick={() => openAuthModal('signup')}>
              Get Started — It's Free <span className="lp-btn-icon">→</span>
            </button>
          </div>
        </section>

        {/* ═══ FOOTER ════════════════════════════════════════ */}
        <footer className="lp-footer">
          <span>First Look — shared problems, practical progress.</span>
          <span>Open civic network</span>
        </footer>
      </main>

      {/* ═══ AUTH MODAL ════════════════════════════════════════ */}
      {isAuthOpen && (
        <div className="modal-backdrop" onClick={() => setIsAuthOpen(false)}>
          <div className="modal-container auth-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-top">
              <span className="auth-modal-badge">FIRST LOOK AUTH</span>
              <button type="button" className="modal-close-icon-btn" onClick={() => setIsAuthOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="auth-card-header">
              <h2>{authMode === 'login' ? 'Sign in to First Look' : 'Create an Account'}</h2>
              <p>Select your role to access your dedicated space</p>
            </div>
            <div className="auth-mode-toggle">
              <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => { setAuthMode('login'); setStatusMsg({ type: '', text: '' }); }}>Log In</button>
              <button type="button" className={authMode === 'signup' ? 'active' : ''} onClick={() => { setAuthMode('signup'); setStatusMsg({ type: '', text: '' }); }}>Sign Up</button>
            </div>
            <div className="auth-role-select-box">
              <label className="field-label">Select Your Role:</label>
              <div className="role-pills-row">
                {['citizen', 'university', 'industry'].map((r) => (
                  <button key={r} type="button" className={`role-choice-btn ${selectedRole === r ? 'active' : ''}`} onClick={() => setSelectedRole(r)}>
                    {r === 'citizen' ? '👤' : r === 'university' ? '🎓' : '🏢'} {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {statusMsg.text && <div className={`status-box ${statusMsg.type}`}>{statusMsg.text}</div>}
            <form onSubmit={handleAuthSubmit} className="auth-inner-form">
              {authMode === 'signup' && (
                <div className="form-field-group">
                  <label className="field-label">Full Name</label>
                  <input type="text" required placeholder="e.g. Jane Doe" value={name} onChange={(e) => setName(e.target.value)} className="field-input" />
                </div>
              )}
              <div className="form-field-group">
                <label className="field-label">Email Address</label>
                <input type="email" required placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" />
              </div>
              <div className="form-field-group">
                <label className="field-label">Password</label>
                <input type="password" required placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} className="field-input" />
              </div>
              <button type="submit" className="btn btn-blue auth-submit-btn" disabled={loading}>
                {loading ? 'Processing…' : authMode === 'login' ? `Login as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}` : `Sign Up as ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`}
              </button>
            </form>
            <div className="instant-demo-footer">
              <div className="demo-divider-row"><span>OR PREVIEW DEMO DASHBOARD WITHOUT LOGIN</span></div>
              <p className="demo-subnote">Skip login to test sample accounts directly:</p>
              <div className="demo-buttons-grid">
                <button type="button" onClick={() => handleEnterDemo('citizen')}    className="demo-role-btn"><span className="badge-citz">CITZ</span> Citizen Demo</button>
                <button type="button" onClick={() => handleEnterDemo('university')} className="demo-role-btn"><span className="badge-uni">UNI</span> University Demo</button>
                <button type="button" onClick={() => handleEnterDemo('industry')}   className="demo-role-btn"><span className="badge-inds">INDS</span> Industry Demo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
