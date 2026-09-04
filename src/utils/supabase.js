import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || process.env?.VITE_SUPABASE_URL || 'https://nthoaygneaxlqkrwxzee.supabase.co';
const supabaseKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) || process.env?.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_MjiRdPRtjIhEClFk0v9tjg_UHv6eOBY';

export const supabase = createClient(supabaseUrl, supabaseKey);
