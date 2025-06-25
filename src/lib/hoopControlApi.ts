import type { BcsjdApiDataItem } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_HOOP_CONTROL_API_BASE_URL || "https://api.hoopcontrol.example.com/v1";
const PUBLIC_API_KEY = process.env.NEXT_PUBLIC_HOOP_CONTROL_API_KEY;

interface FetchOptions extends RequestInit {}

async function fetchFromHoopControlApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (PUBLIC_API_KEY) {
     headers['X-API-Key'] = PUBLIC_API_KEY;
  }
  
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorBody;
    try {
      errorBody = await response.json();
    } catch (e) {
      errorBody = { message: response.statusText };
    }
    const errorMessage = `API request to ${endpoint} failed with status ${response.status}: ${errorBody?.message || 'Unknown error'}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}


export async function getKeyMetrics(): Promise<{data: BcsjdApiDataItem[], isMock: boolean}> {
  try {
    const data = await fetchFromHoopControlApi<BcsjdApiDataItem[]>('/key-metrics');
    return { data, isMock: false };
  } catch (error) {
    console.warn("Hoop Control API fetch failed, returning mock data for UI purposes.");
    const mockData = [
      { id: 1, name: "Usuarios Activos (Ejemplo)", value: Math.floor(Math.random() * 1000), category: "Interacción", lastUpdated: new Date().toISOString() },
      { id: 2, name: "Datos Procesados (Ejemplo)", value: Math.floor(Math.random() * 10000) + " GB", category: "Operaciones", lastUpdated: new Date().toISOString() },
      { id: 3, name: "Disponibilidad del Sistema (Ejemplo)", value: "99.95%", category: "Fiabilidad", lastUpdated: new Date().toISOString() },
    ];
    return { data: mockData, isMock: true };
  }
}
