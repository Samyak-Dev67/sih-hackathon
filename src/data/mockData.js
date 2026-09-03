export const INITIAL_PROBLEMS = [
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
    bountyOrGrant: ",000 Pilot Grant",
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
    bountyOrGrant: ",000 Implementation Award",
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
    bountyOrGrant: ",000 Corporate R&D Contract",
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
    bountyOrGrant: ",000 Pilot Deployment",
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
    bountyOrGrant: ",000 Grant",
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
    summary: "Commercial multispectral UAV cameras exceed smallholder budgets. We challenge university robotics clubs to construct sub- modified CMOS cameras for nitrogen deficiency diagnostics.",
    detailedDescription: "Smallholder farmers cultivating under 3 hectares cannot afford industrial precision satellite or drone imagery services. A collaborative consortium of fertilizer suppliers, farmer groups, and aeronautical institutes is seeking open-source NDVI hardware.",
    tags: ["Agriculture", "Robotics", "Drones", "Open Hardware"],
    contributorsCount: 47,
    universityTeamsCount: 16,
    daysLeft: 41,
    bountyOrGrant: ",000 Prototyping Fund",
    sponsoringBody: "National Agricultural Research Foundation",
    proposals: []
  }
];

export const STATS = {
  openProblems: 1284,
  universityTeams: 327,
  organizations: 84,
  solutions: 46
};

export const CATEGORIES = [
  "All",
  "Infrastructure",
  "Healthcare",
  "Education",
  "Climate",
  "Agriculture",
  "Energy",
  "Technology"
];

export const DEMO_PROFILES = {
  citizen: {
    name: "Dr. Ananya Sharma",
    email: "ananya.citizen@demo.org",
    role: "citizen",
    roleLabel: "Citizen Innovator",
    badgeColor: "emerald",
    location: "Ward 12, Indiranagar",
    avatarInitials: "AS",
    interests: ["Urban Flooding", "Clean Air", "Public Transport", "Waste Segregation"],
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
    badgeColor: "blue",
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
        grantAmount: ",000",
        teamMembers: ["Kavya M. (PhD)", "Rohan S. (M.Tech)", "Aditya P. (B.Tech)"]
      },
      {
        id: "uni-prop-2",
        problemCode: "FL-0733",
        problemTitle: "Non-potable graywater recycling systems",
        sponsor: "Metropolitan Water Board",
        status: "Under Technical Review",
        grantAmount: ",000",
        teamMembers: ["Simran K. (PhD)", "Nikhil V. (Research Fellow)"]
      }
    ]
  },
  industry: {
    name: "Vikram Malhotra",
    email: "v.malhotra@nordic-cleantech.com",
    role: "industry",
    roleLabel: "Industry R&D Director",
    badgeColor: "indigo",
    company: "Nordic CleanTech Solutions & Energy Corp",
    sector: "Clean Energy & Industrial Decarbonization",
    avatarInitials: "VM",
    activeChallengesCount: 3,
    budgetAllocated: ",000",
    postedChallenges: [
      {
        id: "ind-ch-1",
        code: "FL-1120",
        title: "Decarbonizing industrial boiler steam cycles using biomass",
        category: "Energy",
        applicantsCount: 22,
        budget: ",000",
        status: "Accepting University Bids",
        deadline: "34 days left"
      },
      {
        id: "ind-ch-2",
        code: "FL-1455",
        title: "Micro-grid battery degradation telemetry using edge ML",
        category: "Technology",
        applicantsCount: 15,
        budget: ",000",
        status: "Reviewing Proposals",
        deadline: "12 days left"
      }
    ]
  }
};
