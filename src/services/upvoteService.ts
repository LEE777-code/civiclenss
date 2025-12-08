import { supabase } from "@/lib/supabase";

// Helper function to get unique user identifier
const getUserId = (): string => {
  let userId = localStorage.getItem('civic_lens_user_id');
  if (!userId) {
    userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('civic_lens_user_id', userId);
  }
  return userId;
};

// Helper function to get upvoted reports from localStorage
const getUpvotedReports = (): string[] => {
  const userId = getUserId();
  const key = `upvoted_reports_${userId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

// Helper function to save upvoted reports to localStorage
const saveUpvotedReports = (reportIds: string[]): void => {
  const userId = getUserId();
  const key = `upvoted_reports_${userId}`;
  localStorage.setItem(key, JSON.stringify(reportIds));
};

/**
 * Toggle upvote for a report (add upvote if not upvoted, remove if already upvoted)
 * @param reportId - The ID of the report to upvote/remove upvote
 * @returns The updated upvotes count and upvoted status
 */
export const toggleUpvote = async (reportId: string) => {
  try {
    const upvotedReports = getUpvotedReports();
    const hasUpvoted = upvotedReports.includes(reportId);

    // Get the current upvotes count
    const { data: currentReport, error: fetchError } = await supabase
      .from('reports')
      .select('upvotes')
      .eq('id', reportId)
      .single();

    if (fetchError) {
      console.error('Error fetching current upvotes:', fetchError);
      return { error: fetchError };
    }

    const currentUpvotes = currentReport?.upvotes || 0;
    let newUpvotes = currentUpvotes;

    if (hasUpvoted) {
      // Remove upvote
      newUpvotes = Math.max(0, currentUpvotes - 1);
      const updatedList = upvotedReports.filter(id => id !== reportId);
      saveUpvotedReports(updatedList);
    } else {
      // Add upvote
      newUpvotes = currentUpvotes + 1;
      upvotedReports.push(reportId);
      saveUpvotedReports(upvotedReports);
    }

    // Update the upvotes count in database
    const { data, error } = await supabase
      .from('reports')
      .update({ upvotes: newUpvotes })
      .eq('id', reportId)
      .select()
      .single();

    if (error) {
      console.error('Error updating upvotes:', error);
      return { error };
    }

    return { data, upvoted: !hasUpvoted, upvotes: newUpvotes };
  } catch (error) {
    console.error('Unexpected error in toggleUpvote:', error);
    return { error };
  }
};

/**
 * Check if user has upvoted a specific report
 * @param reportId - The ID of the report to check
 * @returns Whether the user has upvoted this report
 */
export const hasUserUpvoted = (reportId: string): boolean => {
  const upvotedReports = getUpvotedReports();
  return upvotedReports.includes(reportId);
};

/**
 * Get the current upvotes count for a report
 * @param reportId - The ID of the report
 * @returns The upvotes count or error
 */
export const getReportUpvotes = async (reportId: string) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('upvotes')
      .eq('id', reportId)
      .single();

    if (error) {
      console.error('Error fetching upvotes:', error);
      return { error };
    }

    return { upvotes: data?.upvotes || 0 };
  } catch (error) {
    console.error('Unexpected error in getReportUpvotes:', error);
    return { error };
  }
};

