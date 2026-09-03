import React, { useState } from 'react';
import { 
  Users, GraduationCap, Building2, PlusCircle, CheckCircle, Clock, 
  ArrowUpRight, FileText, Send, Sparkles, AlertCircle, Award, 
  ChevronRight, MapPin, Tag, ThumbsUp, Filter, Search
} from 'lucide-react';
import { DEMO_PROFILES } from '../data/mockData';

// CITIZEN DASHBOARD
export function CitizenDashboard({ currentUser, onPostProblem, problems = [] }) {
  const profile = currentUser.submissions ? currentUser : DEMO_PROFILES.citizen;
  const [activeTab, setActiveTab] = useState('my-issues');
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueCategory, setNewIssueCategory] = useState('Infrastructure');
  const [newIssueDesc, setNewIssueDesc] = useState('');
  const [submittedList, setSubmittedList] = useState(profile.submissions || []);
  const [successToast, setSuccessToast] = useState('');

  const handleCreateCivicIssue = (e) => {
    e.preventDefault();
    if (!newIssueTitle.trim()) return;

    const newSub = {
      id: 'cit-' + Date.now(),
      title: newIssueTitle,
      category: newIssueCategory,
      status: 'Submitted - Awaiting University Review',
      date: 'Just now',
      upvotes: 1,
      responses: 0
    };

    setSubmittedList([newSub, ...submittedList]);
    setNewIssueTitle('');
    setNewIssueDesc('');
    setSuccessToast('Your civic issue has been logged and broadcast to local universities and government departments!');
    setTimeout(() => setSuccessToast(''), 4500);
  };

  return (
    <div className="role-dashboard-view citizen-view">
      {/* Role Header Banner */}
      <div className="dashboard-role-banner citizen-theme">
        <div className="banner-left-info">
          <div className="banner-role-badge">
            <Users size={16} />
            <span>Citizen Portal</span>
          </div>
          <h1 className="banner-title">Welcome back, {currentUser.name || 'Citizen Member'}</h1>
          <p className="banner-subtitle">
            Voice local challenges, track municipal action, and collaborate with universities to solve neighbourhood problems.
          </p>
          <div className="user-meta-chips">
            <span className="meta-chip"><MapPin size={13} /> {currentUser.location || 'Bengaluru Metro'}</span>
            <span className="meta-chip"><Sparkles size={13} /> Community Score: 480 pts</span>
          </div>
        </div>

        <button className="banner-primary-action-btn" onClick={onPostProblem}>
          <PlusCircle size={16} />
          <span>Report Public Issue</span>
        </button>
      </div>

      {/* Toast */}
      {successToast && (
        <div className="success-banner">
          <CheckCircle size={18} />
          <span>{successToast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="dashboard-subnav-tabs">
        <button 
          className={subnav-tab-btn }
          onClick={() => setActiveTab('my-issues')}
        >
          My Tracked Submissions ({submittedList.length})
        </button>
        <button 
          className={subnav-tab-btn }
          onClick={() => setActiveTab('submit-issue')}
        >
          Submit New Issue / Idea
        </button>
        <button 
          className={subnav-tab-btn }
          onClick={() => setActiveTab('community-initiatives')}
        >
          Active University & Civic Teams
        </button>
      </div>

      {/* Tab 1: Tracked Submissions */}
      {activeTab === 'my-issues' && (
        <div className="dashboard-content-grid">
          <div className="content-main-panel">
            <h3 className="section-title">Your Issues & Idea Tracker</h3>
            <div className="submission-cards-list">
              {submittedList.map((item) => (
                <div key={item.id} className="submission-status-card">
                  <div className="sub-card-top">
                    <span className="sub-category-tag">{item.category}</span>
                    <span className={status-pill }>
                      {item.status}
                    </span>
                  </div>
                  <h4 className="sub-card-title">{item.title}</h4>
                  <div className="sub-card-meta">
                    <span>Logged {item.date}</span>
                    <span>·</span>
                    <span><ThumbsUp size={13} /> {item.upvotes} community endorsements</span>
                    <span>·</span>
                    <span>{item.responses} university inquiries</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="content-side-panel">
            <div className="panel-card">
              <h4 className="panel-heading">How Citizen Reporting Works</h4>
              <ol className="step-guide-list">
                <li><strong>1. Submit:</strong> Document a local issue (e.g. waterlogging, waste, transit).</li>
                <li><strong>2. University Review:</strong> Engineering and policy student teams adopt it for research capstones.</li>
                <li><strong>3. Industry Sponsorship:</strong> Local companies or ministries fund the prototype deployment.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Submit New Issue */}
      {activeTab === 'submit-issue' && (
        <div className="dashboard-form-container">
          <h3 className="section-title">Submit a Problem or Civic Idea</h3>
          <p className="section-desc">
            Your problem statement will be made available to participating universities, engineering labs, and civic authorities.
          </p>

          <form onSubmit={handleCreateCivicIssue} className="role-action-form">
            <div className="form-group">
              <label className="input-field-label">Issue Title / What needs solving?</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Inadequate pedestrian crossings and micro-flooding near Metro Station 4"
                value={newIssueTitle}
                onChange={(e) => setNewIssueTitle(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="input-field-label">Category</label>
              <select 
                value={newIssueCategory} 
                onChange={(e) => setNewIssueCategory(e.target.value)}
                className="text-select"
              >
                <option value="Infrastructure">Infrastructure</option>
                <option value="Climate">Climate & Environment</option>
                <option value="Healthcare">Healthcare & Sanitation</option>
                <option value="Education">Education & Public Libraries</option>
                <option value="Energy">Energy & Lighting</option>
              </select>
            </div>

            <div className="form-group">
              <label className="input-field-label">Detailed Description & Evidence</label>
              <textarea 
                rows="4"
                placeholder="Describe the severity, frequency, affected population, and any existing municipal attempts..."
                value={newIssueDesc}
                onChange={(e) => setNewIssueDesc(e.target.value)}
                className="text-textarea"
              />
            </div>

            <button type="submit" className="form-submit-btn">
              <Send size={16} />
              <span>Broadcast to Universities & Municipal Bodies</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Active Initiatives */}
      {activeTab === 'community-initiatives' && (
        <div className="dashboard-content-grid">
          <div className="content-main-panel">
            <h3 className="section-title">Cross-Sector Pilot Deployments in Your Area</h3>
            <div className="initiative-cards-list">
              <div className="initiative-card">
                <div className="initiative-badge">PILOT IN PROGRESS</div>
                <h4>Ward 12 Automated Stormwater Silt Desander</h4>
                <p>Partnership between RV College of Engineering and Bengaluru Municipal Corp.</p>
                <div className="initiative-footer">
                  <span>Target Completion: Oct 2026</span>
                  <span>Impact: 14,000 residents</span>
                </div>
              </div>

              <div className="initiative-card">
                <div className="initiative-badge">VOLUNTEER SIGNUPS OPEN</div>
                <h4>Urban Miyawaki Afforestation Drone Mapping</h4>
                <p>Citizens and student botanists documenting micro-climate canopy variations.</p>
                <div className="initiative-footer">
                  <span>Signups: 42 citizens joined</span>
                  <button className="small-action-btn">Participate</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// UNIVERSITY DASHBOARD
export function UniversityDashboard({ currentUser, problems = [] }) {
  const profile = currentUser.proposalsSubmitted ? currentUser : DEMO_PROFILES.university;
  const [activeTab, setActiveTab] = useState('grants');
  const [proposalSuccess, setProposalSuccess] = useState('');

  return (
    <div className="role-dashboard-view university-view">
      {/* Role Header Banner */}
      <div className="dashboard-role-banner university-theme">
        <div className="banner-left-info">
          <div className="banner-role-badge">
            <GraduationCap size={16} />
            <span>University Portal</span>
          </div>
          <h1 className="banner-title">{profile.institution || currentUser.organization || 'University Faculty & Lab'}</h1>
          <p className="banner-subtitle">
            Connect students and researchers to funded industry requirements, bid on public RFPs, and showcase research breakthroughs.
          </p>
          <div className="user-meta-chips">
            <span className="meta-chip"><Award size={13} /> {profile.department || 'Applied Engineering'}</span>
            <span className="meta-chip"><Users size={13} /> {profile.activeTeams || 4} Active Student Teams</span>
            <span className="meta-chip"><FileText size={13} /> 28 Student Researchers</span>
          </div>
        </div>
      </div>

      {proposalSuccess && (
        <div className="success-banner">
          <CheckCircle size={18} />
          <span>{proposalSuccess}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="dashboard-subnav-tabs">
        <button 
          className={subnav-tab-btn }
          onClick={() => setActiveTab('grants')}
        >
          Open Industry & Govt Grants ({problems.length})
        </button>
        <button 
          className={subnav-tab-btn }
          onClick={() => setActiveTab('my-proposals')}
        >
          Our Submitted Proposals ({profile.proposalsSubmitted?.length || 2})
        </button>
        <button 
          className={subnav-tab-btn }
          onClick={() => setActiveTab('student-labs')}
        >
          Student Teams & Lab Roster
        </button>
      </div>

      {activeTab === 'grants' && (
        <div className="dashboard-content-grid">
          <div className="content-main-panel">
            <h3 className="section-title">Open Problems Looking for University Research Teams</h3>
            <div className="grants-cards-list">
              {problems.map((p) => (
                <div key={p.id} className="grant-card">
                  <div className="grant-card-header">
                    <span className="grant-code">{p.code}</span>
                    <span className="grant-bounty-badge">{p.bountyOrGrant || ',000 Grant'}</span>
                  </div>
                  <h4 className="grant-title">{p.title}</h4>
                  <p className="grant-desc">{p.summary}</p>
                  <div className="grant-meta-row">
                    <span>Sponsor: <strong>{p.orgName}</strong></span>
                    <span>Deadline: <strong>{p.daysLeft} days left</strong></span>
                    <button 
                      className="bid-proposal-btn"
                      onClick={() => {
                        setProposalSuccess(`Team proposal draft created for "${p.title}"! Assigned to your department capstone queue.`);
                        setTimeout(() => setProposalSuccess(''), 5000);
                      }}
                    >
                      <PlusCircle size={14} />
                      <span>Submit Team Proposal</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="content-side-panel">
            <div className="panel-card">
              <h4 className="panel-heading">Academic Benefits</h4>
              <ul className="benefit-bullets">
                <li>Direct industry funding for capstone and PhD thesis milestones.</li>
                <li>Access to municipal datasets and industrial testing facilities.</li>
                <li>Fast-tracked patents and co-authored publication rights.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'my-proposals' && (
        <div className="dashboard-content-grid">
          <div className="content-main-panel">
            <h3 className="section-title">University Proposals Under Review</h3>
            <div className="proposals-list">
              {(profile.proposalsSubmitted || []).map((prop) => (
                <div key={prop.id} className="proposal-item-card">
                  <div className="prop-status-header">
                    <span className="prop-code">{prop.problemCode}</span>
                    <span className="status-pill open">{prop.status}</span>
                  </div>
                  <h4 className="prop-title">{prop.problemTitle}</h4>
                  <div className="prop-details-grid">
                    <div>
                      <span className="label">Sponsoring Agency:</span>
                      <span className="val">{prop.sponsor}</span>
                    </div>
                    <div>
                      <span className="label">Grant Value:</span>
                      <span className="val highlight">{prop.grantAmount}</span>
                    </div>
                  </div>
                  <div className="team-roster-tags">
                    <span className="label">Student Team Members:</span>
                    {prop.teamMembers.map((m, i) => (
                      <span key={i} className="team-member-pill">{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'student-labs' && (
        <div className="dashboard-content-grid">
          <div className="content-main-panel">
            <h3 className="section-title">Department Lab & Student Roster</h3>
            <div className="lab-teams-grid">
              <div className="lab-team-card">
                <h4>IoT & Environmental Sensors Lab</h4>
                <p>12 students · 2 PhDs · Working on flood warning nodes</p>
                <span className="status-pill open">Available for Industry Sponsoring</span>
              </div>
              <div className="lab-team-card">
                <h4>Renewable Energy & Biomass Group</h4>
                <p>8 students · 1 Postdoc · Specializing in agro-residue torrefaction</p>
                <span className="status-pill sponsored">Funded by Nordic CleanTech</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// INDUSTRY DASHBOARD
export function IndustryDashboard({ currentUser, onPostProblem }) {
  const profile = currentUser.postedChallenges ? currentUser : DEMO_PROFILES.industry;
  const [activeTab, setActiveTab] = useState('my-challenges');
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeBudget, setChallengeBudget] = useState(',000');
  const [challengeSector, setChallengeSector] = useState('CleanTech & Energy');
  const [challengeDesc, setChallengeDesc] = useState('');
  const [toast, setToast] = useState('');
  const [challenges, setChallenges] = useState(profile.postedChallenges || []);

  const handlePostChallenge = (e) => {
    e.preventDefault();
    if (!challengeTitle.trim()) return;

    const newCh = {
      id: 'ind-' + Date.now(),
      code: 'FL-' + Math.floor(1000 + Math.random() * 9000),
      title: challengeTitle,
      category: challengeSector,
      applicantsCount: 0,
      budget: challengeBudget,
      status: 'Open for University Bids',
      deadline: '45 days left'
    };

    setChallenges([newCh, ...challenges]);
    setChallengeTitle('');
    setChallengeDesc('');
    setToast('New industry challenge published! Sent to 327 verified university departments.');
    setTimeout(() => setToast(''), 5000);
  };

  return (
    <div className="role-dashboard-view industry-view">
      {/* Role Header Banner */}
      <div className="dashboard-role-banner industry-theme">
        <div className="banner-left-info">
          <div className="banner-role-badge">
            <Building2 size={16} />
            <span>Industry Portal</span>
          </div>
          <h1 className="banner-title">{profile.company || currentUser.organization || 'Enterprise Innovation Office'}</h1>
          <p className="banner-subtitle">
            Crowdsource innovative ideas, post corporate technical challenges, sponsor academic R&D, and identify top university talent.
          </p>
          <div className="user-meta-chips">
            <span className="meta-chip"><Award size={13} /> {profile.sector || 'CleanTech & Energy'}</span>
            <span className="meta-chip"><Building2 size={13} /> Active Budget: {profile.budgetAllocated || ',000'}</span>
          </div>
        </div>

        <button className="banner-primary-action-btn" onClick={() => setActiveTab('post-challenge')}>
          <PlusCircle size={16} />
          <span>Post Challenge</span>
        </button>
      </div>

      {toast && (
        <div className="success-banner">
          <CheckCircle size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="dashboard-subnav-tabs">
        <button 
          className={subnav-tab-btn }
          onClick={() => setActiveTab('my-challenges')}
        >
          Active Corporate Challenges ({challenges.length})
        </button>
        <button 
          className={subnav-tab-btn }
          onClick={() => setActiveTab('post-challenge')}
        >
          Create Challenge & Grant
        </button>
        <button 
          className={subnav-tab-btn }
          onClick={() => setActiveTab('talent-scout')}
        >
          University Labs & Talent Pipeline
        </button>
      </div>

      {activeTab === 'my-challenges' && (
        <div className="dashboard-content-grid">
          <div className="content-main-panel">
            <h3 className="section-title">Your Posted Challenges & Academic Applications</h3>
            <div className="industry-challenges-list">
              {challenges.map((ch) => (
                <div key={ch.id} className="industry-challenge-card">
                  <div className="ind-header-row">
                    <span className="ind-code">{ch.code}</span>
                    <span className="ind-budget-pill">{ch.budget}</span>
                  </div>
                  <h4 className="ind-title">{ch.title}</h4>
                  <div className="ind-meta-bar">
                    <span>Category: <strong>{ch.category}</strong></span>
                    <span>·</span>
                    <span>Applicants: <strong>{ch.applicantsCount} university teams</strong></span>
                    <span>·</span>
                    <span className="status-pill open">{ch.status}</span>
                  </div>
                  <div className="ind-actions-row">
                    <button className="small-action-btn">
                      <span>Review Proposals ({ch.applicantsCount})</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="content-side-panel">
            <div className="panel-card">
              <h4 className="panel-heading">Industry Advantages</h4>
              <ul className="benefit-bullets">
                <li>Cost-effective R&D pipeline with academic peer-review rigor.</li>
                <li>Direct hiring pipeline of top graduate engineering & data science students.</li>
                <li>ESG and CSR compliance through verified public problem solving.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'post-challenge' && (
        <div className="dashboard-form-container">
          <h3 className="section-title">Publish an Industry Challenge & Grant RFP</h3>
          <p className="section-desc">
            Define your technical bottlenecks or sustainability goals. Verified university departments and student teams will submit formal research proposals.
          </p>

          <form onSubmit={handlePostChallenge} className="role-action-form">
            <div className="form-group">
              <label className="input-field-label">Challenge Title</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Real-time predictive thermal runaway detection in EV battery packs"
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="input-field-label">Industry Domain</label>
                <select 
                  value={challengeSector} 
                  onChange={(e) => setChallengeSector(e.target.value)}
                  className="text-select"
                >
                  <option value="CleanTech & Energy">CleanTech & Energy</option>
                  <option value="Smart Mobility & EV">Smart Mobility & EV</option>
                  <option value="Healthcare & Diagnostics">Healthcare & Diagnostics</option>
                  <option value="Agri-Supply Chain">Agri-Supply Chain</option>
                  <option value="Urban Infrastructure">Urban Infrastructure</option>
                </select>
              </div>

              <div className="form-group">
                <label className="input-field-label">Grant / Pilot Budget</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. ,000"
                  value={challengeBudget}
                  onChange={(e) => setChallengeBudget(e.target.value)}
                  className="text-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-field-label">Technical Deliverables & Requirements</label>
              <textarea 
                rows="4" 
                placeholder="Specify the technical constraints, sample datasets provided, proof-of-concept requirements, and timeline expectations..."
                value={challengeDesc}
                onChange={(e) => setChallengeDesc(e.target.value)}
                className="text-textarea"
              />
            </div>

            <button type="submit" className="form-submit-btn">
              <Send size={16} />
              <span>Publish Challenge to University Network</span>
            </button>
          </form>
        </div>
      )}

      {activeTab === 'talent-scout' && (
        <div className="dashboard-content-grid">
          <div className="content-main-panel">
            <h3 className="section-title">Verified University Labs Ready for Co-Development</h3>
            <div className="talent-labs-list">
              <div className="talent-lab-row">
                <div className="lab-avatar">MIT</div>
                <div className="lab-info">
                  <h4>Materials Science Nano-Coating Research Group</h4>
                  <p>Specializes in anti-corrosion barrier layers for offshore renewable infrastructure.</p>
                  <span className="lab-tags">5 PhDs · 12 M.Techs · 3 Patents Pending</span>
                </div>
                <button className="small-action-btn">Contact Lab Director</button>
              </div>

              <div className="talent-lab-row">
                <div className="lab-avatar">IIT</div>
                <div className="lab-info">
                  <h4>Edge Computing & Sensor Telemetry Center</h4>
                  <p>Low-power LoRaWAN and embedded firmware architectures for harsh industrial environments.</p>
                  <span className="lab-tags">18 Student Researchers · 6 Industry Pilots Completed</span>
                </div>
                <button className="small-action-btn">Contact Lab Director</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
