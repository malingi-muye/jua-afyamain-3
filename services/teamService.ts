/**
 * Team Management Service
 * Handles user invitations, role management, and team operations
 */

import { TeamMember, Role } from '../types';
import { supabase } from '../lib/supabaseClient';
import { validation } from '../lib/validation';
import { auditLogger } from './auditService';
import { apiClient } from '../lib/apiClient';

export interface InvitationRequest {
  id: string;
  email: string;
  role: Role;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  token: string;
}

export interface TeamStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  pendingInvitations: number;
  membersByRole: Record<Role, number>;
}

/**
 * Team Service - Manage clinic staff and roles
 */
class TeamService {
  /**
   * Invite user to clinic
   */
  async inviteTeamMember(
    email: string,
    role: Role,
    invitedBy: string,
    clinicId?: string
  ): Promise<InvitationRequest> {
    // Validate email
    if (!validation.isValidEmail(email)) {
      throw new Error('Invalid email address');
    }

    if (!role || !this.isValidRole(role)) {
      throw new Error('Invalid role');
    }

    // Check if user already exists
    try {
      const { data: existingUser } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existingUser) {
        throw new Error('User already exists in the clinic');
      }
    } catch (err: any) {
      if (err.code !== 'PGRST116') {
        throw err; // Rethrow if not "not found" error
      }
    }

    const token = this.generateInvitationToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation: InvitationRequest = {
      id: `inv-${Date.now()}`,
      email: email.toLowerCase(),
      role,
      status: 'pending',
      invitedBy,
      invitedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      token,
    };

    // Save invitation to database
    try {
      const { error } = await supabase.from('invitations').insert({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        invited_by: invitation.invitedBy,
        invited_at: invitation.invitedAt,
        expires_at: invitation.expiresAt,
        token: invitation.token,
      });

      if (error) throw error;

      // Log audit
      await auditLogger.log(invitedBy, 'System', 'USER_CREATE', 'TeamMember', invitation.id, {
        resourceName: email,
        status: 'success',
        metadata: { email, role },
      });

      // Send invitation email (placeholder)
      await this.sendInvitationEmail(email, role, token);
    } catch (err: any) {
      console.error('Error creating invitation:', err);
      throw new Error('Failed to send invitation');
    }

    return invitation;
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(token: string, password: string, fullName: string): Promise<TeamMember> {
    if (!token || !password || !fullName) {
      throw new Error('Missing required information');
    }

    if (!validation.isStrongPassword(password)) {
      throw new Error('Password does not meet security requirements');
    }

    // Find invitation
    try {
      const { data: invitation, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !invitation) {
        throw new Error('Invalid invitation token');
      }

      // Check if expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      if (invitation.status !== 'pending') {
        throw new Error('Invitation has already been used');
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: invitation.role,
          },
        },
      });

      if (authError || !authData.user) {
        throw new Error('Failed to create account');
      }

      // Update invitation status
      await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      // Create team member record
      const teamMember: TeamMember = {
        id: authData.user.id,
        name: fullName,
        email: invitation.email,
        role: invitation.role,
        status: 'Active',
        lastActive: new Date().toISOString(),
      };

      await auditLogger.log(
        authData.user.id,
        fullName,
        'USER_CREATE',
        'TeamMember',
        authData.user.id,
        { status: 'success', metadata: { email: invitation.email, role: invitation.role } }
      );

      return teamMember;
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      throw new Error(err.message || 'Failed to accept invitation');
    }
  }

  /**
   * Update team member role
   */
  async updateTeamMemberRole(userId: string, newRole: Role, updatedBy: string): Promise<void> {
    if (!this.isValidRole(newRole)) {
      throw new Error('Invalid role');
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await auditLogger.log(updatedBy, 'System', 'USER_UPDATE', 'TeamMember', userId, {
        status: 'success',
        changes: { role: { old: 'Unknown', new: newRole } },
      });
    } catch (err: any) {
      console.error('Error updating team member:', err);
      throw new Error('Failed to update team member');
    }
  }

  /**
   * Deactivate team member
   */
  async deactivateTeamMember(userId: string, deactivatedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'Deactivated' })
        .eq('id', userId);

      if (error) throw error;

      await auditLogger.log(deactivatedBy, 'System', 'USER_UPDATE', 'TeamMember', userId, {
        status: 'success',
        metadata: { action: 'deactivate' },
      });
    } catch (err: any) {
      console.error('Error deactivating team member:', err);
      throw new Error('Failed to deactivate team member');
    }
  }

  /**
   * Reactivate team member
   */
  async reactivateTeamMember(userId: string, reactivatedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'Active', lastActive: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      await auditLogger.log(reactivatedBy, 'System', 'USER_UPDATE', 'TeamMember', userId, {
        status: 'success',
        metadata: { action: 'reactivate' },
      });
    } catch (err: any) {
      console.error('Error reactivating team member:', err);
      throw new Error('Failed to reactivate team member');
    }
  }

  /**
   * Remove team member
   */
  async removeTeamMember(userId: string, removedBy: string): Promise<void> {
    try {
      const { error } = await supabase.from('team_members').delete().eq('id', userId);

      if (error) throw error;

      await auditLogger.log(removedBy, 'System', 'USER_DELETE', 'TeamMember', userId, {
        status: 'success',
      });
    } catch (err: any) {
      console.error('Error removing team member:', err);
      throw new Error('Failed to remove team member');
    }
  }

  /**
   * Get all team members
   */
  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase.from('team_members').select('*');

      if (error || !data) return [];

      return data.map((member: any) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        status: member.status,
        lastActive: member.last_active,
        avatar: member.avatar,
      }));
    } catch (err) {
      console.error('Error fetching team members:', err);
      return [];
    }
  }

  /**
   * Get pending invitations
   */
  async getPendingInvitations(): Promise<InvitationRequest[]> {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error || !data) return [];

      return data.map((inv: any) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        status: inv.status,
        invitedBy: inv.invited_by,
        invitedAt: inv.invited_at,
        expiresAt: inv.expires_at,
        token: inv.token,
      }));
    } catch (err) {
      console.error('Error fetching invitations:', err);
      return [];
    }
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(invitationId: string, cancelledBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (error) throw error;

      await auditLogger.log(cancelledBy, 'System', 'USER_DELETE', 'Invitation', invitationId, {
        status: 'success',
      });
    } catch (err: any) {
      console.error('Error cancelling invitation:', err);
      throw new Error('Failed to cancel invitation');
    }
  }

  /**
   * Get team statistics
   */
  async getTeamStats(): Promise<TeamStats> {
    try {
      const members = await this.getTeamMembers();
      const invitations = await this.getPendingInvitations();

      const stats: TeamStats = {
        totalMembers: members.length,
        activeMembers: members.filter((m) => m.status === 'Active').length,
        inactiveMembers: members.filter((m) => m.status !== 'Active').length,
        pendingInvitations: invitations.length,
        membersByRole: {
          SuperAdmin: members.filter((m) => m.role === 'SuperAdmin').length,
          Admin: members.filter((m) => m.role === 'Admin').length,
          Doctor: members.filter((m) => m.role === 'Doctor').length,
          Nurse: members.filter((m) => m.role === 'Nurse').length,
          Receptionist: members.filter((m) => m.role === 'Receptionist').length,
          Pharmacist: members.filter((m) => m.role === 'Pharmacist').length,
          'Lab Tech': members.filter((m) => m.role === 'Lab Tech').length,
          Accountant: members.filter((m) => m.role === 'Accountant').length,
        },
      };

      return stats;
    } catch (err) {
      console.error('Error calculating team stats:', err);
      return {
        totalMembers: 0,
        activeMembers: 0,
        inactiveMembers: 0,
        pendingInvitations: 0,
        membersByRole: {} as Record<Role, number>,
      };
    }
  }

  /**
   * Private: Validate role
   */
  private isValidRole(role: any): boolean {
    const validRoles: Role[] = [
      'SuperAdmin',
      'Admin',
      'Doctor',
      'Nurse',
      'Receptionist',
      'Pharmacist',
      'Lab Tech',
      'Accountant',
    ];
    return validRoles.includes(role);
  }

  /**
   * Private: Generate invitation token
   */
  private generateInvitationToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Send invitation email
   */
  private async sendInvitationEmail(email: string, role: Role, token: string): Promise<void> {
    try {
      // Call backend email service
      await apiClient.post('/email/send-invitation', {
        email,
        role,
        token,
        acceptUrl: `${window.location.origin}/accept-invitation?token=${token}`,
      });
    } catch (err) {
      console.warn('Failed to send invitation email:', err);
      // Don't throw - invitation was created successfully
    }
  }
}

export const teamService = new TeamService();
