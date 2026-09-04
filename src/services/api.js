import { INITIAL_POSTS } from '../data/mockData';

/**
 * ==============================================================================
 * DATABASE SCHEMA REFERENCE: `posts`
 * ==============================================================================
 * - id: int8 (Primary Key)
 * - created_at: timestamptz (Timestamp with time zone)
 * - title: varchar (Problem title)
 * - desc: varchar (Problem description)
 * - img: varchar (URL / Path to problem image)
 * - category: varchar (Domain category, e.g. Infrastructure, Health, Tech)
 * - score: numeric (Cumulative vote score / likes)
 * - comments: json (Reserved JSON field for discussions)
 * - solutions: json (Array of submitted solutions by universities & industries)
 * ==============================================================================
 */

// ==============================================================================
// BACKEND API BASE URL PLACEHOLDER
// Configure VITE_BACKEND_URL in your .env file, or replace this string placeholder.
// The frontend developer does NOT invent real endpoints. This is a clean placeholder
// structured for the backend developer to easily plug in their API server.
// ==============================================================================
export const BACKEND_API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
// Examples:
// 'http://localhost:5000/api'
// 'https://api.yourdomain.com/v1'

/**
 * API ENDPOINT ROUTES
 * Centralized mapping of all backend endpoints for the `posts` table and solutions.
 * The backend developer can modify route patterns here without touching UI components.
 */
export const API_ENDPOINTS = {
  fetchProblems: '/posts',
  createProblem: '/posts',
  likeProblem: (id) => `/posts/${id}/like`,
  submitSolution: (id) => `/posts/${id}/solutions`,
  fetchSolutions: (id) => `/posts/${id}/solutions`,
};

// Local storage key for fallback simulation (keeps the 2 Lorem Ipsum questions alive)
const STORAGE_KEY = 'first_look_posts_db';

function getLocalDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_POSTS));
      return INITIAL_POSTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_POSTS;
  }
}

function saveLocalDB(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to local store:', e);
  }
}

/**
 * Standardized HTTP request wrapper for backend JSON communication.
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${BACKEND_API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  // Attach active session token if present
  try {
    const saved = localStorage.getItem('fl_active_account');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.token) {
        headers['Authorization'] = `Bearer ${parsed.token}`;
      }
    }
  } catch (e) {}

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `API Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * 1. Fetch All Problems
 * Fetches the problem feed from the backend, with fallback to the 2 Lorem Ipsum demo questions.
 */
export async function getProblems() {
  if (BACKEND_API_BASE_URL) {
    try {
      const data = await apiRequest(API_ENDPOINTS.fetchProblems, { method: 'GET' });
      return data;
    } catch (err) {
      console.warn('Backend unavailable, falling back to local demo posts:', err.message);
      return getLocalDB();
    }
  }
  return getLocalDB();
}

/**
 * 2. Create a Problem
 * Sends JSON payload matching backend requirements:
 * {
 *   "title": "...",
 *   "desc": "...",
 *   "img": "...",
 *   "category": "..."
 * }
 */
export async function createProblem({ title, desc, img = '', category = 'Infrastructure' }) {
  const payload = {
    title: title.trim(),
    desc: desc.trim(),
    img: img ? img.trim() : '',
    category: category.trim() || 'Infrastructure'
  };

  if (BACKEND_API_BASE_URL) {
    try {
      const created = await apiRequest(API_ENDPOINTS.createProblem, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return created;
    } catch (err) {
      console.warn('Backend unavailable, saving problem locally:', err.message);
    }
  }

  // Fallback simulation matching schema:
  // id: int8, created_at: timestamptz, score: numeric, comments: json, solutions: json
  const posts = getLocalDB();
  const newPost = {
    id: Date.now(),
    created_at: new Date().toISOString(),
    title: payload.title,
    desc: payload.desc,
    img: payload.img,
    category: payload.category,
    score: 0,
    comments: [],
    liked_by: [],
    solutions: []
  };

  const updated = [newPost, ...posts];
  saveLocalDB(updated);
  return newPost;
}

/**
 * 3. Like a Problem
 * Uses the existing `score` numeric field for likes.
 * One authenticated account must only be able to like a particular problem once.
 * The frontend prevents repeated likes (toggles on/off), while the backend enforces it.
 */
export async function likeProblem(postId, accountId = 'default-account') {
  const payload = {
    account_id: accountId
  };

  if (BACKEND_API_BASE_URL) {
    try {
      const updatedPost = await apiRequest(API_ENDPOINTS.likeProblem(postId), {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return updatedPost;
    } catch (err) {
      console.warn('Backend unavailable, updating likes locally:', err.message);
    }
  }

  // Fallback local simulation enforcing 1 like per account
  const posts = getLocalDB();
  let updatedPost = null;

  const nextPosts = posts.map(p => {
    if (p.id === postId) {
      const likedBy = Array.isArray(p.liked_by) ? p.liked_by : [];
      const hasLiked = likedBy.includes(accountId);
      let newScore = Number(p.score) || 0;
      let nextLikedBy;

      if (hasLiked) {
        // Toggle off (unlike)
        newScore = Math.max(0, newScore - 1);
        nextLikedBy = likedBy.filter(id => id !== accountId);
      } else {
        // Add single like
        newScore += 1;
        nextLikedBy = [...likedBy, accountId];
      }

      updatedPost = {
        ...p,
        score: newScore,
        liked_by: nextLikedBy
      };
      return updatedPost;
    }
    return p;
  });

  saveLocalDB(nextPosts);
  return updatedPost;
}

/**
 * 4. Submit a Solution
 * Sends the relevant problem ID and solution information as JSON.
 */
export async function submitSolution(postId, { title, desc, proposed_approach, author_name, author_role }) {
  const solutionPayload = {
    problem_id: postId,
    id: `sol-${Date.now()}`,
    title: title.trim(),
    desc: desc.trim(),
    proposed_approach: (proposed_approach || desc).trim(),
    author_name: author_name || 'Academic / Enterprise Account',
    author_role: author_role || 'university',
    created_at: new Date().toISOString()
  };

  if (BACKEND_API_BASE_URL) {
    try {
      const result = await apiRequest(API_ENDPOINTS.submitSolution(postId), {
        method: 'POST',
        body: JSON.stringify(solutionPayload)
      });
      return result;
    } catch (err) {
      console.warn('Backend unavailable, saving solution locally:', err.message);
    }
  }

  // Fallback local simulation appending to the problem's solutions json field
  const posts = getLocalDB();
  let updatedPost = null;

  const nextPosts = posts.map(p => {
    if (p.id === postId) {
      const solutions = Array.isArray(p.solutions) ? p.solutions : [];
      updatedPost = {
        ...p,
        solutions: [solutionPayload, ...solutions]
      };
      return updatedPost;
    }
    return p;
  });

  saveLocalDB(nextPosts);
  return updatedPost;
}

/**
 * 5. Fetch Solutions for a Problem
 * Retrieves solutions for a specific problem ID.
 */
export async function getSolutions(postId) {
  if (BACKEND_API_BASE_URL) {
    try {
      const solutions = await apiRequest(API_ENDPOINTS.fetchSolutions(postId), {
        method: 'GET'
      });
      return solutions;
    } catch (err) {
      console.warn('Backend unavailable, fetching solutions from local store:', err.message);
    }
  }

  const posts = getLocalDB();
  const found = posts.find(p => p.id === postId);
  return found?.solutions || [];
}

/**
 * Combined API Service Object
 * Exposes all required functions with backwards-compatible aliases (getPosts, createPost, likePost)
 */
export const postService = {
  getProblems,
  getPosts: getProblems,
  createProblem,
  createPost: createProblem,
  likeProblem,
  likePost: likeProblem,
  submitSolution,
  getSolutions
};

export const api = postService;
export default postService;
