import React, { useState } from 'react';
import { ProblemCard } from './ProblemCard';
import { CATEGORIES } from '../data/mockData';

export function IndustryDashboard({ 
  currentAccount, 
  posts = [], 
  onVote, 
  onDownvote, 
  onSelectPost,
  searchQuery: propSearchQuery,
  onSearchChange: propOnSearchChange
}) {
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
      {/* Industry Banner */}
      <div className="dashboard-welcome-banner industry-banner">
        <div className="banner-text-content">
          <span className="banner-role-pill">INDUSTRY PORTAL</span>
          <h2>Enterprise Solutions & Technical Innovation</h2>
          <p>
            Discover real-world citizen problems. Deploy commercial-grade technical solutions,
            sponsor community initiatives, and collaborate with universities.
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
                Discover Citizen Problems ({filteredPosts.length})
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
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
