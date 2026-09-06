import React, { useState } from 'react';
import { 
  getChallengeWorkspace, 
  canAccessWorkspace, 
  addMilestone, 
  toggleMilestone, 
  deleteMilestone,
  getTeamsForProblem,
  getUniversityStudents,
  fundMilestone,
  empowerChallenge
} from '../services/api';

export function ProblemWorkspace({ 
  postId, 
  post, 
  currentAccount, 
  onBack,
  onFundChallenge 
}) {
  const [claim, setClaim] = useState(() => getChallengeWorkspace(postId));
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  const [fundingInputs, setFundingInputs] = useState({});
  const [fundingErrors, setFundingErrors] = useState({});

  const handleMilestoneFund = (milestoneId) => {
    const amountStr = fundingInputs[milestoneId];
    const amount = Number(amountStr);
    if (!amountStr || isNaN(amount) || amount <= 0) {
      setFundingErrors(prev => ({ ...prev, [milestoneId]: 'Please enter a valid amount in INR (greater than 0)' }));
      return;
    }
    try {
      const updated = fundMilestone(postId, milestoneId, amount, currentAccount);
      if (updated) {
        setClaim(updated);
        setFundingInputs(prev => ({ ...prev, [milestoneId]: '' }));
        setFundingErrors(prev => ({ ...prev, [milestoneId]: '' }));
      }
    } catch (err) {
      setFundingErrors(prev => ({ ...prev, [milestoneId]: err.message || 'Failed to fund milestone.' }));
    }
  };

  const assignedTeams = getTeamsForProblem(claim?.universityId || currentAccount?.id, postId);
  const allStudents = getUniversityStudents(claim?.universityId || currentAccount?.id);

  // If no claim exists for this problem
  if (!claim) {
    return (
      <div className="workspace-page-container">
        <div className="workspace-access-restricted">
          <div className="access-card">
            <h2>Challenge Not Claimed</h2>
            <p>This problem has not been accepted into any university research workspace yet.</p>
            <button type="button" className="btn btn-outline" onClick={onBack}>
              ← Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check access permissions:
  // Strictly visible only to the university that accepted it and funding industry
  const hasAccess = canAccessWorkspace(postId, currentAccount);

  if (!hasAccess) {
    return (
      <div className="workspace-page-container">
        <div className="workspace-access-restricted">
          <div className="access-card">
            <div className="access-icon-lock">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2>Private Research Workspace</h2>
            <p>
              This workspace is locked and restricted to the research team of <strong>{claim.universityName}</strong> and its funding industry partner.
            </p>
            <div style={{ marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-outline" onClick={onBack}>
                ← Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isUniversity = currentAccount?.role === 'university';
  const milestones = claim.milestones || [];
  const completedCount = milestones.filter(m => m.completed).length;

  const handleToggle = (milestoneId) => {
    const updated = toggleMilestone(postId, milestoneId);
    if (updated) setClaim(updated);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const updated = addMilestone(postId, {
      title: newTitle.trim(),
      deadline: newDeadline.trim() || 'TBD'
    });
    if (updated) {
      setClaim(updated);
      setNewTitle('');
      setNewDeadline('');
      setIsAddingMilestone(false);
    }
  };

  const handleDelete = (milestoneId) => {
    const updated = deleteMilestone(postId, milestoneId);
    if (updated) setClaim(updated);
  };

  return (
    <div className="workspace-page-container">
      {/* Top Breadcrumb Navigation */}
      <div className="workspace-top-bar">
        <div className="workspace-breadcrumbs">
          <button type="button" className="breadcrumb-link" onClick={onBack}>
            Dashboard
          </button>
          <span className="breadcrumb-separator">/</span>
          <button type="button" className="breadcrumb-link" onClick={onBack}>
            {currentAccount?.role === 'industry' ? 'You Support' : 'Accepted Challenges'}
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{claim.title}</span>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={onBack}>
          {currentAccount?.role === 'industry' ? '← Back to You Support' : '← Back to Accepted Challenges'}
        </button>
      </div>

      {/* Project Workspace Header Card */}
      <div className="workspace-header-banner">
        <div className="workspace-header-meta">
          <span className="tag-pill category-tag">{claim.category}</span>
          <span className="tag-pill status-accepted-badge">ACCEPTED RESEARCH WORKSPACE</span>
          <span className="tag-pill" style={{ color: '#3b82f6', fontWeight: 700 }}>
            Progress: {claim.progress || 0}%
          </span>
        </div>

        <h1 className="workspace-title">{claim.title}</h1>
        {post?.desc && (
          <p className="workspace-desc">{post.desc}</p>
        )}

        {/* Stakeholder Collaboration Row */}
        <div className="workspace-stakeholder-row">
          <div className="stakeholder-chip uni-stakeholder">
            <span className="stakeholder-label">LEAD RESEARCH INSTITUTION</span>
            <div className="stakeholder-name-row">
              <div className="stakeholder-avatar">
                {claim.universityName?.slice(0, 2).toUpperCase() || 'UN'}
              </div>
              <strong>{claim.universityName}</strong>
            </div>
          </div>

          <div className="stakeholder-chip team-stakeholder">
            <div className="stakeholder-label-row">
              <span className="stakeholder-label">ASSIGNED RESEARCH TEAMS</span>
              {assignedTeams.length > 0 && isUniversity && (
                <button
                  type="button"
                  className="stakeholder-manage-link"
                  onClick={onBack}
                  title="Manage teams in Team Management"
                >
                  Manage Teams →
                </button>
              )}
            </div>

            <div className="stakeholder-content-box">
              {assignedTeams.length === 0 ? (
                <div className="stakeholder-empty-state">
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>No student team assigned yet</span>
                  {isUniversity && (
                    <button
                      type="button"
                      className="btn-link-action"
                      style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}
                      onClick={onBack}
                    >
                      Configure in Team Management →
                    </button>
                  )}
                </div>
              ) : (
                <div className="workspace-teams-stack">
                  {assignedTeams.map((team) => {
                    const teamStudents = (Array.isArray(team.members) && team.members.length > 0)
                      ? team.members
                      : allStudents.filter(s => (team.studentIds || []).includes(s.id));
                    return (
                      <div key={team.id} className="workspace-team-group">
                        <div className="workspace-team-name-tag">
                          <span className="team-indicator-dot" />
                          <strong className="workspace-team-title">{team.name}</strong>
                          {team.department && (
                            <span className="team-dept-subtext">({team.department})</span>
                          )}
                        </div>
                        {teamStudents.length > 0 ? (
                          <div className="workspace-team-students-list">
                            {teamStudents.map((s) => (
                              <div key={s.id || s.name} className="workspace-student-row">
                                <span className="student-bullet" />
                                <span className="workspace-student-name">{s.name}</span>
                                <span className="workspace-student-role-badge">{s.role}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.78rem' }}>No student researchers assigned</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="stakeholder-chip ind-stakeholder">
            <span className="stakeholder-label">INDUSTRY SPONSOR</span>
            <div className="stakeholder-name-row">
              {claim.fundedByIndustry ? (
                <>
                  <div className="stakeholder-avatar ind-avatar">
                    {claim.fundedByIndustry.name?.slice(0, 2).toUpperCase() || 'IN'}
                  </div>
                  <strong>{claim.fundedByIndustry.name}</strong>
                  <span className="stakeholder-status-pill">Empowering Partner</span>
                </>
              ) : (
                <div className="awaiting-funding-box">
                  <span className="text-muted">Awaiting Industry Funding Partner</span>
                  {currentAccount?.role === 'industry' && (
                    <button 
                      type="button" 
                      className="btn btn-blue btn-sm" 
                      onClick={() => {
                        const updated = empowerChallenge(claim.postId, currentAccount);
                        if (updated) setClaim(updated);
                        if (onFundChallenge) onFundChallenge(claim.postId);
                      }}
                      style={{ marginLeft: '0.75rem', fontWeight: 600 }}
                    >
                      Empower Project
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MILESTONES & PROGRESS MANAGEMENT (Dictates platform progress bar)        */}
      {/* ========================================================================= */}
      <div className="workspace-milestones-card">
        <div className="milestones-card-header">
          <div>
            <h2 className="milestones-card-title">Research Milestones & Progress</h2>
            <p className="milestones-card-subtitle">
              Milestones set by the university dictate the progress bar shown on the problem dashboard.
            </p>
          </div>

          {isUniversity && (
            <button
              type="button"
              className="btn btn-blue btn-sm"
              onClick={() => setIsAddingMilestone(prev => !prev)}
            >
              {isAddingMilestone ? 'Cancel' : '+ Set Milestone'}
            </button>
          )}
        </div>

        {/* Dynamic Progress Indicator */}
        <div className="workspace-progress-panel">
          <div className="workspace-progress-top">
            <span className="workspace-progress-stats">
              {completedCount} of {milestones.length} Milestones Completed
            </span>
            <span className="workspace-progress-val">{claim.progress || 0}% Complete</span>
          </div>
          <div className="workspace-progress-track">
            <div 
              className="workspace-progress-fill"
              style={{ width: `${Math.min(claim.progress || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Set Milestone Inline Form */}
        {isAddingMilestone && (
          <form onSubmit={handleAddSubmit} className="add-milestone-form">
            <h3 className="add-milestone-heading">Set New Research Milestone</h3>
            <div className="form-field-group">
              <label className="field-label">Milestone Title & Scope *</label>
              <input
                type="text"
                required
                placeholder="e.g., Phase 1: Drone Thermal Sensor Mapping and Analysis"
                className="field-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>

            <div className="form-field-group">
              <label className="field-label">Target Completion Deadline *</label>
              <input
                type="text"
                required
                placeholder="e.g., Dec 15, 2026"
                className="field-input"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setIsAddingMilestone(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-blue btn-sm"
              >
                Save Milestone
              </button>
            </div>
          </form>
        )}

        {/* Milestones List */}
        <div className="milestones-list">
          {milestones.length === 0 ? (
            <div className="empty-milestones-notice">
              <p>No milestones set yet. Click "+ Set Milestone" to establish your research roadmap.</p>
            </div>
          ) : (
            milestones.map((m, idx) => (
              <div key={m.id || idx} className="milestone-card-wrapper">
                <div 
                  className={`milestone-item ${m.completed ? 'is-completed' : ''}`}
                >
                  <label className="milestone-checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={!!m.completed}
                      onChange={() => handleToggle(m.id)}
                      className="milestone-checkbox"
                      disabled={!isUniversity}
                      title={isUniversity ? "Check to complete milestone" : "View-only for industry sponsor"}
                    />
                    <span className="milestone-custom-check" />
                  </label>

                  <div className="milestone-info">
                    <span className="milestone-title-text">{m.title}</span>
                    <div className="milestone-sub-meta">
                      <span className="milestone-target-date">Target: {m.deadline}</span>

                      {/* Milestone Funding Details */}
                      {m.funding && (
                        <span className={`milestone-funding-pill ${m.completed ? 'is-transferred' : 'is-committed'}`}>
                          <span className={`funding-status-dot ${m.completed ? 'green' : 'blue'}`} />
                          {m.completed
                            ? `₹${Number(m.funding.amount).toLocaleString('en-IN')} transferred ${isUniversity ? `from ${m.funding.industryName || 'Industry Partner'}` : `to ${claim.universityName || 'University'}`}`
                            : `₹${Number(m.funding.amount).toLocaleString('en-IN')} committed ${isUniversity ? `by ${m.funding.industryName || 'Industry Partner'}` : 'on milestone completion'}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="milestone-actions-cluster">
                    {m.funding && (
                      <span className={`milestone-funding-badge ${m.completed ? 'badge-transferred' : 'badge-committed'}`}>
                        {m.completed ? 'TRANSFERRED' : 'COMMITTED'}
                      </span>
                    )}

                    <span className={`milestone-status-tag ${m.completed ? 'tag-completed' : 'tag-pending'}`}>
                      {m.completed ? 'COMPLETED' : 'IN PROGRESS'}
                    </span>

                    {isUniversity && (
                      <button
                        type="button"
                        className="milestone-delete-btn"
                        onClick={() => handleDelete(m.id)}
                        title="Delete milestone"
                        aria-label="Delete milestone"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Industry Funding Input Box for un-funded milestones */}
                {!m.funding && !m.completed && currentAccount?.role === 'industry' && (
                  <div className="milestone-fund-box-row">
                    <span className="fund-box-label">Fund Milestone:</span>
                    <div className="fund-input-wrapper">
                      <span className="rupee-currency-prefix">₹</span>
                      <input
                        type="number"
                        min="100"
                        step="500"
                        placeholder="Enter amount (e.g. 50000)"
                        value={fundingInputs[m.id] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFundingInputs(prev => ({ ...prev, [m.id]: val }));
                          if (fundingErrors[m.id]) setFundingErrors(prev => ({ ...prev, [m.id]: '' }));
                        }}
                        className="milestone-fund-input"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-blue btn-sm fund-commit-btn"
                      onClick={() => handleMilestoneFund(m.id)}
                    >
                      Fund Milestone
                    </button>
                    {fundingErrors[m.id] && (
                      <span className="fund-error-text">{fundingErrors[m.id]}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Clean Workspace Area Ready for Next Modules */}
      <div className="workspace-canvas-container">
        <div className="workspace-empty-state">
          <div className="workspace-empty-icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <line x1="3" y1="9" x2="21" y2="9"></line>
            </svg>
          </div>
          <h3>Project Workspace Active</h3>
          <p>
            Collaboration workspace established for <strong>{claim.universityName}</strong>
            {claim.fundedByIndustry ? ` and ${claim.fundedByIndustry.name}` : ''}.
          </p>
          <span className="workspace-ready-badge">Ready for Collaboration Tools</span>
        </div>
      </div>
    </div>
  );
}
