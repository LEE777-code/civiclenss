import { supabase, Admin } from '@/lib/supabase';

export const authService = {
  // Get admin profile by Clerk ID
  async getAdminByClerkId(clerkId: string): Promise<Admin | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      console.error('Error fetching admin:', error);
      return null;
    }

    return data;
  },

  // Create admin profile
  async createAdmin(adminData: Partial<Admin>): Promise<Admin | null> {
    const { data, error } = await supabase
      .from('admins')
      .insert([{
        ...adminData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating admin:', error);
      return null;
    }

    return data;
  },

  // Update admin profile
  async updateAdmin(clerkId: string, updates: Partial<Admin>): Promise<boolean> {
    const { error } = await supabase
      .from('admins')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', clerkId);

    if (error) {
      console.error('Error updating admin:', error);
      return false;
    }

    return true;
  },

  // Get all admins (for super admin)
  async getAllAdmins(): Promise<Admin[]> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admins:', error);
      return [];
    }

    return data || [];
  },
};
