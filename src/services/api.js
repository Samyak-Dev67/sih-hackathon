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
 * 1. Fetch All Posts from Supabase
 * Fetch all posts ordered by creation date.
 * Throws error if Supabase request fails (no silent localStorage fallback).
 */
export async function getPosts() {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized. Please verify VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log('📡 [Supabase SELECT]: Fetching posts from "posts" table...');
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [Supabase SELECT Error]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security policy blocked SELECT on "posts" table. Please configure an RLS SELECT policy in Supabase.');
    }
    throw new Error(`Supabase SELECT failed: ${error.message} (code: ${error.code})`);
  }

  console.log(`✅ [Supabase SELECT Success]: Retrieved ${data ? data.length : 0} posts from Supabase.`);
  return data || [];
}

/**
 * Fetch a single post by ID from Supabase
 */
export async function getPostById(postId) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log(`📡 [Supabase SELECT]: Fetching post #${postId}...`);
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    console.error('❌ [Supabase SELECT Error (getPostById)]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Supabase getPostById failed: ${error.message} (code: ${error.code})`);
  }

  return data;
}

export const getProblems = getPosts;

/**
 * 2. Create a Problem / Post in Supabase
 * Inserts directly into Supabase `posts` table.
 * Throws actual Supabase error on failure (no silent localStorage fallback).
 */
export async function createPost(postData) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

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

  console.log('📡 [Supabase INSERT]: Attempting to insert into "posts" table:', payload);

  const { data, error } = await supabase
    .from('posts')
    .insert([payload])
    .select();

  if (error) {
    console.error('❌ [Supabase INSERT Error]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked INSERT into "posts" table (code 42501).');
      console.error('👉 Fix: Go to Supabase Dashboard > Authentication > Policies (or Table Editor > posts > Policies), and add an INSERT policy allowing anon/authenticated users: WITH CHECK (true)');
    }
    throw new Error(`Supabase INSERT failed: ${error.message} (code: ${error.code})`);
  }

  if (!data || data.length === 0) {
    const err = new Error('Supabase INSERT returned no rows. Check if an RLS SELECT policy is preventing reading the inserted row.');
    console.warn('⚠️ [Supabase Warning]:', err.message);
    throw err;
  }

  console.log('✅ [Supabase INSERT Success]: Row successfully written to "posts" table:', data[0]);
  return data[0];
}

export const createProblem = createPost;

/**
 * Upload Image to Supabase Storage ('post-images') and Create Post
 */
export async function uploadImageAndCreatePost(file, postData = {}) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  let imageUrl = postData.img || '';

  if (file) {
    console.log('📡 [Supabase Storage]: Uploading file to bucket "post-images"...', file.name);
    const fileExt = file.name ? file.name.split('.').pop() : 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('❌ [Supabase Storage Error]: Failed to upload to "post-images" bucket:', {
        message: uploadError.message
      });
      console.error('👉 Ensure bucket "post-images" exists in Supabase Storage and has public upload policies.');
      throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath);

    if (urlData?.publicUrl) {
      imageUrl = urlData.publicUrl;
      console.log('✅ [Supabase Storage Success]: Public image URL generated:', imageUrl);
    }
  }

  return await createPost({
    ...postData,
    img: imageUrl
  });
}

/**
 * Add a Comment to a Post in Supabase
 */
export async function addComment(postId, newComment) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log(`📡 [Supabase UPDATE]: Adding comment to post #${postId}...`);
  // 1. Fetch existing comments
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('comments')
    .eq('id', postId)
    .single();

  if (fetchError) {
    console.error('❌ [Supabase SELECT Error (addComment)]:', fetchError);
    throw new Error(`Supabase failed to fetch existing comments: ${fetchError.message}`);
  }

  const updatedComments = [...(post.comments || []), newComment];

  // 2. Update with the new array
  const { data, error } = await supabase
    .from('posts')
    .update({ comments: updatedComments })
    .eq('id', postId)
    .select();

  if (error) {
    console.error('❌ [Supabase UPDATE Error (addComment)]:', error);
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked UPDATE on "posts" table (code 42501).');
    }
    throw new Error(`Supabase update comments failed: ${error.message}`);
  }

  console.log('✅ [Supabase UPDATE Success]: Comments updated on post #', postId);
  return data && data.length > 0 ? data[0] : null;
}

/**
 * 3. Like (Upvote) a Problem in Supabase
 * Directly updates `score` in the Supabase `posts` table.
 */
export async function likeProblem(postId, accountId = 'default-account') {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log(`📡 [Supabase UPDATE]: Processing upvote for post #${postId}...`);
  // 1. Fetch current score from Supabase
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (fetchError) {
    console.error('❌ [Supabase SELECT Error (likeProblem)]:', fetchError);
    throw new Error(`Supabase failed to read post for upvote: ${fetchError.message}`);
  }

  const currentScore = Number(post.score) || 0;
  const newScore = currentScore + 1;

  // 2. Update post score in Supabase
  const { data, error } = await supabase
    .from('posts')
    .update({ score: newScore })
    .eq('id', postId)
    .select();

  if (error) {
    console.error('❌ [Supabase UPDATE Error (likeProblem)]:', error);
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked UPDATE on "posts" table (code 42501). Add an UPDATE policy in Supabase.');
    }
    throw new Error(`Supabase upvote failed: ${error.message}`);
  }

  console.log(`✅ [Supabase UPDATE Success]: Post #${postId} score updated to ${newScore}`);
  return data && data.length > 0 ? data[0] : { ...post, score: newScore };
}

/**
 * 3b. Downvote a Problem in Supabase
 * Directly decrements `score` in the Supabase `posts` table.
 */
export async function downvoteProblem(postId, accountId = 'default-account') {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log(`📡 [Supabase UPDATE]: Processing downvote for post #${postId}...`);
  // 1. Fetch current score from Supabase
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (fetchError) {
    console.error('❌ [Supabase SELECT Error (downvoteProblem)]:', fetchError);
    throw new Error(`Supabase failed to read post for downvote: ${fetchError.message}`);
  }

  const currentScore = Number(post.score) || 0;
  const newScore = currentScore - 1;

  // 2. Update post score in Supabase
  const { data, error } = await supabase
    .from('posts')
    .update({ score: newScore })
    .eq('id', postId)
    .select();

  if (error) {
    console.error('❌ [Supabase UPDATE Error (downvoteProblem)]:', error);
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked UPDATE on "posts" table (code 42501). Add an UPDATE policy in Supabase.');
    }
    throw new Error(`Supabase downvote failed: ${error.message}`);
  }

  console.log(`✅ [Supabase UPDATE Success]: Post #${postId} score decremented to ${newScore}`);
  return data && data.length > 0 ? data[0] : { ...post, score: newScore };
}

/**
 * 4. Submit a Solution to Supabase
 * Appends the solution object to the `solutions` JSON column in the Supabase `posts` table.
 */
export async function submitSolution(postId, { title, desc, proposed_approach, author_name, author_role }) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

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

  console.log(`📡 [Supabase UPDATE]: Submitting solution for post #${postId}...`, solutionPayload);

  // 1. Fetch existing solutions
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('solutions')
    .eq('id', postId)
    .single();

  if (fetchError) {
    console.error('❌ [Supabase SELECT Error (submitSolution)]:', fetchError);
    throw new Error(`Supabase failed to fetch existing solutions: ${fetchError.message}`);
  }

  const existingSolutions = Array.isArray(post?.solutions) ? post.solutions : [];
  const updatedSolutions = [solutionPayload, ...existingSolutions];

  // 2. Update solutions array in Supabase
  const { data, error } = await supabase
    .from('posts')
    .update({ solutions: updatedSolutions })
    .eq('id', postId)
    .select();

  if (error) {
    console.error('❌ [Supabase UPDATE Error (submitSolution)]:', error);
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked UPDATE on "posts" table (code 42501).');
    }
    throw new Error(`Supabase submitSolution failed: ${error.message}`);
  }

  console.log('✅ [Supabase UPDATE Success]: Solution saved to Supabase for post #', postId);
  return data && data.length > 0 ? data[0] : null;
}

/**
 * 5. Fetch Solutions for a Problem
 */
export async function getSolutions(postId) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  const { data, error } = await supabase
    .from('posts')
    .select('solutions')
    .eq('id', postId)
    .single();

  if (error) {
    console.error('❌ [Supabase SELECT Error (getSolutions)]:', error);
    throw new Error(`Supabase getSolutions failed: ${error.message}`);
  }

  return data?.solutions || [];
}

/**
 * Combined API Service Object
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
