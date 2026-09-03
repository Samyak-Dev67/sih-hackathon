import React from 'react';
import { Search, PlusCircle, LogOut, Building2, GraduationCap, Users } from 'lucide-react';

export function Navbar({ 
  currentUser, 
  onOpenAuth, 
  onOpenPostProblem, 
  onLogout, 
  onSelectRoleDemo, 
  activeTab, 
  setActiveTab,
  searchQuery,
  setSearchQuery
}) {
  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Left: Brand Identity */}
        <div className="brand-group" onClick={() => setActiveTab('home')} style={{ cursor: 'pointer' }}>
          <div className="brand-badge-box">
            <span>FL</span>
          </div>
          <div className="brand-text-block">
            <span className="brand-title">First Look</span>
            <span className="brand-tagline">PUBLIC PROBLEM SOLVING</span>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="search-bar-wrapper">
          <Search className="search-icon" size={17} />
          <input 
            type="text" 
            placeholder="Search problems, organizations, university teams..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Right actions */}
        <nav className="nav-actions-group">
          <button 
            className={`nav-link-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Home
          </button>
          
          <button 
            className={`nav-link-btn ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            Discover
          </button>

          <button 
            className={`nav-link-btn ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            Teams
          </button>

          {currentUser && (
            <button 
              className={`nav-link-btn role-dashboard-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              {currentUser.role === 'university' && <GraduationCap size={15} />}
              {currentUser.role === 'industry' && <Building2 size={15} />}
              {currentUser.role === 'citizen' && <Users size={15} />}
              <span>{currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : ''} Portal</span>
            </button>
          )}

          {/* "+ Post Problem" button */}
          <button 
            className="post-problem-btn"
            onClick={onOpenPostProblem}
          >
            <PlusCircle size={16} />
            <span>Post Problem</span>
          </button>

          {/* Quick Demo Switcher */}
          <div className="demo-role-dropdown-container">
            <span className="demo-pill-tag">Role Demo:</span>
            <div className="role-switch-buttons">
              <button 
                title="Switch to Citizen View"
                className={`role-micro-btn ${currentUser?.role === 'citizen' ? 'active-role' : ''}`}
                onClick={() => onSelectRoleDemo('citizen')}
              >
                Citizen
              </button>
              <button 
                title="Switch to University View"
                className={`role-micro-btn ${currentUser?.role === 'university' ? 'active-role' : ''}`}
                onClick={() => onSelectRoleDemo('university')}
              >
                University
              </button>
              <button 
                title="Switch to Industry View"
                className={`role-micro-btn ${currentUser?.role === 'industry' ? 'active-role' : ''}`}
                onClick={() => onSelectRoleDemo('industry')}
              >
                Industry
              </button>
            </div>
          </div>

          {/* User profile / Login trigger */}
          {currentUser ? (
            <div className="user-profile-menu">
              <div 
                className="user-avatar-circle"
                title={`${currentUser.name || currentUser.email} (${currentUser.role || 'Member'})`}
                onClick={() => setActiveTab('dashboard')}
              >
                <span>{(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}</span>
              </div>
              <button 
                className="logout-icon-btn" 
                onClick={onLogout} 
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="auth-buttons-group">
              <button 
                className="login-nav-btn"
                onClick={() => onOpenAuth('login')}
              >
                Log In
              </button>
              <button 
                className="signup-nav-btn"
                onClick={() => onOpenAuth('signup')}
              >
                Sign Up
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
