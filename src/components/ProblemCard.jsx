import React, { useState } from 'react';
import { isPostAuthor, getPostAuthorInfo, getPostStatus, formatRelativeTime, getChallengeWorkspace } from '../services/api';

export function ProblemCard({ 
  post, 
  onVote, 
  onDownvote, 
  onSelectPost, 
  currentAccountId,
  currentAccount,
  onDeleteProblem,
  onToggleResolve,
  onOpenWorkspace,
  onAcceptChallenge
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
    resolved = false
  } = post;

  const acceptedClaim = getChallengeWorkspace(id);

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
            {acceptedClaim ? (
              <>
                <span className="tag-pill status-accepted-badge">ACCEPTED</span>
                {currentAccount?.role === 'university' && acceptedClaim.universityId !== currentAccount?.id && (
                  <span 
                    className="tag-pill badge-locked" 
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.12)', 
                      color: '#ef4444', 
                      border: '1px solid rgba(239, 68, 68, 0.3)', 
                      fontWeight: 700 
                    }}
                  >
                    LOCKED
                  </span>
                )}
                {currentAccount?.role === 'industry' && (
                  <span 
                    className="tag-pill" 
                    style={{ 
                      background: 'rgba(59, 130, 246, 0.12)', 
                      color: '#3b82f6', 
                      border: '1px solid rgba(59, 130, 246, 0.3)', 
                      fontWeight: 600,
                      fontSize: '0.72rem'
                    }}
                  >
                    TAKEN BY {acceptedClaim.universityName?.toUpperCase()}
                  </span>
                )}
              </>
            ) : isResolved ? (
              <span className="tag-pill status-resolved-badge">RESOLVED</span>
            ) : (
              <>
                <span className="tag-pill status-open-badge">OPEN</span>
                {currentAccount?.role === 'industry' && (
                  <span 
                    className="tag-pill" 
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.04)', 
                      color: 'var(--text-muted)', 
                      border: '1px solid var(--border-color)', 
                      fontSize: '0.72rem'
                    }}
                  >
                    NO UNIVERSITY CLAIMED
                  </span>
                )}
              </>
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

        {/* Research Progress Bar (dictated by university milestones) */}
        {acceptedClaim && (
          <div className="card-accepted-progress-block">
            <div className="card-progress-top">
              <span className="card-progress-label">
                Research Progress • {acceptedClaim.universityName}
              </span>
              <span className="card-progress-pct">{acceptedClaim.progress || 0}%</span>
            </div>
            <div className="card-progress-track">
              <div 
                className="card-progress-bar"
                style={{ width: `${Math.min(acceptedClaim.progress || 0, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer Meta Row */}
        <div className="problem-footer-row">
          <div className="problem-tags-group">
            <span className="tag-pill">ID #{id}</span>
            <span className="tag-pill">Score: {score}</span>
            {isResolved && <span className="tag-pill resolved-tag">Resolved by Citizen</span>}
            {acceptedClaim?.fundedByIndustry && (
              <span className="tag-pill" style={{ background: 'rgba(129, 140, 248, 0.12)', color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.3)', fontWeight: 600 }}>
                Funded by {acceptedClaim.fundedByIndustry.name}
              </span>
            )}
          </div>

          {acceptedClaim ? (
            <>
              {acceptedClaim.universityId === currentAccount?.id ? (
                onOpenWorkspace && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenWorkspace(id);
                    }}
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem', whiteSpace: 'nowrap' }}
                  >
                    Manage Problem →
                  </button>
                )
              ) : currentAccount?.role === 'university' ? (
                <span 
                  className="tag-pill badge-locked" 
                  style={{ 
                    fontSize: '0.74rem', 
                    color: '#ef4444', 
                    border: '1px solid rgba(239, 68, 68, 0.35)', 
                    background: 'rgba(239, 68, 68, 0.08)', 
                    fontWeight: 600 
                  }}
                  title={`Accepted by ${acceptedClaim.universityName}. Locked for other universities.`}
                >
                  Locked • {acceptedClaim.universityName}
                </span>
              ) : currentAccount?.role === 'industry' ? (
                <button
                  type="button"
                  className="btn btn-blue btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onOpenWorkspace) onOpenWorkspace(id);
                    else if (onSelectPost) onSelectPost(post);
                  }}
                  style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem', whiteSpace: 'nowrap', fontWeight: 600 }}
                >
                  Empower →
                </button>
              ) : null}
            </>
          ) : (
            <>
              {currentAccount?.role === 'university' && onAcceptChallenge && (
                <button
                  type="button"
                  className="btn btn-blue btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcceptChallenge(post);
                  }}
                  style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem', whiteSpace: 'nowrap' }}
                >
                  Accept Challenge →
                </button>
              )}
              {currentAccount?.role === 'industry' && (
                <span 
                  className="tag-pill" 
                  style={{ 
                    fontSize: '0.74rem', 
                    color: 'var(--text-muted)', 
                    border: '1px solid var(--border-color)', 
                    background: 'rgba(255, 255, 255, 0.04)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  No University Claimed
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
