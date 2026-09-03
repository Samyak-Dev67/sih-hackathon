import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';

export default function App() {
  // Navigation state: 'landing' | 'login' | 'citizen' | 'university' | 'industry'
  const [currentPage, setCurrentPage] = useState('landing');

  // Auth mode: 'login' | 'signup'
  const [authMode, setAuthMode] = useState('login');

  // Selected Role: 'citizen' | 'university' | 'industry'
  const [role, setRole] = useState('citizen');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Check Supabase session on initial mount
  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const savedRole = session.user.user_metadata?.role || 'citizen';
          setRole(savedRole);
        }
      } catch (err) {
        console.log('Session check:', err);
      }
    }
    checkSession();
  }, []);

  // Supabase Auth Handler
  const handleAuth = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });
    setLoading(true);

    try {
      if (authMode === 'signup') {
        // Sign Up with user metadata
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              first_name: firstName.trim() || email.split('@')[0],
              role: role,
            },
          },
        });

        if (error) throw error;

        setStatusMsg({
          type: 'success',
          text: `Account created successfully for ${role}! Redirecting to ${role} page...`
        });

        setUser(data?.user || { email, user_metadata: { role, first_name: firstName } });
        
        setTimeout(() => {
          setCurrentPage(role);
          setStatusMsg({ type: '', text: '' });
        }, 1000);

      } else {
        // Log In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;

        const userRole = data?.user?.user_metadata?.role || role;
        setUser(data.user);
        setRole(userRole);

        setStatusMsg({
          type: 'success',
          text: `Logged in successfully! Redirecting to ${userRole} page...`
        });

        setTimeout(() => {
          setCurrentPage(userRole);
          setStatusMsg({ type: '', text: '' });
        }, 800);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setStatusMsg({
        type: 'error',
        text: err.message || 'Authentication error. Please check your details.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Direct quick demo navigation (for effortless testing/hackathon demos)
  const handleQuickJump = (targetRole) => {
    setRole(targetRole);
    setCurrentPage(targetRole);
  };

  // Sign out
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
    setCurrentPage('landing');
  };

  return (
    <div className="simple-app-wrapper">
      {/* Top Governmental & Social Media Style Navigation Bar */}
      <header className="simple-navbar">
        <div className="nav-container">
          <div className="brand-logo" onClick={() => setCurrentPage('landing')}>
            <div className="logo-box">FL</div>
            <div className="brand-titles">
              <span className="platform-name">First Look</span>
              <span className="platform-tagline">PUBLIC PROBLEM SOLVING</span>
            </div>
          </div>

          <nav className="nav-links">
            <button 
              className={`nav-btn ${currentPage === 'landing' ? 'active' : ''}`}
              onClick={() => setCurrentPage('landing')}
            >
              Home / Info
            </button>

            {user ? (
              <>
                <button 
                  className={`nav-btn ${currentPage === role ? 'active' : ''}`}
                  onClick={() => setCurrentPage(role)}
                >
                  {role.toUpperCase()} Page
                </button>
                <button className="nav-btn logout-btn" onClick={handleLogout}>
                  Log Out
                </button>
              </>
            ) : (
              <button 
                className={`nav-btn primary-btn ${currentPage === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setStatusMsg({ type: '', text: '' });
                  setCurrentPage('login');
                }}
              >
                Login / Sign Up
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content View Switcher */}
      <main className="simple-main-content">
        
        {/* ================= 1. LANDING PAGE ================= */}
        {currentPage === 'landing' && (
          <div className="landing-view">
            {/* Dark Hero Card matching Reference Image */}
            <section className="hero-card">
              <span className="hero-badge">FIRST LOOK</span>
              <h1 className="hero-title">Real problems. Collective solutions.</h1>
              <p className="hero-description">
                A web-based platform designed to create a common ecosystem connecting citizens,
                industries, and universities to work together on real-world challenges.
              </p>
              <div className="hero-buttons">
                <button 
                  className="btn btn-blue"
                  onClick={() => {
                    setAuthMode('signup');
                    setCurrentPage('login');
                  }}
                >
                  Join the Platform
                </button>
                <button 
                  className="btn btn-white"
                  onClick={() => {
                    setAuthMode('login');
                    setCurrentPage('login');
                  }}
                >
                  Sign In
                </button>
              </div>
            </section>

            {/* Platform Description & Information */}
            <section className="info-section">
              <div className="section-heading">
                <h2>About the Platform</h2>
                <p>
                  Instead of having citizens, companies, and educational institutions operate independently,
                  First Look brings them together around common needs, skills, ideas, and opportunities.
                </p>
              </div>

              <div className="pillars-grid">
                <div className="pillar-card">
                  <div className="pillar-badge">CITIZEN</div>
                  <h3>For Citizens</h3>
                  <p>
                    Discover relevant opportunities, submit real-world problems or ideas, participate
                    in community initiatives, and connect with universities and industries that can help
                    solve neighborhood and civic challenges.
                  </p>
                </div>

                <div className="pillar-card">
                  <div className="pillar-badge">UNIVERSITY</div>
                  <h3>For Universities</h3>
                  <p>
                    Connect students and researchers with industry requirements and civic problems.
                    Showcase research and capstone projects, form multidisciplinary teams, and gain
                    practical problem-solving exposure.
                  </p>
                </div>

                <div className="pillar-card">
                  <div className="pillar-badge">INDUSTRY</div>
                  <h3>For Industries</h3>
                  <p>
                    Identify top academic talent, collaborate with university laboratories, discover
                    innovative ideas, post challenges or requirements, and sponsor solutions that
                    address societal and industrial needs.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================= 2. LOGIN & SIGNUP PAGE ================= */}
        {currentPage === 'login' && (
          <div className="login-view">
            <div className="auth-card">
              <div className="auth-header">
                <h2>{authMode === 'login' ? 'Sign in to First Look' : 'Create an Account'}</h2>
                <p>Select your role to access your dedicated space</p>
              </div>

              {/* Mode Toggle (Login vs Sign Up) */}
              <div className="auth-toggle">
                <button 
                  type="button"
                  className={authMode === 'login' ? 'toggle-active' : ''}
                  onClick={() => { setAuthMode('login'); setStatusMsg({ type: '', text: '' }); }}
                >
                  Log In
                </button>
                <button 
                  type="button"
                  className={authMode === 'signup' ? 'toggle-active' : ''}
                  onClick={() => { setAuthMode('signup'); setStatusMsg({ type: '', text: '' }); }}
                >
                  Sign Up
                </button>
              </div>

              {/* Role Selection (Citizen, University, Industry) */}
              <div className="role-selector-block">
                <label className="form-label">Select Your Role:</label>
                <div className="role-options">
                  <button 
                    type="button"
                    className={`role-tab ${role === 'citizen' ? 'selected' : ''}`}
                    onClick={() => setRole('citizen')}
                  >
                    Citizen
                  </button>
                  <button 
                    type="button"
                    className={`role-tab ${role === 'university' ? 'selected' : ''}`}
                    onClick={() => setRole('university')}
                  >
                    University
                  </button>
                  <button 
                    type="button"
                    className={`role-tab ${role === 'industry' ? 'selected' : ''}`}
                    onClick={() => setRole('industry')}
                  >
                    Industry
                  </button>
                </div>
              </div>

              {/* Status & Error Notification */}
              {statusMsg.text && (
                <div className={`status-box ${statusMsg.type}`}>
                  {statusMsg.text}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleAuth} className="simple-form">
                {authMode === 'signup' && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Jane Doe"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                  />
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Processing...' : (authMode === 'login' ? `Login as ${role}` : `Sign Up as ${role}`)}
                </button>
              </form>

              {/* Quick Jump for Hackathon testing */}
              <div className="quick-test-section">
                <p className="quick-test-label">Instant Demo Preview (Skip Auth):</p>
                <div className="quick-buttons">
                  <button onClick={() => handleQuickJump('citizen')} className="quick-btn">
                    Citizen Page
                  </button>
                  <button onClick={() => handleQuickJump('university')} className="quick-btn">
                    University Page
                  </button>
                  <button onClick={() => handleQuickJump('industry')} className="quick-btn">
                    Industry Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. CITIZEN ROLE PAGE ================= */}
        {currentPage === 'citizen' && (
          <div className="role-page-view">
            <div className="role-content-box">
              <span className="role-pill">Citizen Role</span>
              <h1>Citizen Page</h1>
              <div className="sample-text-block">
                <p>This is the sample page for Citizens.</p>
                <p>
                  Citizens use this dedicated space to discover local opportunities, submit real-world problems or ideas, participate in civic initiatives, and connect with universities and industries that can help address community needs.
                </p>
                <p>
                  You can track the progress of your submissions, view solutions created by universities, and collaborate with other groups across the ecosystem.
                </p>
              </div>
              <div className="role-actions">
                <button className="btn btn-blue" onClick={() => setCurrentPage('landing')}>
                  Back to Landing Page
                </button>
                <button className="btn btn-outline" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 4. UNIVERSITY ROLE PAGE ================= */}
        {currentPage === 'university' && (
          <div className="role-page-view">
            <div className="role-content-box">
              <span className="role-pill">University Role</span>
              <h1>University Page</h1>
              <div className="sample-text-block">
                <p>This is the sample page for Universities.</p>
                <p>
                  Universities use this dedicated space to connect students and researchers with industry requirements, collaborate on solving real-world challenges, showcase academic research and projects, and help students gain practical exposure.
                </p>
                <p>
                  Faculty and student teams can explore problems posted by citizens and industry partners, apply for research grants, and publish solutions.
                </p>
              </div>
              <div className="role-actions">
                <button className="btn btn-blue" onClick={() => setCurrentPage('landing')}>
                  Back to Landing Page
                </button>
                <button className="btn btn-outline" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= 5. INDUSTRY ROLE PAGE ================= */}
        {currentPage === 'industry' && (
          <div className="role-page-view">
            <div className="role-content-box">
              <span className="role-pill">Industry Role</span>
              <h1>Industry Page</h1>
              <div className="sample-text-block">
                <p>This is the sample page for Industries.</p>
                <p>
                  Industries use this dedicated space to identify emerging talent, collaborate with universities on R&D, discover innovative ideas, post corporate challenges or project requirements, and engage with citizens and students.
                </p>
                <p>
                  Companies can sponsor university research teams, review project proposals, and contribute to solving impactful societal problems.
                </p>
              </div>
              <div className="role-actions">
                <button className="btn btn-blue" onClick={() => setCurrentPage('landing')}>
                  Back to Landing Page
                </button>
                <button className="btn btn-outline" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
