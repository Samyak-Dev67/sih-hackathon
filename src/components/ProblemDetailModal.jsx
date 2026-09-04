import React, { useState } from 'react';

export function ProblemDetailModal({ 
  post, 
  onClose, 
  currentAccount, 
  onVote, 
  onSubmitSolution 
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
    solutions = []
  } = post;

  const userRole = currentAccount?.role || 'citizen';
  const canSubmitSolution = userRole === 'university' || userRole === 'industry';
  const hasLiked = liked_by.includes(currentAccount?.id);

  // Solution form state
  const [solTitle, setSolTitle] = useState('');
  const [solApproach, setSolApproach] = useState('');
  const [showSolutionForm, setShowSolutionForm] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSolutionSubmit = async (e) => {
    e.preventDefault();
    if (!solTitle.trim() || !solApproach.trim()) {
      setFeedbackMsg('Please provide a title and proposed approach for the solution.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitSolution(id, {
        title: solTitle.trim(),
        desc: solApproach.trim(),
        proposed_approach: solApproach.trim(),
        author_name: currentAccount.name,
        author_role: userRole
      });

      setSolTitle('');
      setSolApproach('');
      setShowSolutionForm(false);
      setFeedbackMsg('Solution submitted successfully!');
      setTimeout(() => setFeedbackMsg(''), 4000);
    } catch (err) {
      setFeedbackMsg(err.message || 'Error submitting solution.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container detail-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header-bar">
          <div className="modal-header-meta">
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
            <div className="detail-author-row">
              <div className="author-avatar-circle">
                C1
              </div>
              <div>
                <span className="detail-author-name">Citizen Account</span>
                <span className="detail-author-role">(CITIZEN)</span>
                <span className="detail-date">
                  • {new Date(created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            <h2 className="detail-problem-title">{title}</h2>
            <div className="detail-problem-description">
              {desc}
            </div>

            {img && (
              <div style={{ borderRadius: '8px', overflow: 'hidden', margin: '0.5rem 0' }}>
                <img src={img} alt={title} style={{ maxWidth: '100%', height: 'auto' }} />
              </div>
            )}

            {/* Like / Action Bar */}
            <div className="detail-actions-bar">
              <button 
                type="button"
                className={`detail-vote-btn ${hasLiked ? 'active-up' : ''}`}
                onClick={() => onVote(id)}
                title={hasLiked ? "Click to remove like" : "1 like per account"}
              >
                ▲ Score ({score}) {hasLiked ? '• Liked' : ''}
              </button>

              {/* Submit Solution Button for University & Industry */}
              {canSubmitSolution && !showSolutionForm && (
                <button 
                  type="button" 
                  className="btn btn-blue"
                  onClick={() => setShowSolutionForm(true)}
                >
                  + Submit a Solution
                </button>
              )}
            </div>
          </div>

          {feedbackMsg && (
            <div className="status-box success">
              {feedbackMsg}
            </div>
          )}

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
              <h3>Solutions ({solutions.length})</h3>
            </div>
            <span className="solutions-header-note">
              Submitted by verified Universities & Industries
            </span>
          </div>

          {/* Solutions List */}
          <div className="solutions-list">
            {solutions.length === 0 ? (
              <div className="empty-solutions-card">
                <p>No solutions submitted yet.</p>
                {canSubmitSolution ? (
                  <span className="empty-subtext">Click "+ Submit a Solution" above to post the first solution.</span>
                ) : (
                  <span className="empty-subtext">Universities and industries will post structured solutions here.</span>
                )}
              </div>
            ) : (
              solutions.map((sol, index) => (
                <div key={sol.id || index} className="solution-item-card">
                  <div className="solution-card-top">
                    <div className="solution-org-info">
                      <span className={`role-badge-tag ${sol.author_role === 'university' ? 'badge-uni' : 'badge-inds'}`}>
                        {(sol.author_role || 'PARTNER').toUpperCase()}
                      </span>
                      <strong className="solution-org-title">{sol.author_name}</strong>
                    </div>
                    {sol.created_at && (
                      <span className="solution-date-text">
                        {new Date(sol.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <h4 className="solution-title">{sol.title}</h4>
                  <div className="solution-description-text">
                    {sol.proposed_approach || sol.desc}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Citizen Notice - strictly NO comment box */}
          {userRole === 'citizen' && (
            <div className="citizen-transparency-box">
              <div className="transparency-icon">ℹ️</div>
              <div className="transparency-text">
                <strong>Civic Transparency Notice:</strong> Solutions from universities and industries are displayed above for community visibility. Citizens cannot comment or submit solutions on this platform.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
