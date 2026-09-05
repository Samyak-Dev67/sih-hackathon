import React, { useState } from 'react';
import { isPostAuthor, getPostAuthorInfo, getPostStatus, formatRelativeTime } from '../services/api';

export function ProblemCard({ 
  post, 
  onVote, 
  onDownvote, 
  onSelectPost, 
  currentAccountId,
  currentAccount,
  onDeleteProblem,
  onToggleResolve
}) {
  const {
    id,
    title,
    desc,
    img,
    category,
    score = 0,
    created_at,
    liked_by = [],
    downvoted_by = [],
    solutions = [],
    solution = [],
    comments = [],
    resolved = false
  } = post;

  const postSolutions = Array.isArray(solutions) && solutions.length > 0
    ? solutions
    : Array.isArray(solution)
      ? solution
      : [];

  const validComments = (Array.isArray(comments) ? comments : []).filter(
    c => c && typeof c === 'object' && !c.__meta && (c.text || c.comment)
  );

  const accountObj = currentAccount || (currentAccountId ? { id: currentAccountId } : null);
  const isAuthor = isPostAuthor(post, accountObj);
  const authorInfo = getPostAuthorInfo(post, accountObj);
  const status = getPostStatus(post);
  const isResolved = status === 'Resolved' || resolved === true || post.resolved === true;

  const voterId = accountObj?.id;
  const hasLiked = voterId && Array.isArray(liked_by) ? liked_by.includes(voterId) : false;
  const hasDownvoted = voterId && Array.isArray(downvoted_by) ? downvoted_by.includes(voterId) : false;

  const [isVoting, setIsVoting] = useState(false);

  const handleArrowVote = async (e, direction) => {
    e.stopPropagation();
    if (!voterId) {
      alert(`Please sign in to ${direction}vote problems.`);
      return;
    }
    if (isVoting) return;
    setIsVoting(true);
    try {
      if (direction === 'down' && onDownvote) {
        await onDownvote(id);
      } else if (onVote) {
        await onVote(id, direction);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsVoting(false);
    }
  };

  const getTimeAgo = (dateStr) => formatRelativeTime(dateStr);

  const handleCardDelete = async (e) => {
    e.stopPropagation();
    if (!onDeleteProblem) return;
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`);
    if (confirmed) {
      try {
        await onDeleteProblem(id);
      } catch (err) {
        alert(err.message || 'Failed to delete problem.');
      }
    }
  };

  const handleCardToggleResolve = async (e) => {
    e.stopPropagation();
    if (!onToggleResolve) return;
    try {
      await onToggleResolve(id, isResolved ? 'Open' : 'Resolved');
    } catch (err) {
      alert(err.message || 'Failed to update problem status.');
    }
  };

  return (
    <div className={`problem-card ${isResolved ? 'is-resolved' : ''}`}>
      {/* Upvote/Downvote Column - Enforces 1 vote per account */}
      <div className="vote-column">
        <button 
          type="button"
          className={`vote-arrow ${hasLiked ? 'active-up' : ''}`}
          onClick={(e) => handleArrowVote(e, 'up')}
          disabled={isVoting}
          title={hasLiked ? "You upvoted this (click to remove)" : "Click to upvote (1 per account)"}
          aria-label="Upvote"
        >
          ▲
        </button>
        <span className={`vote-count ${hasLiked ? 'vote-count-up' : hasDownvoted ? 'vote-count-down' : ''}`}>
          {score}
        </span>
        <button 
          type="button"
          className={`vote-arrow ${hasDownvoted ? 'active-down' : ''}`}
          onClick={(e) => handleArrowVote(e, 'down')}
          disabled={isVoting}
          title={hasDownvoted ? "You downvoted this (click to remove)" : "Click to downvote (1 per account)"}
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
            <div className="author-avatar-circle" title={`Author: ${authorInfo.name}`}>
              {authorInfo.initials}
            </div>
            <div className="author-details">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span className="author-name">{authorInfo.name}</span>
                <span className="role-badge-tag badge-citz">CITIZEN</span>
                {isAuthor && <span className="author-badge-you">Your Post</span>}
              </div>
              <span className="author-time">• {getTimeAgo(created_at)}</span>
            </div>
          </div>

          <div className="status-container" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {isResolved ? (
              <span className="tag-pill status-resolved-badge">RESOLVED</span>
            ) : (
              <span className="tag-pill status-open-badge">OPEN</span>
            )}
            <span className="tag-pill category-tag">{category || 'General'}</span>

            {/* Author Quick Actions */}
            {isAuthor && (
              <div className="card-author-quick-actions" style={{ display: 'flex', gap: '0.35rem' }}>
                {onToggleResolve && (
                  <button
                    type="button"
                    className={`card-quick-btn ${isResolved ? 'card-reopen-btn' : 'card-resolve-btn'}`}
                    onClick={handleCardToggleResolve}
                    title={isResolved ? "Click to reopen this problem" : "Click to mark as resolved"}
                  >
                    {isResolved ? 'Reopen' : 'Resolve'}
                  </button>
                )}
                {onDeleteProblem && (
                  <button
                    type="button"
                    className="card-quick-btn card-delete-btn"
                    onClick={handleCardDelete}
                    title="Delete your problem"
                    aria-label="Delete problem"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                )}
              </div>
            )}
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

        {/* Solutions section directly visible under the problem post */}
        {postSolutions && postSolutions.length > 0 && (
          <div className="card-solutions-preview-box">
            <div className="card-solutions-preview-header">
              <span className="card-solutions-pill">
                {postSolutions.length} {postSolutions.length === 1 ? 'Solution Submitted' : 'Solutions Submitted'}
              </span>
              <span className="card-solutions-view-hint">Click card to review details →</span>
            </div>
            <div className="card-solutions-mini-list">
              {postSolutions.map((sol, sIdx) => (
                <div key={sol.id || sIdx} className="card-solution-mini-item">
                  <div className="card-solution-mini-top">
                    <span className={`role-badge-tag ${sol.author_role === 'university' ? 'badge-uni' : 'badge-inds'}`}>
                      {(sol.author_role || 'PARTNER').toUpperCase()}
                    </span>
                    <strong className="card-solution-mini-author">{sol.author_name}</strong>
                    {sol.created_at && (
                      <span className="card-solution-mini-date">• {formatRelativeTime(sol.created_at)}</span>
                    )}
                  </div>
                  <h4 className="card-solution-mini-title">{sol.title}</h4>
                  <p className="card-solution-mini-snippet">{sol.proposed_approach || sol.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Meta Row */}
        <div className="problem-footer-row">
          <div className="problem-tags-group">
            <span className="tag-pill">ID #{id}</span>
            <span className="tag-pill">Score: {score}</span>
            {isResolved && <span className="tag-pill resolved-tag">Resolved by Citizen</span>}
          </div>

          {/* Solutions & Comments indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="solutions-indicator" title="Submitted solutions">
              <span className="solutions-count-text">
                {postSolutions.length} {postSolutions.length === 1 ? 'Solution' : 'Solutions'}
              </span>
            </div>
            <div className="solutions-indicator" title="Citizen comments">
              <span className="solutions-count-text">
                {validComments.length} {validComments.length === 1 ? 'Comment' : 'Comments'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
