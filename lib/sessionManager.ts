/**
 * Session Manager - Handles JWT tokens, session lifecycle, and refresh logic
 */

const SESSION_STORAGE_KEY = 'juaafya_session';
const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // Refresh when 5 minutes left

interface SessionData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  userId: string;
  email: string;
}

export class SessionManager {
  private session: SessionData | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private listeners: Array<(isValid: boolean) => void> = [];

  constructor() {
    this.loadSession();
    this.startSessionMonitor();
  }

  /**
   * Load session from storage
   */
  private loadSession(): void {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (this.isSessionValid(data)) {
          this.session = data;
        } else {
          this.clearSession();
        }
      }
    } catch (err) {
      console.warn('Failed to load session:', err);
      this.clearSession();
    }
  }

  /**
   * Save session to storage
   */
  private saveSession(): void {
    if (this.session) {
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.session));
      } catch (err) {
        console.warn('Failed to save session:', err);
      }
    }
  }

  /**
   * Check if session is valid
   */
  private isSessionValid(session: SessionData): boolean {
    if (!session || !session.accessToken) return false;
    // Check if token is expired
    return session.expiresAt > Date.now();
  }

  /**
   * Set session from auth response
   */
  setSession(accessToken: string, userId: string, email: string, expiresIn: number = 3600): void {
    this.session = {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
      userId,
      email,
    };
    this.saveSession();
    this.notifyListeners(true);
    this.resetSessionMonitor();
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    if (!this.session || !this.isSessionValid(this.session)) {
      this.clearSession();
      return null;
    }
    return this.session.accessToken;
  }

  /**
   * Get current session data
   */
  getSession(): SessionData | null {
    if (!this.session || !this.isSessionValid(this.session)) {
      this.clearSession();
      return null;
    }
    return this.session;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }

  /**
   * Get time remaining in session (in milliseconds)
   */
  getTimeRemaining(): number {
    if (!this.session) return 0;
    const remaining = this.session.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Refresh session token
   */
  async refreshSession(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.session?.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      if (data.accessToken && data.expiresIn) {
        this.setSession(data.accessToken, data.userId, data.email, data.expiresIn);
        return true;
      }
    } catch (err) {
      console.error('Session refresh error:', err);
      this.clearSession();
    }
    return false;
  }

  /**
   * Clear session
   */
  clearSession(): void {
    this.session = null;
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this.stopSessionMonitor();
    this.notifyListeners(false);
  }

  /**
   * Subscribe to session changes
   */
  onSessionChange(listener: (isValid: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of session change
   */
  private notifyListeners(isValid: boolean): void {
    this.listeners.forEach((listener) => {
      try {
        listener(isValid);
      } catch (err) {
        console.error('Error in session listener:', err);
      }
    });
  }

  /**
   * Start session monitoring
   */
  private startSessionMonitor(): void {
    this.refreshTimer = setInterval(() => {
      if (!this.session) return;

      const timeRemaining = this.getTimeRemaining();

      // Refresh token if less than threshold remaining
      if (timeRemaining < REFRESH_THRESHOLD_MS && timeRemaining > 0) {
        this.refreshSession();
      }

      // Logout if session expired
      if (timeRemaining <= 0) {
        this.clearSession();
      }
    }, 60000); // Check every minute
  }

  /**
   * Reset session monitor
   */
  private resetSessionMonitor(): void {
    this.stopSessionMonitor();
    this.startSessionMonitor();
  }

  /**
   * Stop session monitoring
   */
  private stopSessionMonitor(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this.clearSession();
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
