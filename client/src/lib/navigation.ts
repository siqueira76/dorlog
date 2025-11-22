// Utility for consistent navigation
// Firebase Hosting uses root path ("/") - no base path needed

/**
 * Navigate to a path
 * Use this instead of direct window.location.href calls
 */
export function navigateToPath(path: string): void {
  console.log('🧭 Navigation:', {
    requestedPath: path,
    fullPath: path
  });
  
  window.location.href = path;
}

/**
 * Get the full URL for a path
 */
export function getFullPath(path: string): string {
  return path;
}

/**
 * Create a navigation helper for wouter's navigate function
 */
export function createNavigate(routerNavigate: (path: string) => void) {
  return (path: string) => {
    console.log('🧭 Router Navigation:', {
      requestedPath: path
    });
    
    routerNavigate(path);
  };
}