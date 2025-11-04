# Admin Data Fetching Pattern - Standardization Guide

## Overview

All admin pages now follow a **standardized, error-safe data fetching pattern** with:

✅ **Safe JSON parsing** - No more uncaught SyntaxError exceptions  
✅ **Debounced search** (300ms) - Reduces unnecessary API calls  
✅ **Consistent error handling** - User-friendly error messages  
✅ **Loading states** - Clear UI feedback during data fetching  
✅ **Empty states** - Proper messaging when no data is found  
✅ **Pagination support** - Works seamlessly with backend pagination  

---

## Pattern Implementation

### 1. Core Principles

#### Safe JSON Parsing
```typescript
// ✅ CORRECT - Safe parsing with error handling
const responseText = await response.text();
if (process.env.NODE_ENV === "development") {
  console.log("Raw response:", responseText.substring(0, 500));
}

let data: any;
try {
  data = JSON.parse(responseText);
} catch (parseError) {
  console.error("JSON parse error:", parseError);
  console.error("Response text:", responseText.substring(0, 500));
  throw new Error("Server returned invalid JSON. Please check the console for details.");
}

// ❌ WRONG - Direct parsing can crash the app
const data = await response.json(); // Can throw uncaught SyntaxError!
```

#### Content-Type Validation
```typescript
// Always check content-type before parsing
const contentType = response.headers.get("content-type");
if (!contentType || !contentType.includes("application/json")) {
  throw new Error("Server did not return valid JSON.");
}
```

#### Error Response Handling
```typescript
if (!response.ok) {
  // Try to parse error response safely
  let errorMessage = `Server error: ${response.status} ${response.statusText}`;
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    }
  } catch (parseError) {
    console.error("Error parsing error response:", parseError);
  }
  throw new Error(errorMessage);
}
```

### 2. Debounced Search Implementation

```typescript
import debounce from "lodash/debounce";

// Create debounced version of fetch function
const debouncedFetch = useCallback(
  debounce(() => {
    fetchData();
  }, 300), // 300ms delay
  [fetchData]
);

// Use debounced fetch for search, immediate fetch for other changes
useEffect(() => {
  if (search) {
    debouncedFetch();
  } else {
    fetchData();
  }

  return () => {
    debouncedFetch.cancel(); // Cleanup on unmount
  };
}, [search, page, filters, fetchData, debouncedFetch]);
```

### 3. Search Input with Page Reset

```typescript
// Always reset to page 1 when search changes
<input
  type="text"
  placeholder="Search..."
  value={search}
  onChange={(e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  }}
/>
```

---

## Standardized Pages

### ✅ Appointments Page
- **Endpoint**: `/api/appointments/` (paginated) and `/api/appointments/by_phone/` (search)
- **Features**: Phone number search, status/service filters, date range filtering
- **Search**: Debounced phone number search (digits only)
- **Pagination**: Server-side with 20 items per page

### ✅ Appointment History Page
- **Endpoint**: `/api/history/`
- **Features**: Search by name, phone, or changed by
- **Search**: Debounced server-side search
- **Pagination**: Server-side with 20 items per page

### ✅ Doctors Page
- **Endpoint**: `/api/doctors/`
- **Features**: Service filter, client-side search
- **Search**: Client-side filtering (name, email, phone)
- **Pagination**: None (loads all doctors)

### ✅ Feedback Page
- **Endpoint**: `/api/feedback/`
- **Features**: Server-side search
- **Search**: Debounced server-side search
- **Pagination**: Server-side with 20 items per page

---

## UI States

### Loading State
```typescript
{loading && items.length === 0 ? (
  <tr>
    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
      Loading...
    </td>
  </tr>
) : ...}
```

### Empty State
```typescript
{!loading && items.length === 0 ? (
  <tr>
    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
      No items found
    </td>
  </tr>
) : ...}
```

### Error State
```typescript
{error && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
    {error}
  </div>
)}
```

---

## Common Patterns

### Fetch Function Structure
```typescript
const fetchData = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    // 1. Build URL with parameters
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ...(filter && { filter }),
    });

    const url = `/api/endpoint/?${params}`;
    
    // 2. Fetch data
    const response = await fetch(url);

    // 3. Check response status
    if (!response.ok) {
      // Handle error response safely
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    // 4. Validate content-type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Server did not return valid JSON.");
    }

    // 5. Safe JSON parsing
    const responseText = await response.text();
    if (process.env.NODE_ENV === "development") {
      console.log("Raw response:", responseText.substring(0, 500));
    }

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Response text:", responseText.substring(0, 500));
      throw new Error("Server returned invalid JSON. Please check the console for details.");
    }

    // 6. Handle different response formats
    if (data.results) {
      setItems(data.results);
      setTotalCount(data.count || 0);
    } else if (Array.isArray(data)) {
      setItems(data);
      setTotalCount(data.length);
    } else {
      setItems([]);
      setTotalCount(0);
    }
  } catch (err) {
    console.error("Error fetching data:", err);
    setError(err instanceof Error ? err.message : "Failed to fetch data");
    setItems([]);
    setTotalCount(0);
  } finally {
    setLoading(false);
  }
}, [page, pageSize, filters]);
```

---

## Benefits

### 🛡️ Error Safety
- No more uncaught JSON parsing errors
- Graceful handling of non-JSON responses
- User-friendly error messages
- Console logging for debugging

### ⚡ Performance
- Debounced search reduces API calls
- Prevents race conditions
- Efficient re-rendering

### 🎨 Consistent UX
- Uniform loading states across all pages
- Consistent error messaging
- Predictable search behavior
- Smooth pagination experience

### 🔧 Maintainability
- Standardized pattern across all admin pages
- Easy to debug with console logging
- Clear separation of concerns
- Reusable patterns

---

## Future Enhancements

### Optional: Use Custom Hook
A reusable hook `useAdminDataFetch` has been created at:
`frontend/src/hooks/useAdminDataFetch.ts`

This hook can be used to further simplify data fetching:

```typescript
import { useAdminDataFetch } from "@/hooks/useAdminDataFetch";

const { data, loading, error, totalCount, refetch } = useAdminDataFetch({
  endpoint: "/api/appointments/",
  params: { page, page_size: 20, status: statusFilter },
  searchParam: "phone",
  searchValue: search,
  debounceMs: 300,
});
```

---

## Testing Checklist

When implementing this pattern on a new page:

- [ ] Search is debounced (300ms)
- [ ] Search resets to page 1
- [ ] Loading state shows while fetching
- [ ] Error state displays user-friendly message
- [ ] Empty state shows when no results
- [ ] JSON parsing errors are caught and logged
- [ ] Non-JSON responses are handled gracefully
- [ ] Console logs raw response in development
- [ ] Pagination works correctly
- [ ] Filters work correctly
- [ ] No console errors on valid responses
- [ ] No console errors on invalid responses

---

## Troubleshooting

### "Server returned invalid JSON" error
1. Check the console for the raw response text
2. Verify the backend endpoint is returning valid JSON
3. Check if the endpoint exists and is accessible
4. Verify authentication/authorization

### Search not working
1. Verify debounce is implemented correctly
2. Check if search parameter is being sent to API
3. Verify backend supports the search parameter
4. Check if page is reset to 1 on search

### Pagination issues
1. Verify `totalCount` is being set correctly
2. Check if `page` state is being updated
3. Ensure pagination UI is only shown when needed
4. Verify backend returns correct count

---

## Summary

This standardized pattern ensures:
- **No crashes** from JSON parsing errors
- **Better UX** with debounced search and loading states
- **Easier debugging** with comprehensive error logging
- **Consistent behavior** across all admin pages
- **Maintainable code** with clear patterns

All admin pages (Appointments, History, Doctors, Feedback) now follow this pattern.
