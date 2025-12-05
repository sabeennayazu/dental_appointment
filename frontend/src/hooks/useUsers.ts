import useSWR from 'swr';
import { User } from '@/lib/api/users';

const API_BASE = 'http://localhost:8000/api';

// Fetcher function for SWR
const fetcher = async (url: string) => {
  console.log('[useUsers] Fetching:', url);
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('Failed to fetch users');
    try {
      const data = await res.json();
      error.message = data.detail || data.message || error.message;
    } catch (e) {
      error.message = res.statusText;
    }
    (error as any).status = res.status;
    console.error('[useUsers] Error:', error);
    throw error;
  }

  const data = await res.json();
  console.log('[useUsers] Success:', {
    url,
    dataLength: Array.isArray(data) ? data.length : data.results?.length,
  });
  return data;
};

/**
 * Hook for client-side users fetching with SWR
 * Useful for client components that need to refresh user list
 */
export function useUsers(enabled: boolean = true) {
  const url = `${API_BASE}/users`; // ✅ FIX HERE (removed "/")

  const results = useSWR(enabled ? url : null, fetcher, {
    refreshInterval: 5000, // Auto-refresh every 5 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 1000,
  });

  // Handle both array and paginated responses
  let items: User[] = [];
  let totalCount = 0;

  if (results.data) {
    if (Array.isArray(results.data)) {
      items = results.data as User[];
      totalCount = items.length;
      console.log('[useUsers] Array response:', { count: totalCount });
    } else if (results.data.results && Array.isArray(results.data.results)) {
      items = results.data.results as User[];
      totalCount = results.data.count || items.length;
      console.log('[useUsers] Paginated response:', { count: totalCount });
    }
  }

  return {
    data: items,
    count: totalCount,
    error: results.error,
    isLoading: results.isLoading,
    isValidating: results.isValidating,
    mutate: results.mutate,
    mutateUsers: results.mutate, // alias if needed
  };
}

export default useUsers;
