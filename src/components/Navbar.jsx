import React, { useState } from 'react';
import { DarkModeToggle } from './DarkModeToggle';

export function Navbar({ 
  currentUser = null, // null if not logged in
  activePage = 'landing', // 'landing' | 'citizen' | 'university' | 'industry'
  theme,
  onToggleTheme,
  onOpenAuth,
  onLogout,
  searchQuery = '',
  onSearchChange
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [internalQuery, setInternalQuery] = useState('');
  const currentQuery = onSearchChange ? searchQuery : internalQuery;

  const handleQueryChange = (val) => {
    if (onSearchChange) onSearchChange(val);
    else setInternalQuery(val);
  };

  const getRoleBadge = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'university':
        return { short: 'UNI', label: 'University', cls: 'badge-uni', path: '/university.html' };
      case 'industry':
        return { short: 'INDS', label: 'Industry', cls: 'badge-inds', path: '/industry.html' };
      default:
        return { short: 'CITZ', label: 'Citizen', cls: 'badge-citz', path: '/citizen.html' };
    }
  };

  const roleInfo = currentUser ? getRoleBadge(currentUser.role) : null;

  return (
    <header className="platform-navbar">
      <div className="navbar-inner-wrap">
        {/* Brand Left */}
        <a href="/" className="navbar-brand-group" style={{ textDecoration: 'none' }}>
          <div className="brand-logo-sq">FL</div>
          <div className="brand-text-col">
            <span className="brand-main-title">First Look</span>
            <span className="brand-sub-title">PUBLIC PROBLEM SOLVING</span>
          </div>
        </a>

        {/* Global Search Bar (Accessible to ANYBODY) */}
        <div className="navbar-search-bar">
          <span className="navbar-search-icon">🔍</span>
          <input 
            type="text"
            placeholder="Search problems by keyword, ID (#), or category..."
            value={currentQuery}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (activePage === 'landing') {
                  const el = document.getElementById('search-problems');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.location.href = `/?search=${encodeURIComponent(currentQuery || e.target.value)}#search-problems`;
                }
              }
            }}
            className="navbar-search-input"
          />
          {currentQuery && (
            <button 
              type="button" 
              className="navbar-search-clear"
              onClick={() => handleQueryChange('')}
              title="Clear search"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Center Navigation Links */}
        <nav className="navbar-nav-links">
          <a 
            href="/" 
            className={`nav-link-btn ${activePage === 'landing' ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            Home / Info
          </a>

          <a 
            href={activePage === 'landing' ? '#search-problems' : '/#search-problems'} 
            className="nav-link-btn"
            style={{ textDecoration: 'none' }}
            onClick={(e) => {
              if (activePage === 'landing') {
                e.preventDefault();
                const el = document.getElementById('search-problems');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Search Problems
          </a>

          {/* Show ONLY the logged-in user's relevant dashboard */}
          {currentUser && roleInfo && (
            <a 
              href={roleInfo.path} 
              className={`nav-link-btn ${activePage === currentUser.role ? 'active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              {roleInfo.label} Dashboard
            </a>
          )}
        </nav>

        {/* Right Section: Theme Toggle + Profile OR Login Button */}
        <div className="navbar-right-cluster">
          <DarkModeToggle theme={theme} onToggle={onToggleTheme} />

          {currentUser ? (
            /* Logged-in User Profile Card with (Uni, citz, inds) badge */
            <div className="profile-card-container">
              <div 
                className="profile-pill-card"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                title="Account menu"
              >
                <div className="profile-avatar-circle">
                  {currentUser.initials || currentUser.name?.charAt(0) || 'U'}
                </div>
                <div className="profile-text-group">
                  <span className="profile-user-name">{currentUser.name}</span>
                  <span className={`profile-role-tag ${roleInfo.cls}`}>
                    {roleInfo.short}
                  </span>
                </div>
                <span className="profile-dropdown-arrow">▾</span>
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="profile-dropdown-menu">
                  <div className="dropdown-header">
                    <strong>{currentUser.name}</strong>
                    <span className="dropdown-email">{currentUser.email || 'Logged In'}</span>
                    <span className={`dropdown-role-indicator ${roleInfo.cls}`}>
                      {roleInfo.label} Account ({roleInfo.short})
                    </span>
                  </div>

                  <div className="dropdown-divider"></div>

                  <a 
                    href={roleInfo.path}
                    className="dropdown-item-btn"
                    style={{ textDecoration: 'none' }}
                  >
                    Go to My Dashboard
                  </a>

                  <div className="dropdown-divider"></div>

                  <button 
                    type="button"
                    className="dropdown-item-btn logout-item"
                    onClick={() => {
                      setShowProfileMenu(false);
                      if (onLogout) onLogout();
                      else {
                        localStorage.removeItem('fl_active_account');
                        window.location.href = '/';
                      }
                    }}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Guest Sign In button - When not logged in */
            <button 
              type="button"
              className="btn btn-blue"
              onClick={onOpenAuth}
            >
              Sign In / Sign Up
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
