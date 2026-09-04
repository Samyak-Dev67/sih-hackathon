import { INITIAL_POSTS } from '../data/mockData.js';
import { supabase } from '../utils/supabase.js';

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
  const formatted = (data || []).map(post => {
    const postSols = Array.isArray(post.solutions)
      ? post.solutions
      : Array.isArray(post.solution)
        ? post.solution
        : [];
    const isResolved = post.resolved === true;
    return {
      ...post,
      solutions: postSols,
      solution: postSols,
      resolved: isResolved,
      status: isResolved ? 'Resolved' : 'Open'
    };
  });
  return formatted;
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

  if (!data) return null;

  const postSols = Array.isArray(data.solutions)
    ? data.solutions
    : Array.isArray(data.solution)
      ? data.solution
      : [];
  const isResolved = data.resolved === true;

  return {
    ...data,
    solutions: postSols,
    solution: postSols,
    resolved: isResolved,
    status: isResolved ? 'Resolved' : 'Open'
  };
}

export const getProblems = getPosts;

/**
 * Helper to check if a string is a valid UUID
 */
function isValidUUID(str) {
  return (
    typeof str === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)
  );
}

/**
 * Check if the currently authenticated or active account is the author of a post.
 */
export function isPostAuthor(post, currentAccount) {
  if (!post || !currentAccount) return false;

  // 1. Direct user_id match (Supabase auth UUID)
  if (post.user_id && currentAccount.id && post.user_id === currentAccount.id) {
    return true;
  }

  // 2. Direct author_id match
  if (post.author_id && currentAccount.id && post.author_id === currentAccount.id) {
    return true;
  }

  // 3. Metadata embedded inside comments JSON
  if (Array.isArray(post.comments)) {
    const meta = post.comments.find(c => c && typeof c === 'object' && c.__meta);
    if (meta) {
      if (meta.author_id && currentAccount.id && meta.author_id === currentAccount.id) return true;
      if (meta.author_email && currentAccount.email && meta.author_email === currentAccount.email) return true;
    }
  }

  // 4. Direct email match
  if (post.author_email && currentAccount.email && post.author_email === currentAccount.email) {
    return true;
  }

  return false;
}

/**
 * Helper to get status of a post ('Resolved' or 'Open')
 * Evaluates the `resolved` boolean column from Supabase directly.
 */
export function getPostStatus(post) {
  if (!post) return 'Open';
  // 1. Direct boolean column in Supabase
  if (post.resolved === true) return 'Resolved';
  if (post.resolved === false) return 'Open';
  // 2. Direct string status field if present
  if (post.status === 'Resolved' || post.status === 'Open') return post.status;
  // 3. Fallback check for comments __meta
  if (Array.isArray(post.comments)) {
    const meta = post.comments.find(c => c && typeof c === 'object' && c.__meta);
    if (meta?.status === 'Resolved') return 'Resolved';
  }
  return 'Open';
}

/**
 * Extract author display information from a post
 * Uses actual username from currentAccount, comments metadata, or Supabase user
 */
export function getPostAuthorInfo(post, currentAccount) {
  if (!post) return { name: 'Community Member', initials: 'CM' };

  // 1. If currently viewing user is the author, their actual account name takes precedence!
  const isAuthor = isPostAuthor(post, currentAccount);
  if (isAuthor && currentAccount) {
    const activeName = currentAccount.name || (currentAccount.email ? currentAccount.email.split('@')[0] : null);
    if (activeName && !activeName.toLowerCase().startsWith('citizen account')) {
      const initials = activeName
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      return { name: activeName, initials: initials || activeName.substring(0, 2).toUpperCase() };
    }
  }

  // 2. Check comments metadata JSON
  if (Array.isArray(post.comments)) {
    const meta = post.comments.find(c => c && typeof c === 'object' && c.__meta);
    if (meta?.author_name && !meta.author_name.toLowerCase().startsWith('citizen account')) {
      const initials = meta.author_name
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
      return { name: meta.author_name, initials: initials || meta.author_name.substring(0, 2).toUpperCase() };
    }
    if (meta?.author_email) {
      const username = meta.author_email.split('@')[0];
      const initials = username.substring(0, 2).toUpperCase();
      return { name: username, initials };
    }
  }

  // 3. Direct author_name if available on post object
  if (post.author_name && !post.author_name.toLowerCase().startsWith('citizen account')) {
    const initials = post.author_name
      .split(' ')
      .filter(Boolean)
      .map(w => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    return { name: post.author_name, initials: initials || post.author_name.substring(0, 2).toUpperCase() };
  }

  // 4. If post has user_id, check against currentAccount or create a clean handle
  if (post.user_id) {
    if (currentAccount && currentAccount.id === post.user_id) {
      const activeName = currentAccount.name || (currentAccount.email ? currentAccount.email.split('@')[0] : 'Citizen');
      const initials = activeName.substring(0, 2).toUpperCase();
      return { name: activeName, initials };
    }
    const shortId = post.user_id.substring(0, 5);
    return { name: `user_${shortId}`, initials: `U${shortId[0].toUpperCase()}` };
  }

  return { name: 'Community Member', initials: 'CM' };
}

/**
 * 2. Create a Problem / Post in Supabase
 * Inserts directly into Supabase `posts` table.
 * Records author identity via `user_id` and comments JSON metadata.
 * Throws actual Supabase error on failure (no silent localStorage fallback).
 */
export async function createPost(postData = {}) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  // Determine active author info
  let authorId = postData?.author_id;
  let authorName = postData?.author_name;
  let authorEmail = postData?.author_email;

  if (!authorId || !authorName) {
    try {
      const saved = localStorage.getItem('fl_active_account');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!authorId && parsed.id) authorId = parsed.id;
        if (!authorName && parsed.name) authorName = parsed.name;
        if (!authorEmail && parsed.email) authorEmail = parsed.email;
      }
    } catch (e) {}
  }

  // Safe metadata inside comments JSON column (safe for DB schema)
  const metaObj = {
    __meta: true,
    author_id: authorId || null,
    author_name: authorName || (authorEmail ? authorEmail.split('@')[0] : 'Community Member'),
    author_email: authorEmail || null,
    created_at: new Date().toISOString()
  };

  const existingComments = Array.isArray(postData?.comments) ? postData.comments : [];
  const commentsPayload = [metaObj, ...existingComments];

  const payload = {
    title: postData?.title ? postData.title.trim() : 'How to optimize database queries',
    desc: postData?.desc ? postData.desc.trim() : 'A complete guide on indexing and schema design.',
    img: postData?.img ? postData.img.trim() : '',
    category: postData?.category ? postData.category.trim() : 'Infrastructure',
    score: typeof postData?.score === 'number' ? postData.score : 0,
    comments: commentsPayload,
    solutions: Array.isArray(postData?.solutions) ? postData.solutions : [],
    resolved: false
  };

  // If authorId is a valid UUID, include user_id
  if (authorId && isValidUUID(authorId)) {
    payload.user_id = authorId;
  }

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
      console.error('👉 Fix: Go to Supabase Dashboard > Authentication > Policies, and add an INSERT policy allowing authenticated users.');
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
 * 2b. Update an existing Post in Supabase (Author Only)
 * Only updates valid columns in `posts` table: title, desc, category, img, resolved, solutions.
 */
export async function updatePost(postId, updatedFields = {}) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log(`📡 [Supabase UPDATE]: Updating post #${postId}...`, updatedFields);

  // Extract only columns that exist on `posts` table
  const payload = {};
  if (typeof updatedFields.title === 'string') payload.title = updatedFields.title.trim();
  if (typeof updatedFields.desc === 'string') payload.desc = updatedFields.desc.trim();
  if (typeof updatedFields.category === 'string') payload.category = updatedFields.category.trim();
  if (typeof updatedFields.img === 'string') payload.img = updatedFields.img.trim();
  if (typeof updatedFields.score === 'number') payload.score = updatedFields.score;
  if (typeof updatedFields.resolved === 'boolean') payload.resolved = updatedFields.resolved;
  if (Array.isArray(updatedFields.comments)) payload.comments = updatedFields.comments;
  if (Array.isArray(updatedFields.solutions)) payload.solutions = updatedFields.solutions;
  else if (Array.isArray(updatedFields.solution)) payload.solutions = updatedFields.solution;

  const { data, error } = await supabase
    .from('posts')
    .update(payload)
    .eq('id', postId)
    .select();

  if (error) {
    console.error('❌ [Supabase UPDATE Error]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked UPDATE on "posts" table (code 42501). Check RLS UPDATE policy in Supabase.');
    }
    throw new Error(`Supabase UPDATE failed: ${error.message} (code: ${error.code})`);
  }

  console.log(`✅ [Supabase UPDATE Success]: Post #${postId} updated successfully:`, data && data[0]);
  return data && data.length > 0 ? data[0] : { id: postId, ...payload };
}

export const updateProblem = updatePost;

/**
 * 2c. Delete a Post in Supabase (Author Only)
 * Permanently removes row from `posts` table.
 */
export async function deletePost(postId) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log(`📡 [Supabase DELETE]: Deleting post #${postId}...`);

  const { data, error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .select();

  if (error) {
    console.error('❌ [Supabase DELETE Error]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked DELETE on "posts" table (code 42501). Check RLS DELETE policy in Supabase.');
    }
    throw new Error(`Supabase DELETE failed: ${error.message} (code: ${error.code})`);
  }

  console.log(`✅ [Supabase DELETE Success]: Post #${postId} removed from Supabase.`);
  return { success: true, id: postId, data };
}

export const deleteProblem = deletePost;

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
 * Upload Image to Supabase Storage ('post-images') and Update Existing Post
 */
export async function uploadImageAndUpdatePost(postId, file, updatedFields = {}) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  let imageUrl = updatedFields.img || '';

  if (file) {
    console.log(`📡 [Supabase Storage]: Uploading new image for post #${postId}...`, file.name);
    const fileExt = file.name ? file.name.split('.').pop() : 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('❌ [Supabase Storage Error]: Failed to upload image:', uploadError.message);
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

  return await updatePost(postId, {
    ...updatedFields,
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
 * Caches locally so solutions remain immediately visible.
 */
export async function submitSolution(postId, { title, desc, proposed_approach, author_name, author_role }) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  // Derive author details
  let resolvedAuthorName = author_name;
  let resolvedAuthorRole = author_role || 'university';
  if (!resolvedAuthorName) {
    try {
      const saved = localStorage.getItem('fl_active_account');
      if (saved) {
        const parsed = JSON.parse(saved);
        resolvedAuthorName = parsed.name || (parsed.email ? parsed.email.split('@')[0] : null);
        if (parsed.role) resolvedAuthorRole = parsed.role;
      }
    } catch (e) {}
  }
  if (!resolvedAuthorName) resolvedAuthorName = 'Academic / Enterprise Partner';

  const solutionPayload = {
    problem_id: postId,
    id: `sol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim(),
    desc: desc.trim(),
    proposed_approach: (proposed_approach || desc).trim(),
    author_name: resolvedAuthorName,
    author_role: resolvedAuthorRole,
    created_at: new Date().toISOString()
  };

  console.log(`📡 [Supabase UPDATE]: Submitting solution for post #${postId}...`, solutionPayload);

  // 1. Fetch current post from Supabase
  const { data: post, error: fetchErr } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (fetchErr) {
    console.error('❌ [Supabase SELECT Error (submitSolution)]:', fetchErr);
    throw new Error(`Failed to fetch post #${postId} before saving solution: ${fetchErr.message}`);
  }

  const existingSolutions = Array.isArray(post.solutions)
    ? post.solutions
    : Array.isArray(post.solution)
      ? post.solution
      : [];

  const updatedSolutions = [
    solutionPayload,
    ...existingSolutions.filter(s => s.id !== solutionPayload.id)
  ];

  // 2. Update solutions directly in Supabase
  let updateResult = null;
  let updateError = null;

  const { data: dataSolutions, error: errorSolutions } = await supabase
    .from('posts')
    .update({ solutions: updatedSolutions })
    .eq('id', postId)
    .select();

  if (errorSolutions) {
    // If backend column is named 'solution', fallback to 'solution'
    if (errorSolutions.message?.includes('solution') || errorSolutions.code === 'PGRST204') {
      console.log('🔄 Attempting fallback to "solution" column...');
      const { data: dataSolution, error: errorSolution } = await supabase
        .from('posts')
        .update({ solution: updatedSolutions })
        .eq('id', postId)
        .select();

      if (errorSolution) {
        updateError = errorSolution;
      } else {
        updateResult = dataSolution;
      }
    } else {
      updateError = errorSolutions;
    }
  } else {
    updateResult = dataSolutions;
  }

  if (updateError) {
    console.error('❌ [Supabase UPDATE Error (submitSolution)]:', {
      message: updateError.message,
      code: updateError.code,
      details: updateError.details,
      hint: updateError.hint
    });
    if (updateError.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked UPDATE on "posts.solutions".');
      console.error('👉 Fix: Go to Supabase Dashboard > Authentication > Policies, and add an UPDATE policy allowing users to submit solutions.');
    }
    throw new Error(`Supabase failed to save solution: ${updateError.message} (code: ${updateError.code})`);
  }

  if (!updateResult || updateResult.length === 0) {
    const rlsErr = new Error('Supabase UPDATE returned 0 rows. Row-Level Security (RLS) on the "posts" table may have blocked updating this problem.');
    console.error('🚨 [Supabase RLS Error]:', rlsErr.message);
    throw rlsErr;
  }

  const savedRecord = updateResult[0];
  const isResolved = savedRecord.resolved === true;
  const finalPost = {
    ...savedRecord,
    solutions: updatedSolutions,
    solution: updatedSolutions,
    resolved: isResolved,
    status: isResolved ? 'Resolved' : 'Open'
  };

  console.log(`✅ [Supabase UPDATE Success]: Solution saved to post #${postId} in Supabase:`, finalPost);
  return finalPost;
}

/**
 * 4b. Mark Problem as Resolved or Open (Citizen Author Only)
 * Directly updates the `resolved` boolean column (true/false) in Supabase.
 */
export async function toggleProblemStatus(postId, targetStatus, currentAccount) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  console.log(`📡 [Supabase SELECT]: Fetching problem #${postId} to check resolved boolean...`);
  const { data: postRecord, error: fetchErr } = await supabase
    .from('posts')
    .select('id, resolved, title')
    .eq('id', postId)
    .single();

  if (fetchErr) {
    console.error('❌ [Supabase SELECT Error (toggleProblemStatus)]:', fetchErr);
    throw new Error(`Failed to fetch problem #${postId}: ${fetchErr.message}`);
  }

  const currentlyResolved = postRecord?.resolved === true;
  let newResolvedBool = !currentlyResolved;
  if (targetStatus === 'Resolved' || targetStatus === true) {
    newResolvedBool = true;
  } else if (targetStatus === 'Open' || targetStatus === false) {
    newResolvedBool = false;
  }

  console.log(`📡 [Supabase UPDATE]: Updating post #${postId} -> resolved: ${newResolvedBool}...`);

  const { data, error } = await supabase
    .from('posts')
    .update({ resolved: newResolvedBool })
    .eq('id', postId)
    .select();

  if (error) {
    console.error('❌ [Supabase UPDATE Error (toggleProblemStatus)]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    if (error.code === '42501') {
      console.error('🚨 [RLS / Permission Error]: Row-Level Security blocked UPDATE on "posts.resolved" (code 42501).');
      console.error('👉 Fix: Go to Supabase Dashboard > Authentication > Policies, and verify UPDATE policy on "posts".');
    }
    throw new Error(`Supabase UPDATE failed for resolved status: ${error.message} (code: ${error.code})`);
  }

  if (!data || data.length === 0) {
    const rlsErr = new Error('Supabase UPDATE returned 0 rows for resolved status. RLS may have blocked updating this problem.');
    console.error('🚨 [Supabase RLS Error]:', rlsErr.message);
    throw rlsErr;
  }

  const updatedRecord = data[0];
  const finalStatus = newResolvedBool ? 'Resolved' : 'Open';

  console.log(`✅ [Supabase UPDATE Success]: Post #${postId} resolved is now ${newResolvedBool} ("${finalStatus}")`);
  return {
    ...updatedRecord,
    resolved: newResolvedBool,
    status: finalStatus
  };
}

export const resolveProblem = (postId, account) => toggleProblemStatus(postId, 'Resolved', account);
export const reopenProblem = (postId, account) => toggleProblemStatus(postId, 'Open', account);

/**
 * 5. Fetch Solutions for a Problem directly from Supabase
 */
export async function getSolutions(postId) {
  if (!supabase) {
    const err = new Error('Supabase client is not initialized.');
    console.error('❌ [Supabase Connection Error]:', err.message);
    throw err;
  }

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    console.error('❌ [Supabase SELECT Error (getSolutions)]:', error);
    throw new Error(`Supabase getSolutions failed: ${error.message}`);
  }

  const dbSols = Array.isArray(data?.solutions)
    ? data.solutions
    : Array.isArray(data?.solution)
      ? data.solution
      : [];

  return dbSols;
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
  updateProblem,
  updatePost,
  deleteProblem,
  deletePost,
  uploadImageAndCreatePost,
  uploadImageAndUpdatePost,
  isPostAuthor,
  getPostAuthorInfo,
  getPostStatus,
  toggleProblemStatus,
  resolveProblem,
  reopenProblem,
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
