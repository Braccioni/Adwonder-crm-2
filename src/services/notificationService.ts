import { supabase } from '../lib/supabase';
import { Notification } from '../types';

export const notificationService = {
  // Get all pending notifications for the current user
  async getPendingNotifications(): Promise<Notification[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('get_pending_notifications', { user_uuid: user.id });

      if (error) {
        console.warn('Notifications table not configured yet:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Notifications service not available:', error);
      return [];
    }
  },

  // Get all notifications (read and unread) for the current user
  async getAllNotifications(): Promise<Notification[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          client:clients(nome_azienda)
        `)
        .eq('user_id', user.id)
        .order('data_notifica', { ascending: false });

      if (error) {
        console.warn('Notifications table not configured yet:', error.message);
        return [];
      }

      return data?.map(notification => ({
        ...notification,
        nome_azienda: notification.client?.nome_azienda
      })) || [];
    } catch (error) {
      console.warn('Notifications service not available:', error);
      return [];
    }
  },

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ letta: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.warn('Notifications table not configured yet:', error.message);
        return;
      }
    } catch (error) {
      console.warn('Mark as read service not available:', error);
    }
  },

  // Mark multiple notifications as read
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ letta: true, updated_at: new Date().toISOString() })
      .in('id', notificationIds);

    if (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  },

  // Generate notifications for all clients (manual trigger)
  async generateNotifications(): Promise<void> {
    try {
      const { error } = await supabase.rpc('generate_contract_notifications');

      if (error) {
        console.warn('Notification generation function not configured yet:', error.message);
        return;
      }
    } catch (error) {
      console.warn('Notification generation service not available:', error);
    }
  },

  // Get notification count for dashboard
  async getNotificationCount(): Promise<{ pending: number; expiring_soon: number }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get pending notifications count
      const { count: pendingCount, error: pendingError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('letta', false)
        .lte('data_notifica', new Date().toISOString().split('T')[0]);

      if (pendingError) {
        console.warn('Notifications table not configured yet:', pendingError.message);
        return { pending: 0, expiring_soon: 0 };
      }

      // Get contracts expiring in next 60 days
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

      const { count: expiringCount, error: expiringError } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('data_scadenza_contratto', 'is', null)
        .gte('data_scadenza_contratto', new Date().toISOString().split('T')[0])
        .lte('data_scadenza_contratto', sixtyDaysFromNow.toISOString().split('T')[0]);

      if (expiringError) {
        console.warn('Contract expiration data not available:', expiringError.message);
        return { pending: pendingCount || 0, expiring_soon: 0 };
      }

      return {
        pending: pendingCount || 0,
        expiring_soon: expiringCount || 0
      };
    } catch (error) {
      console.warn('Notification count service not available:', error);
      return { pending: 0, expiring_soon: 0 };
    }
  },

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Get notifications for a specific client
  async getClientNotifications(clientId: string): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('client_id', clientId)
      .order('data_notifica', { ascending: false });

    if (error) {
      console.error('Error fetching client notifications:', error);
      throw error;
    }

    return data || [];
  }
};