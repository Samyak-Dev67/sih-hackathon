import React from 'react';
import { ArrowRight, Users, GraduationCap, Building2, CheckCircle2, Globe, Award } from 'lucide-react';

export function LandingHero({ onExploreClick, onPostProblemClick, onSelectRoleDemo }) {
  return (
    <section className="landing-hero-container">
      {/* Dark Banner matching the exact reference screenshot */}
      <div className="hero-dark-banner">
        <div className="hero-decorative-accent"></div>
        <div className="hero-badge-row">
          <span className="hero-eyebrow-tag">FIRST LOOK</span>
        </div>
        
        <h1 className="hero-headline">
          Real problems.<br />
          Collective solutions.
        </h1>

        <p className="hero-subtext">
          A platform connecting governments, organizations, communities and universities to work together on real-world challenges.
        </p>

        <div className="hero-buttons-row">
          <button className="hero-btn-primary" onClick={onExploreClick}>
            Explore Problems
          </button>
          <button className="hero-btn-secondary" onClick={onPostProblemClick}>
            Post a Problem
          </button>
        </div>
      </div>

      {/* Tri-Sector Architecture Overview Banner */}
      <div className="tri-ecosystem-overview">
        <div className="tri-pillar-card citizen-pillar" onClick={() => onSelectRoleDemo('citizen')}>
          <div className="pillar-header">
            <div className="pillar-icon-box citizen-bg">
              <Users size={20} />
            </div>
            <div>
              <span className="pillar-role-tag">For Citizens</span>
              <h3 className="pillar-title">Civic Discovery & Voice</h3>
            </div>
          </div>
          <p className="pillar-body">
            Highlight local municipal issues, upvote community challenges, track solutions from research teams, and participate in grassroots initiatives.
          </p>
          <div className="pillar-footer">
            <span>Explore Citizen Hub</span>
            <ArrowRight size={14} />
          </div>
        </div>

        <div className="tri-pillar-card university-pillar" onClick={() => onSelectRoleDemo('university')}>
          <div className="pillar-header">
            <div className="pillar-icon-box university-bg">
              <GraduationCap size={20} />
            </div>
            <div>
              <span className="pillar-role-tag">For Universities</span>
              <h3 className="pillar-title">Research & Student Labs</h3>
            </div>
          </div>
          <p className="pillar-body">
            Connect students and faculties to funded challenges, bid on sponsored research grants, and turn academic projects into real-world deployments.
          </p>
          <div className="pillar-footer">
            <span>Explore Academic Hub</span>
            <ArrowRight size={14} />
          </div>
        </div>

        <div className="tri-pillar-card industry-pillar" onClick={() => onSelectRoleDemo('industry')}>
          <div className="pillar-header">
            <div className="pillar-icon-box industry-bg">
              <Building2 size={20} />
            </div>
            <div>
              <span className="pillar-role-tag">For Industries</span>
              <h3 className="pillar-title">Innovation & Talent</h3>
            </div>
          </div>
          <p className="pillar-body">
            Post technological bottlenecks, fund university capstone teams, recruit top research talent, and collaborate directly on sustainable solutions.
          </p>
          <div className="pillar-footer">
            <span>Explore Industry Hub</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </section>
  );
}
