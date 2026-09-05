import React, { useState, useEffect } from 'react';
import { CATEGORIES } from '../data/mockData';
import { 
  isPostAuthor, 
  getPostAuthorInfo, 
  getPostStatus, 
  isSolutionAuthor, 
  isCommentAuthor,
  formatRelativeTime,
  postService 
} from '../services/api';

export function ProblemDetailModal({ 
  post, 
  onClose, 
  currentAccount, 
  onVote, 
  onDownvote,
  onSubmitSolution,
  onDeleteSolution,
  onAddComment,
  onDeleteComment,
  onUpdateProblem,
  onDeleteProblem,
  onToggleResolve,
  onOpenAuth
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
    downvoted_by = [],
    solutions = []
  } = post;

  const isGuest = !currentAccount;
  const userRole = currentAccount?.role || (isGuest ? 'guest' : 'citizen');
  const canSubmitSolution = !isGuest && (userRole === 'university' || userRole === 'industry');
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

  // Status & Solutions state
  const [currentStatus, setCurrentStatus] = useState(() => getPostStatus(post));
  const [resolving, setResolving] = useState(false);
  const [activeSolutions, setActiveSolutions] = useState(() => {
    if (Array.isArray(post.solutions)) return post.solutions;
    if (Array.isArray(post.solution)) return post.solution;
    return [];
  });

  // Tab & Comments state
  const [activeTab, setActiveTab] = useState('solutions'); // 'solutions' | 'comments'
  const [activeComments, setActiveComments] = useState(() => {
    return (Array.isArray(post.comments) ? post.comments : []).filter(
      c => c && typeof c === 'object' && !c.__meta && (c.text || c.comment)
    );
  });
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState(null);

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
    setActiveSolutions(
      Array.isArray(post.solutions)
        ? post.solutions
        : Array.isArray(post.solution)
          ? post.solution
          : []
    );
    setActiveComments(
      (Array.isArray(post.comments) ? post.comments : []).filter(
        c => c && typeof c === 'object' && !c.__meta && (c.text || c.comment)
      )
    );
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
      setFeedbackMsg('Problem updated successfully in Supabase!');
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update problem:', err);
      setEditError(err.message || 'Failed to update problem in Supabase.');
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
      setDeleteError(err.message || 'Failed to delete problem from Supabase.');
      setDeleting(false);
    }
  };

  // Solution form state
  const [solTitle, setSolTitle] = useState('');
  const [solApproach, setSolApproach] = useState('');
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingSolId, setDeletingSolId] = useState(null);
  const [solDeleteError, setSolDeleteError] = useState('');

  const handleSolutionSubmit = async (e) => {
    e.preventDefault();
    if (!solTitle.trim() || !solApproach.trim()) {
      setFeedbackMsg('Please provide a title and proposed approach for the solution.');
      return;
    }

    setSubmitting(true);
    try {
      const authorDisplayName = currentAccount?.name || (currentAccount?.email ? currentAccount.email.split('@')[0] : 'Partner Account');
      const solPayload = {
        title: solTitle.trim(),
        desc: solApproach.trim(),
        proposed_approach: solApproach.trim(),
        author_id: currentAccount?.id || null,
        author_email: currentAccount?.email || null,
        author_name: authorDisplayName,
        author_role: userRole
      };

      await onSubmitSolution(id, solPayload);

      // Immediately append to activeSolutions so it renders under the post with zero delay
      const newSol = {
        id: `sol-${Date.now()}`,
        problem_id: id,
        ...solPayload,
        created_at: new Date().toISOString()
      };

      setActiveSolutions(prev => {
        const existing = Array.isArray(prev) ? prev : [];
        return [newSol, ...existing.filter(s => s.title !== solPayload.title)];
      });

      setSolTitle('');
      setSolApproach('');
      setShowSolutionForm(false);
      setFeedbackMsg('✅ Solution submitted successfully! It is now visible under this problem.');
      setTimeout(() => setFeedbackMsg(''), 5000);
    } catch (err) {
      setFeedbackMsg(err.message || 'Error submitting solution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSolution = async (solId) => {
    if (!window.confirm('Are you sure you want to delete this solution? This cannot be undone.')) {
      return;
    }

    setDeletingSolId(solId);
    setSolDeleteError('');
    try {
      if (onDeleteSolution) {
        await onDeleteSolution(id, solId);
      } else {
        await postService.deleteSolution(id, solId, currentAccount);
      }
      setActiveSolutions(prev => prev.filter(s => s.id !== solId));
      setFeedbackMsg('✅ Your solution has been deleted.');
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      console.error('Failed to delete solution:', err);
      setSolDeleteError(err.message || 'Failed to delete solution.');
    } finally {
      setDeletingSolId(null);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (userRole !== 'citizen') {
      setCommentFeedback('Only verified citizens are authorized to post comments.');
      return;
    }

    setSubmittingComment(true);
    setCommentFeedback('');
    try {
      const authorDisplayName = currentAccount?.name || (currentAccount?.email ? currentAccount.email.split('@')[0] : 'Citizen Member');
      const commentPayload = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        author_id: currentAccount?.id || null,
        author_email: currentAccount?.email || null,
        author_name: authorDisplayName,
        author_role: 'citizen',
        text: commentText.trim(),
        created_at: new Date().toISOString()
      };

      if (onAddComment) {
        await onAddComment(id, commentPayload);
      } else {
        await postService.addComment(id, commentPayload, currentAccount);
      }

      setActiveComments(prev => [...prev, commentPayload]);
      setCommentText('');
      setCommentFeedback('✅ Comment posted successfully!');
      setTimeout(() => setCommentFeedback(''), 4000);
    } catch (err) {
      console.error('Failed to post comment:', err);
      setCommentFeedback(`❌ ${err.message || 'Failed to post comment.'}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete your comment? This cannot be undone.')) {
      return;
    }

    setDeletingCommentId(commentId);
    try {
      if (onDeleteComment) {
        await onDeleteComment(id, commentId);
      } else {
        await postService.deleteComment(id, commentId, currentAccount);
      }
      setActiveComments(prev => prev.filter(c => c.id !== commentId));
      setCommentFeedback('✅ Comment deleted.');
      setTimeout(() => setCommentFeedback(''), 3000);
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert(err.message || 'Failed to delete comment.');
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container detail-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header-bar">
          <div className="modal-header-meta">
            {currentStatus === 'Resolved' ? (
              <span className="tag-pill status-resolved-badge">✅ RESOLVED</span>
            ) : (
              <span className="tag-pill status-open-badge">OPEN</span>
            )}
            <span className="tag-pill category-tag">{category || 'General'}</span>
            <span className="tag-pill">ID #{id}</span>
          </div>
          <button className="modal-close-icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-scroll-body">
          {/* Main Problem Details */}
          <div className="detail-problem-section">
            <div className="detail-author-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="author-avatar-circle" title={`Author: ${authorInfo.name}`}>
                  {authorInfo.initials}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="detail-author-name">{authorInfo.name}</span>
                    <span className="detail-author-role">(CITIZEN)</span>
                    {isAuthor && <span className="author-badge-you">Your Post</span>}
                  </div>
                  <span className="detail-date" title={new Date(created_at).toLocaleString()}>
                    • {formatRelativeTime(created_at)} ({new Date(created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})
                  </span>
                </div>
              </div>

              {/* Author Quick Actions (Edit, Delete, Resolve) */}
              {isAuthor && !isEditing && (
                <div className="author-actions-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {onToggleResolve && (
                    <button
                      type="button"
                      className={`btn ${currentStatus === 'Resolved' ? 'btn-reopen-status' : 'btn-resolve-status'}`}
                      onClick={handleToggleResolve}
                      disabled={resolving}
                      title={currentStatus === 'Resolved' ? "Reopen problem" : "Mark problem as resolved"}
                    >
                      {resolving ? 'Updating...' : currentStatus === 'Resolved' ? '↩️ Reopen Problem' : '✅ Mark Resolved'}
                    </button>
                  )}
                  <button 
                    type="button" 
                    className="btn btn-outline btn-edit-post"
                    onClick={() => setIsEditing(true)}
                    title="Edit problem details"
                  >
                    ✏️ Edit Problem
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-delete-post"
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Delete this problem permanently"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>

            {/* Resolved Celebration Banner */}
            {currentStatus === 'Resolved' && (
              <div className="resolved-celebration-banner">
                <span style={{ fontSize: '1.4rem' }}>✅</span>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Problem Solved & Marked as Resolved</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    The citizen who posted this problem has marked it as resolved with community solutions.
                  </p>
                </div>
              </div>
            )}

            {/* Delete Confirmation Alert Banner */}
            {showDeleteConfirm && (
              <div className="delete-confirm-box" style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: '8px',
                padding: '1rem',
                margin: '1rem 0'
              }}>
                <h4 style={{ color: '#EF4444', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                  ⚠️ Delete Problem Confirmation
                </h4>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                  Are you sure you want to permanently delete <strong>"{title}"</strong>? This will remove the row from the Supabase <code>posts</code> table. This action cannot be undone.
                </p>
                {deleteError && (
                  <div className="form-error-banner" style={{ marginBottom: '0.75rem' }}>
                    ⚠️ {deleteError}
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
                    {deleting ? 'Deleting from Supabase...' : 'Yes, Delete Problem'}
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
                    Make changes below and click save to update the Supabase database.
                  </p>
                </div>

                {editError && (
                  <div className="form-error-banner" style={{ marginBottom: '1rem' }}>
                    ⚠️ {editError}
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
                      {saving ? 'Saving changes to Supabase...' : 'Save Changes'}
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

              {/* Submit Solution Button for University & Industry */}
              {canSubmitSolution && !showSolutionForm && (
                <button 
                  type="button" 
                  className="btn btn-blue"
                  onClick={() => {
                    setActiveTab('solutions');
                    setShowSolutionForm(true);
                  }}
                >
                  + Submit a Solution
                </button>
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
          </div>

          {feedbackMsg && (
            <div className="status-box success">
              {feedbackMsg}
            </div>
          )}

          {/* Section Navigation Tabs: Solutions vs Comments (Togglable) */}
          <div className="modal-tab-nav-bar">
            <button
              type="button"
              className={`modal-tab-pill-btn ${activeTab === 'solutions' ? 'active' : ''}`}
              onClick={() => setActiveTab('solutions')}
            >
              💡 Solutions ({activeSolutions.length})
            </button>
            <button
              type="button"
              className={`modal-tab-pill-btn ${activeTab === 'comments' ? 'active' : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              💬 Comments ({activeComments.length})
            </button>
          </div>

          {/* ===================== TAB 1: SOLUTIONS ===================== */}
          {activeTab === 'solutions' && (
            <div className="modal-tab-pane">
              {/* Solution Submission Form (University & Industry ONLY) */}
              {canSubmitSolution && showSolutionForm && (
                <div className="submit-solution-box">
                  <div className="solution-form-header">
                    <h3>Submit a Solution</h3>
                    <p>Provide a structured technical proposal for this citizen problem.</p>
                  </div>

                  <form onSubmit={handleSolutionSubmit} className="solution-form">
                    <div className="form-field-group">
                      <label className="field-label">Solution Title *</label>
                      <input 
                        type="text"
                        required
                        className="field-input"
                        placeholder="Enter a descriptive solution title..."
                        value={solTitle}
                        onChange={(e) => setSolTitle(e.target.value)}
                      />
                    </div>

                    <div className="form-field-group">
                      <label className="field-label">Proposed Approach & Technical Details *</label>
                      <textarea 
                        rows={4}
                        required
                        className="field-textarea"
                        placeholder="Describe how your institution or enterprise proposes to solve this problem..."
                        value={solApproach}
                        onChange={(e) => setSolApproach(e.target.value)}
                      />
                    </div>

                    <div className="form-actions-row">
                      <button 
                        type="button" 
                        className="btn btn-outline"
                        onClick={() => setShowSolutionForm(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-blue"
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting...' : 'Post Solution'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Solutions Feed Header */}
              <div className="solutions-section-header">
                <div className="solutions-header-left">
                  <h3>Solutions ({activeSolutions.length})</h3>
                </div>
                <span className="solutions-header-note">
                  Submitted by verified Universities & Industries
                </span>
              </div>

              {/* Solutions List */}
              <div className="solutions-list">
                {solDeleteError && (
                  <div className="status-box error" style={{ margin: '0.75rem 0' }}>
                    {solDeleteError}
                  </div>
                )}

                {activeSolutions.length === 0 ? (
                  <div className="empty-solutions-card">
                    <p>No solutions submitted yet.</p>
                    {canSubmitSolution ? (
                      <span className="empty-subtext">Click "+ Submit a Solution" above to post the first solution.</span>
                    ) : (
                      <span className="empty-subtext">Universities and industries will post structured solutions here.</span>
                    )}
                  </div>
                ) : (
                  activeSolutions.map((sol, index) => {
                    const isSolAuthor = isSolutionAuthor(sol, currentAccount);
                    return (
                      <div key={sol.id || index} className="solution-item-card">
                        <div className="solution-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div className="solution-org-info" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span className={`role-badge-tag ${sol.author_role === 'university' ? 'badge-uni' : 'badge-inds'}`}>
                              {(sol.author_role || 'PARTNER').toUpperCase()}
                            </span>
                            <strong className="solution-org-title">{sol.author_name}</strong>
                            {isSolAuthor && <span className="author-badge-you">Your Solution</span>}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {sol.created_at && (
                              <span className="solution-date-text">
                                {formatRelativeTime(sol.created_at)}
                              </span>
                            )}
                            {isSolAuthor && (
                              <button
                                type="button"
                                className="btn-delete-sol-item"
                                onClick={() => handleDeleteSolution(sol.id)}
                                disabled={deletingSolId === sol.id}
                                title="Delete your solution"
                              >
                                {deletingSolId === sol.id ? 'Deleting...' : '🗑️ Delete'}
                              </button>
                            )}
                          </div>
                        </div>

                        <h4 className="solution-title">{sol.title}</h4>
                        <div className="solution-description-text">
                          {sol.proposed_approach || sol.desc}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Citizen info notice */}
              {!isGuest && userRole === 'citizen' && (
                <div className="citizen-transparency-box" style={{ marginTop: '1.25rem' }}>
                  <div className="transparency-icon">💡</div>
                  <div className="transparency-text">
                    <strong>Solutions Showcase:</strong> Solutions are proposed by registered universities and enterprise partners. Citizens can discuss this problem under the <strong>💬 Comments</strong> tab.
                  </div>
                </div>
              )}

              {/* Guest info notice */}
              {isGuest && (
                <div className="citizen-transparency-box" style={{ marginTop: '1.25rem' }}>
                  <div className="transparency-icon">💡</div>
                  <div className="transparency-text" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <div>
                      <strong>Are you a University or Enterprise Partner?</strong> Sign in to submit structured academic or industrial solutions for this problem.
                    </div>
                    {onOpenAuth && (
                      <button type="button" className="btn btn-blue" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }} onClick={() => onOpenAuth('signup', 'university')}>
                        Sign In / Join
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 2: COMMENTS ===================== */}
          {activeTab === 'comments' && (
            <div className="modal-tab-pane">
              <div className="solutions-section-header">
                <div className="solutions-header-left">
                  <h3>Citizen Comments ({activeComments.length})</h3>
                </div>
                <span className="solutions-header-note">
                  Civic discussion by verified community citizens
                </span>
              </div>

              {commentFeedback && (
                <div className={`status-box ${commentFeedback.startsWith('✅') ? 'success' : 'error'}`} style={{ margin: '0.75rem 0' }}>
                  {commentFeedback}
                </div>
              )}

              {/* Comment Post Form (ONLY Citizens can post) */}
              {!isGuest && userRole === 'citizen' ? (
                <form onSubmit={handleCommentSubmit} className="citizen-comment-input-box" style={{ margin: '1rem 0 1.5rem 0' }}>
                  <textarea
                    rows={3}
                    required
                    className="field-textarea"
                    placeholder="Share your perspective or additional details about this issue..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Posting as: <strong>{currentAccount?.name || 'Citizen'}</strong> <span className="role-badge-tag badge-citz">CITIZEN</span>
                    </span>
                    <button
                      type="submit"
                      className="btn btn-blue"
                      disabled={submittingComment || !commentText.trim()}
                    >
                      {submittingComment ? 'Posting...' : '💬 Post Comment'}
                    </button>
                  </div>
                </form>
              ) : isGuest ? (
                <div className="citizen-transparency-box" style={{ margin: '1rem 0' }}>
                  <div className="transparency-icon">💬</div>
                  <div className="transparency-text" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.6rem' }}>
                    <div>
                      <strong>Community Discussion:</strong> Sign in as a verified citizen to post comments on this problem.
                    </div>
                    {onOpenAuth && (
                      <button type="button" className="btn btn-blue" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }} onClick={() => onOpenAuth('login', 'citizen')}>
                        Citizen Sign In
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="citizen-transparency-box" style={{ margin: '1rem 0' }}>
                  <div className="transparency-icon">ℹ️</div>
                  <div className="transparency-text">
                    <strong>Citizen Only Discussion:</strong> Only verified citizen accounts are authorized to post comments on citizen problems. As a {userRole === 'university' ? 'University Partner' : 'Industry Partner'}, you can submit structured proposals under the <strong>💡 Solutions</strong> tab.
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="comments-stream-list">
                {activeComments.length === 0 ? (
                  <div className="empty-solutions-card">
                    <p>No comments yet.</p>
                    {userRole === 'citizen' ? (
                      <span className="empty-subtext">Be the first citizen to comment on this problem!</span>
                    ) : (
                      <span className="empty-subtext">Citizen community discussions will appear here.</span>
                    )}
                  </div>
                ) : (
                  activeComments.map((c, idx) => {
                    const isMyComment = isCommentAuthor(c, currentAccount);
                    const cInitials = (c.author_name || 'C')
                      .split(' ')
                      .filter(Boolean)
                      .map(w => w[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase() || 'C';

                    return (
                      <div key={c.id || idx} className="comment-bubble-item" style={{
                        padding: '1rem',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        marginBottom: '0.85rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div className="author-avatar-circle" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                              {cInitials}
                            </div>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{c.author_name}</strong>
                            <span className="role-badge-tag badge-citz">CITIZEN</span>
                            {isMyComment && <span className="author-badge-you">Your Comment</span>}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {formatRelativeTime(c.created_at)}
                            </span>
                            {isMyComment && (
                              <button
                                type="button"
                                className="btn-delete-sol-item"
                                onClick={() => handleDeleteComment(c.id)}
                                disabled={deletingCommentId === c.id}
                                title="Delete your comment"
                              >
                                {deletingCommentId === c.id ? 'Deleting...' : '🗑️ Delete'}
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>
                          {c.text || c.comment}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
