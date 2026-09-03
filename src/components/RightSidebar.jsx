import React from 'react';
import { ArrowRight, Sparkles, Building2, GraduationCap, Users } from 'lucide-react';
import { STATS } from '../data/mockData';

export function RightSidebar({ onSelectCategory, onSelectRoleDemo, onOpenAuth }) {
  const browseFields = [
    "Infrastructure",
    "Healthcare",
    "Education",
    "Climate",
    "Agriculture",
    "Energy"
  ];

  return (
    <aside className="right-sidebar">
      {/* Platform Statistics Card matching reference image */}
      <div className="stats-card">
        <h3 className="stats-card-heading">First Look</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{STATS.openProblems.toLocaleString()}</span>
            <span className="stat-label">Open problems</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{STATS.universityTeams.toLocaleString()}</span>
            <span className="stat-label">University teams</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{STATS.organizations.toLocaleString()}</span>
            <span className="stat-label">Organizations</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{STATS.solutions.toLocaleString()}</span>
            <span className="stat-label">Solutions</span>
          </div>
        </div>
      </div>

      {/* Browse fields list matching reference image */}
      <div className="browse-fields-card">
        <h4 className="browse-fields-heading">Browse fields</h4>
        <div className="fields-list">
          {browseFields.map((field) => (
            <button 
              key={field} 
              className="field-row-btn"
              onClick={() => onSelectCategory(field)}
            >
              <span>{field}</span>
              <ArrowRight size={14} className="field-arrow-icon" />
            </button>
          ))}
        </div>
      </div>

      {/* Ecosystem Role Quick Access Card */}
      <div className="ecosystem-guide-card">
        <div className="guide-header">
          <Sparkles size={16} className="guide-icon" />
          <span>Connect Your Sector</span>
        </div>
        <p className="guide-description">
          Experience the platform through role-tailored dashboards & workflows:
        </p>
        
        <div className="guide-roles-list">
          <div className="guide-role-row" onClick={() => onSelectRoleDemo('citizen')}>
            <div className="role-icon-circle citizen">
              <Users size={14} />
            </div>
            <div className="role-info">
              <strong>Citizens</strong>
              <span>Submit civic issues & upvote solutions</span>
            </div>
            <ArrowRight size={14} className="role-jump-arrow" />
          </div>

          <div className="guide-role-row" onClick={() => onSelectRoleDemo('university')}>
            <div className="role-icon-circle university">
              <GraduationCap size={14} />
            </div>
            <div className="role-info">
              <strong>Universities</strong>
              <span>Lead student teams & research bids</span>
            </div>
            <ArrowRight size={14} className="role-jump-arrow" />
          </div>

          <div className="guide-role-row" onClick={() => onSelectRoleDemo('industry')}>
            <div className="role-icon-circle industry">
              <Building2 size={14} />
            </div>
            <div className="role-info">
              <strong>Industries</strong>
              <span>Post challenges & fund prototypes</span>
            </div>
            <ArrowRight size={14} className="role-jump-arrow" />
          </div>
        </div>
      </div>
    </aside>
  );
}
