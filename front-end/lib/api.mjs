import {state} from "../index.mjs";
// === ABOUT THE STATE
// state gives you these two functions only
// updateState(stateKey, newValues)
// destroyState()
// here are your state keys
// currentUser: null,
// currentProfile: null,
// isLoggedIn: false,
// profiles: {}, // Keyed by username
// blooms: {}, // Keyed by username

// ===== ABOUT THE BACKEND in main.py

// backend endpoints you have available and what success returns
// /login and  /register
// { "success": true, "token": access_token }
// /profile
// {"username": username,
// "follows": [username, username2]),
// "followers": [username, username2]) }

// /profile/<profile_username>
// {"username": "profile_username",
//  "recent_blooms": [{bloom}, {10 blooms total}],
//  "follows": [username, username2],
//  "followers": [username, username2],
//  "is_following": Boolean,
//  "is_self": Boolean,
//  "total_blooms": Number }

// /follow and /bloom
// { "success": true}

// /bloom/<id_str>
// {bloom object tba}

// /home and /blooms/<profile_username>
// [{users_bloom}, {users_blooms}]

// btw a bloom object is composed thus
// {"id": Number,
// "sender": username,
// "content": "string from textarea",
// "sent_timestamp": "datetime as ISO 8601 formatted string"}
//

// Base URL for API requests
const API_BASE_URL = "/api";

// Helper function for making API requests
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
    // Add CORS mode to handle cross-origin requests
    mode: "cors",
    // Include credentials like cookies if needed
    credentials: "include",
  };

  const fetchOptions = {...defaultOptions, ...options};

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

    // Check if the response is ok (status 200-299)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(
        errorData.message ||
          `API error: ${response.status} ${response.statusText}`
      );
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Check if response is json
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    } else {
      return {success: true};
    }
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

// Auth methods
async function login(username, password) {
  try {
    const data = await apiRequest("/login", {
      method: "POST",
      body: JSON.stringify({username, password}),
    });

    if (data.success && data.token) {
      localStorage.setItem("token", data.token);
      state.updateState("currentUser", username);
      state.updateState("isLoggedIn", true);
    } else {
      throw new Error(data.message || "Login failed");
    }

    return data;
  } catch (error) {
    // Clear any sensitive data
    state.updateState("isLoggedIn", false);
    state.updateState("currentUser", null);
    throw error;
  }
}

async function signup(username, password) {
  try {
    const data = await apiRequest("/register", {
      method: "POST",
      body: JSON.stringify({username, password}),
    });

    if (data.success && data.token) {
      localStorage.setItem("token", data.token);
      state.updateState("currentUser", username);
      state.updateState("isLoggedIn", true);
    } else {
      throw new Error(data.message || "Registration failed");
    }

    return data;
  } catch (error) {
    // Ensure failed signup doesn't leave partial state
    state.updateState("isLoggedIn", false);
    state.updateState("currentUser", null);
    throw error;
  }
}

function logout() {
  try {
    localStorage.removeItem("token");
    state.destroyState();
  } catch (error) {
    console.error("Logout failed", error);
    // Try to remove token anyway
    localStorage.removeItem("token");
    throw error;
  }
}

// Bloom methods
async function getBlooms(username) {
  try {
    // If username is provided, get blooms for that profile
    // Otherwise, get blooms for home feed
    const endpoint = username ? `/blooms/${username}` : "/home";
    const blooms = await apiRequest(endpoint);

    if (username) {
      // Store blooms for this specific profile
      state.updateState("profiles", {
        [username]: {
          ...state.profiles[username],
          blooms,
        },
      });
    } else {
      // Store home feed blooms
      state.updateState("blooms", blooms);
    }

    return blooms;
  } catch (error) {
    // Set empty blooms on error to prevent UI from breaking
    if (username) {
      state.updateState("profiles", {
        [username]: {
          ...state.profiles[username],
          blooms: [],
        },
      });
    } else {
      state.updateState("blooms", []);
    }
    throw error;
  }
}

async function postBloom(content) {
  try {
    const data = await apiRequest("/bloom", {
      method: "POST",
      body: JSON.stringify({content}),
    });

    // If successful, refresh home blooms
    if (data.success) {
      try {
        await getBlooms();
      } catch (refreshError) {
        console.error("Failed to refresh blooms after posting", refreshError);
        // Continue since the post was successful
      }
    } else {
      throw new Error(data.message || "Failed to post bloom");
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// User methods
async function getProfile(username) {
  try {
    const endpoint = username ? `/profile/${username}` : "/profile";
    const profileData = await apiRequest(endpoint);

    if (username) {
      // Store profile data for this specific username
      state.updateState("profiles", {
        [username]: {
          ...state.profiles[username],
          ...profileData,
        },
      });
      state.updateState("currentProfile", username);
    } else {
      // Store current user's profile data
      state.updateState("currentUser", profileData.username);
    }

    return profileData;
  } catch (error) {
    // Set default profile values on error
    if (username) {
      state.updateState("profiles", {
        [username]: {
          ...state.profiles[username],
        },
      });
    }
    throw error;
  }
}

async function followUser(username) {
  try {
    const data = await apiRequest("/follow", {
      method: "POST",
      body: JSON.stringify({username}),
    });

    // If successful, refresh the profile to update follow status
    if (data.success) {
      try {
        await getProfile(username);
      } catch (refreshError) {
        console.error(
          "Failed to refresh profile after following",
          refreshError
        );
        // Continue since the follow was successful
      }
    } else {
      throw new Error(data.message || "Failed to follow user");
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// here are the functions you need to export
export const apiService = {
  // Auth methods
  login,
  signup,
  logout,

  // Bloom methods
  getBlooms,
  postBloom,

  // User methods
  getProfile,
  followUser,
};
