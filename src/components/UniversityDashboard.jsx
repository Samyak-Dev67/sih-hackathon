import React, { useState, useEffect } from 'react';
import { ProblemCard } from './ProblemCard';
import { TeamManagement } from './TeamManagement';
import { CATEGORIES } from '../data/mockData';
import {
  getAcceptedChallenges,
  getUniversityTeams,
  getUniversityStudents,
  fetchUniversityTeams,
  getTeamsForProblem
} from '../services/api';

export function UniversityDashboard({ 
  currentAccount, 
  posts = [], 
  onVote, 
  onDownvote,
  onSelectPost,
  searchQuery: propSearchQuery,
  onSearchChange: propOnSearchChange,
  onOpenWorkspace,
  onAcceptChallenge
}) {
  const [activeTab, setActiveTab] = useState('accepted'); // 'accepted' | 'discover' | 'teams'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  // Fetch accepted challenges for this university
  const acceptedList = getAcceptedChallenges(currentAccount?.id);
  const [uniTeams, setUniTeams] = useState(() => getUniversityTeams(currentAccount?.id));
  const [uniStudents, setUniStudents] = useState(() => getUniversityStudents(currentAccount?.id));

  useEffect(() => {
    async function loadUniData() {
      try {
        const fetched = await fetchUniversityTeams(currentAccount?.id);
        setUniTeams(fetched || []);
        const allStudents = [];
        const seen = new Set();
        (fetched || []).forEach(team => {
          (team.members || []).forEach(m => {
            if (m && (m.id || m.email || m.name)) {
              const key = m.id || m.email || m.name;
              if (!seen.has(key)) {
                seen.add(key);
                allStudents.push(m);
              }
            }
          });
        });
        setUniStudents(allStudents);
      } catch (e) {}
    }
    loadUniData();
  }, [currentAccount?.id, activeTab]);

  const activeSearch = propSearchQuery !== undefined ? propSearchQuery : localSearch;
  const setActiveSearch = propOnSearchChange || setLocalSearch;
  const cleanQ = (activeSearch || '').toLowerCase().trim();

  // Filter open problems for the discover tab
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
      {/* Top University Navigation Tabs */}
      <div className="uni-subnav-bar">
        <button
          type="button"
          className={`uni-nav-tab-btn ${activeTab === 'accepted' ? 'active' : ''}`}
          onClick={() => setActiveTab('accepted')}
        >
          Accepted Challenges ({acceptedList.length})
        </button>
        <button
          type="button"
          className={`uni-nav-tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          Team Management ({uniTeams.length})
        </button>
        <button
          type="button"
          className={`uni-nav-tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          Discover Open Problems ({posts.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACCEPTED CHALLENGES DASHBOARD (Matches User Reference Mockup)      */}
      {/* ========================================================================= */}
      {activeTab === 'accepted' && (
        <div className="uni-workspace-dashboard">
          {/* Workspace Hero Banner */}
          <div className="uni-workspace-header-row">
            <div>
              <h1 className="uni-workspace-title">
                Workspace: {currentAccount?.name || 'University Research Lab'}
              </h1>
              <p className="uni-workspace-subtitle">
                Coordinate active engineering solutions, manage milestones, and view expert claims.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-blue uni-explore-btn"
              onClick={() => setActiveTab('discover')}
            >
              Explore Open Problems
            </button>
          </div>

          {/* 3 Metric Cards (Community Impact Score was excluded per red X) */}
          <div className="uni-metrics-grid">
            <div className="uni-metric-card">
              <span className="uni-metric-label">ACTIVE CLAIMS</span>
              <span className="uni-metric-value text-blue">{acceptedList.length}</span>
            </div>

            <div className="uni-metric-card">
              <span className="uni-metric-label">IN PROGRESS MILESTONES</span>
              <span className="uni-metric-value text-orange">
                {acceptedList.reduce((acc, c) => acc + (c.milestones ? c.milestones.filter(m => !m.completed).length : 0), 0)}
              </span>
            </div>

            <div className="uni-metric-card">
              <span className="uni-metric-label">COMPLETED SOLUTIONS</span>
              <span className="uni-metric-value text-green">
                {acceptedList.filter(c => c.progress === 100).length}
              </span>
            </div>
          </div>

          {/* Challenges I am Working On Section */}
          <div className="uni-challenges-section">
            <h2 className="uni-section-heading">Challenges I am Working On</h2>

            {acceptedList.length === 0 ? (
              <div className="empty-accepted-box">
                <h3>No Accepted Challenges Yet</h3>
                <p>
                  Your university laboratory hasn't taken up any citizen problems yet.
                  Explore open civic challenges and accept them to launch dedicated workspaces.
                </p>
                <button
                  type="button"
                  className="btn btn-blue"
                  style={{ marginTop: '0.75rem' }}
                  onClick={() => setActiveTab('discover')}
                >
                  Browse Open Citizen Problems
                </button>
              </div>
            ) : (
              <div className="uni-challenges-list">
                {acceptedList.map((challenge) => (
                  <div key={challenge.id} className="uni-challenge-card">
                    {/* Card Top Row: Category + Milestone Deadline */}
                    <div className="uni-challenge-top-row">
                      <span className="tag-pill category-tag">{challenge.category}</span>
                      <span className="uni-milestone-deadline">
                        Milestone Deadline: {challenge.milestoneDeadline}
                      </span>
                    </div>

                    {/* Problem Title */}
                    <h3 className="uni-challenge-title">{challenge.title}</h3>

                    {/* Progress Row */}
                    <div className="uni-progress-block">
                      <div className="uni-progress-header">
                        <span className="uni-progress-label">Overall Completion Progress</span>
                        <span className="uni-progress-pct">{challenge.progress || 15}%</span>
                      </div>
                      <div className="uni-progress-track">
                        <div 
                          className="uni-progress-bar"
                          style={{ width: `${Math.min(challenge.progress || 15, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom Row: Team Assigned + Manage Problem Button */}
                    <div className="uni-challenge-footer-row">
                      <div className="uni-team-assigned-block">
                        <span className="uni-team-label">Team Assigned:</span>
                        {(() => {
                          const assignedTeams = getTeamsForProblem(currentAccount?.id, challenge.postId);
                          const assignedStudents = uniStudents.filter(s =>
                            assignedTeams.some(t => (t.studentIds || []).includes(s.id))
                          );

                          if (assignedTeams.length === 0) {
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="text-muted" style={{ fontSize: '0.82rem' }}>No team assigned</span>
                                <button
                                  type="button"
                                  className="btn-link-action"
                                  style={{ fontSize: '0.78rem' }}
                                  onClick={() => setActiveTab('teams')}
                                >
                                  + Assign Team
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                              <span className="team-assigned-name-pill">
                                {assignedTeams.map(t => t.name).join(', ')}
                              </span>
                              <div className="uni-team-avatars-row">
                                {assignedStudents.map((member) => (
                                  <div 
                                    key={member.id} 
                                    className="uni-team-avatar-circle" 
                                    title={`${member.name} (${member.role})`}
                                  >
                                    {member.initials}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="uni-card-action-group">
                        <button
                          type="button"
                          className="btn btn-outline uni-manage-btn"
                          onClick={() => onOpenWorkspace && onOpenWorkspace(challenge.postId)}
                        >
                          Manage Solution
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEAM MANAGEMENT (Specialized Multi-Student Teams)                  */}
      {/* ========================================================================= */}
      {activeTab === 'teams' && (
        <TeamManagement
          currentAccount={currentAccount}
          acceptedProblems={acceptedList}
          onOpenWorkspace={onOpenWorkspace}
          onNavigateToDiscover={() => setActiveTab('discover')}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DISCOVER OPEN PROBLEMS (Open Civic Challenges Catalog)             */}
      {/* ========================================================================= */}
      {activeTab === 'discover' && (
        <div className="dashboard-layout-grid">
          {/* Left Category Filter Sidebar */}
          <aside className="dashboard-sidebar">
            <div className="sidebar-widget">
              <h4 className="widget-title">Research Categories</h4>
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
                  Discover Open Problems ({filteredPosts.length})
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
