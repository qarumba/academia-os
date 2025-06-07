interface HeliconeRequest {
  id: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
  status: 'success' | 'error' | 'pending';
  created_at: string;
  provider: string;
  user_id?: string;
}

interface HeliconeStats {
  total_requests: number;
  total_cost: number;
  total_tokens: number;
  average_response_time: number;
  success_rate: number;
  recent_requests: HeliconeRequest[];
}

export class HeliconeService {
  private static readonly API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? '/api/helicone' 
    : 'http://localhost:3001/api/helicone';

  private static getHeliconeConfig() {
    const modelConfig = localStorage.getItem("modelConfig");
    if (modelConfig) {
      const config = JSON.parse(modelConfig);
      // Use provider-specific Helicone endpoints
      const endpoint = config.provider === 'anthropic' 
        ? "https://anthropic.helicone.ai" 
        : "https://oai.helicone.ai/v1";
      
      return {
        endpoint,
        key: config.heliconeKey,
        provider: config.provider
      };
    }
    return null;
  }

  static isHeliconeConfigured(): boolean {
    const config = this.getHeliconeConfig();
    return !!(config?.key); // Only check for key since endpoint is provider-specific
  }

  /**
   * Get Helicone configuration for specific provider
   */
  static getHeliconeConfigForProvider(provider: 'openai' | 'anthropic') {
    const config = this.getHeliconeConfig();
    if (!config?.key) return null;

    const endpoint = provider === 'anthropic' 
      ? "https://anthropic.helicone.ai" 
      : "https://oai.helicone.ai/v1";

    return {
      endpoint,
      key: config.key,
      headers: {
        "Helicone-Auth": `Bearer ${config.key}`,
        "Helicone-Cache-Enabled": "true",
      }
    };
  }

  /**
   * Fetch recent requests from Helicone API via server proxy
   */
  static async getRecentRequests(limit: number = 50): Promise<HeliconeRequest[]> {
    const config = this.getHeliconeConfig();
    if (!config?.key) return [];

    try {
      const response = await fetch(`${this.API_BASE_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: config.key,
          limit
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        if (response.status === 401) {
          console.warn('Helicone API: Invalid or missing API key. Please check your Helicone configuration.');
        } else {
          console.warn(`Helicone API request failed: ${response.status}`, errorData);
        }
        return [];
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error: any) {
      if (error?.message?.includes('fetch')) {
        console.error('Helicone server unavailable. Please ensure the server is running on port 3001.');
        return [];
      }
      console.error('Failed to fetch Helicone data:', error);
      return [];
    }
  }

  /**
   * Get aggregated statistics
   */
  static async getSessionStats(since?: Date): Promise<HeliconeStats> {
    const requests = await this.getRecentRequests();
    
    // Filter by session start time if provided
    const filteredRequests = since 
      ? requests.filter(req => new Date(req.created_at) >= since)
      : requests;

    const totalCost = filteredRequests.reduce((sum, req) => sum + (req.cost || 0), 0);
    const totalTokens = filteredRequests.reduce((sum, req) => sum + (req.total_tokens || 0), 0);
    const successfulRequests = filteredRequests.filter(req => req.status === 'success');

    return {
      total_requests: filteredRequests.length,
      total_cost: totalCost,
      total_tokens: totalTokens,
      average_response_time: 0, // Calculate if available in API
      success_rate: filteredRequests.length > 0 ? successfulRequests.length / filteredRequests.length : 0,
      recent_requests: filteredRequests.slice(0, 10)
    };
  }

  /**
   * Track session start time for cost tracking
   */
  static startSession() {
    localStorage.setItem('academia_session_start', new Date().toISOString());
  }

  static getSessionStartTime(): Date | null {
    const startTime = localStorage.getItem('academia_session_start');
    return startTime ? new Date(startTime) : null;
  }

  /**
   * Test Helicone API connectivity via server proxy
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    const config = this.getHeliconeConfig();
    if (!config?.key) {
      return { success: false, message: 'No Helicone API key configured' };
    }

    // Debug logging to see what's being sent
    console.log('Debug: Testing Helicone with key:', config.key ? `${config.key.substring(0, 15)}...` : 'None');
    console.log('Debug: Using server proxy at:', this.API_BASE_URL);

    try {
      const response = await fetch(`${this.API_BASE_URL}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: config.key
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
        return { 
          success: false, 
          message: errorData.message || `Server error: ${response.status}` 
        };
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      if (error?.message?.includes('fetch')) {
        return { 
          success: false, 
          message: 'Cannot connect to Helicone server. Please ensure the server is running on port 3001.' 
        };
      }
      return { 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Safely handle API requests with graceful fallback
   */
  static async safeApiCall<T>(apiCall: () => Promise<T>, fallbackValue: T): Promise<T> {
    try {
      return await apiCall();
    } catch (error) {
      console.warn('Helicone API call failed, using fallback:', error);
      return fallbackValue;
    }
  }
}