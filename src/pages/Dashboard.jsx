import React, { useEffect, useState } from "react";
import api from "../services/api";

// Simple in-module cache to avoid duplicate network requests across mounts
const requestCache = {};
function fetchOnce(key, fn) {
  if (requestCache[key]) {
    return requestCache[key] instanceof Promise ? requestCache[key] : Promise.resolve(requestCache[key]);
  }

  const p = fn()
    .then((res) => {
      const data = res?.data ?? res ?? null;
      requestCache[key] = data;
      return data;
    })
    .catch((err) => {
      // remove cache entry on error so future attempts can retry
      delete requestCache[key];
      throw err;
    });

  requestCache[key] = p;
  return p;
}

const Dashboard = ({ orders = [], customers = [], products = [] }) => {
  const [totalOrders, setTotalOrders] = useState(orders?.length || 0);
  const [statusCounts, setStatusCounts] = useState(() => {
    const map = {};
    (orders || []).forEach((o) => {
      if (!o) return;
      map[o.status] = (map[o.status] || 0) + 1;
    });
    return map;
  });
  const [totalProducts, setTotalProducts] = useState(products?.length || 0);
  const [totalCustomers, setTotalCustomers] = useState(customers?.length || 0);
  const [totalRevenue, setTotalRevenue] = useState(() => (orders || []).reduce((sum, o) => sum + (Number(o?.total) || 0), 0));
  const [averageOrderValue, setAverageOrderValue] = useState(() => {
    const rev = (orders || []).reduce((sum, o) => sum + (Number(o?.total) || 0), 0);
    return totalOrders > 0 ? rev / totalOrders : 0;
  });

  useEffect(() => {
    let mounted = true;

    async function loadAll() {
      try {
        const [ordersPayload, productsPayload, customersPayload] = await Promise.all([
          fetchOnce('orders_total', () => api.get('/api/orders/total')),
          fetchOnce('products_all', () => api.get('/api/products/all-product')),
          fetchOnce('customers_search', () => api.get('/api/customers/search')),
        ]);

        // orders/total
        try {
          const payload = ordersPayload ?? {};
          const value = payload?.total ?? payload?.orderTotal ?? payload?.orderTotalValue ?? 0;
          if (mounted) setTotalOrders(Number(value) || 0);

          const apiOrderTotal = payload?.orderTotal ?? payload?.orderTotalValue ?? payload?.orderTotalAmount ?? payload?.orderTotal ?? payload?.orderTotalValue;
          if (mounted && apiOrderTotal !== undefined) setTotalRevenue(Number(apiOrderTotal) || 0);

          const apiAvg = payload?.averageOrderValue ?? payload?.average ?? payload?.average_order_value ?? null;
          if (mounted && apiAvg !== null && apiAvg !== undefined) setAverageOrderValue(Number(apiAvg) || 0);

          const orderStatus = payload?.orderStatus ?? payload?.orderStatuses ?? null;
          if (mounted && Array.isArray(orderStatus)) {
            const map = {};
            orderStatus.forEach((it) => {
              const key = it?.status ?? it?.key ?? '';
              const qty = Number(it?.quantity ?? it?.count ?? it?.qty ?? 0) || 0;
              if (key) map[key] = qty;
            });
            setStatusCounts((prev) => ({ ...prev, ...map }));
          }
        } catch (e) {
          // ignore per-endpoint parse errors
        }

        // products/all-product
        try {
          const pdata = productsPayload ?? [];
          const pCount = Array.isArray(pdata) ? pdata.length : Number(pdata?.total ?? pdata?.count ?? pdata?.length ?? 0) || 0;
          if (mounted) setTotalProducts(pCount);
        } catch (e) {
          // ignore
        }

        // customers/search
        try {
          const cdata = customersPayload ?? [];
          const cCount = Array.isArray(cdata) ? cdata.length : Number(cdata?.total ?? cdata?.count ?? cdata?.length ?? 0) || 0;
          if (mounted) setTotalCustomers(cCount);
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // overall ignore
      }
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-pink-700 mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Total de Pedidos</h3>
          <p className="text-3xl font-bold text-pink-600 mt-2">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Receita Total</h3>
          <p className="text-3xl font-bold text-pink-600 mt-2">R$ {totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Ticket Médio</h3>
          <p className="text-3xl font-bold text-pink-600 mt-2">R$ {averageOrderValue.toFixed(2)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-pink-700 mb-4">Status dos Pedidos</h3>
          {[
            { key: 'OrderPlaced', label: 'Pedido Realizado' },
            { key: 'Confirmed', label: 'Pedido Confirmado' },
            { key: 'Finished', label: 'Concluido' },
          ].map((s) => {
            const count = statusCounts[s.key] ?? (orders.filter((o) => o.status === s.key).length);
            return (
              <p key={s.key} className="text-sm text-gray-700 mb-2">
                {s.label}: <strong>{count}</strong>
              </p>
            );
          })}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-pink-700 mb-4">Resumo</h3>
          <p className="text-sm text-gray-700 mb-2">Total de Clientes: <strong>{totalCustomers}</strong></p>
          <p className="text-sm text-gray-700 mb-2">Total de Produtos: <strong>{totalProducts}</strong></p>
          <p className="text-sm text-gray-700">Pedidos Concluídos: <strong>{statusCounts['Finished'] ?? orders.filter((o) => o.status === 'Finished').length}</strong></p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
