import { useState, useEffect, useCallback, useRef } from "react";
import debounce from "lodash/debounce";

interface FetchOptions {
  endpoint: string;
  params?: Record<string, any>;
  searchParam?: string;
  searchValue?: string;
  debounceMs?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface UseFetchDataResult<T> {
  data: T[];
  loading: boolean;
  error: string;
  totalCount: number;
  refetch: () => void;
}

/**
 * Standardized hook for fetching admin data with:
 * - Debounced search (300ms default)
 * - Safe JSON parsing with error handling
 * - Loading and error states
 * - Pagination support
 */
export function useAdminDataFetch<T = any>(
  options: FetchOptions
): UseFetchDataResult<T> {
  const {
    endpoint,
    params = {},
    searchParam,
    searchValue,
    debounceMs = 300,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Add search parameter if provided
      if (searchValue && searchParam) {
        queryParams.append(searchParam, searchValue);
      }

      // Add other parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, String(value));
        }
      });

      const url = `${endpoint}?${queryParams.toString()}`;
      
      // Fetch with proper error handling
      const response = await fetch(url);

      // Check if response is ok
      if (!response.ok) {
        // Try to parse error response
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } else {
            const textError = await response.text();
            if (textError) {
              errorMessage = textError.substring(0, 200); // Limit error message length
            }
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }

        throw new Error(errorMessage);
      }

      // Safe JSON parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server did not return valid JSON. Content-Type: " + (contentType || "unknown"));
      }

      // Get response text first for debugging
      const responseText = await response.text();
      
      // Log raw response in development
      if (process.env.NODE_ENV === "development") {
        console.log("Raw response:", responseText.substring(0, 500));
      }

      // Parse JSON safely
      let jsonData;
      try {
        jsonData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Response text:", responseText.substring(0, 500));
        throw new Error("Server returned invalid JSON. Please check the console for details.");
      }

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      // Handle different response formats
      if (jsonData.results && Array.isArray(jsonData.results)) {
        // Paginated response
        setData(jsonData.results);
        setTotalCount(jsonData.count || 0);
      } else if (Array.isArray(jsonData)) {
        // Direct array response
        setData(jsonData);
        setTotalCount(jsonData.length);
      } else {
        // Unexpected format
        console.warn("Unexpected response format:", jsonData);
        setData([]);
        setTotalCount(0);
      }

      if (onSuccess) {
        onSuccess(jsonData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch data";
      
      if (isMountedRef.current) {
        setError(errorMessage);
        setData([]);
        setTotalCount(0);
      }

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [endpoint, params, searchParam, searchValue, onSuccess, onError]);

  // Debounced version for search
  const debouncedFetch = useCallback(
    debounce(() => {
      fetchData();
    }, debounceMs),
    [fetchData, debounceMs]
  );

  // Effect for fetching data
  useEffect(() => {
    // Use debounced fetch if searching, otherwise fetch immediately
    if (searchValue) {
      debouncedFetch();
    } else {
      fetchData();
    }

    // Cleanup
    return () => {
      debouncedFetch.cancel();
    };
  }, [searchValue, fetchData, debouncedFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    totalCount,
    refetch: fetchData,
  };
}
