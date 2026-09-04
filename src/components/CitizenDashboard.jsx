import React, { useState } from 'react';
import { ProblemCard } from './ProblemCard';
import { SubmitProblemForm } from './SubmitProblemForm';
import { CATEGORIES } from '../data/mockData';

export function CitizenDashboard({ 
  currentAccount, 
  posts = [], 
  onVote, 
  onDownvote, 
  onSelectPost, 
  onSubmitProblem,
  onUpdateProblem,
  onDeleteProblem,
  onToggleResolve,
  searchQuery: propSearchQuery,
  onSearchChange: propOnSearchChange
}) {
  const [showSubmitView, setShowSubmitView] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [localSearch, setLocalSearch] = useState('');

  const activeSearch = propSearchQuery !== undefined ? propSearchQuery : localSearch;
  const setActiveSearch = propOnSearchChange || setLocalSearch;

  const cleanQ = (activeSearch || '').toLowerCase().trim();

  // As you type only problems which match the title remain, others disappear; when empty, show all results
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
      {/* Citizen Banner */}
      <div className="dashboard-welcome-banner citizen-banner">
        <div className="banner-text-content">
          <span className="banner-role-pill">CITIZEN PORTAL</span>
          <h2>Voice Community Needs. Connect with Problem Solvers.</h2>
          <p>
            Submit real-world civic problems in your neighborhood. Local universities and enterprise
            partners review community proposals and submit structured solutions.
          </p>
        </div>
        <div className="banner-action">
          {!showSubmitView ? (
            <button 
              className="btn btn-blue banner-btn"
              onClick={() => setShowSubmitView(true)}
            >
              + Post a Problem
            </button>
          ) : (
            <button 
              className="btn btn-outline banner-btn"
              onClick={() => setShowSubmitView(false)}
            >
              ← Back to Problems
            </button>
          )}
        </div>
      </div>

      {showSubmitView ? (
        <SubmitProblemForm 
          onSubmitProblem={async (problemData) => {
            await onSubmitProblem(problemData);
            setShowSubmitView(false);
          }}
          onCancel={() => setShowSubmitView(false)}
        />
      ) : (
        <div className="dashboard-layout-grid">
          {/* Left Sidebar */}
          <aside className="dashboard-sidebar">
            <div className="sidebar-widget">
              <div className="widget-header">
                <h4>Identify a Problem?</h4>
                <p>Post a problem to let universities and industries design structured solutions.</p>
                <button 
                  className="btn btn-blue sidebar-action-btn"
                  onClick={() => setShowSubmitView(true)}
                >
                  + Post Problem
                </button>
              </div>
            </div>

            {/* Category Filters */}
            <div className="sidebar-widget">
              <h4 className="widget-title">Category Filters</h4>
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
                  Citizen Problems ({filteredPosts.length})
                </span>
              </div>

              <div className="feed-search-box">
                <input 
                  type="text"
                  placeholder="Search problems by title..."
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

            {/* Problem Cards Stream */}
            <div className="problems-feed-stream">
              {filteredPosts.length === 0 ? (
                <div className="empty-feed-card">
                  {activeSearch || selectedCategory !== 'All' ? (
                    <>
                      <h3>No problems found</h3>
                      <p>No problems match title "{activeSearch}".</p>
                      <button 
                        className="btn btn-outline"
                        onClick={() => { setActiveSearch(''); setSelectedCategory('All'); }}
                        style={{ marginTop: '0.5rem' }}
                      >
                        Reset Search Filters
                      </button>
                    </>
                  ) : (
                    <>
                      <h3>No problems found</h3>
                      <p>Be the first citizen to post a problem for university and industry teams.</p>
                      <button 
                        className="btn btn-blue"
                        onClick={() => setShowSubmitView(true)}
                      >
                        Post a Problem
                      </button>
                    </>
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
                    onDeleteProblem={onDeleteProblem}
                    onToggleResolve={onToggleResolve}
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
