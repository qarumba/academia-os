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
  private static getHeliconeConfig() {
    const modelConfig = localStorage.getItem("modelConfig");
    if (modelConfig) {
      const config = JSON.parse(modelConfig);
      return {
        endpoint: config.heliconeEndpoint,
        key: config.heliconeKey
      };
    }
    return null;
  }

  static isHeliconeConfigured(): boolean {
    const config = this.getHeliconeConfig();
    return !!(config?.endpoint && config?.key);
  }

  /**
   * Fetch recent requests from Helicone API
   */
  static async getRecentRequests(limit: number = 50): Promise<HeliconeRequest[]> {
    const config = this.getHeliconeConfig();
    if (!config?.key) return [];

    try {
      const response = await fetch(`https://api.helicone.ai/v1/request`, {
        headers: {
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Helicone API request failed');
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
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
}