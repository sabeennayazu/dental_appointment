import useSWR from 'swr';
import { Appointment } from '@/lib/types';

const API_BASE = '/api';

// Define the shape of the API response
interface PaginatedApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Fetcher function for SWR with better error handling
const fetcher = async (url: string) => {
  console.log('[SWR Fetcher] Fetching:', url);
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    try {
      const data = await res.json();
      error.message = data.detail || data.message || error.message;
    } catch (e) {
      error.message = res.statusText;
    }
    (error as any).status = res.status;
    console.error('[SWR Fetcher] Error:', error);
    throw error;
  }
  
  const data = await res.json();
  console.log('[SWR Fetcher] Success:', { url, hasResults: !!data.results, dataLength: Array.isArray(data) ? data.length : data.results?.length });
  return data;
};

// Hook for fetching appointments with filters
export function useAppointments({
  page = 1,
  pageSize = 20,
  status = '',
  service = '',
  dateFrom = '',
  dateTo = '',
  phone = '',
  includeHistory = true, // Include historical appointments by default
  enabled = true,
}: {
  page?: number;
  pageSize?: number;
  status?: string;
  service?: string;
  dateFrom?: string;
  dateTo?: string;
  phone?: string;
  includeHistory?: boolean;
  enabled?: boolean;
} = {}) {
  // Build query parameters for regular appointments endpoint
  const params = new URLSearchParams();
  if (page) params.set('page', page.toString());
  if (pageSize) params.set('page_size', pageSize.toString());
  if (status) params.set('status', status);
  if (service) params.set('service', service);
  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);

  // Build the URL - use different endpoints for phone search vs regular list
  let url: string;
  
  if (phone) {
    // Use dedicated by_phone endpoint for phone searches
    url = `${API_BASE}/appointments/by_phone/?phone=${encodeURIComponent(phone)}`;
    console.log('[useAppointments] Phone search URL:', url);
  } else {
    // Use regular paginated endpoint for all other queries
    url = `${API_BASE}/appointments/?${params.toString()}`;
    console.log('[useAppointments] Regular list URL:', url);
  }

  // Use SWR to fetch data - single endpoint only
  const results = useSWR(
    enabled ? url : null,
    fetcher,
    {
      refreshInterval: 2000, // Auto-refresh every 2 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 1000, // Dedupe requests within 1 second
    }
  );

  // Process results based on response structure
  let items: Appointment[] = [];
  let totalCount = 0;

  if (results.data) {
    if (Array.isArray(results.data)) {
      // by_phone endpoint returns an array directly
      items = results.data as Appointment[];
      totalCount = items.length;
      console.log('[useAppointments] Array response:', { count: totalCount, items: items.length });
    } else if (results.data.results && Array.isArray(results.data.results)) {
      // Regular appointments endpoint returns paginated response
      items = results.data.results as Appointment[];
      totalCount = results.data.count || items.length;
      console.log('[useAppointments] Paginated response:', { count: totalCount, items: items.length });
    }
  }

  return {
    data: items,
    count: totalCount,
    error: results.error,
    isLoading: results.isLoading,
    isValidating: results.isValidating,
    mutate: results.mutate,
  };
}
