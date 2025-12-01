/**
 * Gestión de Ecommerce (Productos y Órdenes)
 * ACA Chile Frontend
 */

import React, { useState } from 'react';
import { Package, ShoppingCart } from 'lucide-react';

export default function AdminEcommerce() {
  type EcommerceTab = 'productos' | 'ordenes';
  const [activeTab, setActiveTab] = useState<EcommerceTab>('productos');

  // Lazy load de componentes
  const AdminProducts = React.lazy(() => import('./AdminProducts'));
  const AdminOrders = React.lazy(() => import('./AdminOrders'));

  const tabs: Array<{
    id: EcommerceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'productos', label: 'Productos (SKUs)', icon: Package },
    { id: 'ordenes', label: 'Órdenes de Compra', icon: ShoppingCart }
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-neutral-900">Gestión de Ecommerce</h1>
          <p className="text-neutral-600 mt-1">Administra productos y órdenes de la tienda</p>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <nav className="flex space-x-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary-600 text-primary-600 font-semibold'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          }
        >
          {activeTab === 'productos' && <AdminProducts />}
          {activeTab === 'ordenes' && <AdminOrders />}
        </React.Suspense>
      </div>
    </div>
  );
}
