import { INITIAL_POSTS } from '../data/mockData';
import { supabase } from '../utils/supabase';

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
 * 1. Fetch All Posts (Supabase integration)
 * Fetch all posts ordered by creation date
 */
export async function getPosts() {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
      } else if (data && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.error('Supabase getPosts error:', err);
  }

  // Fallback to backend API or local demo questions
  if (BACKEND_API_BASE_URL) {
    try {
      const data = await apiRequest(API_ENDPOINTS.fetchProblems, { method: 'GET' });
      return data;
    } catch (err) {
      console.warn('Backend unavailable, falling back to local demo posts:', err.message);
    }
  }
  return getLocalDB();
}

/**
 * Fetch a single post by ID (Supabase integration)
 */
export async function getPostById(postId) {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) {
        console.error('Error fetching post:', error);
      } else if (data) {
        return data;
      }
    }
  } catch (err) {
    console.error('Supabase getPostById error:', err);
  }

  // Fallback to local DB
  const posts = getLocalDB();
  return posts.find(p => p.id === postId) || null;
}

export const getProblems = getPosts;

/**
 * 2. Create a Problem / Post
 * Sends JSON payload matching backend requirements:
 * {
 *   "title": "...",
 *   "desc": "...",
 *   "img": "...",
 *   "category": "..."
 * }
 */
export async function createPost(postData) {
  // Support both custom postData and default/sample payload
  const payload = postData ? {
    title: postData.title ? postData.title.trim() : 'How to optimize database queries',
    desc: postData.desc ? postData.desc.trim() : 'A complete guide on indexing and schema design.',
    img: postData.img ? postData.img.trim() : '',
    category: postData.category ? postData.category.trim() : 'Database',
    score: typeof postData.score === 'number' ? postData.score : 0,
    comments: postData.comments || [],
    solutions: postData.solutions || []
  } : {
    title: 'How to optimize database queries',
    desc: 'A complete guide on indexing and schema design.',
    img: 'https://example.com/image.png',
    category: 'Database',
    score: 4.8,
    comments: [
      { user: 'Alice', comment: 'Great post!', created_at: new Date() }
    ],
    solutions: [
      { solution_id: 1, text: 'Use composite indexes for filtering.' }
    ]
  };

  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('posts')
        .insert([payload])
        .select();

      if (error) {
        console.error('Error creating post in Supabase:', error);
      } else if (data && data.length > 0) {
        return data[0];
      }
    }
  } catch (err) {
    console.error('Supabase createPost error:', err);
  }

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
    score: payload.score || 0,
    comments: payload.comments || [],
    liked_by: [],
    downvoted_by: [],
    solutions: payload.solutions || []
  };

  const updated = [newPost, ...posts];
  saveLocalDB(updated);
  return newPost;
}

export const createProblem = createPost;

/**
 * Upload Image to Supabase Storage ('post-images') and Create Post
 */
export async function uploadImageAndCreatePost(file, postData = {}) {
  try {
    let imageUrl = postData.img || '';

    if (file && supabase) {
      // 1. Generate a unique filename to avoid overwriting existing files
      const fileExt = file.name ? file.name.split('.').pop() : 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // 2. Upload file to Supabase Storage bucket ('post-images')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      if (uploadError) {
        console.warn('Storage upload error (bucket might not exist or lacks public permissions):', uploadError.message);
      } else {
        // 3. Get the public URL of the uploaded image
        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          imageUrl = urlData.publicUrl;
        }
      }
    }

    // 4. Insert the new post record into the 'posts' table
    return await createPost({
      ...postData,
      img: imageUrl
    });
  } catch (error) {
    console.error('Error uploading image or creating post:', error.message);
    return await createPost(postData);
  }
}

/**
 * Add a Comment to a Post (Supabase integration)
 */
export async function addComment(postId, newComment) {
  try {
    if (supabase) {
      // 1. Fetch existing comments
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('comments')
        .eq('id', postId)
        .single();

      if (fetchError) {
        console.error('Error fetching existing comments:', fetchError);
      } else {
        const updatedComments = [...(post.comments || []), newComment];

        // 2. Update with the new array
        const { data, error } = await supabase
          .from('posts')
          .update({ comments: updatedComments })
          .eq('id', postId)
          .select();

        if (error) {
          console.error('Error updating comments in Supabase:', error);
        } else if (data && data.length > 0) {
          return data[0];
        }
      }
    }
  } catch (err) {
    console.error('Supabase addComment error:', err);
  }

  // Local fallback
  const posts = getLocalDB();
  let updatedPost = null;
  const nextPosts = posts.map(p => {
    if (p.id === postId) {
      const existing = Array.isArray(p.comments) ? p.comments : [];
      updatedPost = {
        ...p,
        comments: [...existing, newComment]
      };
      return updatedPost;
    }
    return p;
  });
  saveLocalDB(nextPosts);
  return updatedPost;
}

/**
 * 3. Like (Upvote) a Problem
 * Uses the existing `score` numeric field for likes.
 * One authenticated account can give 1 upvote.
 * If already upvoted, clicking upvote again removes the upvote.
 * If user had downvoted, clicking upvote removes downvote and adds upvote.
 */
export async function likeProblem(postId, accountId = 'default-account') {
  const payload = {
    account_id: accountId,
    vote_type: 'up'
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

  // Fallback local simulation enforcing 1 vote per account
  const posts = getLocalDB();
  let updatedPost = null;

  const nextPosts = posts.map(p => {
    if (p.id === postId) {
      const likedBy = Array.isArray(p.liked_by) ? p.liked_by : [];
      const downvotedBy = Array.isArray(p.downvoted_by) ? p.downvoted_by : [];
      const hasLiked = likedBy.includes(accountId);
      const hasDownvoted = downvotedBy.includes(accountId);
      let newScore = Number(p.score) || 0;
      let nextLikedBy = [...likedBy];
      let nextDownvotedBy = [...downvotedBy];

      if (hasLiked) {
        // Toggle off upvote
        newScore -= 1;
        nextLikedBy = nextLikedBy.filter(id => id !== accountId);
      } else {
        // Add upvote
        newScore += 1;
        nextLikedBy.push(accountId);
        if (hasDownvoted) {
          // Remove previous downvote (+1 to revert downvote)
          newScore += 1;
          nextDownvotedBy = nextDownvotedBy.filter(id => id !== accountId);
        }
      }

      updatedPost = {
        ...p,
        score: newScore,
        liked_by: nextLikedBy,
        downvoted_by: nextDownvotedBy
      };
      return updatedPost;
    }
    return p;
  });

  saveLocalDB(nextPosts);
  return updatedPost;
}

/**
 * 3b. Downvote a Problem
 * Decreases score by 1 if not yet downvoted.
 * If already downvoted, clicking downvote again removes downvote.
 * If user had upvoted, clicking downvote removes upvote and adds downvote.
 */
export async function downvoteProblem(postId, accountId = 'default-account') {
  const payload = {
    account_id: accountId,
    vote_type: 'down'
  };

  if (BACKEND_API_BASE_URL) {
    try {
      const updatedPost = await apiRequest(`${API_ENDPOINTS.likeProblem(postId)}/downvote`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return updatedPost;
    } catch (err) {
      console.warn('Backend unavailable, updating downvote locally:', err.message);
    }
  }

  // Fallback local simulation enforcing 1 downvote per account
  const posts = getLocalDB();
  let updatedPost = null;

  const nextPosts = posts.map(p => {
    if (p.id === postId) {
      const likedBy = Array.isArray(p.liked_by) ? p.liked_by : [];
      const downvotedBy = Array.isArray(p.downvoted_by) ? p.downvoted_by : [];
      const hasLiked = likedBy.includes(accountId);
      const hasDownvoted = downvotedBy.includes(accountId);
      let newScore = Number(p.score) || 0;
      let nextLikedBy = [...likedBy];
      let nextDownvotedBy = [...downvotedBy];

      if (hasDownvoted) {
        // Toggle off downvote
        newScore += 1;
        nextDownvotedBy = nextDownvotedBy.filter(id => id !== accountId);
      } else {
        // Add downvote
        newScore -= 1;
        nextDownvotedBy.push(accountId);
        if (hasLiked) {
          // Remove previous upvote (-1 to revert upvote)
          newScore -= 1;
          nextLikedBy = nextLikedBy.filter(id => id !== accountId);
        }
      }

      updatedPost = {
        ...p,
        score: newScore,
        liked_by: nextLikedBy,
        downvoted_by: nextDownvotedBy
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
  getPosts,
  getPostById,
  createProblem,
  createPost,
  uploadImageAndCreatePost,
  addComment,
  likeProblem,
  likePost: likeProblem,
  downvoteProblem,
  downvotePost: downvoteProblem,
  submitSolution,
  getSolutions
};

export const api = postService;
export default postService;
