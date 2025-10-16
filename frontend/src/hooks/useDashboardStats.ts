/**
 * Hook para obtener estadísticas del dashboard administrativo
 */

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalSocios: number;
  cuotasPendientes: number;
  eventosActivos: number;
  comunicados: number;
  loading: boolean;
  error: string | null;
}

export function useDashboardStats(): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>({
    totalSocios: 0,
    cuotasPendientes: 0,
    eventosActivos: 0,
    comunicados: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };

      // Obtener total de socios
      const sociosResponse = await fetch('/api/admin/socios?limit=1', { headers });
      const sociosData = await sociosResponse.json();
      const totalSocios = sociosData.data?.pagination?.total || 0;

      // Obtener cuotas pendientes
      const cuotasResponse = await fetch('/api/admin/cuotas?estado=pendiente&limit=1', { headers });
      const cuotasData = await cuotasResponse.json();
      const cuotasPendientes = cuotasData.data?.pagination?.total || 0;

      // Obtener eventos activos (usando endpoint de eventos)
      const eventosResponse = await fetch('/api/eventos?limit=1', { headers });
      const eventosData = await eventosResponse.json();
      const eventosActivos = eventosData.pagination?.total || 0;

      // Obtener comunicados (noticias)
      const noticiasResponse = await fetch('/api/noticias?limit=1', { headers });
      const noticiasData = await noticiasResponse.json();
      const comunicados = noticiasData.pagination?.total || 0;

      setStats({
        totalSocios,
        cuotasPendientes,
        eventosActivos,
        comunicados,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('[useDashboardStats] Error loading stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar estadísticas',
      }));
    }
  };

  return stats;
}
