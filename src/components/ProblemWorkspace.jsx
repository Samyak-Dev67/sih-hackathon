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

  const handlePresetAmount = (milestoneId, presetValue) => {
    setFundingInputs(prev => ({ ...prev, [milestoneId]: String(presetValue) }));
    if (fundingErrors[milestoneId]) {
      setFundingErrors(prev => ({ ...prev, [milestoneId]: '' }));
    }
  };

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

        {/* Stakeholder Collaboration Cards Deck */}
        <div className="workspace-stakeholder-row">
          {/* Card 1: Lead Research Institution */}
          <div className="stakeholder-card uni-stakeholder-card">
            <div className="stakeholder-card-badge">
              <span className="badge-bullet blue" />
              <span>LEAD RESEARCH INSTITUTION</span>
            </div>
            <div className="stakeholder-card-main">
              <div className="stakeholder-avatar uni-avatar">
                {claim.universityName?.slice(0, 2).toUpperCase() || 'UN'}
              </div>
              <div className="stakeholder-text-wrap">
                <strong className="stakeholder-name-text">{claim.universityName}</strong>
                <span className="stakeholder-subtext">Verified Academic Research Lab</span>
              </div>
            </div>
            <div className="stakeholder-card-footer">
              <span className="stakeholder-meta-pill">Research Lead</span>
            </div>
          </div>

          {/* Card 2: Assigned Research Teams */}
          <div className="stakeholder-card team-stakeholder-card">
            <div className="stakeholder-card-badge space-between">
              <div className="badge-bullet-group">
                <span className="badge-bullet purple" />
                <span>ASSIGNED RESEARCH COHORT</span>
              </div>
              {assignedTeams.length > 0 && isUniversity && (
                <button
                  type="button"
                  className="stakeholder-manage-link"
                  onClick={onBack}
                  title="Configure in Team Management"
                >
                  Manage Teams →
                </button>
              )}
            </div>

            <div className="stakeholder-card-main team-main">
              {assignedTeams.length === 0 ? (
                <div className="stakeholder-empty-box">
                  <span className="empty-team-label">No student team assigned yet</span>
                  {isUniversity && (
                    <button
                      type="button"
                      className="btn-link-action"
                      onClick={onBack}
                    >
                      Assign teams in Team Management →
                    </button>
                  )}
                </div>
              ) : (
                <div className="workspace-teams-scroll">
                  {assignedTeams.map((team) => {
                    const teamStudents = (Array.isArray(team.members) && team.members.length > 0)
                      ? team.members
                      : allStudents.filter(s => (team.studentIds || []).includes(s.id));
                    return (
                      <div key={team.id} className="workspace-team-card-inner">
                        <div className="workspace-team-title-row">
                          <strong className="workspace-team-title">{team.name}</strong>
                          {team.department && (
                            <span className="team-dept-badge">{team.department}</span>
                          )}
                        </div>
                        {teamStudents.length > 0 ? (
                          <div className="workspace-team-members-pills">
                            {teamStudents.map((s) => (
                              <span key={s.id || s.name} className="workspace-member-pill" title={`${s.name} - ${s.role}`}>
                                <span className="member-avatar-micro">{s.initials || s.name?.slice(0, 2).toUpperCase()}</span>
                                <span className="member-name-str">{s.name}</span>
                                {s.role && <span className="member-role-str">({s.role})</span>}
                              </span>
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

            <div className="stakeholder-card-footer">
              <span className="stakeholder-meta-pill">
                {assignedTeams.length > 0 ? `${assignedTeams.length} Team(s) Active` : 'Cohort Unassigned'}
              </span>
            </div>
          </div>

          {/* Card 3: Industry Sponsor */}
          <div className="stakeholder-card ind-stakeholder-card">
            <div className="stakeholder-card-badge">
              <span className="badge-bullet green" />
              <span>INDUSTRY SPONSOR & GRANTS</span>
            </div>

            <div className="stakeholder-card-main">
              {claim.fundedByIndustry ? (
                <>
                  <div className="stakeholder-avatar ind-avatar">
                    {claim.fundedByIndustry.name?.slice(0, 2).toUpperCase() || 'IN'}
                  </div>
                  <div className="stakeholder-text-wrap">
                    <strong className="stakeholder-name-text">{claim.fundedByIndustry.name}</strong>
                    <span className="stakeholder-subtext">Empowering Industry Partner</span>
                  </div>
                </>
              ) : (
                <div className="awaiting-sponsor-wrap">
                  <div className="awaiting-sponsor-info">
                    <strong className="awaiting-title">Awaiting Industry Partner</strong>
                    <span className="awaiting-desc">Back this project with milestone research grants</span>
                  </div>
                  {currentAccount?.role === 'industry' && (
                    <button 
                      type="button" 
                      className="btn btn-blue btn-sm btn-empower-card" 
                      onClick={() => {
                        const updated = empowerChallenge(claim.postId, currentAccount);
                        if (updated) setClaim(updated);
                        if (onFundChallenge) onFundChallenge(claim.postId);
                      }}
                    >
                      Empower Initiative
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="stakeholder-card-footer">
              {claim.fundedByIndustry ? (
                <span className="stakeholder-meta-pill active-sponsor">Empowering Partner</span>
              ) : (
                <span className="stakeholder-meta-pill pending-sponsor">Open for Sponsorship</span>
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
            <h2 className="milestones-card-title">Research Roadmap & Escrow Grants</h2>
            <p className="milestones-card-subtitle">
              Milestones completed by the university dictate project progress. Industry partners can allocate grants released automatically upon completion.
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
            milestones.map((m, idx) => {
              const isFunded = Boolean(m.funding && m.funding.amount);
              const fundAmount = isFunded ? Number(m.funding.amount) : 0;
              const isCompleted = Boolean(m.completed);

              return (
                <div key={m.id || idx} className={`workspace-milestone-card ${isCompleted ? 'is-completed' : ''}`}>
                  {/* Top Bar of Milestone */}
                  <div className="milestone-card-top">
                    <div className="milestone-top-left">
                      <span className="milestone-index-badge">MILESTONE {idx + 1}</span>
                      <div className="milestone-deadline-pill">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>Target: {m.deadline}</span>
                      </div>
                    </div>

                    <div className="milestone-actions-cluster">
                      {isFunded && (
                        <span className={`milestone-funding-badge ${isCompleted ? 'badge-transferred' : 'badge-committed'}`}>
                          {isCompleted ? 'TRANSFERRED' : 'ESCROW COMMITTED'}
                        </span>
                      )}

                      <span className={`milestone-status-tag ${isCompleted ? 'tag-completed' : 'tag-pending'}`}>
                        {isCompleted ? 'COMPLETED' : 'IN PROGRESS'}
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

                  {/* Main Milestone Body */}
                  <div className="milestone-main-row">
                    <label className="milestone-checkbox-wrap">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggle(m.id)}
                        className="milestone-checkbox"
                        disabled={!isUniversity}
                        title={isUniversity ? "Mark milestone completed" : "View-only for industry sponsor"}
                      />
                      <span className="milestone-custom-check" />
                    </label>

                    <div className="milestone-title-wrapper">
                      <span className="milestone-title-text">{m.title}</span>
                    </div>
                  </div>

                  {/* Escrow Guarantee Status Banner if funded */}
                  {isFunded && (
                    <div className={`milestone-escrow-banner ${isCompleted ? 'is-transferred' : 'is-committed'}`}>
                      <div className="escrow-banner-left">
                        <div className={`escrow-banner-icon ${isCompleted ? 'green' : 'blue'}`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </div>
                        <div className="escrow-banner-content">
                          <div className="escrow-banner-heading">
                            <strong className="escrow-amount-str">₹{fundAmount.toLocaleString('en-IN')} Research Grant</strong>
                            <span className="escrow-subbadge">
                              {isCompleted ? 'Disbursed to Lead Institution' : 'Held Securely in Escrow'}
                            </span>
                          </div>
                          <p className="escrow-banner-subtext">
                            {isCompleted
                              ? `Funds released to ${claim.universityName || 'University'} upon verified milestone completion. Empowered by ${m.funding.industryName || 'Industry Partner'}.`
                              : `Committed by ${m.funding.industryName || 'Industry Partner'}. Released automatically to the university upon verified milestone completion.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Industry Research Grant Allocation Panel if un-funded */}
                  {!isFunded && !isCompleted && currentAccount?.role === 'industry' && (
                    <div className="milestone-grant-allocation-card">
                      <div className="grant-allocation-header">
                        <div className="grant-header-title">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          <span>PLEDGE RESEARCH GRANT FOR THIS MILESTONE</span>
                        </div>
                        <span className="grant-escrow-hint">Held in escrow until milestone is delivered</span>
                      </div>

                      <div className="grant-quick-presets">
                        <span className="presets-label">Quick Grants:</span>
                        {[25000, 50000, 100000, 250000].map(val => (
                          <button
                            key={val}
                            type="button"
                            className={`grant-preset-pill ${fundingInputs[m.id] === String(val) ? 'active' : ''}`}
                            onClick={() => handlePresetAmount(m.id, val)}
                          >
                            + ₹{val.toLocaleString('en-IN')}
                          </button>
                        ))}
                      </div>

                      <div className="grant-input-row">
                        <div className="grant-input-wrapper">
                          <span className="currency-symbol">₹</span>
                          <input
                            type="number"
                            min="500"
                            step="500"
                            placeholder="Amount in INR (e.g. 50000)"
                            value={fundingInputs[m.id] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFundingInputs(prev => ({ ...prev, [m.id]: val }));
                              if (fundingErrors[m.id]) setFundingErrors(prev => ({ ...prev, [m.id]: '' }));
                            }}
                            className="grant-input-field"
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-blue grant-commit-btn"
                          onClick={() => handleMilestoneFund(m.id)}
                        >
                          Commit Escrow Grant
                        </button>
                      </div>

                      {fundingErrors[m.id] && (
                        <div className="grant-error-row">
                          <span>{fundingErrors[m.id]}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* University view if un-funded */}
                  {!isFunded && !isCompleted && currentAccount?.role === 'university' && (
                    <div className="milestone-grant-unfunded-hint">
                      <span className="unfunded-hint-bullet" />
                      <span>Open for industry grant sponsorship</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Collaboration Hub Readiness Card */}
      <div className="workspace-canvas-container">
        <div className="workspace-canvas-card">
          <div className="workspace-canvas-header">
            <div className="canvas-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="3" y1="9" x2="21" y2="9" />
              </svg>
            </div>
            <div>
              <h3 className="canvas-card-title">Academic-Industry Collaboration Bridge Active</h3>
              <p className="canvas-card-desc">
                Research workspace established for <strong>{claim.universityName}</strong>
                {claim.fundedByIndustry ? ` and ${claim.fundedByIndustry.name}` : ''}.
              </p>
            </div>
          </div>

          <div className="canvas-features-grid">
            <div className="canvas-feature-item">
              <div className="feature-dot blue" />
              <div>
                <strong>Milestone Escrow Grants</strong>
                <span>Transparent grant disbursements released on verified deliverables</span>
              </div>
            </div>
            <div className="canvas-feature-item">
              <div className="feature-dot purple" />
              <div>
                <strong>Direct Student Cohort Mentorship</strong>
                <span>Direct collaboration with faculty leads and student researchers</span>
              </div>
            </div>
            <div className="canvas-feature-item">
              <div className="feature-dot green" />
              <div>
                <strong>Lab Telemetry & Prototypes</strong>
                <span>Shared test datasets, field validation metrics, and milestone reports</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
