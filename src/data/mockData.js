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

// Exactly 2 sample questions using Lorem Ipsum text
export const INITIAL_POSTS = [
  {
    id: 101,
    created_at: "2026-09-04T07:30:00Z",
    title: "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
    desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    img: "",
    category: "Infrastructure",
    score: 12,
    comments: [], // Backend schema field; NOT exposed as comments in user UI
    liked_by: ["citizen-account-2"], // Enforces 1 like per account
    solutions: [
      {
        id: "sol-1",
        post_id: 101,
        title: "Duis aute irure dolor in reprehenderit in voluptate",
        desc: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
        proposed_approach: "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit.",
        author_role: "university",
        author_name: "University Account 1",
        created_at: "2026-09-04T08:15:00Z"
      }
    ]
  },
  {
    id: 102,
    created_at: "2026-09-04T06:45:00Z",
    title: "Vestibulum ante ipsum primis in faucibus orci luctus",
    desc: "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Mauris viverra veniam commodo, convallis magna sed, tincidunt libero. Suspendisse potenti.",
    img: "",
    category: "Tech",
    score: 8,
    comments: [],
    liked_by: [],
    solutions: [
      {
        id: "sol-2",
        post_id: 102,
        title: "Vivamus suscipit tortor eget felis porttitor volutpat",
        desc: "Donec sollicitudin molestie malesuada. Vestibulum ac diam sit amet quam vehicula elementum sed sit amet dui.",
        proposed_approach: "Pellentesque in ipsum id orci porta dapibus. Curabitur aliquet quam id dui posuere blandit.",
        author_role: "industry",
        author_name: "Industry Account 1",
        created_at: "2026-09-04T07:50:00Z"
      }
    ]
  }
];

// Generic accounts only - no real names
export const DEMO_ACCOUNTS = {
  citizen: {
    id: "citizen-account-1",
    name: "Citizen Account 1",
    email: "citizen1@demo.org",
    role: "citizen",
    roleBadge: "CITZ",
    initials: "C1"
  },
  citizen2: {
    id: "citizen-account-2",
    name: "Citizen Account 2",
    email: "citizen2@demo.org",
    role: "citizen",
    roleBadge: "CITZ",
    initials: "C2"
  },
  university: {
    id: "university-account-1",
    name: "University Account 1",
    email: "university1@demo.org",
    role: "university",
    roleBadge: "UNI",
    initials: "U1"
  },
  industry: {
    id: "industry-account-1",
    name: "Industry Account 1",
    email: "industry1@demo.org",
    role: "industry",
    roleBadge: "INDS",
    initials: "I1"
  }
};
