import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Database Types
export interface Issue {
  id: string;
  // Hardened ID fields
  issue_id?: string; // Optional if same as id
  department_id?: string;
  district_id?: string;
  admin_id?: string;
  supervisor_id?: string;

  title: string;
  description: string;
  category: string;
  status: 'SUBMITTED' | 'ASSIGNED_TO_SUPERVISOR' | 'IN_PROGRESS' | 'WORK_COMPLETED' | 'ADMIN_VERIFIED' | 'REJECTED' | 'ESCALATED' | 'open' | 'in-progress' | 'resolved' | 'rejected'; // Keeping strict + legacy for compatibility during migration
  priority: 'low' | 'medium' | 'high';
  location: string;
  latitude?: number;
  longitude?: number;
  district: string;
  state: string;
  department?: string;
  image_url?: string;
  reported_by: string;
  reporter_name?: string;
  is_anonymous: boolean;
  upvotes: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  assigned_to?: string;
}

export interface Admin {
  id: string;
  // Hardened ID fields
  department_id?: string;
  district_id?: string;
  is_active?: boolean;

  clerk_id: string;
  email: string;
  name: string;
  full_name?: string;
  role: 'state' | 'district' | 'local' | 'super_admin' | 'department';
  state?: string;
  district?: string;
  local_body?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  created_at: string;
}
