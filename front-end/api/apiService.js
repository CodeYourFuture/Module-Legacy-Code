// api/apiService.js
class ApiService {
  constructor(baseUrl = "http://127.0.0.1:3000") {
    this.baseUrl = baseUrl;
    this.token = null;
    this.currentUser = null;
  }

  // ==== AUTH METHODS ====
  async login(username, password) {
    try {
      const response = await this._post("/login", {username, password});

      // Backend returns { success: true, token: "..." }
      if (response.success && response.token) {
        this.token = response.token;

        // Create a user object with the username
        const userData = {
          username: username,
          token: response.token,
        };

        return {
          success: true,
          access_token: response.token,
          user: userData,
        };
      }

      return response;
    } catch (error) {
      return {
        success: false,
        detail: error.message,
      };
    }
  }

  async signup(username, password, displayName) {
    try {
      // Use /register instead of /signup
      const response = await this._post("/register", {
        username,
        password,
        // Note: backend doesn't use displayName
      });

      if (response.success && response.token) {
        this.token = response.token;

        // Create user object
        const userData = {
          username: username,
          token: response.token,
          displayName: displayName || username,
        };

        return {
          success: true,
          access_token: response.token,
          user: userData,
        };
      }

      return response;
    } catch (error) {
      return {
        success: false,
        detail: error.message,
      };
    }
  }

  async logout() {
    this.token = null;
    this.currentUser = null;
    return {success: true};
  }

  // ==== TWEET METHODS ====
  async getFeed() {
    return this._get("/blooms/feed");
  }

  async getBlooms() {
    return this._get("/blooms");
  }

  async postBloom(content) {
    return this._post("/bloom", {content});
  }

  async likeBloom(bloomId) {
    return this._post(`/blooms/${bloomId}/like`);
  }

  // ==== USER METHODS ====
  async getProfile() {
    console.log("[ApiService] Getting profile");
    try {
      const response = await this._get("/profile");
      console.log("[ApiService] Profile response:", response);
      return response;
    } catch (error) {
      console.error("[ApiService] Profile error:", error);
      // Return null instead of throwing to prevent component errors
      return null;
    }
  }

  async getUserProfile(username) {
    // If no username is provided, return null to prevent API errors
    if (!username || username.trim() === "") {
      console.error(
        "[ApiService] Invalid or empty username provided for profile request"
      );
      return null;
    }

    console.log(`[ApiService] Getting user profile: ${username}`);

    try {
      const response = await this._get(`/profile/${username}`);
      console.log("[ApiService] User profile response:", response);
      return response;
    } catch (error) {
      console.error("[ApiService] User profile error:", error);
      // Return null instead of throwing to prevent component errors
      return null;
    }
  }

  async followUser(username) {
    return this._post(`/users/${username}/follow`);
  }

  // ==== HELPER METHODS ====
  async _get(endpoint) {
    try {
      console.log(`[ApiService] GET request to: ${this.baseUrl}${endpoint}`);
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: this._getHeaders(),
        mode: "cors",
        // No credentials option - we're using token auth in headers
      });
      return this._handleResponse(response);
    } catch (error) {
      console.error(`[ApiService] GET error for ${endpoint}:`, error);
      return null;
    }
  }

  async _post(endpoint, data) {
    try {
      console.log(
        `[ApiService] POST request to: ${this.baseUrl}${endpoint}`,
        data
      );
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: this._getHeaders(),
        body: JSON.stringify(data),
        mode: "cors",
        // No credentials option - we're using token auth in headers
      });
      return this._handleResponse(response);
    } catch (error) {
      console.error(`[ApiService] POST error for ${endpoint}:`, error);
      return {
        success: false,
        detail: error.message,
      };
    }
  }

  _getHeaders() {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (this.token) {
      // Ensure the token is properly formatted for JWT
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async _handleResponse(response) {
    try {
      // Log response status and headers for debugging
      console.log(`[ApiService] Response status: ${response.status}`);

      if (!response.ok) {
        console.error(
          `[ApiService] Error response: ${response.status} ${response.statusText}`
        );

        // Try to parse the error response as JSON
        try {
          const errorData = await response.json();
          return {
            success: false,
            detail:
              errorData.reason ||
              `API error: ${response.status} ${response.statusText}`,
            status: response.status,
          };
        } catch (parseError) {
          return {
            success: false,
            detail: `API error: ${response.status} ${response.statusText}`,
            status: response.status,
          };
        }
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return data;
      } else {
        console.warn("[ApiService] Response is not JSON");
        return {
          success: true,
          message: "Operation completed but response was not JSON",
        };
      }
    } catch (error) {
      console.error("[ApiService] Error handling response:", error);
      return {
        success: false,
        detail: error.message || "Failed to process response",
      };
    }
  }
}

export const apiService = new ApiService();
