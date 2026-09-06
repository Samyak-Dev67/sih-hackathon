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
        <div className="uni-workspace-dashboard">
          {/* Workspace Hero Banner */}
          <div className="uni-workspace-header-row">
            <div>
              <h1 className="uni-workspace-title">
                Supported Initiatives: {currentAccount?.name || 'Industry Partner'}
              </h1>
              <p className="uni-workspace-subtitle">
                Review academic research progress, collaborate with university student cohorts, and monitor milestone funding disbursements.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-blue uni-explore-btn"
              onClick={() => setActiveTab('discover')}
            >
              Explore All Challenges
            </button>
          </div>

          {/* 3 Metric Cards for Industry */}
          <div className="uni-metrics-grid">
            <div className="uni-metric-card">
              <span className="uni-metric-label">PROJECTS SUPPORTED</span>
              <span className="uni-metric-value text-blue">{supportedChallenges.length}</span>
            </div>

            <div className="uni-metric-card">
              <span className="uni-metric-label">TOTAL FUNDS COMMITTED</span>
              <span className="uni-metric-value text-orange">
                ₹{totalCommitted.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="uni-metric-card">
              <span className="uni-metric-label">TOTAL FUNDS TRANSFERRED</span>
              <span className="uni-metric-value text-green">
                ₹{totalTransferred.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Supported Projects List */}
          <div className="uni-challenges-section" style={{ marginTop: '2rem' }}>
            <div className="section-title-row" style={{ marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Active Supported Challenges ({supportedChallenges.length})
              </h2>
            </div>

            {supportedChallenges.length === 0 ? (
              <div className="empty-feed-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
                <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  You are not supporting any challenge yet
                </h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
                  Browse citizen problems that have been accepted by universities, review their research roadmap, and empower their milestones.
                </p>
                <button
                  type="button"
                  className="btn btn-blue"
                  onClick={() => setActiveTab('discover')}
                >
                  Discover Open & Accepted Challenges
                </button>
              </div>
            ) : (
              <div className="uni-claims-grid">
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
                      className="uni-claim-card"
                      onClick={() => onOpenWorkspace && onOpenWorkspace(claim.postId)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="uni-claim-card-top">
                        <span className="tag-pill category-tag">{claim.category}</span>
                        <span className="tag-pill status-accepted-badge">SUPPORTED</span>
                      </div>

                      <h3 className="uni-claim-card-title">{claim.title}</h3>

                      {/* Lead University */}
                      <div className="uni-claim-team-row" style={{ marginTop: '0.5rem' }}>
                        <span className="uni-claim-team-label">Lead Institution:</span>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {claim.universityName || 'University Lab'}
                        </strong>
                      </div>

                      {/* Assigned Student Teams */}
                      <div className="uni-claim-team-row">
                        <span className="uni-claim-team-label">Assigned Cohort:</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {assignedTeams.length > 0 
                            ? `${assignedTeams.length} research team(s) working` 
                            : 'Lead faculty assigned'}
                        </span>
                      </div>

                      {/* Funding Summary Pill */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
                        {claimTransferred > 0 && (
                          <span className="milestone-funding-pill is-transferred">
                            <span className="funding-status-dot green" />
                            ₹{claimTransferred.toLocaleString('en-IN')} transferred
                          </span>
                        )}
                        {claimCommitted > 0 && (
                          <span className="milestone-funding-pill is-committed">
                            <span className="funding-status-dot blue" />
                            ₹{claimCommitted.toLocaleString('en-IN')} committed
                          </span>
                        )}
                        {claimTransferred === 0 && claimCommitted === 0 && (
                          <span className="tag-pill" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            No milestone funded yet
                          </span>
                        )}
                      </div>

                      {/* Milestone Progress Bar */}
                      <div className="uni-claim-progress-wrap">
                        <div className="uni-claim-progress-text">
                          <span>{completedCount} of {milestones.length} Milestones</span>
                          <span>{claim.progress || 0}%</span>
                        </div>
                        <div className="uni-claim-progress-track">
                          <div 
                            className="uni-claim-progress-bar"
                            style={{ width: `${claim.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Card Action */}
                      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
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
