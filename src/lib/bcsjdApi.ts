import type { BcsjdApiDataItem } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_HOOP_CONTROL_API_BASE_URL || "https://api.hoopcontrol.example.com/v1";
const PUBLIC_API_KEY = process.env.NEXT_PUBLIC_HOOP_CONTROL_API_KEY;

interface FetchOptions extends RequestInit {
  // Add any custom options if needed
}

async function fetchFromHoopControlApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
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
    console.error(`Error fetching from Hoop Control API endpoint ${endpoint}:`, error);
    throw error; // Re-throw to be handled by the caller
  }
}

// Example function to get some data items
export async function getKeyMetrics(): Promise<{data: BcsjdApiDataItem[], isMock: boolean}> {
  // Replace '/key-metrics' with your actual endpoint
  // This is a placeholder and might need adjustments based on real API structure
  try {
    const data = await fetchFromHoopControlApi<BcsjdApiDataItem[]>('/key-metrics');
    return { data, isMock: false };
  } catch (error) {
    // Return some mock data or an empty array on error for graceful UI handling
    console.warn("Hoop Control API fetch failed, returning mock data for UI purposes.");
    const mockData = [
      { id: 1, name: "Active Users (Mock)", value: Math.floor(Math.random() * 1000), category: "Engagement", lastUpdated: new Date().toISOString() },
      { id: 2, name: "Data Processed (Mock)", value: Math.floor(Math.random() * 10000) + " GB", category: "Operations", lastUpdated: new Date().toISOString() },
      { id: 3, name: "System Uptime (Mock)", value: "99.95%", category: "Reliability", lastUpdated: new Date().toISOString() },
    ];
    return { data: mockData, isMock: true };
  }
}

// Add more functions here to interact with other Hoop Control API endpoints as needed.
// For example:
// export async function postData(data: any): Promise<any> {
//   return fetchFromHoopControlApi('/submit-data', {
//     method: 'POST',
//     body: JSON.stringify(data),
//   });
// }
