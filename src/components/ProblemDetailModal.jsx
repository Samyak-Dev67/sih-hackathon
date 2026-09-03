import React, { useState } from 'react';
import { X, GraduationCap, Award, Send, CheckCircle2 } from 'lucide-react';

export function ProblemDetailModal({ problem, isOpen, onClose, onVote, currentUser, onAddProposal }) {
  if (!isOpen || !problem) return null;

  const [proposalText, setProposalText] = useState('');
  const [teamName, setTeamName] = useState(currentUser?.organization || currentUser?.name || '');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmitProposal = (e) => {
    e.preventDefault();
    if (!proposalText.trim()) return;

    onAddProposal(problem.id, {
      id: 'prop-' + Date.now(),
      team: teamName || 'Independent Academic Cohort',
      author: currentUser?.name || 'Registered Contributor',
      role: currentUser?.role || 'University',
      summary: proposalText,
      votes: 1
    });

    setProposalText('');
    setSuccessMsg('Proposal submitted successfully! It is now visible to the sponsoring body.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card problem-detail-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="detail-modal-header">
          <div className="detail-org-row">
            <div className="org-avatar-badge large">
              <span>{problem.orgInitials || 'FL'}</span>
            </div>
            <div>
              <div className="detail-org-name">{problem.orgName}</div>
              <div className="detail-org-type">{problem.orgType} · Posted {problem.postedTime}</div>
            </div>
            <div className="card-status-badge open ml-auto">
              <span>{problem.status || 'OPEN'}</span>
            </div>
          </div>

          <h2 className="detail-modal-title">{problem.title}</h2>

          <div className="detail-tags-row">
            {problem.tags.map((tag, idx) => (
              <span key={idx} className="problem-tag-chip">{tag}</span>
            ))}
            {problem.bountyOrGrant && (
              <span className="problem-grant-chip">{problem.bountyOrGrant}</span>
            )}
          </div>
        </div>

        <div className="detail-modal-body">
          <div className="detail-meta-stats-bar">
            <div className="meta-stat">
              <span className="stat-value">{problem.upvotes}</span>
              <span className="stat-label">Community Endorsements</span>
            </div>
            <div className="meta-stat">
              <span className="stat-value">{problem.contributorsCount}</span>
              <span className="stat-label">Active Contributors</span>
            </div>
            <div className="meta-stat">
              <span className="stat-value">{problem.universityTeamsCount}</span>
              <span className="stat-label">University Teams</span>
            </div>
            <div className="meta-stat">
              <span className="stat-value">{problem.daysLeft} days</span>
              <span className="stat-label">Submission Window</span>
            </div>
          </div>

          <div className="detail-section">
            <h4 className="detail-section-heading">Executive Summary</h4>
            <p className="detail-paragraph">{problem.summary}</p>
          </div>

          <div className="detail-section">
            <h4 className="detail-section-heading">Detailed Challenge Context & Scope</h4>
            <p className="detail-paragraph">{problem.detailedDescription || problem.summary}</p>
          </div>

          {problem.sponsoringBody && (
            <div className="sponsoring-box">
              <Award size={18} className="sponsor-icon" />
              <div>
                <strong>Sponsoring Agency / Grant Authority:</strong>
                <span> {problem.sponsoringBody} ({problem.bountyOrGrant || 'Full Implementation Grant'})</span>
              </div>
            </div>
          )}

          <div className="detail-section proposals-section">
            <div className="proposals-header">
              <h4 className="detail-section-heading">Active Solutions & Team Proposals ({problem.proposals?.length || 0})</h4>
              <span className="proposals-sub">Peer-reviewed collaborative responses</span>
            </div>

            {problem.proposals && problem.proposals.length > 0 ? (
              <div className="proposals-cards-list">
                {problem.proposals.map((prop) => (
                  <div key={prop.id} className="proposal-card">
                    <div className="proposal-card-top">
                      <div className="team-badge">
                        <GraduationCap size={14} />
                        <span>{prop.team}</span>
                      </div>
                      <span className="prop-author">by {prop.author} ({prop.role})</span>
                      <span className="prop-votes">?? {prop.votes} votes</span>
                    </div>
                    <p className="proposal-text">{prop.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-proposals-box">
                <p>No team proposals submitted yet. Be the first university lab or citizen group to submit a solution!</p>
              </div>
            )}

            {successMsg && (
              <div className="auth-info-banner mt-3">
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="proposal-submit-form">
              <h5 className="form-subheading">Submit Your Team Solution / Hypothesis</h5>
              <div className="form-group">
                <input 
                  type="text" 
                  placeholder="Your Team / Lab / Community Group Name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="text-input"
                  required
                />
              </div>
              <div className="form-group">
                <textarea 
                  rows="3" 
                  placeholder="Summarize your technical methodology, sensor topology, or civic deployment plan..."
                  value={proposalText}
                  onChange={(e) => setProposalText(e.target.value)}
                  className="text-textarea"
                  required
                />
              </div>
              <button type="submit" className="form-submit-btn">
                <Send size={15} />
                <span>Submit Solution to Problem</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
