import React from 'react';

export function ProblemCard({ post, onVote, onSelectPost, currentAccountId }) {
  const {
    id,
    title,
    desc,
    img,
    category,
    score = 0,
    created_at,
    liked_by = [],
    solutions = []
  } = post;

  const hasLiked = liked_by.includes(currentAccountId);

  // Format relative time
  const getTimeAgo = (dateStr) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours} hours ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <div className="problem-card">
      {/* Upvote Column - Enforces 1 like per account */}
      <div className="vote-column">
        <button 
          type="button"
          className={`vote-arrow ${hasLiked ? 'active-up' : ''}`}
          onClick={(e) => { e.stopPropagation(); onVote(id); }}
          title={hasLiked ? "You liked this (click to remove)" : "Click to like (1 like per account)"}
          aria-label="Like"
        >
          ▲
        </button>
        <span className={`vote-count ${hasLiked ? 'vote-count-up' : ''}`}>
          {score}
        </span>
        <button 
          type="button"
          className="vote-arrow"
          onClick={(e) => { e.stopPropagation(); onVote(id); }}
          title={hasLiked ? "Remove like" : "Like"}
          aria-label="Downvote"
        >
          ▼
        </button>
      </div>

      {/* Main Problem Content */}
      <div className="problem-body" onClick={() => onSelectPost(post)}>
        {/* Header Row */}
        <div className="problem-header-row">
          <div className="author-meta-block">
            <div className="author-avatar-circle">
              C1
            </div>
            <div className="author-details">
              <span className="author-name">Citizen Account</span>
              <span className="role-badge-tag badge-citz">CITIZEN</span>
              <span className="author-time">• {getTimeAgo(created_at)}</span>
            </div>
          </div>

          <div className="status-container">
            <span className="tag-pill category-tag">{category || 'General'}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="problem-title">{title}</h3>

        {/* Description */}
        <p className="problem-desc-snippet">{desc}</p>

        {/* Image if applicable */}
        {img && (
          <div className="problem-card-image-wrap" style={{ margin: '0.5rem 0', maxHeight: '200px', overflow: 'hidden', borderRadius: '8px' }}>
            <img src={img} alt={title} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
          </div>
        )}

        {/* Footer Meta Row */}
        <div className="problem-footer-row">
          <div className="problem-tags-group">
            <span className="tag-pill">ID #{id}</span>
            <span className="tag-pill">Score: {score}</span>
          </div>

          {/* Solutions indicator - never called "comments" */}
          <div className="solutions-indicator">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span className="solutions-count-text">
              {solutions.length} {solutions.length === 1 ? 'Solution' : 'Solutions'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
