import { supabase } from '../lib/supabase';
import { Deal } from '../types';

export const dealService = {
  async getAll(): Promise<Deal[]> {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          client:clients(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn('Error fetching deals, returning empty array:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Deal | null> {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.warn('Error fetching deal by id, returning null:', error);
      return null;
    }
  },

  async create(deal: Omit<Deal, 'id' | 'created_at' | 'updated_at' | 'client'>): Promise<Deal> {
    try {
      const { data, error } = await supabase
        .from('deals')
        .insert([deal])
        .select(`
          *,
          client:clients(*)
        `)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Error creating deal:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<Deal>): Promise<Deal> {
    try {
      const { data, error } = await supabase
        .from('deals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          client:clients(*)
        `)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Error updating deal:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.warn('Error deleting deal:', error);
      throw error;
    }
  }
};