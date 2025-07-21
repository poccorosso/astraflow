/**
 * Session Manager
 * Manages session IDs for conversation tracking
 */

// Generate a unique session ID
export const generateSessionId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `session_${timestamp}_${randomStr}`;
};

// Get current session ID from localStorage or generate new one
export const getCurrentSessionId = (): string => {
  const stored = localStorage.getItem('current_session_id');
  if (stored) {
    return stored;
  }
  
  const newSessionId = generateSessionId();
  localStorage.setItem('current_session_id', newSessionId);
  return newSessionId;
};

// Start a new session
export const startNewSession = (): string => {
  const newSessionId = generateSessionId();
  localStorage.setItem('current_session_id', newSessionId);
  
  // Store session start time
  localStorage.setItem(`session_${newSessionId}_start`, new Date().toISOString());
  
  return newSessionId;
};

// Get session info
export const getSessionInfo = (sessionId: string) => {
  const startTime = localStorage.getItem(`session_${sessionId}_start`);
  return {
    id: sessionId,
    startTime: startTime ? new Date(startTime) : null,
    displayId: sessionId.split('_').slice(-1)[0].toUpperCase() // Show last part in uppercase
  };
};

// Format session ID for display
export const formatSessionId = (sessionId: string): string => {
  const parts = sessionId.split('_');
  if (parts.length >= 3) {
    return parts[parts.length - 1].toUpperCase();
  }
  return sessionId.substring(0, 8).toUpperCase();
};

// Update session last activity time
export const updateSessionActivity = (sessionId: string): void => {
  localStorage.setItem(`session_${sessionId}_last_activity`, new Date().toISOString());

  // Also ensure session start time exists
  const startKey = `session_${sessionId}_start`;
  if (!localStorage.getItem(startKey)) {
    localStorage.setItem(startKey, new Date().toISOString());
  }
};

// Get session last activity time
export const getSessionLastActivity = (sessionId: string): Date | null => {
  const lastActivity = localStorage.getItem(`session_${sessionId}_last_activity`);
  const startTime = localStorage.getItem(`session_${sessionId}_start`);

  // Return last activity time if available, otherwise start time
  const timeStr = lastActivity || startTime;
  return timeStr ? new Date(timeStr) : null;
};

// Get all session IDs from localStorage, sorted by last activity
export const getAllSessionIds = (): string[] => {
  const sessions: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('session_') && key.endsWith('_start')) {
      const sessionId = key.replace('_start', '');
      sessions.push(sessionId);
    }
  }
  return sessions.sort((a, b) => {
    const timeA = getSessionLastActivity(a);
    const timeB = getSessionLastActivity(b);

    if (!timeA && !timeB) return 0;
    if (!timeA) return 1;
    if (!timeB) return -1;

    return timeB.getTime() - timeA.getTime(); // Most recent first
  });
};
