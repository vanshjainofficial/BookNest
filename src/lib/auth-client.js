

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
        
        const parts = token.split('.');
        if (parts.length !== 3) {
          
          removeToken();
          return null;
        }
        
        
        const payload = JSON.parse(atob(parts[1]));
        
        return payload;
      } catch (error) {
        
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
    
    return false;
  }
  
  
  const now = Date.now() / 1000;
  const isExpired = user.exp <= now;
  
  if (isExpired) {
    
    removeToken();
    return false;
  }
  
  
  return true;
}
