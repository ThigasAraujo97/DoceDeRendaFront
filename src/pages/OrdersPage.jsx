import React, { useState, useEffect } from "react";
import { toastError } from "../utils/toast";
import { useTable } from "../hooks/useTable";
import { parseBackendDateTime, statusBadge } from "../utils";
import OrderEditor from "./OrderEditor";

const OrdersPage = ({ openOrder }) => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(15);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const d = parseBackendDateTime(dateString) || new Date(dateString);
    if (!d || isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR") + " " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders/all");
      if (!res.ok) throw new Error("Erro ao buscar pedidos");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toastError("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAllOrders(); }, []);

  useEffect(() => {
    const fetchAux = async () => {
      try {
        const cres = await fetch('/api/customers/search');
        if (cres.ok) {
          const cdata = await cres.json();
          setCustomers(Array.isArray(cdata) ? cdata : []);
        }
      } catch (err) {}

      try {
        const pres = await fetch('/api/products/all-product');
        if (pres.ok) {
          const pdata = await pres.json();
          const normalized = Array.isArray(pdata)
            ? pdata.map((p) => ({ ...p, productStatus: p.productStatus ?? p.status ?? null }))
            : [];
          setProducts(normalized);
        }
      } catch (err) {}
    };
    fetchAux();
  }, []);

  useEffect(() => {
    const fetchFilteredOrders = async () => {
      setLoading(true);
      try {
        if (searchTerm && searchTerm.trim() && !filterStatus && !dateFrom && !dateTo) {
          const name = encodeURIComponent(searchTerm.trim());
          const res = await fetch(`/api/orders/customer-name/${name}`);
          if (!res.ok) throw new Error("Erro na busca por nome");
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
        } else {
          const params = new URLSearchParams();
          if (searchTerm && searchTerm.trim()) params.append("search", searchTerm.trim());
          if (filterStatus) params.append("status", filterStatus);
          if (dateFrom) params.append("from", dateFrom);
          if (dateTo) params.append("to", dateTo);

          const url = "/api/orders/all" + (params.toString() ? `?${params.toString()}` : "");
          const res = await fetch(url);
          if (!res.ok) throw new Error("Erro na busca");
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchFilteredOrders, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, filterStatus, dateFrom, dateTo]);

  const table = useTable(orders, pageSize);

  const printForKitchen = () => {
      try {
        if (!orders || orders.length === 0) return toastError("Nenhum pedido para imprimir");
      const ids = orders.map((o) => o.id).filter(Boolean).join(",");
        if (!ids) return toastError("Nenhum pedido válido para imprimir");
      const target = `/api/orders/print/kitchen?ids=${encodeURIComponent(ids)}`;
      window.open(target, "_blank");
    } catch (e) {
      console.error(e);
        toastError("Erro ao gerar impressão para cozinha");
    }
  };

  const printFiltered = () => {
      try {
        if (!orders || orders.length === 0) return toastError("Nenhum pedido para imprimir");
      const ids = orders.map((o) => o.id).filter(Boolean).join(",");
        if (!ids) return toastError("Nenhum pedido válido para imprimir");
      const target = `/api/orders/print?ids=${encodeURIComponent(ids)}`;
      window.open(target, "_blank");
    } catch (e) {
      console.error(e);
        toastError("Erro ao gerar impressão");
    }
  };

  useEffect(() => { table.setCurrentPage(1); }, [pageSize]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-pink-700">Pedidos</h1>
        <button
          onClick={() => setEditingOrderId(0)}
          className="bg-pink-600 text-white px-4 py-2 rounded-xl hover:bg-pink-700"
        >
          + Novo Pedido
        </button>
      </div>

      <div className="mb-4 flex gap-2 items-center">
        <input
          type="text"
          placeholder="Buscar por nome do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
        />

        <button
          onClick={fetchAllOrders}
          className="bg-white border border-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center"
          title="Recarregar pedidos"
          aria-label="Recarregar pedidos"
        >
          <span className="text-lg" aria-hidden>⟳</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowPrintOptions((s) => !s)}
            className="ml-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"
            title="Opções de impressão"
          >
            <span>Impressão</span>
            <span aria-hidden>🖨️</span>
          </button>

          {showPrintOptions && (
            <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded shadow p-2 z-40">
              <button
                onClick={() => { setShowPrintOptions(false); printFiltered(); }}
                className="w-full text-left bg-white border border-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-50 text-sm"
              >
                Imprimir
              </button>

              <button
                onClick={() => { setShowPrintOptions(false); printForKitchen(); }}
                className="w-full text-left mt-2 bg-white border border-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-50 text-sm"
              >
                Imprimir Cozinha
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowAdvancedFilters((s) => !s)}
          className="ml-2 text-sm text-pink-600 hover:underline"
        >
          {showAdvancedFilters ? 'Fechar filtros' : 'Filtros avançados'}
        </button>
      </div>

      {showAdvancedFilters && (
        <div className="fixed right-0 top-20 h-[calc(100vh-5rem)] w-80 bg-white border-l shadow-lg p-4 z-50 overflow-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-pink-700">Filtros Avançados</h3>
            <button onClick={() => setShowAdvancedFilters(false)} className="text-gray-500">✕</button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Todos</option>
                <option value="OrderPlaced">Pedido Realizado</option>
                <option value="Confirmed">Pedido Confirmado</option>
                <option value="Finished">Concluído</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">De</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Até</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Itens por página</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead className="bg-pink-100 text-pink-700">
            <tr>
              <th className="px-3 py-2">Pedido</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Data Entrega</th>
              <th className="px-3 py-2">Entrega</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-6 text-gray-500">Carregando pedidos...</td>
              </tr>
            ) : table.pageData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-gray-500">Nenhum pedido encontrado</td>
              </tr>
            ) : (
              table.pageData.map((o) => (
                <tr
                  key={o.id}
                  className="border-t hover:bg-pink-50 cursor-pointer"
                  onClick={() => setEditingOrderId(o.id)}
                >
                  <td className="font-mono text-sm">#{o.id}</td>
                  <td>{o.customerName}</td>
                  <td>{formatDateTime(o.deliveryDate)}</td>
                  <td>{o.isDelivery ? "Entrega" : "Retirada"}</td>
                  <td>{statusBadge(o.orderStatus || o.status)}</td>
                  <td>R$ {Number(o.total || 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: table.totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => table.setCurrentPage(page)}
            className={`px-3 py-1 rounded ${
              table.currentPage === page
                ? "bg-pink-600 text-white"
                : "bg-pink-100 hover:bg-pink-200"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {editingOrderId !== null && (
        <OrderEditor
          orderId={editingOrderId === 0 ? null : editingOrderId}
          orders={orders}
          setOrders={setOrders}
          onClose={() => setEditingOrderId(null)}
          customers={customers}
          setCustomers={setCustomers}
          products={products}
          setProducts={setProducts}
          setEditingOrderId={setEditingOrderId}
        />
      )}
    </div>
  );
};

export default OrdersPage;
