import React, { useState } from 'react';
import { ProblemCard } from './ProblemCard';
import { CATEGORIES } from '../data/mockData';
import { filterProblems } from '../utils/search';

export function UniversityDashboard({ 
  currentAccount, 
  posts = [], 
  onVote, 
  onDownvote,
  onSelectPost 
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = filterProblems(posts, {
    query: searchQuery,
    category: selectedCategory
  });

  return (
    <div className="dashboard-container">
      {/* University Banner */}
      <div className="dashboard-welcome-banner university-banner">
        <div className="banner-text-content">
          <span className="banner-role-pill">UNIVERSITY PORTAL</span>
          <h2>Connect Academic Research with Real-World Community Needs</h2>
          <p>
            Engage faculty laboratories and student teams on real-world citizen problems.
            Select a problem to analyze and submit structured academic solutions.
          </p>
        </div>
        <div className="banner-stats-strip">
          <div className="banner-stat-box">
            <span className="stat-number">{posts.length}</span>
            <span className="stat-desc">Citizen Problems</span>
          </div>
        </div>
      </div>

      <div className="dashboard-layout-grid">
        {/* Left Filter Sidebar */}
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
                Discover Citizen Problems ({filteredPosts.length})
              </span>
            </div>

            <div className="feed-search-box">
              <input 
                type="text"
                placeholder="Search by keyword, ID (#), or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="feed-search-input"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="feed-search-clear-btn" 
                  onClick={() => setSearchQuery('')}
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
                  {searchQuery || selectedCategory !== 'All'
                    ? `No problems match your search filters ${searchQuery ? `("${searchQuery}")` : ''}.`
                    : 'Check back soon or adjust your category search.'}
                </p>
                {(searchQuery || selectedCategory !== 'All') && (
                  <button 
                    type="button"
                    className="btn btn-outline"
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
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
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
