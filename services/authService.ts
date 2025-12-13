import { supabase } from '../lib/supabaseClient';
import { TeamMember } from '../types';

export const authService = {
  /**
   * Login with email and password
   * Enforces minimum security requirements
   */
  async login(email: string, password: string): Promise<TeamMember> {
    // Input validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 6) {
      throw new Error('Invalid credentials');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Login failed: No user data returned');
      }

      return constructTeamMember(data.user);
    } catch (err: any) {
      console.error('Login error:', err);
      throw new Error('Invalid email or password');
    }
  },

  /**
   * Sign up a new user
   * Only allowed if registration is enabled
   */
  async signup(
    email: string,
    password: string,
    fullName: string,
    clinicName: string
  ): Promise<TeamMember> {
    // Input validation
    if (!email || !password || !fullName || !clinicName) {
      throw new Error('All fields are required');
    }

    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (!isStrongPassword(password)) {
      throw new Error('Password must contain uppercase, lowercase, number, and special character');
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            clinic_name: clinicName.trim(),
            role: 'Admin',
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Signup failed: No user data returned');
      }

      return constructTeamMember(data.user);
    } catch (err: any) {
      console.error('Signup error:', err);
      throw new Error(err.message || 'Failed to create account');
    }
  },

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('Logout error:', err);
      throw new Error('Failed to logout');
    }
  },

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (err) {
      console.error('Session error:', err);
      return null;
    }
  },

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (!isStrongPassword(newPassword)) {
      throw new Error('Password must contain uppercase, lowercase, number, and special character');
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    } catch (err: any) {
      console.error('Password change error:', err);
      throw new Error(err.message || 'Failed to change password');
    }
  },

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );
      if (error) throw error;
    } catch (err: any) {
      console.error('Password reset error:', err);
      throw new Error(err.message || 'Failed to send reset email');
    }
  },

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    if (!token) {
      throw new Error('Verification token is required');
    }

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: '',
        token,
        type: 'email',
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Email verification error:', err);
      throw new Error('Invalid or expired verification token');
    }
  },
};

/**
 * Helper: Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Helper: Check password strength
 */
function isStrongPassword(password: string): boolean {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

/**
 * Helper: Construct TeamMember from Supabase user
 */
function constructTeamMember(user: any): TeamMember {
  return {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    role: (user.user_metadata?.role as any) || 'Doctor',
    status: 'Active',
    lastActive: new Date().toISOString(),
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}`,
  };
}
