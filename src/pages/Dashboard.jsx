import React, { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from 'react-router-dom';
import api from "../services/api";
import { statusBadge, parseBackendDateTime } from '../utils';

// small local formatter to avoid adding a dependency on date-fns
function formatDeliveryDate(value) {
  try {
    const maybeDate = (value instanceof Date) ? value : parseBackendDateTime(value) || new Date(value);
    const d = maybeDate;
    if (!d || Number.isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const day = pad(d.getDate());
    const month = pad(d.getMonth() + 1);
    return `${hh}:${mm} ${day}/${month}`;
  } catch (e) {
    return '';
  }
}

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

  const mountedRef = useRef(true);
  const location = useLocation();

  // Orders table (Pedidos do Dia)
  const [dayOrders, setDayOrders] = useState([]);
  // removed per-row selection; printing will use visible orders
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  // helper to format for <input type="datetime-local"> in local timezone
  const formatLocalInput = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const [filterFrom, setFilterFrom] = useState(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return formatLocalInput(d);
  });
  const [filterTo, setFilterTo] = useState(() => {
    const d = new Date();
    d.setHours(23,59,59,999);
    return formatLocalInput(d);
  });
  const STATUS_OPTIONS = [
    { key: 'OrderPlaced', label: 'Realizado' },
    { key: 'Confirmed', label: 'Confirmado' },
    { key: 'Finished', label: 'Concluido' },
  ];
  const [statusFilters, setStatusFilters] = useState(() => new Set(STATUS_OPTIONS.map(s => s.key)));

  const fetchDayOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      // append selected statuses
      Array.from(statusFilters).forEach(s => params.append('status', s));
      // convert local-datetime inputs to ISO strings for backend
      if (filterFrom) params.append('from', new Date(filterFrom).toISOString());
      if (filterTo) params.append('to', new Date(filterTo).toISOString());

      const url = `/api/orders/all?${params.toString()}`;
      const res = await api.get(url);
      const data = res?.data ?? res ?? [];
      // backend returns GetOrderResponse items; normalize to array
      setDayOrders(Array.isArray(data) ? data : (data?.items ?? []));
      // reset selection
      setSelectedOrders(new Set());
    } catch (e) {
      // ignore errors for now
    }
  }, [filterFrom, filterTo, statusFilters]);

  // selection removed — keep no-op to avoid refactor work elsewhere
  const toggleSelectOrder = () => {};

  const handlePrint = async (kitchen = false) => {
    // open printing endpoint in new tab with `ids` query param like OrdersPage
    try {
      const ids = dayOrders.map(o => o?.id).filter(Boolean);
      if (ids.length === 0) return;
      const endpoint = kitchen ? '/api/orders/print/kitchen' : '/api/orders/print';
      const url = `${endpoint}?ids=${encodeURIComponent(ids.join(','))}`;
      window.open(url, '_blank');
    } catch (e) {
      // ignore
    }
  };

  const dayTotal = dayOrders.reduce((s, o) => s + (Number(o?.total) || 0), 0);

  const loadAll = useCallback(async () => {
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
        if (mountedRef.current) setTotalOrders(Number(value) || 0);

        const apiOrderTotal = payload?.orderTotal ?? payload?.orderTotalValue ?? payload?.orderTotalAmount ?? payload?.orderTotal ?? payload?.orderTotalValue;
        if (mountedRef.current && apiOrderTotal !== undefined) setTotalRevenue(Number(apiOrderTotal) || 0);

        const apiAvg = payload?.averageOrderValue ?? payload?.average ?? payload?.average_order_value ?? null;
        if (mountedRef.current && apiAvg !== null && apiAvg !== undefined) setAverageOrderValue(Number(apiAvg) || 0);

        const orderStatus = payload?.orderStatus ?? payload?.orderStatuses ?? null;
        if (mountedRef.current && Array.isArray(orderStatus)) {
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
        if (mountedRef.current) setTotalProducts(pCount);
      } catch (e) {
        // ignore
      }

      // customers/search
      try {
        const cdata = customersPayload ?? [];
        const cCount = Array.isArray(cdata) ? cdata.length : Number(cdata?.total ?? cdata?.count ?? cdata?.length ?? 0) || 0;
        if (mountedRef.current) setTotalCustomers(cCount);
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // overall ignore
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // refresh when sidebar/dashboard is clicked even if route doesn't change
    const handler = () => {
      // invalidate the in-module cache used by fetchOnce so we actually re-fetch
      try {
        delete requestCache['orders_total'];
        delete requestCache['products_all'];
        delete requestCache['customers_search'];
      } catch (e) {
        // ignore
      }

      loadAll();
      // refresh day orders as well
      try { fetchDayOrders(); } catch (e) { }
    };

    try {
      window.addEventListener('dashboard:refresh', handler);
    } catch (e) {
      // ignore if window not available
    }

    return () => {
      mountedRef.current = false;
      try {
        window.removeEventListener('dashboard:refresh', handler);
      } catch (e) {
        // ignore
      }
    };
  }, [loadAll]);

  // When navigating to /dashboard from other routes, ensure we reload.
  useEffect(() => {
    try {
      if (location && location.pathname === '/dashboard') {
        // invalidate cache to force fresh fetch
        try {
          delete requestCache['orders_total'];
          delete requestCache['products_all'];
          delete requestCache['customers_search'];
        } catch (e) {
          // ignore
        }
        loadAll();
        // also fetch day orders
        fetchDayOrders();
      }
    } catch (e) {
      // ignore
    }
  }, [location?.pathname, loadAll, fetchDayOrders]);

  return (
    <>
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

      {/* Pedidos do Dia */}
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-pink-700">Pedidos do Dia</h3>
        <div className="flex items-center space-x-2">
          <button onClick={() => handlePrint(false)} className="bg-pink-500 text-white px-3 py-2 rounded hover:bg-pink-600">Imprimir Conta</button>
          <button onClick={() => handlePrint(true)} className="bg-pink-200 text-pink-700 px-3 py-2 rounded hover:bg-pink-300">Imprimir Cozinha</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Data Inicial</label>
          <input type="datetime-local" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Data Final</label>
          <input type="datetime-local" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={fetchDayOrders} className="bg-pink-100 text-pink-700 px-3 py-1 rounded">Buscar</button>
        </div>
        <div className="flex items-center space-x-3 ml-4">
          {STATUS_OPTIONS.map((s) => (
            <label key={s.key} className="inline-flex items-center space-x-2 text-sm">
              <input type="checkbox" checked={statusFilters.has(s.key)} onChange={() => {
                setStatusFilters(prev => {
                  const next = new Set(prev);
                  if (next.has(s.key)) next.delete(s.key); else next.add(s.key);
                  return next;
                });
              }} />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="text-left text-sm text-gray-600">
              <th className="px-3 py-2">Pedido</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Entrega</th>
              <th className="px-3 py-2">Data Entrega</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {dayOrders.map((o) => (
              <tr key={o?.id} className="border-t text-sm">
                <td className="px-3 py-2">#{o?.id}</td>
                <td className="px-3 py-2">{o?.customerName ?? o?.customer?.name}</td>
                <td className="px-3 py-2">{statusBadge(o?.orderStatus ?? o?.status)}</td>
                <td className="px-3 py-2">{(o?.isDelivery ?? o?.delivery) ? 'Entrega' : 'Retirada'}</td>
                <td className="px-3 py-2">{o?.deliveryDate ? formatDeliveryDate(o.deliveryDate) : ''}</td>
                <td className="px-3 py-2 text-right">R$ {Number(o?.total || o?.amount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-4">
        <div className="text-sm text-gray-700">Total do Dia: <strong>R$ {dayTotal.toFixed(2)}</strong></div>
      </div>
      </div>
    </>
  );
};

export default Dashboard;
