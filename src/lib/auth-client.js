// Client-side authentication utilities

export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export function setToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

export function getCurrentUser() {
  if (typeof window !== 'undefined') {
    const token = getToken();
    if (token) {
      try {
        // JWT token has 3 parts separated by dots
        const parts = token.split('.');
        if (parts.length !== 3) {
          // Invalid token format
          removeToken();
          return null;
        }
        
        // Decode the payload (middle part)
        const payload = JSON.parse(atob(parts[1]));
        // Token decoded successfully
        return payload;
      } catch (error) {
        // Error decoding token
        removeToken();
        return null;
      }
    }
  }
  return null;
}

export function isAuthenticated() {
  const user = getCurrentUser();
  if (!user) {
    // No user found in token
    return false;
  }
  
  // Check if token is expired
  const now = Date.now() / 1000;
  const isExpired = user.exp <= now;
  
  if (isExpired) {
    // Token expired
    removeToken();
    return false;
  }
  
  // User is authenticated
  return true;
}
