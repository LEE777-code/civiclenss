import { supabase } from '@/lib/supabase';

export interface Officer {
    id: string;
    name: string;
    phone: string;
    department: string | null;
    email: string;
    role: string;
    state: string | null;
    district: string | null;
    local_body: string | null;
}

/**
 * Get all admins with phone numbers (they can be assigned reports)
 */
export async function getOfficers(): Promise<Officer[]> {
    const { data, error } = await supabase
        .from('admins')
        .select('id, name, phone, department, email, role, state, district, local_body')
        .not('phone', 'is', null) // Only admins with phone numbers
        .order('name');

    if (error) {
        console.error('Error fetching officers:', error);
        return [];
    }

    return data || [];
}

/**
 * Get officer (admin) by ID
 */
export async function getOfficerById(id: string): Promise<Officer | null> {
    const { data, error } = await supabase
        .from('admins')
        .select('id, name, phone, department, email, role, state, district, local_body')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching officer:', error);
        return null;
    }

    return data;
}

/**
 * Assign admin to report
 */
export async function assignOfficerToReport(
    reportId: string,
    adminId: string,
    assignedBy: string
): Promise<boolean> {
    const { error } = await supabase
        .from('reports')
        .update({
            assigned_admin_id: adminId,
            assigned_at: new Date().toISOString(),
            assigned_by: assignedBy,
        })
        .eq('id', reportId);

    if (error) {
        console.error('Error assigning officer:', error);
        return false;
    }

    return true;
}
