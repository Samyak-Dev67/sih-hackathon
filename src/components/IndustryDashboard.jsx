import React, { useState } from 'react';
import { ProblemCard } from './ProblemCard';
import { CATEGORIES } from '../data/mockData';
import { 
  getIndustrySupportedChallenges, 
  getTeamsForProblem, 
  getUniversityStudents 
} from '../services/api';

export function IndustryDashboard({ 
  currentAccount, 
  posts = [], 
  onVote, 
  onDownvote, 
  onSelectPost,
  searchQuery: propSearchQuery,
  onSearchChange: propOnSearchChange,
  onOpenWorkspace
}) {
  const [activeTab, setActiveTab] = useState('supported'); // 'supported' | 'discover'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  // Fetch supported challenges for this industry account
  const supportedChallenges = getIndustrySupportedChallenges(currentAccount?.id);

  // Compute financial metrics in Rupees (INR)
  let totalCommitted = 0;
  let totalTransferred = 0;

  supportedChallenges.forEach(claim => {
    const milestones = claim.milestones || [];
    milestones.forEach(m => {
      if (m.funding && typeof m.funding.amount === 'number') {
        if (m.completed || m.funding.transferred) {
          totalTransferred += m.funding.amount;
        } else {
          totalCommitted += m.funding.amount;
        }
      }
    });
  });

  const activeSearch = propSearchQuery !== undefined ? propSearchQuery : localSearch;
  const setActiveSearch = propOnSearchChange || setLocalSearch;
  const cleanQ = (activeSearch || '').toLowerCase().trim();

  // Filter posts for the discover tab
  const filteredPosts = posts.filter(post => {
    if (selectedCategory !== 'All' && (post.category || '').toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (cleanQ) {
      const titleStr = (post.title || '').toLowerCase();
      if (!titleStr.includes(cleanQ)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="dashboard-container">
      {/* Top Industry Navigation Tabs */}
      <div className="uni-subnav-bar industry-subnav-bar">
        <button
          type="button"
          className={`uni-nav-tab-btn ${activeTab === 'supported' ? 'active' : ''}`}
          onClick={() => setActiveTab('supported')}
        >
          You Support ({supportedChallenges.length})
        </button>
        <button
          type="button"
          className={`uni-nav-tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          Discover Challenges ({posts.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: YOU SUPPORT (Personalized for this specific Industry account)      */}
      {/* ========================================================================= */}
      {activeTab === 'supported' && (
        <div className="industry-dashboard-content">
          {/* Workspace Hero Banner */}
          <div className="industry-hero-banner">
            <div className="industry-hero-text">
              <div className="industry-eyebrow">
                <span className="industry-pulse-dot" />
                <span>ENTERPRISE COLLABORATION PORTAL</span>
              </div>
              <h1 className="industry-title">
                Supported Initiatives: {currentAccount?.name || 'Industry Partner'}
              </h1>
              <p className="industry-subtitle">
                Review academic research progress, collaborate with university student cohorts, and monitor milestone funding disbursements.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline industry-explore-btn"
              onClick={() => setActiveTab('discover')}
            >
              Explore All Challenges →
            </button>
          </div>

          {/* 3 Metric Cards for Industry */}
          <div className="industry-metrics-grid">
            <div className="industry-metric-card metric-blue">
              <div className="industry-metric-header">
                <span className="industry-metric-label">PROJECTS SUPPORTED</span>
                <span className="industry-metric-badge badge-blue">ACTIVE</span>
              </div>
              <div className="industry-metric-value text-blue">{supportedChallenges.length}</div>
              <span className="industry-metric-subtext">University challenges backed</span>
            </div>

            <div className="industry-metric-card metric-orange">
              <div className="industry-metric-header">
                <span className="industry-metric-label">TOTAL FUNDS COMMITTED</span>
                <span className="industry-metric-badge badge-orange">IN ESCROW</span>
              </div>
              <div className="industry-metric-value text-orange">
                ₹{totalCommitted.toLocaleString('en-IN')}
              </div>
              <span className="industry-metric-subtext">Held in escrow until milestone delivery</span>
            </div>

            <div className="industry-metric-card metric-green">
              <div className="industry-metric-header">
                <span className="industry-metric-label">TOTAL FUNDS TRANSFERRED</span>
                <span className="industry-metric-badge badge-green">DISBURSED</span>
              </div>
              <div className="industry-metric-value text-green">
                ₹{totalTransferred.toLocaleString('en-IN')}
              </div>
              <span className="industry-metric-subtext">Released upon verified completion</span>
            </div>
          </div>

          {/* Supported Projects List */}
          <div className="industry-supported-section">
            <div className="industry-section-header">
              <h2>Active Supported Challenges ({supportedChallenges.length})</h2>
              <span className="industry-section-count">Directing research grants to verified university solutions</span>
            </div>

            {supportedChallenges.length === 0 ? (
              <div className="industry-empty-card">
                <div className="industry-empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3>You are not supporting any challenge yet</h3>
                <p>
                  Browse citizen problems that have been accepted by universities, review their research roadmap, and empower their milestones with research grants.
                </p>
                <button
                  type="button"
                  className="btn btn-blue"
                  onClick={() => setActiveTab('discover')}
                >
                  Discover Open & Accepted Challenges →
                </button>
              </div>
            ) : (
              <div className="industry-supported-grid">
                {supportedChallenges.map((claim) => {
                  const milestones = claim.milestones || [];
                  const completedCount = milestones.filter(m => m.completed).length;
                  const assignedTeams = getTeamsForProblem(claim.universityId, claim.postId);

                  // Calculate per-claim funding
                  let claimCommitted = 0;
                  let claimTransferred = 0;
                  milestones.forEach(m => {
                    if (m.funding && typeof m.funding.amount === 'number') {
                      if (m.completed || m.funding.transferred) {
                        claimTransferred += m.funding.amount;
                      } else {
                        claimCommitted += m.funding.amount;
                      }
                    }
                  });

                  return (
                    <div 
                      key={claim.id || claim.postId}
                      className="industry-supported-card"
                      onClick={() => onOpenWorkspace && onOpenWorkspace(claim.postId)}
                    >
                      <div className="industry-card-top-row">
                        <div className="industry-card-badges">
                          <span className="tag-pill category-tag">{claim.category}</span>
                          <span className="tag-pill status-accepted-badge">SUPPORTED</span>
                        </div>
                        <span className="industry-card-id">ID #{claim.postId}</span>
                      </div>

                      <h3 className="industry-card-title">{claim.title}</h3>

                      <div className="industry-card-meta-list">
                        <div className="industry-card-meta-item">
                          <span className="industry-meta-label">Lead Institution:</span>
                          <strong className="industry-meta-value">{claim.universityName || 'University Lab'}</strong>
                        </div>

                        <div className="industry-card-meta-item">
                          <span className="industry-meta-label">Assigned Cohort:</span>
                          <span className="industry-meta-value">
                            {assignedTeams.length > 0 
                              ? `${assignedTeams.length} research team(s) active` 
                              : 'Faculty-led research team'}
                          </span>
                        </div>
                      </div>

                      {/* Financial status strip */}
                      <div className="industry-card-funding-row">
                        <div className="funding-chip committed">
                          <span className="funding-chip-dot blue" />
                          <span className="funding-chip-label">Committed:</span>
                          <strong className="funding-chip-amount">₹{claimCommitted.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="funding-chip transferred">
                          <span className="funding-chip-dot green" />
                          <span className="funding-chip-label">Transferred:</span>
                          <strong className="funding-chip-amount">₹{claimTransferred.toLocaleString('en-IN')}</strong>
                        </div>
                      </div>

                      {/* Milestone Progress Bar */}
                      <div className="industry-card-progress-section">
                        <div className="industry-card-progress-labels">
                          <span className="progress-count-text">
                            {completedCount} of {milestones.length} Milestones Completed
                          </span>
                          <span className="progress-percent-text">{claim.progress || 0}% Complete</span>
                        </div>
                        <div className="industry-card-progress-track">
                          <div 
                            className="industry-card-progress-bar"
                            style={{ width: `${claim.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Row */}
                      <div className="industry-card-action-row">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm industry-card-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenWorkspace) onOpenWorkspace(claim.postId);
                          }}
                        >
                          Enter Problem Workspace →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DISCOVER CHALLENGES (Browse both accepted and unaccepted problems) */}
      {/* ========================================================================= */}
      {activeTab === 'discover' && (
        <div className="dashboard-layout-grid">
          {/* Left Filter Sidebar */}
          <aside className="dashboard-sidebar">
            <div className="sidebar-widget">
              <h4 className="widget-title">Industry Sectors</h4>
              <div className="category-filter-list">
                {CATEGORIES.map((cat) => {
                  const count = cat === 'All' 
                    ? posts.length 
                    : posts.filter(p => (p.category || '').toLowerCase() === cat.toLowerCase()).length;
                  return (
                    <button 
                      key={cat}
                      className={`filter-item-btn ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      <span>{cat}</span>
                      <span className="filter-count-badge">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Feed Column */}
          <section className="dashboard-feed-column">
            <div className="feed-header-controls">
              <div className="feed-tabs-row">
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  All Citizen Problems ({filteredPosts.length})
                </span>
              </div>

              <div className="feed-search-box">
                <input 
                  type="text"
                  placeholder="Filter problems by title..."
                  value={activeSearch}
                  onChange={(e) => setActiveSearch(e.target.value)}
                  className="feed-search-input"
                />
                {activeSearch && (
                  <button 
                    type="button" 
                    className="feed-search-clear-btn" 
                    onClick={() => setActiveSearch('')}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="problems-feed-stream">
              {filteredPosts.length === 0 ? (
                <div className="empty-feed-card">
                  <h3>No citizen problems found</h3>
                  <p>
                    {activeSearch || selectedCategory !== 'All'
                      ? `No problems match title "${activeSearch}".`
                      : 'Check back soon or adjust your category search.'}
                  </p>
                  {(activeSearch || selectedCategory !== 'All') && (
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      onClick={() => { setActiveSearch(''); setSelectedCategory('All'); }}
                      style={{ marginTop: '0.5rem' }}
                    >
                      Reset Search Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <ProblemCard 
                    key={post.id}
                    post={post}
                    onVote={onVote}
                    onDownvote={onDownvote}
                    onSelectPost={onSelectPost}
                    currentAccountId={currentAccount?.id}
                    currentAccount={currentAccount}
                    onOpenWorkspace={onOpenWorkspace}
                  />
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
