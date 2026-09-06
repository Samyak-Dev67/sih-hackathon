import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../data/mockData';
import { 
  isPostAuthor, 
  getPostAuthorInfo, 
  getPostStatus, 
  formatRelativeTime,
  getChallengeWorkspace,
  getSolutions
} from '../services/api';

export function ProblemDetailModal({ 
  post, 
  onClose, 
  currentAccount, 
  onVote, 
  onDownvote,
  onUpdateProblem,
  onDeleteProblem,
  onToggleResolve,
  onOpenAuth,
  onAcceptChallenge,
  onFundChallenge,
  onOpenWorkspace
}) {
  if (!post) return null;

  const {
    id,
    title,
    desc,
    img,
    category,
    score = 0,
    created_at,
    liked_by = [],
    downvoted_by = []
  } = post;

  const acceptedClaim = getChallengeWorkspace(id);

  const isGuest = !currentAccount;
  const userRole = currentAccount?.role || (isGuest ? 'guest' : 'citizen');
  const voterId = currentAccount?.id;
  const hasLiked = voterId && Array.isArray(liked_by) ? liked_by.includes(voterId) : false;
  const hasDownvoted = voterId && Array.isArray(downvoted_by) ? downvoted_by.includes(voterId) : false;
  const [isVoting, setIsVoting] = useState(false);

  const handleModalVote = async (direction) => {
    if (isGuest || !voterId) {
      if (onOpenAuth) onOpenAuth('login');
      else alert(`Please sign in to ${direction}vote problems.`);
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

  // Author permissions check & username derivation
  const isAuthor = isPostAuthor(post, currentAccount);
  const authorInfo = getPostAuthorInfo(post, currentAccount);

  // Status state
  const [currentStatus, setCurrentStatus] = useState(() => getPostStatus(post));
  const [resolving, setResolving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Edit Problem state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title || '');
  const [editDesc, setEditDesc] = useState(desc || '');
  const [editCategory, setEditCategory] = useState(category || 'Infrastructure');
  const [editImg, setEditImg] = useState(img || '');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(img || '');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Problem state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Solutions state
  const [solutions, setSolutions] = useState(() => {
    if (Array.isArray(post.solutions)) return post.solutions;
    if (Array.isArray(post.solution)) return post.solution;
    return [];
  });
  const [loadingSolutions, setLoadingSolutions] = useState(false);

  // Sync state if post changes
  useEffect(() => {
    setEditTitle(post.title || '');
    setEditDesc(post.desc || '');
    setEditCategory(post.category || 'Infrastructure');
    setEditImg(post.img || '');
    setEditImagePreview(post.img || '');
    setEditImageFile(null);
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setEditError('');
    setDeleteError('');
    setCurrentStatus(getPostStatus(post));
    
    if (Array.isArray(post.solutions)) {
      setSolutions(post.solutions);
    } else if (Array.isArray(post.solution)) {
      setSolutions(post.solution);
    }
  }, [post]);

  // Load solutions for problem ID
  useEffect(() => {
    let isMounted = true;
    if (id) {
      setLoadingSolutions(true);
      getSolutions(id)
        .then((sols) => {
          if (isMounted && Array.isArray(sols)) {
            setSolutions(sols);
          }
        })
        .catch((err) => {
          console.error('Failed to load solutions:', err);
        })
        .finally(() => {
          if (isMounted) setLoadingSolutions(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleToggleResolve = async () => {
    if (!onToggleResolve) return;
    setResolving(true);
    try {
      const newStatus = currentStatus === 'Resolved' ? 'Open' : 'Resolved';
      await onToggleResolve(id, newStatus);
      setCurrentStatus(newStatus);
      setFeedbackMsg(`Problem marked as ${newStatus}!`);
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      setFeedbackMsg(err.message || 'Failed to update problem status.');
    } finally {
      setResolving(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editDesc.trim()) {
      setEditError('Title and description cannot be empty.');
      return;
    }

    if (!onUpdateProblem) {
      setEditError('Edit handler is not configured.');
      return;
    }

    setSaving(true);
    setEditError('');

    try {
      await onUpdateProblem(id, {
        title: editTitle.trim(),
        desc: editDesc.trim(),
        category: editCategory,
        img: editImg.trim(),
        imageFile: editImageFile
      });

      setIsEditing(false);
      setFeedbackMsg('Problem updated successfully!');
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update problem:', err);
      setEditError(err.message || 'Failed to update problem.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteProblem) {
      setDeleteError('Delete handler is not configured.');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      await onDeleteProblem(id);
      onClose();
    } catch (err) {
      console.error('Failed to delete problem:', err);
      setDeleteError(err.message || 'Failed to delete problem.');
      setDeleting(false);
    }
  };

  const isMyUniversityAccepted = Boolean(
    acceptedClaim && 
    currentAccount?.id && 
    acceptedClaim.universityId === currentAccount.id
  );

  const isLockedByOtherUniversity = Boolean(
    acceptedClaim && 
    (!currentAccount?.id || acceptedClaim.universityId !== currentAccount.id)
  );

  const isMyIndustryFunded = acceptedClaim?.fundedByIndustry && (
    acceptedClaim.fundedByIndustry.id === currentAccount?.id ||
    acceptedClaim.fundedByIndustry.id === 'ind-1'
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="detail-modal-card problem-detail-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="modal-header-bar">
          <div className="modal-header-meta">
            {acceptedClaim ? (
              <>
                <span className="tag-pill status-accepted-badge">ACCEPTED RESEARCH</span>
                {isLockedByOtherUniversity && userRole === 'university' && (
                  <span className="tag-pill badge-locked-pill">
                    LOCKED
                  </span>
                )}
              </>
            ) : (
              <span className={`tag-pill ${currentStatus === 'Resolved' ? 'status-resolved-badge' : 'status-open-badge'}`}>
                {currentStatus.toUpperCase()}
              </span>
            )}
            <span className="tag-pill category-tag">{category || 'General'}</span>
            <span className="tag-pill">ID #{id}</span>
          </div>
          <button 
            type="button" 
            className="modal-close-icon-btn" 
            onClick={onClose}
            aria-label="Close"
            title="Close modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="modal-scroll-body">
          {/* Main Problem Details Section */}
          <div className="detail-problem-section">
            {/* Author Meta Row */}
            <div className="detail-author-row">
              <div className="author-avatar-circle" title={`Author: ${authorInfo.name}`}>
                {authorInfo.initials}
              </div>
              <div className="detail-author-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <strong className="author-name">{authorInfo.name}</strong>
                  <span className="role-badge-tag badge-citz">CITIZEN</span>
                  {isAuthor && <span className="author-badge-you">Your Problem</span>}
                </div>
                <span className="author-time">
                  Posted {formatRelativeTime(created_at)}
                </span>
              </div>

              {/* Author Actions */}
              {isAuthor && !isEditing && (
                <div className="author-actions-pill-group">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setIsEditing(true)}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-action"
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.35rem 0.75rem',
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px'
                    }}
                  >
                    Delete
                  </button>
                  {onToggleResolve && (
                    <button
                      type="button"
                      className={`btn ${currentStatus === 'Resolved' ? 'btn-outline' : 'btn-blue'}`}
                      onClick={handleToggleResolve}
                      disabled={resolving}
                      style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                    >
                      {resolving ? 'Updating...' : currentStatus === 'Resolved' ? 'Reopen Problem' : 'Mark Resolved'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Delete Confirmation Box */}
            {showDeleteConfirm && (
              <div className="delete-confirm-box" style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                margin: '1rem 0'
              }}>
                <h4 style={{ color: '#EF4444', fontWeight: 700, marginBottom: '0.35rem', fontSize: '1rem' }}>
                  Confirm Problem Deletion
                </h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                  Are you sure you want to permanently delete <strong>"{title}"</strong>? This action cannot be undone.
                </p>
                {deleteError && (
                  <div className="form-error-banner" style={{ marginBottom: '0.75rem' }}>
                    {deleteError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={deleting}
                    onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger-action"
                    disabled={deleting}
                    onClick={handleDelete}
                    style={{
                      background: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      fontWeight: 600,
                      cursor: deleting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete Problem'}
                  </button>
                </div>
              </div>
            )}

            {/* Edit Mode vs Read-Only Details */}
            {isEditing ? (
              <div className="detail-edit-box" style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1.25rem',
                margin: '1rem 0'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>Edit Problem Details</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Make changes below and click save.
                  </p>
                </div>

                {editError && (
                  <div className="form-error-banner" style={{ marginBottom: '1rem' }}>
                    {editError}
                  </div>
                )}

                <form onSubmit={handleEditSubmit}>
                  <div className="form-field-group">
                    <label className="field-label">Problem Title *</label>
                    <input
                      type="text"
                      required
                      className="field-input"
                      value={editTitle}
                      onChange={(e) => { setEditTitle(e.target.value); setEditError(''); }}
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">Category *</label>
                    <select
                      className="field-select"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">Problem Description *</label>
                    <textarea
                      rows={5}
                      required
                      className="field-textarea"
                      value={editDesc}
                      onChange={(e) => { setEditDesc(e.target.value); setEditError(''); }}
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">Attach / Change Image (Optional)</label>
                    {editImagePreview && (
                      <div style={{ marginBottom: '0.5rem', maxHeight: '160px', overflow: 'hidden', borderRadius: '6px' }}>
                        <img src={editImagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'cover' }} />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="field-input"
                      onChange={handleImageChange}
                    />
                    <div style={{ marginTop: '0.35rem' }}>
                      <input
                        type="text"
                        placeholder="Or enter image URL..."
                        className="field-input"
                        value={editImg}
                        onChange={(e) => {
                          setEditImg(e.target.value);
                          setEditImagePreview(e.target.value);
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-actions-row" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={saving}
                      onClick={() => { setIsEditing(false); setEditError(''); }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-blue"
                      disabled={saving}
                    >
                      {saving ? 'Saving changes...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <h2 className="detail-problem-title">{title}</h2>
                <div className="detail-problem-description">
                  {desc}
                </div>

                {img && (
                  <div style={{ borderRadius: '10px', overflow: 'hidden', margin: '0.85rem 0', border: '1px solid var(--border-color)' }}>
                    <img src={img} alt={title} style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}

                {/* Industry Status Card */}
                {userRole === 'industry' && (
                  <div className={`industry-claim-status-card ${acceptedClaim ? 'is-claimed' : 'is-unclaimed'}`}>
                    {acceptedClaim ? (
                      <>
                        <div className="status-badge-row">
                          <span className="tag-pill status-accepted-badge">CLAIMED BY UNIVERSITY</span>
                          <span className="tag-pill category-tag">{acceptedClaim.milestones?.length || 0} Milestones</span>
                        </div>
                        <h4 className="claim-card-title">Taken by: {acceptedClaim.universityName}</h4>
                        <p className="claim-card-desc">
                          This challenge has been taken up for academic research. Empower this initiative to review the faculty lead, assigned student cohort, and sponsor key milestones.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="status-badge-row">
                          <span className="tag-pill tag-unclaimed-badge">AWAITING UNIVERSITY</span>
                        </div>
                        <h4 className="claim-card-title">No university has taken the challenge</h4>
                        <p className="claim-card-desc">
                          No university research lab has claimed this challenge yet. Industry empowerment and milestone funding will become active once an academic institution accepts the challenge.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Actions Bar */}
            <div className="detail-actions-bar">
              <button 
                type="button" 
                className={`detail-vote-btn ${hasLiked ? 'active-up' : ''}`}
                onClick={() => handleModalVote('up')}
                disabled={isVoting}
                title={hasLiked ? "You upvoted this (click to remove)" : isGuest ? "Sign in to upvote" : "1 upvote per account"}
              >
                ▲ Upvote ({score}) {hasLiked ? '• Upvoted' : ''}
              </button>
              <button 
                type="button" 
                className={`detail-vote-btn ${hasDownvoted ? 'active-down' : ''}`}
                onClick={() => handleModalVote('down')}
                disabled={isVoting}
                title={hasDownvoted ? "You downvoted this (click to remove)" : isGuest ? "Sign in to downvote" : "1 downvote per account"}
              >
                ▼ Downvote {hasDownvoted ? '• Downvoted' : ''}
              </button>

              {/* University Specific Workflow Actions */}
              {userRole === 'university' && (
                <>
                  {!acceptedClaim ? (
                    <button 
                      type="button" 
                      className="btn btn-blue"
                      onClick={() => {
                        if (onAcceptChallenge) onAcceptChallenge(post);
                        onClose();
                      }}
                    >
                      Accept Challenge & Open Workspace →
                    </button>
                  ) : isMyUniversityAccepted ? (
                    <button 
                      type="button" 
                      className="btn btn-blue"
                      onClick={() => {
                        if (onOpenWorkspace) onOpenWorkspace(id);
                        onClose();
                      }}
                    >
                      Open Problem Workspace →
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="btn-locked-status"
                      disabled
                      title={`Locked: Accepted by ${acceptedClaim.universityName}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      Locked • Accepted by {acceptedClaim.universityName}
                    </button>
                  )}
                </>
              )}

              {/* Industry Specific Workflow Actions */}
              {userRole === 'industry' && (
                <>
                  {acceptedClaim ? (
                    <button 
                      type="button" 
                      className="btn btn-blue"
                      onClick={() => {
                        if (onFundChallenge) onFundChallenge(id);
                        else if (onOpenWorkspace) onOpenWorkspace(id);
                        onClose();
                      }}
                      style={{ fontWeight: 700 }}
                    >
                      Empower Challenge →
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled
                      style={{ opacity: 0.6, cursor: 'not-allowed' }}
                      title="No university has taken this challenge yet"
                    >
                      No University Claimed Yet
                    </button>
                  )}
                </>
              )}

              {isGuest && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => onOpenAuth ? onOpenAuth('login') : null}
                  style={{ fontSize: '0.82rem' }}
                >
                  Sign in to Contribute
                </button>
              )}
            </div>

            {/* Unified Institutional Research & Governance Card */}
            {acceptedClaim && (
              <div className={`detail-research-status-card ${isLockedByOtherUniversity ? 'is-locked' : 'is-active'}`}>
                {/* Header Row */}
                <div className="research-status-card-header">
                  <div className="research-lead-col">
                    <div className="research-card-eyebrow">
                      {isLockedByOtherUniversity ? (
                        <span className="eyebrow-tag locked-eyebrow">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                          Institutional Research • Locked
                        </span>
                      ) : isMyUniversityAccepted ? (
                        <span className="eyebrow-tag active-eyebrow">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                          </svg>
                          Active University Workspace • Lead Lab
                        </span>
                      ) : (
                        <span className="eyebrow-tag general-eyebrow">
                          Active University Research
                        </span>
                      )}
                    </div>
                    <div className="research-lab-name">
                      Lead Lab: {acceptedClaim.universityName}
                    </div>
                    <div className="research-deadline-meta">
                      Target Milestone Deadline: <strong>{acceptedClaim.milestoneDeadline || 'Jan 30, 2027'}</strong>
                    </div>
                  </div>

                  <div className="research-sponsor-col">
                    {acceptedClaim.fundedByIndustry ? (
                      <div className="sponsor-funded-block">
                        <span className="role-badge-tag badge-inds">INDUSTRY FUNDED</span>
                        <div className="sponsor-org-name">{acceptedClaim.fundedByIndustry.name}</div>
                      </div>
                    ) : (
                      <span className="tag-pill sponsor-open-badge">
                        Open for Industry Sponsorship
                      </span>
                    )}
                  </div>
                </div>

                {/* Governance Alert Notice when locked */}
                {isLockedByOtherUniversity && userRole === 'university' && (
                  <div className="research-governance-notice">
                    <div className="governance-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                    <div className="governance-text">
                      This civic problem was claimed by <strong>{acceptedClaim.universityName}</strong> and is locked. In accordance with platform governance, other university accounts cannot claim or overwrite this project.
                    </div>
                  </div>
                )}

                {/* Completion Progress Bar */}
                <div className="research-progress-section">
                  <div className="research-progress-header">
                    <span className="progress-label">Overall Completion Progress</span>
                    <span className="progress-value">{acceptedClaim.progress || 0}%</span>
                  </div>
                  <div className="research-progress-track">
                    <div 
                      className="research-progress-fill" 
                      style={{ 
                        width: `${Math.min(acceptedClaim.progress || 0, 100)}%`,
                        background: isLockedByOtherUniversity ? '#ef4444' : 'var(--accent-blue, #3b82f6)'
                      }} 
                    />
                  </div>
                </div>

                {/* Milestones Preview List */}
                <div className="research-milestones-preview">
                  <div className="milestones-preview-title">
                    Active Research Milestones ({Array.isArray(acceptedClaim.milestones) ? acceptedClaim.milestones.length : 2})
                  </div>
                  <div className="milestones-preview-list">
                    {(acceptedClaim.milestones && acceptedClaim.milestones.length > 0 
                      ? acceptedClaim.milestones 
                      : [
                          { id: 'm-default-1', title: 'Phase 1: Field Investigation & Scope Definition', deadline: acceptedClaim.milestoneDeadline || 'Jan 30, 2027', completed: (acceptedClaim.progress || 0) >= 50 },
                          { id: 'm-default-2', title: 'Phase 2: Prototype Development & Testing', deadline: 'Mar 15, 2027', completed: (acceptedClaim.progress || 0) === 100 }
                        ]
                    ).map((m, idx) => (
                      <div key={m.id || idx} className={`milestone-preview-row ${m.completed ? 'is-completed' : ''}`}>
                        <div className="milestone-dot-indicator">
                          {m.completed ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                        <div className="milestone-preview-info">
                          <span className="milestone-preview-name">{m.title}</span>
                          <span className="milestone-preview-due">Target: {m.deadline || 'TBD'}</span>
                        </div>
                        <span className={`milestone-status-chip ${m.completed ? 'status-done' : 'status-ongoing'}`}>
                          {m.completed ? 'Completed' : 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Community Solutions & Research Evidence Section */}
            <div className="detail-solutions-container" style={{ marginTop: '1.75rem' }}>
              <div className="solutions-section-header">
                <div className="solutions-header-left">
                  <h3>Community Solutions & Notes</h3>
                  <span className="solutions-badge-count">{solutions.length}</span>
                </div>
                <span className="solutions-header-note">
                  Public collaborative evidence
                </span>
              </div>

              {loadingSolutions ? (
                <div className="empty-solutions-card" style={{ marginTop: '0.85rem' }}>
                  <p>Loading solutions...</p>
                </div>
              ) : solutions.length === 0 ? (
                <div className="empty-solutions-card" style={{ marginTop: '0.85rem' }}>
                  <p>No community solutions submitted yet.</p>
                  <span className="empty-subtext">
                    {acceptedClaim 
                      ? `As research milestones progress with ${acceptedClaim.universityName}, prototypes and findings will be published here.`
                      : 'Universities and partners can propose solutions once investigation begins.'}
                  </span>
                </div>
              ) : (
                <div className="solutions-list" style={{ marginTop: '0.85rem' }}>
                  {solutions.map((sol, index) => (
                    <div key={sol.id || index} className="solution-item-card">
                      <div className="solution-card-top">
                        <div className="solution-org-info">
                          <strong className="solution-org-title">{sol.author_name || 'Academic Partner'}</strong>
                          <span className="role-badge-tag badge-uni">
                            {(sol.author_role || 'University').toUpperCase()}
                          </span>
                        </div>
                        <span className="solution-timeline-pill">
                          {formatRelativeTime(sol.created_at)}
                        </span>
                      </div>
                      <h4 className="solution-title">{sol.title}</h4>
                      <p className="solution-description-text">{sol.desc || sol.proposed_approach}</p>
                      {sol.proposed_approach && sol.proposed_approach !== sol.desc && (
                        <div className="solution-approach-block">
                          <strong>Proposed Approach:</strong> {sol.proposed_approach}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {feedbackMsg && (
            <div className="status-box success" style={{ marginTop: '1rem' }}>
              {feedbackMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
