import type { BcsjdApiDataItem } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BCSJD_API_BASE_URL || "https://api.bcsjd.example.com/v1";
// API Key should ideally be used server-side only. If needed client-side, ensure it's safe.
// const API_KEY = process.env.BCSJD_API_KEY; // For server-side
const PUBLIC_API_KEY = process.env.NEXT_PUBLIC_BCSJD_API_KEY; // If a public key is used client-side

interface FetchOptions extends RequestInit {
  // Add any custom options if needed
}

async function fetchFromBcsjdApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add API key to headers if available and configured for client-side use
  if (PUBLIC_API_KEY) {
    // Assuming Bearer token, adjust if it's a custom header like 'X-API-Key'
    // headers['Authorization'] = `Bearer ${PUBLIC_API_KEY}`; 
     headers['X-API-Key'] = PUBLIC_API_KEY;
  }
  
  // If called from server action, you might use the server-only API_KEY
  // This example is more geared towards client-side or Next.js API routes calling this.

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = { message: response.statusText };
      }
      throw new Error(`API request failed with status ${response.status}: ${errorBody?.message || 'Unknown error'}`);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    console.error(`Error fetching from BCSJD API endpoint ${endpoint}:`, error);
    throw error; // Re-throw to be handled by the caller
  }
}

// Example function to get some data items
export async function getBcsjdKeyMetrics(): Promise<BcsjdApiDataItem[]> {
  // Replace '/key-metrics' with your actual endpoint
  // This is a placeholder and might need adjustments based on real API structure
  try {
    const data = await fetchFromBcsjdApi<BcsjdApiDataItem[]>('/key-metrics');
    return data;
  } catch (error) {
    // Return some mock data or an empty array on error for graceful UI handling
    console.warn("BCSJD API fetch failed, returning mock data for UI purposes.");
    return [
      { id: 1, name: "Active Users (Mock)", value: Math.floor(Math.random() * 1000), category: "Engagement", lastUpdated: new Date().toISOString() },
      { id: 2, name: "Data Processed (Mock)", value: Math.floor(Math.random() * 10000) + " GB", category: "Operations", lastUpdated: new Date().toISOString() },
      { id: 3, name: "System Uptime (Mock)", value: "99.95%", category: "Reliability", lastUpdated: new Date().toISOString() },
    ];
  }
}

// Add more functions here to interact with other BCSJD API endpoints as needed.
// For example:
// export async function postBcsjdData(data: any): Promise<any> {
//   return fetchFromBcsjdApi('/submit-data', {
//     method: 'POST',
//     body: JSON.stringify(data),
//   });
// }
