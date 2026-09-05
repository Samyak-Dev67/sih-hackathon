import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../data/mockData';
import { 
  isPostAuthor, 
  getPostAuthorInfo, 
  getPostStatus, 
  formatRelativeTime,
  getChallengeWorkspace 
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
  }, [post]);

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
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className="modal-header">
          <div className="modal-header-meta">
            {acceptedClaim ? (
              <>
                <span className="tag-pill status-accepted-badge">ACCEPTED</span>
                {isLockedByOtherUniversity && userRole === 'university' && (
                  <span 
                    className="tag-pill badge-locked" 
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.15)', 
                      color: '#ef4444', 
                      border: '1px solid rgba(239, 68, 68, 0.35)', 
                      fontWeight: 700 
                    }}
                  >
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
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="modal-body-scroll">
          {/* Main Problem Details Section */}
          <div className="problem-detail-content">
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
                  <div style={{ borderRadius: '8px', overflow: 'hidden', margin: '0.5rem 0' }}>
                    <img src={img} alt={title} style={{ maxWidth: '100%', height: 'auto' }} />
                  </div>
                )}

                {/* Research Status Banner & Progress Bar if Accepted */}
                {acceptedClaim && (
                  <div 
                    className="detail-claim-status-box"
                    style={{
                      marginTop: '1rem',
                      marginBottom: '0.85rem',
                      padding: '0.9rem 1.15rem',
                      borderRadius: '8px',
                      background: isLockedByOtherUniversity 
                        ? 'rgba(239, 68, 68, 0.07)' 
                        : 'rgba(56, 189, 248, 0.08)',
                      border: `1px solid ${isLockedByOtherUniversity ? 'rgba(239, 68, 68, 0.28)' : 'rgba(56, 189, 248, 0.28)'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.45rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span 
                          style={{ 
                            fontWeight: 700, 
                            fontSize: '0.82rem', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.04em',
                            color: isLockedByOtherUniversity ? '#ef4444' : '#38bdf8' 
                          }}
                        >
                          {isLockedByOtherUniversity ? 'Locked • Claimed by Another University' : 'Active University Workspace'}
                        </span>
                        <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                          • {acceptedClaim.universityName}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isLockedByOtherUniversity ? '#ef4444' : '#38bdf8' }}>
                        Progress: {acceptedClaim.progress || 0}%
                      </span>
                    </div>

                    <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                      <div 
                        style={{ 
                          width: `${Math.min(acceptedClaim.progress || 0, 100)}%`, 
                          height: '100%', 
                          background: isLockedByOtherUniversity ? '#ef4444' : '#38bdf8',
                          transition: 'width 0.3s ease' 
                        }} 
                      />
                    </div>

                    {isLockedByOtherUniversity && userRole === 'university' && (
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                        This civic problem was accepted by {acceptedClaim.universityName} and is locked. Other university accounts cannot accept or claim this problem.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Like / Action Bar */}
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
                      className="btn btn-outline"
                      disabled
                      style={{ 
                        opacity: 0.65, 
                        cursor: 'not-allowed', 
                        borderColor: 'rgba(239, 68, 68, 0.4)', 
                        color: '#ef4444', 
                        background: 'rgba(239, 68, 68, 0.08)', 
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        padding: '0.45rem 0.95rem'
                      }}
                      title={`Locked: Accepted by ${acceptedClaim.universityName}`}
                    >
                      Locked • Accepted by {acceptedClaim.universityName}
                    </button>
                  )}
                </>
              )}

              {/* Industry Specific Workflow Actions */}
              {userRole === 'industry' && acceptedClaim && (
                <>
                  {isMyIndustryFunded ? (
                    <button 
                      type="button" 
                      className="btn btn-blue"
                      onClick={() => {
                        if (onOpenWorkspace) onOpenWorkspace(id);
                        onClose();
                      }}
                    >
                      Enter Funded Workspace →
                    </button>
                  ) : !acceptedClaim.fundedByIndustry ? (
                    <button 
                      type="button" 
                      className="btn btn-blue"
                      onClick={() => {
                        if (onFundChallenge) onFundChallenge(id);
                        onClose();
                      }}
                    >
                      Accept to Fund Challenge →
                    </button>
                  ) : (
                    <span className="tag-pill" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      Funded by {acceptedClaim.fundedByIndustry.name}
                    </span>
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

            {/* University & Industry Collaboration Status Card */}
            {acceptedClaim && (
              <div className="detail-research-status-card" style={{
                marginTop: '1.5rem',
                padding: '1.25rem 1.4rem',
                borderRadius: '14px',
                background: 'var(--surface-2, rgba(255, 255, 255, 0.04))',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--accent-blue, #3b82f6)', letterSpacing: '0.04em' }}>
                      Active University Research
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      Lead Lab: {acceptedClaim.universityName}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Milestone Deadline: {acceptedClaim.milestoneDeadline}
                    </div>
                  </div>

                  <div>
                    {acceptedClaim.fundedByIndustry ? (
                      <div style={{ textAlign: 'right' }}>
                        <span className="role-badge-tag badge-inds">INDUSTRY FUNDED</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                          {acceptedClaim.fundedByIndustry.name}
                        </div>
                      </div>
                    ) : (
                      <span className="tag-pill" style={{ background: 'rgba(244, 114, 182, 0.12)', color: '#f472b6', border: '1px solid rgba(244, 114, 182, 0.25)', fontSize: '0.78rem' }}>
                        Open for Industry Sponsorship
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar dictated by milestones */}
                <div style={{ width: '100%', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Overall Completion Progress</span>
                    <span style={{ color: '#3b82f6' }}>{acceptedClaim.progress || 0}%</span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: 'var(--surface, rgba(255, 255, 255, 0.08))', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${Math.min(acceptedClaim.progress || 0, 100)}%`, 
                        height: '100%', 
                        background: '#3b82f6', 
                        borderRadius: '9999px', 
                        transition: 'width 0.3s ease' 
                      }} 
                    />
                  </div>
                </div>
              </div>
            )}
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
