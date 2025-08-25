import useAuthStore from '../store/authStore';

/**
 * Enhanced fetch wrapper with automatic token refresh
 */
class ApiClient {
  constructor(baseURL = '') {
    // Resolve API base URL safely across build tools (Vite, CRA) and environments
    const resolvedBase =
      baseURL ||
      // Vite style env
      (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
      // CRA / Node style env (guard process for browsers)
      (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) ||
      // Optional global config
      (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.API_URL) ||
      '';
    this.baseURL = resolvedBase;
    this.refreshPromise = null;
  }

  /**
   * Get authorization headers
   */
  getAuthHeaders() {
    const accessToken = useAuthStore.getState().getAccessToken();
    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }

  /**
   * Refresh the access token
   */
  async refreshToken() {
    // If already refreshing, wait for the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Create new refresh promise
    this.refreshPromise = useAuthStore.getState().refreshAccessToken();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } catch (error) {
      // Clear auth on refresh failure
      useAuthStore.getState().clearTokens();
      throw error;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Make an API request with automatic retry on 401
   */
  async request(url, options = {}, retryOnUnauthorized = true) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // Merge headers with auth headers
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    // Make the request
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401 && retryOnUnauthorized) {
        const isRefreshing = useAuthStore.getState().getIsRefreshing();
        
        // Don't retry if we're already refreshing or if this is a refresh request
        if (!isRefreshing && !url.includes('/auth/refresh')) {
          try {
            // Attempt to refresh token
            await this.refreshToken();
            
            // Retry the original request with new token
            return this.request(url, options, false);
          } catch (error) {
            // Refresh failed, redirect to login
            useAuthStore.getState().logout();
            throw new Error('Session expired. Please login again.');
          }
        }
      }

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return response.text();
    } catch (error) {
      // Network error or other fetch errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Convenience methods for different HTTP verbs
   */
  get(url, options = {}) {
    return this.request(url, {
      ...options,
      method: 'GET',
    });
  }

  post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(url, options = {}) {
    return this.request(url, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Upload file with multipart/form-data
   */
  async upload(url, formData, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    // Don't set Content-Type for FormData, let browser set it with boundary
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };
    delete headers['Content-Type'];

    const response = await fetch(fullUrl, {
      ...options,
      method: options.method || 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export both the class and the instance
export { ApiClient };
export default apiClient;
