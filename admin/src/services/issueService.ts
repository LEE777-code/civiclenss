import { supabase, Issue } from '@/lib/supabase';

export interface IssueFilters {
  status?: string;
  priority?: string;
  category?: string;
  state?: string;
  district?: string;
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const issueService = {
  // Fetch all issues with optional filters
  async getIssues(filters?: IssueFilters): Promise<Issue[]> {
    let query = supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters?.state) {
      query = query.eq('state', filters.state);
    }

    if (filters?.district) {
      query = query.eq('district', filters.district);
    }

    if (filters?.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching issues:', error);
      throw error;
    }

    return data || [];
  },

  // Get single issue by ID
  async getIssueById(id: string): Promise<Issue | null> {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching issue:', error);
      return null;
    }

    return data;
  },

  // Update issue status
  async updateIssueStatus(id: string, status: Issue['status'], assignedTo?: string): Promise<boolean> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    if (assignedTo) {
      updateData.assigned_to = assignedTo;
    }

    const { error } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating issue status:', error);
      return false;
    }

    return true;
  },

  // Update issue priority
  async updateIssuePriority(id: string, priority: Issue['priority']): Promise<boolean> {
    const { error } = await supabase
      .from('issues')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating issue priority:', error);
      return false;
    }

    return true;
  },

  // Get issue statistics
  async getIssueStats(filters?: { state?: string; district?: string }) {
    let query = supabase.from('issues').select('status, priority, category, created_at');

    if (filters?.state) {
      query = query.eq('state', filters.state);
    }

    if (filters?.district) {
      query = query.eq('district', filters.district);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching issue stats:', error);
      return null;
    }

    const stats = {
      total: data.length,
      open: data.filter(i => i.status === 'open').length,
      inProgress: data.filter(i => i.status === 'in-progress').length,
      resolved: data.filter(i => i.status === 'resolved').length,
      rejected: data.filter(i => i.status === 'rejected').length,
      byPriority: {
        high: data.filter(i => i.priority === 'high').length,
        medium: data.filter(i => i.priority === 'medium').length,
        low: data.filter(i => i.priority === 'low').length,
      },
      byCategory: data.reduce((acc: any, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      }, {}),
    };

    return stats;
  },

  // Get recent issues
  async getRecentIssues(limit: number = 10): Promise<Issue[]> {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent issues:', error);
      return [];
    }

    return data || [];
  },

  // Delete issue (admin only)
  async deleteIssue(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting issue:', error);
      return false;
    }

    return true;
  },
};
