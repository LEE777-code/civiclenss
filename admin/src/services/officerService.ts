import { supabase } from '@/lib/supabase';

// ============================================
// INTERFACES
// ============================================

export interface Officer {
    id: string;
    name: string;
    phone: string;
    department: string | null;
    email: string;
    role: string;
    state?: string | null;
    district: string | null;
    local_body?: string | null;
    current_lat?: number;
    current_lon?: number;
    distance?: number;
}

export interface EligibleSupervisor {
    id: string;
    name: string;
    email: string;
    phone?: string;
    department: string;
    district: string;
    distance: number;
    active_tasks: number;
    sla_delay_count: number;
    score: number;
    isRecommended: boolean;
    isNearest: boolean;
    isLeastWorkload: boolean;
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Get all officers/supervisors (Fallback/Legacy)
 */
export async function getOfficers(): Promise<Officer[]> {
    // If supervisors table exists, prefer it
    const { data: sups, error: supError } = await supabase.from('supervisors').select('*');
    if (!supError && sups && sups.length > 0) {
        return sups.map((s: any) => ({
            ...s,
            id: s.id,
            name: s.full_name || s.name || 'Unknown',
            phone: s.phone_number || s.phone || '',
            department: s.department,
            email: s.email,
            role: 'supervisor',
            district: s.district,
            state: null,
            local_body: null
        }));
    }

    const { data, error } = await supabase
        .from('admins')
        .select('id, full_name, phone, department, email, role, district')
        .neq('role', 'super_admin')
        .order('full_name');

    if (error) {
        console.error('Error fetching officers:', error);
        return [];
    }

    return (data || []).map(o => ({
        ...o,
        name: o.full_name,
        state: null,
        local_body: null
    }));
}

/**
 * Get supervisors from Supabase (filtering by district)
 */
export async function getNearbySupervisors(lat: number, lon: number, department?: string, district?: string): Promise<Officer[]> {
    try {
        let query = supabase
            .from('supervisors')
            .select('*');

        if (district) {
            query = query.eq('district', district);
        }

        if (department) {
            query = query.eq('department', department);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching supervisors from Supabase:', error);
            // Fallback to admins table if supervisors table is empty or missing (safety net)
            return getOfficers();
        }

        if (!data || data.length === 0) {
            return getOfficers();
        }

        // Map to Officer interface
        return data.map((s: any) => ({
            id: s.id,
            name: s.full_name || s.name || 'Unknown',
            phone: s.phone_number || s.phone || '',
            department: s.department,
            email: s.email,
            role: 'supervisor',
            district: s.district,
            current_lat: s.current_lat || s.latitude || lat, // Mock location if missing
            current_lon: s.current_lon || s.longitude || lon,
            distance: 0 // Calculate distance if needed, or 0
        }));
    } catch (error) {
        console.error('Error in getNearbySupervisors:', error);
        return [];
    }
}

/**
 * Get Top Eligible Supervisors (Simulated AI Logic on Client)
 */
export async function getEligibleSupervisors(issueId: string): Promise<{ supervisors: EligibleSupervisor[]; issue: { department: string; district: string } | null }> {
    try {
        // 1. Fetch the issue to get location/category
        const { data: issue, error: issueError } = await supabase
            .from('issues')
            .select('*')
            .eq('id', issueId)
            .single();

        if (issueError || !issue) throw new Error('Issue not found');

        // 2. Fetch supervisors in the same district/department
        let query = supabase
            .from('supervisors')
            .select('*')
            .eq('district', issue.district);

        if (issue.department) {
            query = query.eq('department', issue.department);
        }

        const { data: supervisors, error: supError } = await query;

        if (supError) throw supError;

        if (!supervisors || supervisors.length === 0) {
            // Fallback: Fetch from admins if no supervisors found
            const fallbackOfficers = await getOfficers();
            const districtOfficers = fallbackOfficers.filter(o => o.district === issue.district);

            if (districtOfficers.length > 0) {
                const mappedAdmins = districtOfficers.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    email: s.email,
                    department: s.department || issue.department,
                    district: s.district,
                    phone: s.phone || '',
                    distance: 0,
                    active_tasks: 0,
                    sla_delay_count: 0,
                    score: 90,
                    isRecommended: true,
                    isNearest: true,
                    isLeastWorkload: true
                }));
                return { supervisors: mappedAdmins, issue: { department: issue.department || '', district: issue.district } };
            }
            return { supervisors: [], issue: null };
        }

        // 3. Simple Logic to mimic AI ranking
        const scoredSupervisors = supervisors.map((s: any) => ({
            id: s.id,
            name: s.full_name || s.name || 'Unknown',
            email: s.email,
            department: s.department,
            district: s.district,
            phone: s.phone || s.phone_number || '',
            distance: (Math.random() * 10).toFixed(1), // Mock distance
            active_tasks: Math.floor(Math.random() * 5),
            sla_delay_count: 0,
            score: Math.floor(Math.random() * 20) + 80,
            isRecommended: true,
            isNearest: true,
            isLeastWorkload: true
        }));

        return { supervisors: scoredSupervisors, issue: { department: issue.department || '', district: issue.district } };
    } catch (error) {
        console.error('Error fetching eligible supervisors:', error);
        return { supervisors: [], issue: null };
    }
}

/**
 * Assign Supervisor to Issue (Direct DB Update)
 */
export async function assignSupervisorToIssue(
    issueId: string,
    supervisorId: string,
    adminId: string,
    adminName: string,
    overrideReason?: string
): Promise<{ success: boolean; message: string; supervisor_name?: string }> {
    try {
        // Fetch supervisor name first
        const { data: supervisor } = await supabase
            .from('supervisors')
            .select('full_name, name')
            .eq('id', supervisorId)
            .single();

        // Perform the update
        const { error } = await supabase
            .from('issues')
            .update({
                assigned_to: supervisorId, // Keeping legacy field
                supervisor_id: supervisorId, // New strict field
                status: 'ASSIGNED_TO_SUPERVISOR',
                updated_at: new Date().toISOString()
            })
            .eq('id', issueId);

        if (error) throw error;

        // Log the assignment (optional, if audit logs logic exists)
        // ...

        return {
            success: true,
            message: 'Supervisor assigned successfully',
            supervisor_name: supervisor?.full_name || supervisor?.name || 'Supervisor'
        };
    } catch (error: any) {
        console.error('Error assigning supervisor:', error);
        return { success: false, message: error.message || 'Assignment failed' };
    }
}

/**
 * Assign admin to report (Legacy shim)
 */
export async function assignOfficerToReport(reportId: string, supervisorId: string, adminId: string): Promise<boolean> {
    const res = await assignSupervisorToIssue(reportId, supervisorId, adminId, 'Admin');
    return res.success;
}
