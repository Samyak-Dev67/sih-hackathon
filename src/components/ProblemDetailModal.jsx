import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../data/mockData';
import { 
  isPostAuthor, 
  getPostAuthorInfo, 
  getPostStatus, 
  formatRelativeTime,
  getChallengeWorkspace,
  isCommentAuthor,
  getPostComments,
  addComment as apiAddComment,
  editComment as apiEditComment,
  deleteComment as apiDeleteComment,
  getPostUpdates,
  addPostUpdate as apiAddPostUpdate,
  editPostUpdate as apiEditPostUpdate,
  deletePostUpdate as apiDeletePostUpdate,
  isUpdateAuthor
} from '../services/api';

export function ProblemDetailModal({ 
  post, 
  onClose, 
  currentAccount, 
  onVote, 
  onDownvote,
  onUpdateProblem,
  onDeleteProblem,
  onOpenAuth,
  onAcceptChallenge,
  onFundChallenge,
  onOpenWorkspace,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onAddUpdate,
  onEditUpdate,
  onDeleteUpdate
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

  const acceptedClaim = post.accepted_by || getChallengeWorkspace(id);

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

  // University Updates state (Lead Research Institution Only)
  const [updates, setUpdates] = useState(() => getPostUpdates(post));
  const [newUpdateText, setNewUpdateText] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [editingUpdateText, setEditingUpdateText] = useState('');
  const [savingUpdateEdit, setSavingUpdateEdit] = useState(false);
  const [deletingUpdateId, setDeletingUpdateId] = useState(null);
  const [isDeletingUpdate, setIsDeletingUpdate] = useState(false);

  // Comments state (Citizen Discussions)
  const [comments, setComments] = useState(() => getPostComments(post));
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [commentSuccess, setCommentSuccess] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [savingCommentEdit, setSavingCommentEdit] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

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
    
    setUpdates(getPostUpdates(post));
    setNewUpdateText('');
    setUpdateError('');
    setUpdateSuccess('');
    setEditingUpdateId(null);
    setEditingUpdateText('');
    setDeletingUpdateId(null);

    setComments(getPostComments(post));
    setNewCommentText('');
    setCommentError('');
    setCommentSuccess('');
    setEditingCommentId(null);
    setEditingCommentText('');
    setDeletingCommentId(null);
  }, [post]);

  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (isGuest) {
      if (onOpenAuth) onOpenAuth('login');
      else alert('Please sign in as a citizen to post comments.');
      return;
    }
    if (userRole !== 'citizen') {
      setCommentError('Only citizen accounts are authorized to post civic comments.');
      return;
    }
    if (!newCommentText.trim()) {
      setCommentError('Comment text cannot be empty.');
      return;
    }

    setSubmittingComment(true);
    setCommentError('');
    setCommentSuccess('');

    try {
      let updated = null;
      if (onAddComment) {
        updated = await onAddComment(id, newCommentText.trim());
      } else {
        updated = await apiAddComment(id, newCommentText.trim(), currentAccount);
      }

      if (updated && Array.isArray(updated.comments)) {
        setComments(getPostComments(updated));
      } else {
        const tempComment = {
          id: `comment-${Date.now()}`,
          author_id: currentAccount?.id,
          author_name: currentAccount?.name || currentAccount?.email?.split('@')[0] || 'Citizen',
          author_role: 'citizen',
          text: newCommentText.trim(),
          created_at: new Date().toISOString()
        };
        setComments(prev => [...prev, tempComment]);
      }
      setNewCommentText('');
      setCommentSuccess('Comment posted successfully.');
      setTimeout(() => setCommentSuccess(''), 3500);
    } catch (err) {
      console.error('Failed to post comment:', err);
      setCommentError(err.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text || comment.comment || '');
    setCommentError('');
    setDeletingCommentId(null);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
    setCommentError('');
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editingCommentText.trim()) {
      setCommentError('Comment text cannot be empty.');
      return;
    }

    setSavingCommentEdit(true);
    setCommentError('');
    setCommentSuccess('');

    try {
      let updated = null;
      if (onEditComment) {
        updated = await onEditComment(id, commentId, editingCommentText.trim());
      } else {
        updated = await apiEditComment(id, commentId, editingCommentText.trim(), currentAccount);
      }

      if (updated && Array.isArray(updated.comments)) {
        setComments(getPostComments(updated));
      } else {
        setComments(prev => prev.map(c => (c.id === commentId ? { ...c, text: editingCommentText.trim(), updated_at: new Date().toISOString() } : c)));
      }
      setEditingCommentId(null);
      setEditingCommentText('');
      setCommentSuccess('Comment updated successfully.');
      setTimeout(() => setCommentSuccess(''), 3500);
    } catch (err) {
      console.error('Failed to update comment:', err);
      setCommentError(err.message || 'Failed to update comment.');
    } finally {
      setSavingCommentEdit(false);
    }
  };

  const handleRequestDeleteComment = (commentId) => {
    setDeletingCommentId(commentId);
    setEditingCommentId(null);
    setCommentError('');
  };

  const handleCancelDeleteComment = () => {
    setDeletingCommentId(null);
  };

  const handleConfirmDeleteComment = async (commentId) => {
    setIsDeletingComment(true);
    setCommentError('');
    setCommentSuccess('');

    try {
      let updated = null;
      if (onDeleteComment) {
        updated = await onDeleteComment(id, commentId);
      } else {
        updated = await apiDeleteComment(id, commentId, currentAccount);
      }

      if (updated && Array.isArray(updated.comments)) {
        setComments(getPostComments(updated));
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
      setDeletingCommentId(null);
      setCommentSuccess('Comment deleted successfully.');
      setTimeout(() => setCommentSuccess(''), 3500);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setCommentError(err.message || 'Failed to delete comment.');
    } finally {
      setIsDeletingComment(false);
    }
  };

  // Research Updates handlers (Only for the university that accepted the problem)
  const isAcceptedUni = Boolean(
    acceptedClaim && 
    userRole === 'university' && 
    currentAccount && 
    (
      String(acceptedClaim.universityId) === String(currentAccount.id) ||
      (acceptedClaim.universityName && currentAccount.name && acceptedClaim.universityName.trim().toLowerCase() === currentAccount.name.trim().toLowerCase())
    )
  );

  const handleCreateUpdate = async (e) => {
    e.preventDefault();
    if (!isAcceptedUni) {
      setUpdateError('Only the university that accepted this problem can post updates.');
      return;
    }
    if (!newUpdateText.trim()) {
      setUpdateError('Update text cannot be empty.');
      return;
    }

    setSubmittingUpdate(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      let updated = null;
      if (onAddUpdate) {
        updated = await onAddUpdate(id, newUpdateText.trim());
      } else {
        updated = await apiAddPostUpdate(id, newUpdateText.trim(), currentAccount);
      }

      if (updated && Array.isArray(updated.updates)) {
        setUpdates(getPostUpdates(updated));
      } else {
        const tempUpdate = {
          id: `update-${Date.now()}`,
          university_id: currentAccount?.id,
          university_name: acceptedClaim?.universityName || currentAccount?.name || 'University',
          author_name: currentAccount?.name || 'Research Lead',
          author_role: 'university',
          message: newUpdateText.trim(),
          created_at: new Date().toISOString()
        };
        setUpdates(prev => [tempUpdate, ...prev]);
      }
      setNewUpdateText('');
      setUpdateSuccess('Research update published successfully.');
      setTimeout(() => setUpdateSuccess(''), 3500);
    } catch (err) {
      console.error('Failed to post research update:', err);
      setUpdateError(err.message || 'Failed to post update.');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handleStartEditUpdate = (upd) => {
    setEditingUpdateId(upd.id);
    setEditingUpdateText(upd.message || upd.text || upd.desc || '');
    setUpdateError('');
    setDeletingUpdateId(null);
  };

  const handleCancelEditUpdate = () => {
    setEditingUpdateId(null);
    setEditingUpdateText('');
    setUpdateError('');
  };

  const handleSaveEditUpdate = async (updateId) => {
    if (!editingUpdateText.trim()) {
      setUpdateError('Update text cannot be empty.');
      return;
    }

    setSavingUpdateEdit(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      let updated = null;
      if (onEditUpdate) {
        updated = await onEditUpdate(id, updateId, editingUpdateText.trim());
      } else {
        updated = await apiEditPostUpdate(id, updateId, editingUpdateText.trim(), currentAccount);
      }

      if (updated && Array.isArray(updated.updates)) {
        setUpdates(getPostUpdates(updated));
      } else {
        setUpdates(prev => prev.map(u => (u.id === updateId ? { ...u, message: editingUpdateText.trim(), updated_at: new Date().toISOString() } : u)));
      }
      setEditingUpdateId(null);
      setEditingUpdateText('');
      setUpdateSuccess('Research update edited successfully.');
      setTimeout(() => setUpdateSuccess(''), 3500);
    } catch (err) {
      console.error('Failed to edit update:', err);
      setUpdateError(err.message || 'Failed to edit update.');
    } finally {
      setSavingUpdateEdit(false);
    }
  };

  const handleRequestDeleteUpdate = (updateId) => {
    setDeletingUpdateId(updateId);
    setEditingUpdateId(null);
    setUpdateError('');
  };

  const handleCancelDeleteUpdate = () => {
    setDeletingUpdateId(null);
  };

  const handleConfirmDeleteUpdate = async (updateId) => {
    setIsDeletingUpdate(true);
    setUpdateError('');
    setUpdateSuccess('');

    try {
      let updated = null;
      if (onDeleteUpdate) {
        updated = await onDeleteUpdate(id, updateId);
      } else {
        updated = await apiDeletePostUpdate(id, updateId, currentAccount);
      }

      if (updated && Array.isArray(updated.updates)) {
        setUpdates(getPostUpdates(updated));
      } else {
        setUpdates(prev => prev.filter(u => u.id !== updateId));
      }
      setDeletingUpdateId(null);
      setUpdateSuccess('Research update deleted.');
      setTimeout(() => setUpdateSuccess(''), 3500);
    } catch (err) {
      console.error('Failed to delete update:', err);
      setUpdateError(err.message || 'Failed to delete update.');
    } finally {
      setIsDeletingUpdate(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
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
              <span className={`tag-pill ${currentStatus === 'Resolved' || currentStatus === 'Completed' ? 'status-resolved-badge' : 'status-open-badge'}`}>
                {currentStatus === 'Resolved' ? 'COMPLETED' : currentStatus.toUpperCase()}
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

                {/* Citizen / Public University Adoption & Progress Card */}
                {(userRole === 'citizen' || isGuest) && (
                  <div className={`citizen-claim-status-card ${acceptedClaim ? 'is-claimed' : 'is-unclaimed'}`} style={{
                    margin: '1rem 0',
                    padding: '1rem 1.15rem',
                    borderRadius: '10px',
                    background: acceptedClaim ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: acceptedClaim ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid var(--border-color)'
                  }}>
                    {acceptedClaim ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="tag-pill status-accepted-badge">ACCEPTED BY UNIVERSITY</span>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-blue, #3b82f6)' }}>
                              {acceptedClaim.universityName}
                            </span>
                          </div>
                          <span className="tag-pill category-tag" style={{ fontWeight: 700 }}>
                            {acceptedClaim.progress || 0}% Progress
                          </span>
                        </div>

                        {/* Animated Progress Bar */}
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.65rem' }}>
                          <div 
                            style={{ 
                              width: `${Math.min(acceptedClaim.progress || 0, 100)}%`, 
                              height: '100%', 
                              background: 'var(--accent-blue, #3b82f6)', 
                              borderRadius: '999px',
                              transition: 'width 0.4s ease'
                            }} 
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span>
                            {Array.isArray(acceptedClaim.milestones) && acceptedClaim.milestones.length > 0
                              ? `${acceptedClaim.milestones.filter(m => m && m.completed).length} of ${acceptedClaim.milestones.length} milestones complete`
                              : 'Field investigation & planning ongoing'}
                          </span>
                          {acceptedClaim.fundedByIndustry && (
                            <span style={{ color: '#818cf8', fontWeight: 600 }}>
                              Empowered by {acceptedClaim.fundedByIndustry.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="tag-pill" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                          OPEN FOR ADOPTION
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          No university has claimed this challenge yet. Once a university research team accepts it, live progress updates will appear here.
                        </span>
                      </div>
                    )}
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
                      Academic Institution: <strong>{acceptedClaim.universityName}</strong>
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
                    Active Research Milestones ({Array.isArray(acceptedClaim.milestones) ? acceptedClaim.milestones.length : 0})
                  </div>
                  {Array.isArray(acceptedClaim.milestones) && acceptedClaim.milestones.length > 0 ? (
                    <div className="milestones-preview-list">
                      {acceptedClaim.milestones.map((m, idx) => (
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
                            {m.funding && (
                              <span className="milestone-preview-due" style={{ color: '#818cf8', fontWeight: 600 }}>
                                Funding: INR {Number(m.funding.amount).toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          <span className={`milestone-status-chip ${m.completed ? 'status-done' : 'status-ongoing'}`}>
                            {m.completed ? 'Completed' : 'Active'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '0.85rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      No milestones published yet by the research team.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* University Research Updates Section (Accepted University Only Can Post; All Can View) */}
            <div className="detail-updates-container" style={{ marginTop: '1.75rem' }}>
              <div className="updates-section-header">
                <div className="updates-header-left">
                  <h3>University Updates</h3>
                  <span className="updates-badge-count">{updates.length}</span>
                </div>
                <span className="updates-header-note">
                  {acceptedClaim ? `Official progress notes by ${acceptedClaim.universityName}` : 'Field reports & progress'}
                </span>
              </div>

              {/* Feedback messages for updates */}
              {updateError && (
                <div className="form-error-banner" style={{ margin: '0.75rem 0' }}>
                  {updateError}
                </div>
              )}
              {updateSuccess && (
                <div className="status-box success" style={{ margin: '0.75rem 0' }}>
                  {updateSuccess}
                </div>
              )}

              {/* University Update Composer - ONLY visible to the university that accepted the problem */}
              {isAcceptedUni && (
                <form onSubmit={handleCreateUpdate} className="update-composer-form" style={{ marginTop: '0.85rem', marginBottom: '1.25rem' }}>
                  <div className="update-composer-box">
                    <textarea
                      rows={3}
                      className="field-textarea update-input-area"
                      placeholder="Post a research update, field observation, or progress milestone note for citizens and sponsors..."
                      value={newUpdateText}
                      onChange={(e) => { setNewUpdateText(e.target.value); setUpdateError(''); }}
                      disabled={submittingUpdate}
                    />
                    <div className="update-composer-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span className="update-composer-author-tag" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Posting as: <strong style={{ color: 'var(--accent-blue, #3b82f6)' }}>{acceptedClaim.universityName}</strong>
                      </span>
                      <button
                        type="submit"
                        className="btn btn-blue update-post-btn"
                        disabled={submittingUpdate || !newUpdateText.trim()}
                        style={{ fontSize: '0.85rem', padding: '0.45rem 1.1rem', fontWeight: 600 }}
                      >
                        {submittingUpdate ? 'Publishing...' : 'Post Update'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Notice for other universities who did NOT accept the problem */}
              {userRole === 'university' && acceptedClaim && !isAcceptedUni && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  margin: '0.75rem 0'
                }}>
                  This challenge is claimed and led by <strong>{acceptedClaim.universityName}</strong>. Only the lead university can publish research updates.
                </div>
              )}

              {/* Updates List (Visible to all: citizens, industry, universities, guests) */}
              {updates.length === 0 ? (
                <div className="empty-updates-card" style={{
                  textAlign: 'center',
                  padding: '1.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  marginTop: '0.5rem'
                }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    No university updates published yet.
                  </p>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    {acceptedClaim
                      ? `As ${acceptedClaim.universityName} advances investigation and milestones, progress reports will be posted here.`
                      : 'Once an academic institution accepts this challenge, live research updates will appear here.'}
                  </span>
                </div>
              ) : (
                <div className="updates-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
                  {updates.map((upd) => {
                    const isAuthor = isUpdateAuthor(upd, currentAccount);
                    const uniName = upd.university_name || upd.author_name || acceptedClaim?.universityName || 'Lead University';
                    const initials = uniName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'UN';
                    const isCurrentEditing = editingUpdateId === upd.id;
                    const isCurrentDeleting = deletingUpdateId === upd.id;

                    return (
                      <div key={upd.id} className={`update-bubble-card ${isAuthor ? 'is-own-update' : ''}`}>
                        <div className="update-bubble-header">
                          <div className="update-author-block">
                            <div className="update-avatar-circle">{initials}</div>
                            <div className="update-author-meta">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                <strong className="update-author-name">{uniName}</strong>
                                <span className="role-badge-tag badge-uni">UNIVERSITY</span>
                                {isAuthor && <span className="author-badge-you">Lead Lab</span>}
                              </div>
                              <div className="update-time-row">
                                <span className="update-time-text">{formatRelativeTime(upd.created_at)}</span>
                                {upd.updated_at && <span className="update-edited-indicator">(edited)</span>}
                              </div>
                            </div>
                          </div>

                          {/* University Actions (Edit / Delete) - Only for authoring university */}
                          {isAuthor && !isCurrentEditing && !isCurrentDeleting && (
                            <div className="update-actions-group">
                              <button
                                type="button"
                                className="update-action-btn"
                                onClick={() => handleStartEditUpdate(upd)}
                                title="Edit this update"
                              >
                                Edit
                              </button>
                              <span style={{ color: 'var(--border-color)', fontSize: '0.75rem' }}>•</span>
                              <button
                                type="button"
                                className="update-action-btn danger"
                                onClick={() => handleRequestDeleteUpdate(upd.id)}
                                title="Delete this update"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Inline Edit Form */}
                        {isCurrentEditing ? (
                          <div className="update-inline-edit-box" style={{ marginTop: '0.75rem' }}>
                            <textarea
                              rows={3}
                              className="field-textarea"
                              value={editingUpdateText}
                              onChange={(e) => { setEditingUpdateText(e.target.value); setUpdateError(''); }}
                              disabled={savingUpdateEdit}
                              style={{ width: '100%', marginBottom: '0.5rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={handleCancelEditUpdate}
                                disabled={savingUpdateEdit}
                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="btn btn-blue"
                                onClick={() => handleSaveEditUpdate(upd.id)}
                                disabled={savingUpdateEdit || !editingUpdateText.trim()}
                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                              >
                                {savingUpdateEdit ? 'Saving...' : 'Save Changes'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Update text */}
                            <div className="update-text-content" style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: '1.55', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                              {upd.message || upd.text || upd.desc}
                            </div>

                            {/* Delete Confirmation Box */}
                            {isCurrentDeleting && (
                              <div className="update-delete-confirm-box" style={{
                                marginTop: '0.75rem',
                                padding: '0.75rem 1rem',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '6px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.5rem'
                              }}>
                                <span style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>
                                  Delete this research update permanently?
                                </span>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={handleCancelDeleteUpdate}
                                    disabled={isDeletingUpdate}
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger-action"
                                    onClick={() => handleConfirmDeleteUpdate(upd.id)}
                                    disabled={isDeletingUpdate}
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '0.25rem 0.75rem',
                                      background: '#ef4444',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: isDeletingUpdate ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    {isDeletingUpdate ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>


            {/* Civic Discussion & Community Comments Section */}
            <div className="detail-comments-container" style={{ marginTop: '2rem' }}>
              <div className="comments-section-header">
                <div className="comments-header-left">
                  <h3>Civic Discussion & Comments</h3>
                  <span className="comments-badge-count">{comments.length}</span>
                </div>
                <span className="comments-header-note">
                  Public citizen dialogue
                </span>
              </div>

              {/* Feedback banners */}
              {commentError && (
                <div className="form-error-banner" style={{ margin: '0.75rem 0' }}>
                  {commentError}
                </div>
              )}
              {commentSuccess && (
                <div className="status-box success" style={{ margin: '0.75rem 0' }}>
                  {commentSuccess}
                </div>
              )}

              {/* Comment composer for citizens */}
              {userRole === 'citizen' && !isGuest && (
                <form onSubmit={handleCreateComment} className="comment-composer-form" style={{ marginTop: '1rem', marginBottom: '1.25rem' }}>
                  <div className="comment-composer-box">
                    <textarea
                      rows={3}
                      className="field-textarea comment-input-area"
                      placeholder="Share your observation, local experience, or suggestion on this problem..."
                      value={newCommentText}
                      onChange={(e) => { setNewCommentText(e.target.value); setCommentError(''); }}
                      disabled={submittingComment}
                    />
                    <div className="comment-composer-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span className="comment-composer-author-tag" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Posting as: <strong>{currentAccount?.name || currentAccount?.email?.split('@')[0] || 'Citizen'}</strong>
                      </span>
                      <button
                        type="submit"
                        className="btn btn-blue comment-post-btn"
                        disabled={submittingComment || !newCommentText.trim()}
                        style={{ fontSize: '0.85rem', padding: '0.45rem 1rem', fontWeight: 600 }}
                      >
                        {submittingComment ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {isGuest && (
                <div className="comment-guest-prompt" style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  margin: '1rem 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                      Join the Civic Conversation
                    </strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Sign in as a citizen to comment, share local observations, and collaborate.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => onOpenAuth ? onOpenAuth('login') : null}
                    style={{ fontSize: '0.82rem', padding: '0.35rem 0.85rem' }}
                  >
                    Sign In to Comment
                  </button>
                </div>
              )}

              {userRole !== 'citizen' && !isGuest && (
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  margin: '1rem 0'
                }}>
                  Active role: <strong>{userRole.toUpperCase()}</strong>. Civic comments are posted by verified citizen accounts. Research teams and industry partners can contribute via solutions and milestones.
                </div>
              )}

              {/* Comments list */}
              {comments.length === 0 ? (
                <div className="empty-comments-card" style={{
                  textAlign: 'center',
                  padding: '1.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    No citizen comments posted yet.
                  </p>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Citizens can share ground observations, severity reports, and feedback here.
                  </span>
                </div>
              ) : (
                <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {comments.map((comment) => {
                    const isAuthor = isCommentAuthor(comment, currentAccount);
                    const authorName = comment.author_name || (comment.author_email ? comment.author_email.split('@')[0] : 'Citizen');
                    const initials = authorName.substring(0, 2).toUpperCase();
                    const isCurrentEditing = editingCommentId === comment.id;
                    const isCurrentDeleting = deletingCommentId === comment.id;

                    return (
                      <div key={comment.id} className={`comment-bubble-card ${isAuthor ? 'is-own-comment' : ''}`}>
                        <div className="comment-bubble-header">
                          <div className="comment-author-block">
                            <div className="comment-avatar-circle">{initials}</div>
                            <div className="comment-author-meta">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                <strong className="comment-author-name">{authorName}</strong>
                                <span className="role-badge-tag badge-citz">CITIZEN</span>
                                {isAuthor && <span className="author-badge-you">You</span>}
                              </div>
                              <div className="comment-time-row">
                                <span className="comment-time-text">{formatRelativeTime(comment.created_at)}</span>
                                {comment.updated_at && <span className="comment-edited-indicator">(edited)</span>}
                              </div>
                            </div>
                          </div>

                          {/* Author Actions (Edit / Delete) */}
                          {isAuthor && !isCurrentEditing && !isCurrentDeleting && (
                            <div className="comment-actions-group">
                              <button
                                type="button"
                                className="comment-action-btn"
                                onClick={() => handleStartEditComment(comment)}
                                title="Edit this comment"
                              >
                                Edit
                              </button>
                              <span style={{ color: 'var(--border-color)', fontSize: '0.75rem' }}>•</span>
                              <button
                                type="button"
                                className="comment-action-btn danger"
                                onClick={() => handleRequestDeleteComment(comment.id)}
                                title="Delete this comment"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Inline Edit Mode */}
                        {isCurrentEditing ? (
                          <div className="comment-inline-edit-box" style={{ marginTop: '0.75rem' }}>
                            <textarea
                              rows={3}
                              className="field-textarea"
                              value={editingCommentText}
                              onChange={(e) => { setEditingCommentText(e.target.value); setCommentError(''); }}
                              disabled={savingCommentEdit}
                              style={{ width: '100%', marginBottom: '0.5rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={handleCancelEditComment}
                                disabled={savingCommentEdit}
                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="btn btn-blue"
                                onClick={() => handleSaveEditComment(comment.id)}
                                disabled={savingCommentEdit || !editingCommentText.trim()}
                                style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}
                              >
                                {savingCommentEdit ? 'Saving...' : 'Save Changes'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Comment Text */}
                            <div className="comment-text-content" style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                              {comment.text || comment.comment}
                            </div>

                            {/* Delete Confirmation Box */}
                            {isCurrentDeleting && (
                              <div className="comment-delete-confirm-box" style={{
                                marginTop: '0.75rem',
                                padding: '0.75rem 1rem',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '6px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '0.5rem'
                              }}>
                                <span style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>
                                  Delete your comment permanently?
                                </span>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={handleCancelDeleteComment}
                                    disabled={isDeletingComment}
                                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-danger-action"
                                    onClick={() => handleConfirmDeleteComment(comment.id)}
                                    disabled={isDeletingComment}
                                    style={{
                                      fontSize: '0.75rem',
                                      padding: '0.25rem 0.75rem',
                                      background: '#ef4444',
                                      color: '#ffffff',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: isDeletingComment ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    {isDeletingComment ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
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
