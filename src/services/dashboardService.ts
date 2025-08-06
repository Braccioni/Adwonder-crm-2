import { supabase } from '../lib/supabase';
import { DashboardStats } from '../types';
import { notificationService } from './notificationService';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      // Get total clients
      const { count: total_clients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Get active deals
      const { count: active_deals } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('stato_trattativa', 'in_corso');

      // Get won deals
      const { count: won_deals } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('stato_trattativa', 'vinta');

      // Get lost deals
      const { count: lost_deals } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .eq('stato_trattativa', 'persa');

      // Get total deal value (active deals)
      const { data: activeDealsData } = await supabase
        .from('deals')
        .select('valore_stimato')
        .eq('stato_trattativa', 'in_corso');

      const total_deal_value = activeDealsData?.reduce((sum, deal) => sum + deal.valore_stimato, 0) || 0;

      // Get this week's activities
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { count: this_week_activities } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .gte('data_ora', weekStart.toISOString());

      // Get notification counts
      const notificationCounts = await notificationService.getNotificationCount();

      // Get best client by revenue (sum of won deals)
      const bestClientByRevenue = await this.getBestClientByRevenue();

      // Get best client by contract duration
      const bestClientByContractDuration = await this.getBestClientByContractDuration();

      // Get best sales performance
      const bestSalesPerformance = await this.getBestSalesPerformance();

      return {
        total_clients: total_clients || 0,
        active_deals: active_deals || 0,
        won_deals: won_deals || 0,
        lost_deals: lost_deals || 0,
        total_deal_value,
        this_week_activities: this_week_activities || 0,
        pending_notifications: notificationCounts.pending,
        contracts_expiring_soon: notificationCounts.expiring_soon,
        best_client_by_revenue: bestClientByRevenue || undefined,
        best_client_by_contract_duration: bestClientByContractDuration || undefined,
        best_sales_performance: bestSalesPerformance || undefined
      };
    } catch (error) {
      console.warn('Error loading dashboard stats, returning default values:', error);
      return {
        total_clients: 0,
        active_deals: 0,
        won_deals: 0,
        lost_deals: 0,
        total_deal_value: 0,
        this_week_activities: 0,
        pending_notifications: 0,
        contracts_expiring_soon: 0
      };
    }
  },

  async getBestClientByRevenue() {
    try {
      const { data: wonDeals } = await supabase
        .from('deals')
        .select(`
          valore_stimato,
          clients!inner(nome_azienda)
        `)
        .eq('stato_trattativa', 'vinta');

      if (!wonDeals || wonDeals.length === 0) return undefined;

      const clientRevenue = wonDeals.reduce((acc, deal: any) => {
        const clientName = deal.clients?.nome_azienda;
        if (clientName) {
          acc[clientName] = (acc[clientName] || 0) + deal.valore_stimato;
        }
        return acc;
      }, {} as Record<string, number>);

      const bestClient = Object.entries(clientRevenue).reduce((best, [name, revenue]) => 
        revenue > best.total_revenue ? { nome_azienda: name, total_revenue: revenue } : best,
        { nome_azienda: '', total_revenue: 0 }
      );

      return bestClient.nome_azienda ? bestClient : undefined;
    } catch (error) {
      console.warn('Error getting best client by revenue:', error);
      return undefined;
    }
  },

  async getBestClientByContractDuration() {
    try {
      const { data: clients } = await supabase
        .from('clients')
        .select('nome_azienda, durata_contratto_mesi')
        .not('durata_contratto_mesi', 'is', null)
        .order('durata_contratto_mesi', { ascending: false })
        .limit(1);

      if (!clients || clients.length === 0) return undefined;

      return {
        nome_azienda: clients[0].nome_azienda,
        contract_duration_months: clients[0].durata_contratto_mesi
      };
    } catch (error) {
      console.warn('Error getting best client by contract duration:', error);
      return undefined;
    }
  },

  async getBestSalesPerformance() {
    try {
      // Best month by deals count and value
      const { data: wonDeals } = await supabase
        .from('deals')
        .select('valore_stimato, data_apertura, oggetto_trattativa, clients!inner(nome_azienda)')
        .eq('stato_trattativa', 'vinta');

      if (!wonDeals || wonDeals.length === 0) return undefined;

      // Group by month
      const monthlyStats = wonDeals.reduce((acc, deal: any) => {
        const month = new Date(deal.data_apertura).toISOString().slice(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = { deals_count: 0, total_value: 0 };
        }
        acc[month].deals_count++;
        acc[month].total_value += deal.valore_stimato;
        return acc;
      }, {} as Record<string, { deals_count: number; total_value: number }>);

      const bestMonth = Object.entries(monthlyStats).reduce((best, [month, stats]) => 
        stats.total_value > best.total_value ? { month, ...stats } : best,
        { month: '', deals_count: 0, total_value: 0 }
      );

      // Group by day
      const dailyStats = wonDeals.reduce((acc, deal: any) => {
        const date = deal.data_apertura.split('T')[0]; // YYYY-MM-DD
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const bestDay = Object.entries(dailyStats).reduce((best, [date, count]) => 
        count > best.deals_count ? { date, deals_count: count } : best,
        { date: '', deals_count: 0 }
      );

      // Biggest deal
      const biggestDeal = wonDeals.reduce((biggest: any, deal: any) => 
        deal.valore_stimato > biggest.valore_stimato ? deal : biggest,
        { valore_stimato: 0, oggetto_trattativa: '', clients: { nome_azienda: '' } }
      );

      return {
        best_month: bestMonth.month ? bestMonth : { month: '', deals_count: 0, total_value: 0 },
        best_day: bestDay.date ? bestDay : { date: '', deals_count: 0 },
        biggest_deal: biggestDeal.valore_stimato > 0 ? {
          oggetto_trattativa: biggestDeal.oggetto_trattativa,
          valore_stimato: biggestDeal.valore_stimato,
          client_name: biggestDeal.clients?.nome_azienda || 'N/A'
        } : { oggetto_trattativa: '', valore_stimato: 0, client_name: '' }
      };
    } catch (error) {
      console.warn('Error getting best sales performance:', error);
      return undefined;
    }
  }
};