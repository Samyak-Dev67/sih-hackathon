// First Look — Public Problem Solving Platform
// Pure React Application

const { useState, useEffect, useMemo } = React;

// Supabase Browser Client Initialization
const SUPABASE_URL = "https://nthoaygneaxlqkrwxzee.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MjiRdPRtjIhEClFk0v9tjg_UHv6eOBY";
const supabaseClient = (window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Initial Dataset matching reference design
const INITIAL_PROBLEMS = [
  {
    id: "prob-1",
    code: "FL-1082",
    title: "How can urban flooding be predicted at the neighbourhood level?",
    orgName: "Ministry of Urban Development",
    orgType: "Government",
    orgInitials: "MU",
    postedTime: "2 days ago",
    status: "OPEN",
    category: "Infrastructure",
    upvotes: 342,
    hasUpvoted: false,
    summary: "Monsoon runoff in dense wards overwhelms storm drains due to unmapped topography changes and silt accumulation. We need predictive hydrological sensor networks and citizen-reported alert data to simulate micro-catchment flooding 3 hours ahead of peak rainfall.",
    detailedDescription: "Rapid urbanization and concretization have severely altered natural stormwater drainage pathways. During heavy cloudburst events, localized low-lying colonies suffer destructive flash waterlogging before municipal pumping stations are alerted. We are inviting university computational labs and tech innovators to co-design early telemetry and GIS predictive models.",
    tags: ["Infrastructure", "Open Challenge", "Hydrology", "Smart Cities"],
    contributorsCount: 64,
    universityTeamsCount: 18,
    daysLeft: 28,
    bountyOrGrant: "$25,000 Pilot Grant",
    sponsoringBody: "National Disaster Resilience Council",
    proposals: [
      {
        id: "prop-101",
        team: "Urban Hydro Lab (Imperial & IIT)",
        author: "Dr. Arvind Rao",
        role: "University",
        summary: "IoT ultra-sonic sewer water-level nodes combined with graph neural networks for 45-minute localized inundation maps.",
        votes: 49
      },
      {
        id: "prop-102",
        team: "Ward 14 Civic Watch",
        author: "Meera Sen",
        role: "Citizen",
        summary: "Crowdsourced waterlogging geo-tagging with automated WhatsApp bot feeding into municipal command center.",
        votes: 31
      }
    ]
  },
  {
    id: "prob-2",
    code: "FL-0941",
    title: "Affordable cold-chain monitoring for rural maternal vaccination clinics",
    orgName: "Global Health Alliance & Public Health Dept",
    orgType: "Healthcare NGO & Govt",
    orgInitials: "GH",
    postedTime: "3 days ago",
    status: "OPEN",
    category: "Healthcare",
    upvotes: 289,
    hasUpvoted: false,
    summary: "Over 22% of primary health center vaccine batches suffer thermal excursions during last-mile delivery over dirt roads. We require passive zero-power phase-change monitoring with NFC verification.",
    detailedDescription: "Vaccines for measles, BCG, and rotavirus require strict 2°C to 8°C cold chains. In remote districts with intermittent grid electricity, battery-powered loggers fail or get lost. We are seeking collegiate biomedical engineering departments and industrial IoT manufacturers to formulate resilient last-mile solutions.",
    tags: ["Healthcare", "Cold Chain", "Rural Tech", "Biomedical"],
    contributorsCount: 42,
    universityTeamsCount: 14,
    daysLeft: 19,
    bountyOrGrant: "$40,000 Implementation Award",
    sponsoringBody: "Department of Biotechnology",
    proposals: [
      {
        id: "prop-201",
        team: "CryoBio Devices Lab",
        author: "Prof. Elena Rostova",
        role: "University",
        summary: "Low-cost beeswax PCM cassettes with non-electronic thermo-chromic irreversible indicator strips.",
        votes: 56
      }
    ]
  },
  {
    id: "prob-3",
    code: "FL-1120",
    title: "Decarbonizing industrial boiler steam cycles using localized biomass torrefaction",
    orgName: "Tata Steel & Sustainable Industry Forum",
    orgType: "Industry",
    orgInitials: "TS",
    postedTime: "4 days ago",
    status: "OPEN",
    category: "Energy",
    upvotes: 215,
    hasUpvoted: false,
    summary: "Replacing thermal coal in auxiliary industrial steam generators requires stable agricultural biomass briquettes with high calorific retention and hydrophobic durability in monsoon storage.",
    detailedDescription: "Seasonal crop residue burning creates heavy particulate air pollution while regional heavy industries still depend on imported thermal coal. This challenge invites university mechanical/chemical engineering groups and agricultural cooperatives to validate decentralized mobile torrefaction reactors.",
    tags: ["Energy", "Decarbonization", "Industry Challenge", "Agriculture"],
    contributorsCount: 51,
    universityTeamsCount: 22,
    daysLeft: 34,
    bountyOrGrant: "$60,000 Corporate R&D Contract",
    sponsoringBody: "CleanTech Venture Fund",
    proposals: []
  },
  {
    id: "prob-4",
    code: "FL-0887",
    title: "AI-assisted adaptive curriculum for multi-grade rural primary classrooms",
    orgName: "State Department of School Education",
    orgType: "Education Govt",
    orgInitials: "SE",
    postedTime: "5 days ago",
    status: "OPEN",
    category: "Education",
    upvotes: 198,
    hasUpvoted: false,
    summary: "Single-teacher classrooms with students from Grades 1 to 4 require offline-first audio-visual diagnostic worksheets in regional dialects to personalize foundational numeracy.",
    detailedDescription: "In village schools where one educator oversees 35 children across disparate learning proficiencies, standard textbooks fail. We are mobilizing university cognitive education researchers and tech volunteers to build lightweight, offline Android tablets capable of phonics instruction.",
    tags: ["Education", "EdTech", "Offline AI", "Civic Initiative"],
    contributorsCount: 38,
    universityTeamsCount: 11,
    daysLeft: 15,
    bountyOrGrant: "$18,000 Pilot Deployment",
    sponsoringBody: "Education Innovation Trust",
    proposals: []
  },
  {
    id: "prob-5",
    code: "FL-0733",
    title: "Non-potable graywater recycling systems for high-density public housing",
    orgName: "Metropolitan Water Supply & Sewerage Board",
    orgType: "Government",
    orgInitials: "MW",
    postedTime: "1 week ago",
    status: "OPEN",
    category: "Climate",
    upvotes: 174,
    hasUpvoted: false,
    summary: "High-density residential complexes discard thousands of liters of shower and washbasin graywater daily. We seek gravity-fed bio-sand and reed-bed filtration modules for toilet flushing.",
    detailedDescription: "Groundwater depletion in metropolitan centers requires immediate closed-loop domestic water reuse. We are collaborating with civic resident welfare associations (Citizens) and university environmental engineering faculties to design low-maintenance filtration systems.",
    tags: ["Climate", "Water", "Circular Economy", "Urban"],
    contributorsCount: 29,
    universityTeamsCount: 9,
    daysLeft: 22,
    bountyOrGrant: "$30,000 Grant",
    sponsoringBody: "Ministry of Jal Shakti & Urban Affairs",
    proposals: []
  },
  {
    id: "prob-6",
    code: "FL-1204",
    title: "Precision drone sensor payloads for smallholder pest & soil health mapping",
    orgName: "AgroTech Consortium & Farmers Federation",
    orgType: "Industry & Agriculture",
    orgInitials: "AC",
    postedTime: "1 week ago",
    status: "OPEN",
    category: "Agriculture",
    upvotes: 162,
    hasUpvoted: false,
    summary: "Commercial multispectral UAV cameras exceed smallholder budgets. We challenge university robotics clubs to construct sub-$300 modified CMOS cameras for nitrogen deficiency diagnostics.",
    detailedDescription: "Smallholder farmers cultivating under 3 hectares cannot afford industrial precision satellite or drone imagery services. A collaborative consortium of fertilizer suppliers, farmer groups, and aeronautical institutes is seeking open-source NDVI hardware.",
    tags: ["Agriculture", "Robotics", "Drones", "Open Hardware"],
    contributorsCount: 47,
    universityTeamsCount: 16,
    daysLeft: 41,
    bountyOrGrant: "$35,000 Prototyping Fund",
    sponsoringBody: "National Agricultural Research Foundation",
    proposals: []
  }
];

const STATS = {
  openProblems: 1284,
  universityTeams: 327,
  organizations: 84,
  solutions: 46
};

const CATEGORIES = [
  "All",
  "Infrastructure",
  "Healthcare",
  "Education",
  "Climate",
  "Agriculture",
  "Energy",
  "Technology"
];
const DEMO_PROFILES = {
  citizen: {
    name: "Dr. Ananya Sharma",
    email: "ananya.citizen@demo.org",
    role: "citizen",
    roleLabel: "Citizen Innovator",
    location: "Ward 12, Indiranagar",
    avatarInitials: "AS",
    submissions: [
      {
        id: "cit-sub-1",
        title: "Pothole density sensor network on public buses",
        category: "Infrastructure",
        status: "University Review",
        date: "3 days ago",
        upvotes: 89,
        responses: 4
      },
      {
        id: "cit-sub-2",
        title: "Community composting hubs in public parks",
        category: "Climate",
        status: "Industry Sponsored",
        date: "2 weeks ago",
        upvotes: 142,
        responses: 7
      }
    ]
  },
  university: {
    name: "Prof. Rajesh Kulkarni",
    email: "rajesh.faculty@national-institute.edu",
    role: "university",
    roleLabel: "University Research Faculty",
    institution: "National Institute of Advanced Engineering & Tech",
    department: "Civil & Environmental Computing",
    avatarInitials: "RK",
    activeTeams: 4,
    studentResearchers: 28,
    proposalsSubmitted: [
      {
        id: "uni-prop-1",
        problemCode: "FL-1082",
        problemTitle: "Urban Flooding Neighbourhood Prediction",
        sponsor: "Ministry of Urban Development",
        status: "Shortlisted for Round 2",
        grantAmount: "$25,000",
        teamMembers: ["Kavya M. (PhD)", "Rohan S. (M.Tech)", "Aditya P. (B.Tech)"]
      },
      {
        id: "uni-prop-2",
        problemCode: "FL-0733",
        problemTitle: "Non-potable graywater recycling systems",
        sponsor: "Metropolitan Water Board",
        status: "Under Technical Review",
        grantAmount: "$30,000",
        teamMembers: ["Simran K. (PhD)", "Nikhil V. (Research Fellow)"]
      }
    ]
  },
  industry: {
    name: "Vikram Malhotra",
    email: "v.malhotra@nordic-cleantech.com",
    role: "industry",
    roleLabel: "Industry R&D Director",
    company: "Nordic CleanTech Solutions & Energy Corp",
    sector: "Clean Energy & Industrial Decarbonization",
    avatarInitials: "VM",
    activeChallengesCount: 3,
    budgetAllocated: "$140,000",
    postedChallenges: [
      {
        id: "ind-ch-1",
        code: "FL-1120",
        title: "Decarbonizing industrial boiler steam cycles using biomass",
        category: "Energy",
        applicantsCount: 22,
        budget: "$60,000",
        status: "Accepting University Bids",
        deadline: "34 days left"
      },
      {
        id: "ind-ch-2",
        code: "FL-1455",
        title: "Micro-grid battery degradation telemetry using edge ML",
        category: "Technology",
        applicantsCount: 15,
        budget: "$45,000",
        status: "Reviewing Proposals",
        deadline: "12 days left"
      }
    ]
  }
};

const Icon = {
  Search: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Home: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Compass: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  GraduationCap: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>,
  Building: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="9" y1="6" x2="9" y2="6.01"></line><line x1="15" y1="6" x2="15" y2="6.01"></line><line x1="9" y1="10" x2="9" y2="10.01"></line><line x1="15" y1="10" x2="15" y2="10.01"></line><line x1="9" y1="14" x2="9" y2="14.01"></line><line x1="15" y1="14" x2="15" y2="14.01"></line><line x1="9" y1="18" x2="9" y2="18.01"></line><line x1="15" y1="18" x2="15" y2="18.01"></line></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Up: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>,
  Down: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>,
  ArrowRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  Message: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  Logout: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Send: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>,
  Help: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
};

function Navbar({ currentUser, onOpenAuth, onOpenPostProblem, onLogout, onSelectRoleDemo, activeTab, setActiveTab, searchQuery, setSearchQuery }) {
  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <div className="brand-group" onClick={() => setActiveTab('home')} style={{ cursor: 'pointer' }}>
          <div className="brand-badge-box">
            <span>FL</span>
          </div>
          <div className="brand-text-block">
            <span className="brand-title">First Look</span>
            <span className="brand-tagline">PUBLIC PROBLEM SOLVING</span>
          </div>
        </div>

        <div className="search-bar-wrapper">
          <span className="search-icon"><Icon.Search /></span>
          <input 
            type="text" 
            placeholder="Search problems, organizations, university teams..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <nav className="nav-actions-group">
          <button 
            className={"nav-link-btn " + (activeTab === 'home' ? 'active' : '')}
            onClick={() => setActiveTab('home')}
          >
            Home
          </button>
          
          <button 
            className={"nav-link-btn " + (activeTab === 'discover' ? 'active' : '')}
            onClick={() => setActiveTab('discover')}
          >
            Discover
          </button>

          <button 
            className={"nav-link-btn " + (activeTab === 'teams' ? 'active' : '')}
            onClick={() => setActiveTab('teams')}
          >
            Teams
          </button>

          {currentUser && (
            <button 
              className={"nav-link-btn role-dashboard-link " + (activeTab === 'dashboard' ? 'active' : '')}
              onClick={() => setActiveTab('dashboard')}
            >
              <span>{currentUser.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : ''} Portal</span>
            </button>
          )}

          <button 
            className="post-problem-btn"
            onClick={onOpenPostProblem}
          >
            <Icon.Plus />
            <span>Post Problem</span>
          </button>

          <div className="demo-role-dropdown-container">
            <span className="demo-pill-tag">Role Demo:</span>
            <div className="role-switch-buttons">
              <button 
                title="Switch to Citizen View"
                className={"role-micro-btn " + (currentUser?.role === 'citizen' ? 'active-role' : '')}
                onClick={() => onSelectRoleDemo('citizen')}
              >
                Citizen
              </button>
              <button 
                title="Switch to University View"
                className={"role-micro-btn " + (currentUser?.role === 'university' ? 'active-role' : '')}
                onClick={() => onSelectRoleDemo('university')}
              >
                University
              </button>
              <button 
                title="Switch to Industry View"
                className={"role-micro-btn " + (currentUser?.role === 'industry' ? 'active-role' : '')}
                onClick={() => onSelectRoleDemo('industry')}
              >
                Industry
              </button>
            </div>
          </div>

          {currentUser ? (
            <div className="user-profile-menu">
              <div 
                className="user-avatar-circle"
                title={(currentUser.name || currentUser.email) + " (" + (currentUser.role || 'Member') + ")"}
                onClick={() => setActiveTab('dashboard')}
              >
                <span>{(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}</span>
              </div>
              <button 
                className="logout-icon-btn" 
                onClick={onLogout} 
                title="Sign Out"
              >
                <Icon.Logout />
              </button>
            </div>
          ) : (
            <div className="auth-buttons-group">
              <button 
                className="login-nav-btn"
                onClick={() => onOpenAuth('login')}
              >
                Log In
              </button>
              <button 
                className="signup-nav-btn"
                onClick={() => onOpenAuth('signup')}
              >
                Sign Up
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
function LeftSidebar({ activeTab, setActiveTab, selectedCategory, setSelectedCategory }) {
  const categories = ["Infrastructure", "Healthcare", "Education", "Climate", "Agriculture", "Energy", "Technology"];

  return (
    <aside className="left-sidebar">
      <div className="sidebar-section primary-nav">
        <button 
          className={"sidebar-nav-item " + (activeTab === 'home' && selectedCategory === 'All' ? 'active' : '')}
          onClick={() => { setActiveTab('home'); setSelectedCategory('All'); }}
        >
          <Icon.Home />
          <span>Home</span>
        </button>

        <button 
          className={"sidebar-nav-item " + (activeTab === 'discover' ? 'active' : '')}
          onClick={() => setActiveTab('discover')}
        >
          <Icon.Compass />
          <span>Discover</span>
        </button>

        <button 
          className={"sidebar-nav-item " + (activeTab === 'teams' ? 'active' : '')}
          onClick={() => setActiveTab('teams')}
        >
          <Icon.Users />
          <span>My Teams</span>
        </button>

        <button 
          className={"sidebar-nav-item " + (activeTab === 'solutions' ? 'active' : '')}
          onClick={() => setActiveTab('solutions')}
        >
          <Icon.Check />
          <span>Solutions</span>
        </button>
      </div>

      <div className="sidebar-divider"></div>

      <div className="sidebar-section explore-nav">
        <span className="sidebar-subheading">EXPLORE</span>
        <div className="explore-links-list">
          {categories.map((cat) => (
            <button 
              key={cat}
              className={"explore-category-btn " + (selectedCategory === cat ? 'selected' : '')}
              onClick={() => { setSelectedCategory(cat); setActiveTab('home'); }}
            >
              <span className="cat-name-text">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-spacer"></div>

      <div className="sidebar-footer">
        <a 
          href="#guidelines" 
          className="sidebar-footer-link" 
          onClick={(e) => { 
            e.preventDefault(); 
            alert("First Look Guidelines:\n1. Real-World Impact: All posted problems must address genuine municipal, environmental, or industrial challenges.\n2. Cross-Sector Synergy: Submissions encourage collaborative bids across citizens, universities, and industry.\n3. Verified Outcomes: Grants and pilot implementations are audited through milestone deliverables."); 
          }}
        >
          <Icon.Help />
          <span>Help & Guidelines</span>
        </a>
      </div>
    </aside>
  );
}

function LandingHero({ onExploreClick, onPostProblemClick, onSelectRoleDemo }) {
  return (
    <section className="landing-hero-container">
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

      <div className="tri-ecosystem-overview">
        <div className="tri-pillar-card citizen-pillar" onClick={() => onSelectRoleDemo('citizen')}>
          <div className="pillar-header">
            <div className="pillar-icon-box citizen-bg">
              <Icon.Users />
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
            <Icon.ArrowRight />
          </div>
        </div>

        <div className="tri-pillar-card university-pillar" onClick={() => onSelectRoleDemo('university')}>
          <div className="pillar-header">
            <div className="pillar-icon-box university-bg">
              <Icon.GraduationCap />
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
            <Icon.ArrowRight />
          </div>
        </div>

        <div className="tri-pillar-card industry-pillar" onClick={() => onSelectRoleDemo('industry')}>
          <div className="pillar-header">
            <div className="pillar-icon-box industry-bg">
              <Icon.Building />
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
            <Icon.ArrowRight />
          </div>
        </div>
      </div>
    </section>
  );
}

function RightSidebar({ onSelectCategory, onSelectRoleDemo }) {
  const browseFields = ["Infrastructure", "Healthcare", "Education", "Climate", "Agriculture", "Energy"];

  return (
    <aside className="right-sidebar">
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
              <span className="field-arrow-icon"><Icon.ArrowRight /></span>
            </button>
          ))}
        </div>
      </div>

      <div className="ecosystem-guide-card">
        <div className="guide-header">
          <span>Connect Your Sector</span>
        </div>
        <p className="guide-description">
          Experience the platform through role-tailored dashboards & workflows:
        </p>
        
        <div className="guide-roles-list">
          <div className="guide-role-row" onClick={() => onSelectRoleDemo('citizen')}>
            <div className="role-icon-circle citizen"><Icon.Users /></div>
            <div className="role-info">
              <strong>Citizens</strong>
              <span>Submit civic issues & upvote solutions</span>
            </div>
            <span className="role-jump-arrow"><Icon.ArrowRight /></span>
          </div>

          <div className="guide-role-row" onClick={() => onSelectRoleDemo('university')}>
            <div className="role-icon-circle university"><Icon.GraduationCap /></div>
            <div className="role-info">
              <strong>Universities</strong>
              <span>Lead student teams & research bids</span>
            </div>
            <span className="role-jump-arrow"><Icon.ArrowRight /></span>
          </div>

          <div className="guide-role-row" onClick={() => onSelectRoleDemo('industry')}>
            <div className="role-icon-circle industry"><Icon.Building /></div>
            <div className="role-info">
              <strong>Industries</strong>
              <span>Post challenges & fund prototypes</span>
            </div>
            <span className="role-jump-arrow"><Icon.ArrowRight /></span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ProblemCard({ problem, onVote, onSelectProblem }) {
  const isUpvoted = problem.hasUpvoted;

  return (
    <article className="problem-card">
      <div className="vote-sidebar-column">
        <button 
          className={"vote-chevron-btn up " + (isUpvoted ? 'voted' : '')}
          onClick={(e) => { e.stopPropagation(); onVote(problem.id, 1); }}
          title="Upvote this problem"
        >
          <Icon.Up />
        </button>

        <span className={"vote-count-number " + (isUpvoted ? 'voted' : '')}>
          {problem.upvotes}
        </span>

        <button 
          className="vote-chevron-btn down"
          onClick={(e) => { e.stopPropagation(); onVote(problem.id, -1); }}
          title="Downvote this problem"
        >
          <Icon.Down />
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

        <h2 className="problem-card-title">{problem.title}</h2>
        <p className="problem-card-summary">{problem.summary}</p>

        <div className="problem-tags-row">
          {problem.tags.map((tag, idx) => (
            <span key={idx} className="problem-tag-chip">{tag}</span>
          ))}
          {problem.bountyOrGrant && (
            <span className="problem-grant-chip">{problem.bountyOrGrant}</span>
          )}
        </div>

        <div className="problem-card-footer">
          <div className="footer-metrics-group">
            <span className="metric-pill">
              <Icon.Message />
              <span>{problem.contributorsCount} contributors</span>
            </span>
            <span className="metric-pill">
              <Icon.GraduationCap />
              <span>{problem.universityTeamsCount} university teams</span>
            </span>
            <span className="metric-pill">
              <Icon.Clock />
              <span>{problem.daysLeft} days left</span>
            </span>
          </div>

          <button 
            className="view-problem-action-btn"
            onClick={(e) => { e.stopPropagation(); onSelectProblem(problem); }}
          >
            <span>View problem</span>
            <Icon.ArrowRight />
          </button>
        </div>
      </div>
    </article>
  );
}
function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) {
  const [authMode, setAuthMode] = useState(initialMode);
  const [selectedRole, setSelectedRole] = useState('citizen');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationOrInst, setOrganizationOrInst] = useState('');
  const [affiliationType, setAffiliationType] = useState('Student');
  const [locationOrCity, setLocationOrCity] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  if (!isOpen) return null;

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');
    setLoading(true);

    try {
      if (authMode === 'signup') {
        if (supabaseClient) {
          const { data, error } = await supabaseClient.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
              data: {
                first_name: fullName.trim() || email.split('@')[0],
                role: selectedRole,
                organization: organizationOrInst,
                affiliation_type: affiliationType,
                location: locationOrCity
              }
            }
          });

          if (error) throw error;
        }

        setInfoMessage('Account registered in Supabase! Accessing your ' + selectedRole.toUpperCase() + ' dashboard...');
        setTimeout(() => {
          onAuthSuccess({
            email: email.trim(),
            name: fullName || email.split('@')[0],
            role: selectedRole,
            organization: organizationOrInst
          });
          onClose();
        }, 900);
      } else {
        if (supabaseClient) {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email.trim(),
            password: password,
          });

          if (error) throw error;

          if (data?.user) {
            const userMeta = data.user.user_metadata || {};
            onAuthSuccess({
              email: data.user.email,
              name: userMeta.first_name || data.user.email.split('@')[0],
              role: userMeta.role || selectedRole,
              organization: userMeta.organization || ''
            });
            onClose();
            return;
          }
        }

        onAuthSuccess({
          email: email.trim(),
          name: fullName || email.split('@')[0],
          role: selectedRole,
          organization: organizationOrInst
        });
        onClose();
      }
    } catch (err) {
      console.warn('Supabase auth message:', err.message);
      setErrorMessage(err.message || 'Authentication error. You can also use the instant 1-click Demo Login below.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = (role) => {
    const profile = DEMO_PROFILES[role];
    onAuthSuccess(profile);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <Icon.X />
        </button>

        <div className="auth-header-container">
          <div className="auth-brand-pill">
            <div className="auth-logo-badge">FL</div>
            <span className="auth-platform-name">First Look Platform</span>
          </div>

          <h2 className="auth-headline">
            {authMode === 'signup' ? 'Join the Multi-Sector Network' : 'Sign in to First Look'}
          </h2>
          <p className="auth-subtext">
            Connecting Citizens, Universities, and Industries to solve national & local challenges.
          </p>
        </div>

        <div className="auth-mode-tabs">
          <button 
            type="button"
            className={"auth-mode-btn " + (authMode === 'login' ? 'active' : '')}
            onClick={() => { setAuthMode('login'); setErrorMessage(''); setInfoMessage(''); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={"auth-mode-btn " + (authMode === 'signup' ? 'active' : '')}
            onClick={() => { setAuthMode('signup'); setErrorMessage(''); setInfoMessage(''); }}
          >
            Create Account
          </button>
        </div>

        <div className="role-selection-section">
          <label className="input-field-label">Select Your Ecosystem Role</label>
          <div className="role-cards-selector">
            <div 
              className={"role-option-card citizen " + (selectedRole === 'citizen' ? 'active' : '')}
              onClick={() => setSelectedRole('citizen')}
            >
              <div className="role-card-icon-circle"><Icon.Users /></div>
              <div className="role-card-text">
                <strong>Citizen</strong>
                <span>Community & Civic Voice</span>
              </div>
            </div>

            <div 
              className={"role-option-card university " + (selectedRole === 'university' ? 'active' : '')}
              onClick={() => setSelectedRole('university')}
            >
              <div className="role-card-icon-circle"><Icon.GraduationCap /></div>
              <div className="role-card-text">
                <strong>University</strong>
                <span>Research, Faculty & Students</span>
              </div>
            </div>

            <div 
              className={"role-option-card industry " + (selectedRole === 'industry' ? 'active' : '')}
              onClick={() => setSelectedRole('industry')}
            >
              <div className="role-card-icon-circle"><Icon.Building /></div>
              <div className="role-card-text">
                <strong>Industry</strong>
                <span>Enterprises & Challenges</span>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="auth-error-banner">
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="auth-info-banner">
            <Icon.Check />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="auth-form-fields">
          {authMode === 'signup' && (
            <div>
              <div className="form-group">
                <label className="input-field-label">Full Name / Representative Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-input"
                />
              </div>

              {selectedRole === 'university' && (
                <div>
                  <div className="form-group">
                    <label className="input-field-label">University / Institute Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. National Institute of Technology"
                      value={organizationOrInst}
                      onChange={(e) => setOrganizationOrInst(e.target.value)}
                      className="text-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-field-label">Academic Affiliation</label>
                    <select 
                      value={affiliationType} 
                      onChange={(e) => setAffiliationType(e.target.value)}
                      className="text-select"
                    >
                      <option value="Student">Undergraduate / Graduate Student</option>
                      <option value="Faculty">Professor / Faculty Lead</option>
                      <option value="Researcher">Postdoc / Research Fellow</option>
                      <option value="Lab">Research Lab Coordinator</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedRole === 'industry' && (
                <div>
                  <div className="form-group">
                    <label className="input-field-label">Company / Organization Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Apex CleanTech Systems"
                      value={organizationOrInst}
                      onChange={(e) => setOrganizationOrInst(e.target.value)}
                      className="text-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-field-label">Industry Domain / Sector</label>
                    <select 
                      value={affiliationType} 
                      onChange={(e) => setAffiliationType(e.target.value)}
                      className="text-select"
                    >
                      <option value="CleanTech & Energy">CleanTech & Energy</option>
                      <option value="Smart Mobility & EV">Smart Mobility & EV</option>
                      <option value="Healthcare & BioTech">Healthcare & BioTech</option>
                      <option value="Infrastructure">Infrastructure & Smart Cities</option>
                      <option value="DeepTech & AI">DeepTech & AI</option>
                    </select>
                  </div>
                </div>
              )}

              {selectedRole === 'citizen' && (
                <div className="form-group">
                  <label className="input-field-label">City or District</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Indiranagar, Bengaluru"
                    value={locationOrCity}
                    onChange={(e) => setLocationOrCity(e.target.value)}
                    className="text-input"
                  />
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="input-field-label">
              {selectedRole === 'university' ? 'Academic (.edu) Email' : selectedRole === 'industry' ? 'Corporate Email' : 'Email Address'}
            </label>
            <input 
              type="email" 
              required 
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-input"
            />
          </div>

          <div className="form-group">
            <label className="input-field-label">Password</label>
            <input 
              type="password" 
              required 
              placeholder="Your secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-input"
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span>Authenticating with Supabase...</span>
            ) : (
              <span>{authMode === 'signup' ? ('Sign Up as ' + selectedRole.toUpperCase()) : ('Log In to ' + selectedRole.toUpperCase() + ' Portal')}</span>
            )}
          </button>
        </form>

        <div className="demo-evaluator-section">
          <div className="demo-divider">
            <span>Instant Demo Access (No Email Verification Barrier)</span>
          </div>

          <div className="demo-shortcuts-grid">
            <button 
              type="button" 
              className="demo-shortcut-btn citizen"
              onClick={() => handleInstantDemoLogin('citizen')}
            >
              <span>Demo Citizen</span>
            </button>

            <button 
              type="button" 
              className="demo-shortcut-btn university"
              onClick={() => handleInstantDemoLogin('university')}
            >
              <span>Demo University</span>
            </button>

            <button 
              type="button" 
              className="demo-shortcut-btn industry"
              onClick={() => handleInstantDemoLogin('industry')}
            >
              <span>Demo Industry</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function CitizenDashboard({ currentUser, onPostProblem }) {
  const profile = currentUser.submissions ? currentUser : DEMO_PROFILES.citizen;
  const [activeTab, setActiveTab] = useState('my-issues');
  const [newTitle, setNewTitle] = useState('');
  const [newCat, setNewCat] = useState('Infrastructure');
  const [newDesc, setNewDesc] = useState('');
  const [submittedList, setSubmittedList] = useState(profile.submissions || []);
  const [toast, setToast] = useState('');

  const handleCreateIssue = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newSub = {
      id: 'cit-' + Date.now(),
      title: newTitle,
      category: newCat,
      status: 'Submitted · Awaiting University Review',
      date: 'Just now',
      upvotes: 1,
      responses: 0
    };

    setSubmittedList([newSub, ...submittedList]);
    setNewTitle('');
    setNewDesc('');
    setToast('Your civic issue has been logged and broadcast to local universities and government departments!');
    setTimeout(() => setToast(''), 4500);
  };

  return (
    <div className="role-dashboard-view citizen-view">
      <div className="dashboard-role-banner citizen-theme">
        <div className="banner-left-info">
          <div className="banner-role-badge">
            <Icon.Users />
            <span>Citizen Portal</span>
          </div>
          <h1 className="banner-title">Welcome back, {currentUser.name || 'Citizen Member'}</h1>
          <p className="banner-subtitle">
            Voice local challenges, track municipal action, and collaborate with universities to solve neighbourhood problems.
          </p>
          <div className="user-meta-chips">
            <span className="meta-chip">{currentUser.location || 'Indiranagar, Bengaluru'}</span>
            <span className="meta-chip">Civic Community Score: 480 pts</span>
          </div>
        </div>

        <button className="banner-primary-action-btn" onClick={onPostProblem}>
          <Icon.Plus />
          <span>Report Public Issue</span>
        </button>
      </div>

      {toast && (
        <div className="success-banner">
          <Icon.Check />
          <span>{toast}</span>
        </div>
      )}

      <div className="dashboard-subnav-tabs">
        <button 
          className={"subnav-tab-btn " + (activeTab === 'my-issues' ? 'active' : '')}
          onClick={() => setActiveTab('my-issues')}
        >
          My Tracked Submissions ({submittedList.length})
        </button>
        <button 
          className={"subnav-tab-btn " + (activeTab === 'submit-issue' ? 'active' : '')}
          onClick={() => setActiveTab('submit-issue')}
        >
          Submit New Issue / Idea
        </button>
      </div>

      {activeTab === 'my-issues' && (
        <div className="dashboard-content-grid">
          <div className="content-main-panel">
            <h3 className="section-title">Your Issues & Idea Tracker</h3>
            <div className="submission-cards-list">
              {submittedList.map((item) => (
                <div key={item.id} className="submission-status-card">
                  <div className="sub-card-top">
                    <span className="sub-category-tag">{item.category}</span>
                    <span className={"status-pill " + (item.status.toLowerCase().includes('sponsored') ? 'sponsored' : 'review')}>
                      {item.status}
                    </span>
                  </div>
                  <h4 className="sub-card-title">{item.title}</h4>
                  <div className="sub-card-meta">
                    <span>Logged {item.date}</span>
                    <span>·</span>
                    <span>{item.upvotes} endorsements</span>
                    <span>·</span>
                    <span>{item.responses} inquiries</span>
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

      {activeTab === 'submit-issue' && (
        <div className="dashboard-form-container">
          <h3 className="section-title">Submit a Problem or Civic Idea</h3>
          <p className="section-desc">
            Your problem statement will be made available to participating universities, engineering labs, and civic authorities.
          </p>

          <form onSubmit={handleCreateIssue} className="role-action-form">
            <div className="form-group">
              <label className="input-field-label">Issue Title / What needs solving?</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Inadequate pedestrian crossings near Metro Station 4"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="input-field-label">Category</label>
              <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className="text-select">
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
                placeholder="Describe the severity, frequency, affected population..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="text-textarea"
              />
            </div>

            <button type="submit" className="form-submit-btn">
              <Icon.Send />
              <span>Broadcast to Universities & Municipal Bodies</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function UniversityDashboard({ currentUser, problems = [] }) {
  const profile = currentUser.proposalsSubmitted ? currentUser : DEMO_PROFILES.university;
  const [activeTab, setActiveTab] = useState('grants');
  const [toast, setToast] = useState('');

  return (
    <div className="role-dashboard-view university-view">
      <div className="dashboard-role-banner university-theme">
        <div className="banner-left-info">
          <div className="banner-role-badge">
            <Icon.GraduationCap />
            <span>University Portal</span>
          </div>
          <h1 className="banner-title">{profile.institution || currentUser.organization || 'University Faculty & Lab'}</h1>
          <p className="banner-subtitle">
            Connect students and researchers to funded industry requirements, bid on public RFPs, and showcase research breakthroughs.
          </p>
          <div className="user-meta-chips">
            <span className="meta-chip">{profile.department || 'Applied Engineering'}</span>
            <span className="meta-chip">{profile.activeTeams || 4} Active Student Teams</span>
            <span className="meta-chip">28 Student Researchers</span>
          </div>
        </div>
      </div>

      {toast && (
        <div className="success-banner">
          <Icon.Check />
          <span>{toast}</span>
        </div>
      )}

      <div className="dashboard-subnav-tabs">
        <button 
          className={"subnav-tab-btn " + (activeTab === 'grants' ? 'active' : '')}
          onClick={() => setActiveTab('grants')}
        >
          Open Industry & Govt Grants ({problems.length})
        </button>
        <button 
          className={"subnav-tab-btn " + (activeTab === 'my-proposals' ? 'active' : '')}
          onClick={() => setActiveTab('my-proposals')}
        >
          Our Submitted Proposals ({profile.proposalsSubmitted?.length || 2})
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
                    <span className="grant-bounty-badge">{p.bountyOrGrant || '$25,000 Grant'}</span>
                  </div>
                  <h4 className="grant-title">{p.title}</h4>
                  <p className="grant-desc">{p.summary}</p>
                  <div className="grant-meta-row">
                    <span>Sponsor: <strong>{p.orgName}</strong></span>
                    <span>Deadline: <strong>{p.daysLeft} days left</strong></span>
                    <button 
                      className="bid-proposal-btn"
                      onClick={() => {
                        setToast("Team proposal draft created for: " + p.title);
                        setTimeout(() => setToast(''), 4500);
                      }}
                    >
                      <Icon.Plus />
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
                      <span className="label">Sponsoring Agency: </span>
                      <span className="val">{prop.sponsor}</span>
                    </div>
                    <div>
                      <span className="label">Grant Value: </span>
                      <span className="val highlight">{prop.grantAmount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IndustryDashboard({ currentUser, onPostProblem }) {
  const profile = currentUser.postedChallenges ? currentUser : DEMO_PROFILES.industry;
  const [activeTab, setActiveTab] = useState('my-challenges');
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('$50,000');
  const [sector, setSector] = useState('CleanTech & Energy');
  const [desc, setDesc] = useState('');
  const [toast, setToast] = useState('');
  const [challenges, setChallenges] = useState(profile.postedChallenges || []);

  const handlePostChallenge = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newCh = {
      id: 'ind-' + Date.now(),
      code: 'FL-' + Math.floor(1000 + Math.random() * 9000),
      title: title,
      category: sector,
      applicantsCount: 0,
      budget: budget,
      status: 'Open for University Bids',
      deadline: '45 days left'
    };

    setChallenges([newCh, ...challenges]);
    setTitle('');
    setDesc('');
    setToast('New industry challenge published! Sent to 327 verified university departments.');
    setTimeout(() => setToast(''), 5000);
  };

  return (
    <div className="role-dashboard-view industry-view">
      <div className="dashboard-role-banner industry-theme">
        <div className="banner-left-info">
          <div className="banner-role-badge">
            <Icon.Building />
            <span>Industry Portal</span>
          </div>
          <h1 className="banner-title">{profile.company || currentUser.organization || 'Enterprise Innovation Office'}</h1>
          <p className="banner-subtitle">
            Crowdsource innovative ideas, post corporate technical challenges, sponsor academic R&D, and identify top university talent.
          </p>
          <div className="user-meta-chips">
            <span className="meta-chip">{profile.sector || 'CleanTech & Energy'}</span>
            <span className="meta-chip">Active Budget: {profile.budgetAllocated || '$140,000'}</span>
          </div>
        </div>

        <button className="banner-primary-action-btn" onClick={() => setActiveTab('post-challenge')}>
          <Icon.Plus />
          <span>Post Challenge</span>
        </button>
      </div>

      {toast && (
        <div className="success-banner">
          <Icon.Check />
          <span>{toast}</span>
        </div>
      )}

      <div className="dashboard-subnav-tabs">
        <button 
          className={"subnav-tab-btn " + (activeTab === 'my-challenges' ? 'active' : '')}
          onClick={() => setActiveTab('my-challenges')}
        >
          Active Corporate Challenges ({challenges.length})
        </button>
        <button 
          className={"subnav-tab-btn " + (activeTab === 'post-challenge' ? 'active' : '')}
          onClick={() => setActiveTab('post-challenge')}
        >
          Create Challenge & Grant
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="input-field-label">Industry Domain</label>
                <select value={sector} onChange={(e) => setSector(e.target.value)} className="text-select">
                  <option value="CleanTech & Energy">CleanTech & Energy</option>
                  <option value="Smart Mobility & EV">Smart Mobility & EV</option>
                  <option value="Healthcare & Diagnostics">Healthcare & Diagnostics</option>
                  <option value="Urban Infrastructure">Urban Infrastructure</option>
                </select>
              </div>

              <div className="form-group">
                <label className="input-field-label">Grant / Pilot Budget</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. $40,000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="text-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-field-label">Technical Deliverables & Requirements</label>
              <textarea 
                rows="4" 
                placeholder="Specify the technical constraints, sample datasets provided, proof-of-concept requirements..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="text-textarea"
              />
            </div>

            <button type="submit" className="form-submit-btn">
              <Icon.Send />
              <span>Publish Challenge to University Network</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
function PostProblemModal({ isOpen, onClose, onAddProblem, currentUser }) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Infrastructure');
  const [summary, setSummary] = useState('');
  const [orgName, setOrgName] = useState(currentUser?.organization || currentUser?.name || 'Department of Public Works');
  const [orgType, setOrgType] = useState(currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Government');
  const [grant, setGrant] = useState('$20,000 Pilot Grant');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    const newProblem = {
      id: 'prob-' + Date.now(),
      code: 'FL-' + Math.floor(1000 + Math.random() * 9000),
      title: title.trim(),
      orgName: orgName.trim(),
      orgType: orgType,
      orgInitials: orgName.trim().slice(0, 2).toUpperCase(),
      postedTime: 'Just now',
      status: 'OPEN',
      category: category,
      upvotes: 1,
      hasUpvoted: true,
      summary: summary.trim(),
      tags: [category, 'Open Challenge'],
      contributorsCount: 1,
      universityTeamsCount: 0,
      daysLeft: 30,
      bountyOrGrant: grant.trim(),
      sponsoringBody: orgName.trim(),
      proposals: []
    };

    onAddProblem(newProblem);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card post-problem-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <Icon.X />
        </button>

        <div className="post-modal-header">
          <h2 className="post-headline">Post a Real-World Problem</h2>
          <p className="post-subtext">
            Publish an infrastructure, social, or industrial challenge to mobilize university research teams and citizen collaborators.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="post-problem-form">
          <div className="form-group">
            <label className="input-field-label">Problem Statement / Title</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. How can urban heat islands be mapped with low-cost vehicular sensors?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-input"
            />
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="input-field-label">Domain Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-select">
                <option value="Infrastructure">Infrastructure</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Climate">Climate</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Energy">Energy</option>
                <option value="Technology">Technology</option>
              </select>
            </div>

            <div className="form-group">
              <label className="input-field-label">Sponsoring Grant / Reward</label>
              <input 
                type="text" 
                placeholder="e.g. $30,000 Pilot Implementation"
                value={grant}
                onChange={(e) => setGrant(e.target.value)}
                className="text-input"
              />
            </div>
          </div>

          <div className="form-row-2col">
            <div className="form-group">
              <label className="input-field-label">Publishing Organization</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Smart City Mission"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="text-input"
              />
            </div>

            <div className="form-group">
              <label className="input-field-label">Organization Sector</label>
              <select value={orgType} onChange={(e) => setOrgType(e.target.value)} className="text-select">
                <option value="Government">Government / Public Agency</option>
                <option value="Industry">Industry / Corporate Enterprise</option>
                <option value="University">University / Academic Institute</option>
                <option value="Citizen Group">Citizen Group / NGO</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="input-field-label">Short Summary</label>
            <textarea 
              rows="3" 
              required 
              placeholder="Concise overview of the challenge and target outcome..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="text-textarea"
            />
          </div>

          <button type="submit" className="form-submit-btn">
            <Icon.Plus />
            <span>Publish Problem to First Look Platform</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function ProblemDetailModal({ problem, isOpen, onClose, currentUser, onAddProposal }) {
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
          <Icon.X />
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
              <span className="stat-label">Endorsements</span>
            </div>
            <div className="meta-stat">
              <span className="stat-value">{problem.contributorsCount}</span>
              <span className="stat-label">Contributors</span>
            </div>
            <div className="meta-stat">
              <span className="stat-value">{problem.universityTeamsCount}</span>
              <span className="stat-label">University Teams</span>
            </div>
            <div className="meta-stat">
              <span className="stat-value">{problem.daysLeft} days</span>
              <span className="stat-label">Remaining</span>
            </div>
          </div>

          <div className="detail-section">
            <h4 className="detail-section-heading">Executive Summary</h4>
            <p className="detail-paragraph">{problem.summary}</p>
          </div>

          <div className="detail-section">
            <h4 className="detail-section-heading">Detailed Scope</h4>
            <p className="detail-paragraph">{problem.detailedDescription || problem.summary}</p>
          </div>

          <div className="detail-section proposals-section">
            <div className="proposals-header">
              <h4 className="detail-section-heading">Team Proposals & Solutions ({problem.proposals?.length || 0})</h4>
            </div>

            {problem.proposals && problem.proposals.length > 0 ? (
              <div className="proposals-cards-list">
                {problem.proposals.map((prop) => (
                  <div key={prop.id} className="proposal-card">
                    <div className="proposal-card-top">
                      <div className="team-badge">
                        <span>{prop.team}</span>
                      </div>
                      <span className="prop-author">by {prop.author} ({prop.role})</span>
                      <span className="prop-votes">{prop.votes} votes</span>
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
                <Icon.Check />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitProposal} className="proposal-submit-form">
              <h5 className="form-subheading">Submit Your Solution / Proposal</h5>
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
                <Icon.Send />
                <span>Submit Solution to Problem</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const [activeTab, setActiveTab] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('Infrastructure');
  const [searchQuery, setSearchQuery] = useState('');

  const [problems, setProblems] = useState(INITIAL_PROBLEMS);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);

  useEffect(() => {
    if (supabaseClient) {
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const meta = session.user.user_metadata || {};
          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            name: meta.first_name || session.user.email.split('@')[0],
            role: meta.role || 'citizen',
            organization: meta.organization || ''
          });
        }
      }).catch(err => console.log('Supabase session:', err));
    }
  }, []);

  const handleSelectRoleDemo = (roleKey) => {
    const profile = DEMO_PROFILES[roleKey];
    setCurrentUser(profile);
    setActiveTab('dashboard');
  };

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = (userObj) => {
    setCurrentUser(userObj);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (supabaseClient) {
      supabaseClient.auth.signOut().catch(() => {});
    }
    setCurrentUser(null);
    setActiveTab('home');
  };

  const handleVote = (problemId, delta) => {
    setProblems(prev => prev.map(prob => {
      if (prob.id === problemId) {
        const alreadyUpvoted = prob.hasUpvoted;
        let newVoteCount = prob.upvotes;
        let newStatus = false;

        if (delta > 0) {
          if (alreadyUpvoted) {
            newVoteCount -= 1;
            newStatus = false;
          } else {
            newVoteCount += 1;
            newStatus = true;
          }
        } else {
          if (alreadyUpvoted) {
            newVoteCount -= 2;
            newStatus = false;
          } else {
            newVoteCount = Math.max(0, newVoteCount - 1);
            newStatus = false;
          }
        }

        return { ...prob, upvotes: newVoteCount, hasUpvoted: newStatus };
      }
      return prob;
    }));
  };

  const handleAddProblem = (newProblem) => {
    setProblems([newProblem, ...problems]);
    setSelectedProblem(newProblem);
  };

  const handleAddProposal = (problemId, proposal) => {
    setProblems(prev => prev.map(p => {
      if (p.id === problemId) {
        const updated = {
          ...p,
          proposals: [proposal, ...(p.proposals || [])],
          contributorsCount: p.contributorsCount + 1,
          universityTeamsCount: proposal.role === 'University' ? p.universityTeamsCount + 1 : p.universityTeamsCount
        };
        setSelectedProblem(updated);
        return updated;
      }
      return p;
    }));
  };

  const filteredProblems = problems.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      p.title.toLowerCase().includes(query) ||
      p.summary.toLowerCase().includes(query) ||
      p.orgName.toLowerCase().includes(query) ||
      p.tags.some(t => t.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="app-layout">
      <Navbar 
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onOpenPostProblem={() => setPostModalOpen(true)}
        onLogout={handleLogout}
        onSelectRoleDemo={handleSelectRoleDemo}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="platform-body-container">
        <LeftSidebar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <main className="center-viewport">
          {activeTab === 'dashboard' && currentUser ? (
            <div className="dashboard-wrapper">
              {currentUser.role === 'citizen' && (
                <CitizenDashboard 
                  currentUser={currentUser} 
                  onPostProblem={() => setPostModalOpen(true)}
                />
              )}
              {currentUser.role === 'university' && (
                <UniversityDashboard 
                  currentUser={currentUser} 
                  problems={problems}
                />
              )}
              {currentUser.role === 'industry' && (
                <IndustryDashboard 
                  currentUser={currentUser} 
                  onPostProblem={() => setPostModalOpen(true)}
                />
              )}
            </div>
          ) : (
            <div className="feed-view-container">
              <LandingHero 
                onExploreClick={() => {
                  const feedEl = document.getElementById('problem-feed-section');
                  feedEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                onPostProblemClick={() => {
                  if (!currentUser) handleOpenAuth('signup');
                  else setPostModalOpen(true);
                }}
                onSelectRoleDemo={handleSelectRoleDemo}
              />

              <section id="problem-feed-section" className="feed-header-section">
                <div className="category-tabs-bar">
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat}
                      className={"cat-pill-btn " + (selectedCategory === cat ? 'active' : '')}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="feed-results-counter">
                  <span>Showing <strong>{filteredProblems.length}</strong> active problems looking for collective solutions</span>
                </div>
              </section>

              <div className="problems-stream">
                {filteredProblems.length > 0 ? (
                  filteredProblems.map(prob => (
                    <ProblemCard 
                      key={prob.id}
                      problem={prob}
                      onVote={handleVote}
                      onSelectProblem={(p) => setSelectedProblem(p)}
                    />
                  ))
                ) : (
                  <div className="empty-feed-card">
                    <h3>No problems found in this category</h3>
                    <p>Be the first citizen, university team, or enterprise to post a challenge.</p>
                    <button 
                      className="hero-btn-primary" 
                      onClick={() => setPostModalOpen(true)}
                    >
                      Post New Problem
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <RightSidebar 
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setActiveTab('home');
          }}
          onSelectRoleDemo={handleSelectRoleDemo}
        />
      </div>

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />

      <PostProblemModal 
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onAddProblem={handleAddProblem}
        currentUser={currentUser}
      />

      <ProblemDetailModal 
        problem={selectedProblem}
        isOpen={Boolean(selectedProblem)}
        onClose={() => setSelectedProblem(null)}
        currentUser={currentUser}
        onAddProposal={handleAddProposal}
      />
    </div>
  );
}

// Mount React Component to DOM Root
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
