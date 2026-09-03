import React from 'react';
import { ChevronUp, ChevronDown, MessageSquare, GraduationCap, Clock, ArrowRight } from 'lucide-react';

export function ProblemCard({ problem, onVote, onSelectProblem }) {
  const isUpvoted = problem.hasUpvoted;

  return (
    <article className="problem-card">
      <div className="vote-sidebar-column">
        <button 
          className={`vote-chevron-btn up ${isUpvoted ? 'voted' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onVote(problem.id, 1);
          }}
          title="Upvote this problem"
          aria-label="Upvote"
        >
          <ChevronUp size={20} />
        </button>

        <span className={`vote-count-number ${isUpvoted ? 'voted' : ''}`}>
          {problem.upvotes}
        </span>

        <button 
          className="vote-chevron-btn down"
          onClick={(e) => {
            e.stopPropagation();
            onVote(problem.id, -1);
          }}
          title="Downvote this problem"
          aria-label="Downvote"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      <div className="problem-card-body" onClick={() => onSelectProblem(problem)}>
        <div className="problem-card-header">
          <div className="org-meta-left">
            <div className="org-avatar-badge">
              <span>{problem.orgInitials || problem.orgName.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="org-title-and-meta">
              <span className="org-name-text">{problem.orgName}</span>
              <span className="org-subtext-meta">
                {problem.orgType} · {problem.postedTime}
              </span>
            </div>
          </div>

          <div className="card-status-badge open">
            <span>{problem.status || 'OPEN'}</span>
          </div>
        </div>

        <h2 className="problem-card-title">
          {problem.title}
        </h2>

        <p className="problem-card-summary">
          {problem.summary}
        </p>

        <div className="problem-tags-row">
          {problem.tags.map((tag, idx) => (
            <span key={idx} className="problem-tag-chip">
              {tag}
            </span>
          ))}
          {problem.bountyOrGrant && (
            <span className="problem-grant-chip">
              {problem.bountyOrGrant}
            </span>
          )}
        </div>

        <div className="problem-card-footer">
          <div className="footer-metrics-group">
            <span className="metric-pill">
              <MessageSquare size={14} className="metric-icon" />
              <span>{problem.contributorsCount} contributors</span>
            </span>
            <span className="metric-pill">
              <GraduationCap size={15} className="metric-icon" />
              <span>{problem.universityTeamsCount} university teams</span>
            </span>
            <span className="metric-pill">
              <Clock size={14} className="metric-icon" />
              <span>{problem.daysLeft} days left</span>
            </span>
          </div>

          <button 
            className="view-problem-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onSelectProblem(problem);
            }}
          >
            <span>View problem</span>
            <ArrowRight size={14} className="arrow-indicator" />
          </button>
        </div>
      </div>
    </article>
  );
}
