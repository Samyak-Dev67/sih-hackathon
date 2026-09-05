// Schema:
// posts
// - id: int8
// - created_at: timestamptz
// - title: varchar
// - desc: varchar
// - img: varchar
// - category: varchar
// - score: numeric
// - comments: json
// - solutions: json

export const CATEGORIES = [
  "All",
  "Infrastructure",
  "Health",
  "Environment",
  "Education",
  "Safety",
  "Tech"
];

// Realistic Indian civic problems & sample posts
export const INITIAL_POSTS = [
  {
    id: 101,
    created_at: "2026-09-04T07:30:00Z",
    title: "Monsoon Waterlogging and Drain Backflow near Old Station Road",
    desc: "Every monsoon, the arterial stretch between Old Station Road and the Vegetable Market gets submerged in 2 to 3 feet of stagnant water. Silt accumulation in the municipal storm drain causes blackwater backflow into residential basements, halting morning commuter buses and auto-rickshaws.",
    img: "",
    category: "Infrastructure",
    score: 18,
    comments: [],
    liked_by: ["citizen-account-2"],
    solutions: [
      {
        id: "sol-1",
        post_id: 101,
        title: "Micro-Catchment Desilting & Permeable Infiltration Paver Design",
        desc: "IIT / Civil Engineering Dept proposed a modular rainwater percolation pit system combined with geo-textile desilting grates.",
        proposed_approach: "Implement 4 staggered groundwater recharge borewells along the natural slope gradient and replace concrete sidewalks with interlocking porous pavers to absorb 65% of peak stormwater runoff.",
        author_role: "university",
        author_name: "Indian Institute of Technology (Urban Dept)",
        created_at: "2026-09-04T08:15:00Z"
      }
    ]
  },
  {
    id: 102,
    created_at: "2026-09-04T06:45:00Z",
    title: "Frequent 11kV Distribution Transformer Trips in Sector 14",
    desc: "Overheating and unbalanced phase loading during peak evening summer hours (6 PM - 10 PM) causes frequent tripping of the local distribution transformer. Over 300 families face voltage drops down to 160V, causing cooling appliances and water booster pumps to malfunction.",
    img: "",
    category: "Tech",
    score: 14,
    comments: [],
    liked_by: [],
    solutions: [
      {
        id: "sol-2",
        post_id: 102,
        title: "IoT Load-Balancing & Automatic Dynamic Phase Switchers",
        desc: "L&T Smart Power & Energy Systems proposed retrofitting pole-mounted smart phase selectors with real-time SCADA telemetry.",
        proposed_approach: "Install three-phase microprocessor load monitors that auto-redistribute single-phase residential loads across less saturated feeder lines when phase draw exceeds 85% rated capacity.",
        author_role: "industry",
        author_name: "L&T Electrical & Power Solutions",
        created_at: "2026-09-04T07:50:00Z"
      }
    ]
  },
  {
    id: 103,
    created_at: "2026-09-03T11:20:00Z",
    title: "Heavy Metal & TDS Spikes in Domestic Tubewell Water Supply",
    desc: "Residents in the peri-urban industrial fringe report tap water turning yellowish with strong chemical odor. Water testing in three society tubewells indicates TDS exceeding 1800 ppm and elevated nitrates from untreated agricultural and industrial seepage.",
    img: "",
    category: "Health",
    score: 22,
    comments: [],
    liked_by: [],
    solutions: [
      {
        id: "sol-3",
        post_id: 103,
        title: "Low-Cost Activated Bio-Carbon Multi-Stage Filtration Unit",
        desc: "National Chemical Laboratory (CSIR) formulation for low-energy community purification.",
        proposed_approach: "Deploy decentralized gravity-fed biochar filtration columns followed by UV disinfection tanks at community boreheads, achieving 92% removal of dissolved pollutants without wasting reject brine like domestic RO systems.",
        author_role: "university",
        author_name: "CSIR National Chemical Laboratory",
        created_at: "2026-09-03T14:30:00Z"
      }
    ]
  }
];
