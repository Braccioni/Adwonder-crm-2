import { supabase } from '../lib/supabase';
import { Activity } from '../types';

export const activityService = {
  async getAll(): Promise<Activity[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        client:clients(*),
        deal:deals(*)
      `)
      .eq('user_id', user.id)
      .order('data_ora', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(activity: Omit<Activity, 'id' | 'created_at' | 'client' | 'deal'>): Promise<Activity> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('activities')
      .insert([{ ...activity, user_id: user.id }])
      .select(`
        *,
        client:clients(*),
        deal:deals(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Activity>): Promise<Activity> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        client:clients(*),
        deal:deals(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
  }
};