import React, { useState, useEffect } from "react";
import ExternalDashboard from "./src/pages/Dashboard.jsx";
// auth helper removed; logout handled by page reload

// ===================== TYPES =====================
// Customer, Product, Order, OrderStatus types (represented in JSDoc comments for plain JS)
const OrderStatusDisplay = {
  OrderPlaced: "Pedido Realizado",
  Confirmed: "Pedido Confirmado",
  Finished: "Concluído",
};

// ===== Utilitário: parsear strings de data do backend =====
const parseBackendDateTime = (dateString) => {
  if (!dateString) return null;
  // If ISO or Date-parsable, use Date
  const tryIso = new Date(dateString);
  if (!isNaN(tryIso.getTime())) return tryIso;

  // Try dd/MM/yyyy HH:mm or dd/MM/yyyyTHH:mm
  const m = String(dateString).match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})$/);
  if (m) {
    const [, dd, mm, yyyy, hh, min] = m;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
  }

  // Try yyyy-MM-dd HH:mm
  const m2 = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (m2) {
    const [, yyyy, mm, dd, hh, min] = m2;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
  }

  return null;
};

// ===================== MODAL =====================
const Modal = ({ isOpen, title, children, onClose, large }) => {
  if (!isOpen) return null;
  // larger modal for complex editors — more breathing room on wide screens
  const sizeClass = large ? "w-11/12 md:w-11/12 lg:w-4/5 max-w-7xl" : "w-96";
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-lg ${sizeClass} max-h-[92vh] flex flex-col`}>
        <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-pink-700">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// ===================== SIDEBAR =====================
const Sidebar = ({ page, setPage }) => {
  const user = typeof window !== "undefined" ? localStorage.getItem("authUser") : null;
  const [theme, setTheme] = useState(typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'pink') : 'pink');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('theme-pink', 'theme-blue');
      document.body.classList.add(`theme-${theme}`);
      try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
    }
  }, [theme]);

  return (
    <aside className="w-64 bg-pink-100 p-4 hidden md:block">
      <h2 className="text-xl font-bold text-pink-700 mb-6">🍰 Thiago Araujo</h2>
      {['Dashboard', 'Pedidos', 'Clientes', 'Produtos'].map((p) => (
        <button
          key={p}
          onClick={() => setPage(p)}
          className={`block w-full text-left px-3 py-2 rounded mb-2 ${
            page === p ? "bg-pink-300" : "hover:bg-pink-200"
          }`}
        >
          {p}
        </button>
      ))}

      <div className="mt-6 border-t pt-4">
        <div className="text-sm text-gray-600 mb-2">{user ? `Olá, ${user}` : ''}</div>
        <div className="flex gap-2 mb-3">
          <div className="text-sm text-gray-600 mr-2 self-center">Tema:</div>
          <button
            onClick={() => setTheme('pink')}
            className={`px-3 py-2 rounded ${theme === 'pink' ? 'bg-pink-300 text-pink-700' : 'bg-white border text-sm'}`}
          >
            Rosa
          </button>

          <button
            onClick={() => setTheme('blue')}
            className={`px-3 py-2 rounded ${theme === 'blue' ? 'bg-blue-800 text-white' : 'bg-white border text-sm'}`}
          >
            Azul
          </button>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full text-left px-3 py-2 rounded bg-white border border-gray-200 hover:bg-gray-50 text-sm"
        >
          Sair
        </button>
      </div>
    </aside>
  );
};

// ===================== USE TABLE HOOK =====================
const useTable = (data, pageSize = 5) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const sortedData = sortColumn
    ? [...data].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      })
    : data;

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const pageData = sortedData.slice(startIdx, startIdx + pageSize);

  return {
    pageData,
    currentPage,
    totalPages,
    setCurrentPage,
    sortColumn,
    setSortColumn,
    sortOrder,
    setSortOrder,
  };
};

const productStatusLabel = (s) => {
  if (!s) return "-";
  const map = { Activated: "Ativo", Removed: "Removido" };
  return map[s] || s;
};

// Helper: render status badge with color per status
// variant: 'block' fills the table cell width; 'inline' is compact for editor
const statusBadge = (status, variant = "block") => {
  const raw = status || "";
  // Accept either internal keys (OrderPlaced/Confirmed/Finished) or Portuguese labels
  let key = raw;
  if (!Object.prototype.hasOwnProperty.call(OrderStatusDisplay, key)) {
    const found = Object.keys(OrderStatusDisplay).find((k) => OrderStatusDisplay[k] === raw);
    if (found) key = found;
  }
  const label = OrderStatusDisplay[key] || raw || "-";
  const baseBlock = "block w-full text-center rounded-md py-1 text-sm font-semibold";
  const baseInline = "inline-block px-3 py-1 text-sm font-semibold rounded";
  const base = variant === "inline" ? baseInline : baseBlock;

  if (key === "Confirmed") return <span className={`${base} bg-green-50 border border-green-200 text-green-700`}>{label}</span>;
  if (key === "Finished") return <span className={`${base} bg-blue-50 border border-blue-200 text-blue-700`}>{label}</span>;
  // default -> OrderPlaced (amarelo claro)
  return <span className={`${base} bg-yellow-50 border border-yellow-200 text-yellow-800`}>{label}</span>;
};

// ===================== ORDERS PAGE =====================
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

  // ===== Utilitário: formatar data =====
  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const d = parseBackendDateTime(dateString) || new Date(dateString);
    if (!d || isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR") + " " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  // ===== 1️⃣ Carregar todos os pedidos =====
  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders/all");
      if (!res.ok) throw new Error("Erro ao buscar pedidos");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  // ===== 2️⃣ Buscar com filtros: nome, status e intervalo de datas =====
  useEffect(() => {
    const fetchFilteredOrders = async () => {
      setLoading(true);
      try {
        // If only searching by customer name (no other filters), use dedicated endpoint
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

  // ===== TABELA (paginação) =====
  const table = useTable(orders, pageSize);

  // ===== 4.1️⃣ Imprimir somente para a cozinha (formato reduzido) =====
  const printForKitchen = () => {
    try {
      if (!orders || orders.length === 0) return alert("Nenhum pedido para imprimir");
      const ids = orders.map((o) => o.id).filter(Boolean).join(",");
      if (!ids) return alert("Nenhum pedido válido para imprimir");
      // usa a rota do backend para impressão de cozinha
      const target = `/api/orders/print/kitchen?ids=${encodeURIComponent(ids)}`;
      window.open(target, "_blank");
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar impressão para cozinha");
    }
  };

  // ===== 4️⃣ Imprimir pedidos filtrados/visíveis (abrir endpoint de impressão) =====
  const printFiltered = () => {
    try {
      // Preferir imprimir os pedidos atualmente visíveis na página da tabela
      const source = (table && table.pageData && table.pageData.length > 0) ? table.pageData : orders;
      if (!source || source.length === 0) return alert("Nenhum pedido para imprimir");
      const ids = source.map((o) => o.id).filter(Boolean).join(",");
      if (!ids) return alert("Nenhum pedido válido para imprimir");
      const target = `/api/orders/print?ids=${encodeURIComponent(ids)}`;
      window.open(target, "_blank");
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar impressão");
    }
  };

  // ===== 4️⃣ Resetar página ao trocar pageSize =====
  useEffect(() => {
    table.setCurrentPage(1);
  }, [pageSize]);

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-pink-700">Pedidos</h1>
        <button
          onClick={() => openOrder(undefined)}
          className="bg-pink-600 text-white px-4 py-2 rounded-xl hover:bg-pink-700"
        >
          + Novo Pedido
        </button>
      </div>

      {/* BUSCA + AÇÕES PRINCIPAIS */}
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

      {/* PAINEL LATERAL: FILTROS AVANÇADOS */}
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

      {/* TABELA */}
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
                <td colSpan={5} className="py-6 text-gray-500">
                  Carregando pedidos...
                </td>
              </tr>
            ) : table.pageData.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-gray-500">
                  Nenhum pedido encontrado
                </td>
              </tr>
            ) : (
              table.pageData.map((o) => (
                <tr
                  key={o.id}
                  className="border-t hover:bg-pink-50 cursor-pointer"
                  onClick={() => openOrder(o.id)}
                >
                  <td className="font-mono text-sm">#{o.id}</td>
                  <td>{o.customerName}</td>
                  <td>{formatDateTime(o.deliveryDate)}</td>
                  <td>{o.isDelivery ? "Entrega" : "Retirada"}</td>
                  <td>{statusBadge(o.orderStatus || o.status)}</td>
                  <td>R$ {Number(o.total).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINAÇÃO */}
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
    </div>
  );
};

// ===================== DASHBOARD =====================
const Dashboard = ({ orders, customers, products }) => {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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
          {["OrderPlaced", "Confirmed", "Finished"].map((status) => {
            const count = orders.filter((o) => o.status === status).length;
            return (
              <p key={status} className="text-sm text-gray-700 mb-2">
                {status}: <strong>{count}</strong>
              </p>
            );
          })}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-pink-700 mb-4">Resumo</h3>
          <p className="text-sm text-gray-700 mb-2">Total de Clientes: <strong>{customers.length}</strong></p>
          <p className="text-sm text-gray-700 mb-2">Total de Produtos: <strong>{products.length}</strong></p>
          <p className="text-sm text-gray-700">Pedidos Concluídos: <strong>{orders.filter((o) => o.status === "Finished").length}</strong></p>
        </div>
      </div>
    </div>
  );
};

// ===================== CUSTOMERS PAGE =====================
const CustomerEditor = ({ customerId, customers, setCustomers, onClose }) => {
  const [name, setName] = useState("");
  const customer = customerId ? customers.find((c) => c.id === customerId) : null;
  const [cellPhone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [apartment, setApartment] = useState(false);
  const [numberApartment, setNumberApartment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customerId) {
      const fetchCustomer = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/customers/${customerId}`);
          if (!res.ok) throw new Error("Erro ao buscar cliente");
          const data = await res.json();
          
          setName(data.name || "");
          setPhone(data.cellPhone || data.cellPhone || "");
          
          // Dados do endereço podem vir dentro de um objeto 'address' ou diretamente
          const addressData = data.address || data;
          setStreet(addressData.street || "");
          setNumber(addressData.number || "");
          setNeighborhood(addressData.neighborhood || "");
          setState(addressData.state || "");
          setCity(addressData.city || "");
          setApartment(addressData.apartment || false);
          setNumberApartment(addressData.numberApartment || "");
        } catch (error) {
          console.error("Erro ao buscar cliente:", error);
          alert("Erro ao carregar dados do cliente");
        } finally {
          setLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [customerId]);

  const saveCustomer = async () => {
    if (!name.trim()) {
      alert("Nome é obrigatório");
      return;
    }

    const phoneDigits = cellPhone.replace(/\D/g, "");
    if (phoneDigits.length !== 11) {
      alert("Telefone deve conter exatamente 11 dígitos (DDD + número)");
      return;
    }

    const payload = {
      ...(customerId && { id: customerId }),
      name,
      cellPhone,
      street,
      number,
      neighborhood,
      state,
      city,
      apartment,
      numberApartment,
    };

    try {
      const res = await fetch("/api/customers/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newCustomer = await res.json();
        if (customerId) {
          setCustomers(
            customers.map((c) => (c.id === customerId ? newCustomer : c))
          );
        } else {
          setCustomers([...customers, newCustomer]);
        }
        alert(customerId ? "Cliente atualizado!" : "Cliente criado!");
        onClose();
      } else {
        alert("Erro na API");
      }
    } catch {
      alert("Erro na API");
    }
  };

  return (
    <Modal
      isOpen={true}
      title={customerId ? "Editar Cliente" : "Novo Cliente"}
      onClose={onClose}
    >
      {loading ? (
        <div className="text-center text-gray-500">Carregando...</div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Telefone</label>
            <input
              type="tel"
              value={cellPhone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 11);
                setPhone(value);
              }}
              placeholder="Telefone (11 dígitos com DDD)"
              maxLength="11"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <span className="text-xs text-gray-500">{cellPhone.length}/11 dígitos</span>
          </div>

          <div className="border-t pt-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Endereço</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rua</label>
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Rua"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Número</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="Número"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Bairro"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Estado"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cidade"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={apartment}
                onChange={(e) => setApartment(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              É apartamento
            </label>
          </div>

          {apartment && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Número do Apartamento</label>
              <input
                type="text"
                value={numberApartment}
                onChange={(e) => setNumberApartment(e.target.value)}
                placeholder="Número do apartamento"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          )}

          <button
            onClick={saveCustomer}
            className="w-full bg-pink-600 text-white px-4 py-2 rounded font-semibold hover:bg-pink-700"
          >
            Salvar Cliente
          </button>
        </div>
      )}
    </Modal>
  );
};

const CustomersPage = ({ customers, setCustomers }) => {
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        const res = await fetch("/api/customers/search");
        if (!res.ok) throw new Error("Erro ao buscar clientes");
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao carregar clientes:", err);
      }
    };
    fetchAllCustomers();
  }, [setCustomers]);

  useEffect(() => {
    const searchCustomers = async () => {
      if (!searchTerm.trim()) {
        setSearchResults(customers);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`/api/customers/search?nome=${encodeURIComponent(searchTerm)}`);
        if (!res.ok) throw new Error("Erro ao buscar clientes");
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao buscar clientes:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, customers]);
  
  const table = useTable(searchResults, pageSize);

  useEffect(() => {
    table.setCurrentPage(1);
  }, [pageSize]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-pink-700">Clientes</h1>
        <button
          onClick={() => setEditingCustomerId(0)}
          className="bg-pink-600 text-white px-4 py-2 rounded-xl hover:bg-pink-700"
        >
          + Novo Cliente
        </button>
      </div>
      <div className="mb-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            title="Itens por página"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-pink-100 text-pink-700">
            <tr>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Celular</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {table.pageData.map((c) => (
              <tr key={c.id} className="border-t hover:bg-pink-50">
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{c.cellPhone || "-"}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setEditingCustomerId(c.id)}
                    className="text-pink-600 hover:text-pink-800 font-semibold text-sm"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
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
      {editingCustomerId !== null && (
        <CustomerEditor
          customerId={editingCustomerId === 0 ? null : editingCustomerId}
          customers={customers}
          setCustomers={setCustomers}
          onClose={() => setEditingCustomerId(null)}
        />
      )}
    </div>
  );
};

// ===================== PRODUCTS PAGE =====================
const ProductEditor = ({ productId, products, setProducts, onClose }) => {
  const product = productId ? products.find((p) => p.id === productId) : null;
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.price || "");
  const [categoryId, setCategoryId] = useState(product?.categoryId || "");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(product?.productStatus || product?.status || "Activated");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryUnitType, setNewCategoryUnitType] = useState("Unit");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/products/category");
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const createCategory = async () => {
    if (!newCategoryName.trim()) return alert("Nome da categoria é obrigatório");
    setCreatingCategory(true);
    try {
      const res = await fetch("/api/products/upsert-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim(), unitType: newCategoryUnitType }),
      });
      if (!res.ok) throw new Error("Erro ao criar categoria");
      const created = await res.json();
      const createdItem = typeof created === "object" ? created : { id: created, name: String(created) };
      setCategories((prev) => [...prev, createdItem]);
      setCategoryId(String(createdItem.id ?? createdItem.value ?? createdItem.name));
      setNewCategoryName("");
      setShowAddCategory(false);
    } catch (err) {
      console.error("Erro criando categoria:", err);
      alert("Erro ao criar categoria");
    } finally {
      setCreatingCategory(false);
    }
  };

  const saveProduct = async () => {
    if (!name.trim() || !price || !categoryId) {
      alert("Nome, preço e categoria são obrigatórios");
      return;
    }

    const payload = { 
      ...(productId && { id: productId }),
      name,
      price: parseFloat(price),
      categoryId: categoryId,//NÃO MEXE AQUI
      productStatus: status,
    };

    try {
      const res = await fetch("/api/products/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newProduct = await res.json();
        if (productId) {
          setProducts(
            products.map((p) => (p.id === productId ? newProduct : p))
          );
        } else {
          setProducts([...products, newProduct]);
        }
        alert(productId ? "Produto atualizado!" : "Produto criado!");
        onClose();
      } else {
        alert("Erro na API");
      }
    } catch {
      alert("Erro na API");
    }
  };

  return (
    <Modal
      isOpen={true}
      title={productId ? "Editar Produto" : "Novo Produto"}
      onClose={onClose}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do produto"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Preço</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Preço"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Categoria</label>
          {loading ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-500">
              Carregando categorias...
            </div>
          ) : (
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="">Selecione uma categoria</option>
              {categories && categories.length > 0 ? (
                categories.map((cat, idx) => {
                  const id = cat && (cat.id ?? idx);
                  const nameVal = typeof cat === 'string' ? cat : (cat.name || cat.value || String(cat));
                  return (
                    <option key={id} value={id}>
                      {nameVal}
                    </option>
                  );
                })
              ) : (
                <option value="">Nenhuma categoria disponível</option>
              )}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowAddCategory((s) => !s)}
            className="text-sm text-pink-600 hover:text-pink-800"
          >
            {showAddCategory ? "Cancelar" : "+ Adicionar categoria"}
          </button>

          {showAddCategory && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nome da nova categoria"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de unidade</label>
                <select value={newCategoryUnitType} onChange={(e) => setNewCategoryUnitType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500">
                  <option value="Unit">Unidade (Unit)</option>
                  <option value="Kg">Quilograma (Kg)</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={createCategory}
                  disabled={creatingCategory}
                  className="flex-1 bg-pink-600 text-white px-3 py-2 rounded text-sm hover:bg-pink-700"
                >
                  {creatingCategory ? "Criando..." : "Criar categoria"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddCategory(false); setNewCategoryName(""); }}
                  className="px-3 py-2 border rounded text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="Activated">Ativo</option>
            <option value="Removed">Removido</option>
          </select>
        </div>
        <button
          onClick={saveProduct}
          className="w-full bg-pink-600 text-white px-4 py-2 rounded font-semibold hover:bg-pink-700"
        >
          Salvar Produto
        </button>
      </div>
    </Modal>
  );
};

const ProductsPage = ({ products, setProducts }) => {
  const [editingProductId, setEditingProductId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(15);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch("/api/products/all-product");
        if (!res.ok) throw new Error("Erro ao buscar produtos");
        const data = await res.json();
        // normalize product shape if needed
        const normalized = Array.isArray(data)
          ? data.map((p) => ({
              ...p,
              categoryName:
                p.categoryName ?? (p.category && (p.category.name || p.categoryValue)) ?? p.category ?? null,
              productStatus: p.productStatus ?? p.status ?? null,
            }))
          : [];
        setProducts(normalized);
        setSearchResults(normalized);
      } catch (err) {
        console.error("Erro ao carregar produtos:", err);
      }
    };
    fetchAll();
  }, [setProducts]);

  useEffect(() => {
    const fetchFiltered = async () => {
      if (!statusFilter) {
        setSearchResults(products);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`/api/products/filter-${statusFilter}`);
        if (!res.ok) throw new Error("Erro ao buscar produtos");
        const data = await res.json();
        const normalized = Array.isArray(data)
          ? data.map((p) => ({
              ...p,
              categoryName:
                p.categoryName ?? (p.category && (p.category.name || p.categoryValue)) ?? p.category ?? null,
              productStatus: p.productStatus ?? p.status ?? null,
            }))
          : [];
        setSearchResults(normalized);
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchFiltered();
  }, [statusFilter, products]);

  useEffect(() => {
    const searchProducts = async () => {
      if (!searchTerm.trim() || statusFilter) {
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`/api/products/search?name=${encodeURIComponent(searchTerm)}`);
        if (!res.ok) throw new Error("Erro ao buscar produtos");
        const data = await res.json();
        const normalized = Array.isArray(data)
          ? data.map((p) => ({
              ...p,
              categoryName:
                p.categoryName ?? (p.category && (p.category.name || p.categoryValue)) ?? p.category ?? null,
              productStatus: p.productStatus ?? p.status ?? null,
            }))
          : [];
        setSearchResults(normalized);
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, products, statusFilter]);
  
  const table = useTable(searchResults, pageSize);

  useEffect(() => {
    // reset to first page when page size changes
    table.setCurrentPage(1);
  }, [pageSize]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-pink-700">Produtos</h1>
        <button
          onClick={() => setEditingProductId(0)}
          className="bg-pink-600 text-white px-4 py-2 rounded-xl hover:bg-pink-700"
        >
          + Novo Produto
        </button>
      </div>
      <div className="mb-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Buscar por nome do produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!!statusFilter}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setSearchTerm("");
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            title="Filtrar por status"
          >
            <option value="">Todos os status</option>
            <option value="Activated">Ativo</option>
            <option value="Removed">Removido</option>
          </select>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            title="Itens por página"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-pink-100 text-pink-700">
            <tr>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Categoria</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Preço</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {table.pageData.map((p) => (
              <tr key={p.id} className="border-t hover:bg-pink-50">
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.categoryName || "-"}</td>
                <td className="px-4 py-3 text-gray-600">{productStatusLabel(p.productStatus ?? p.status)}</td>
                <td className="px-4 py-3 text-right font-semibold">R$ {p.price.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setEditingProductId(p.id)}
                    className="text-pink-600 hover:text-pink-800 font-semibold text-sm"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
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
      {editingProductId !== null && (
        <ProductEditor
          productId={editingProductId === 0 ? null : editingProductId}
          products={products}
          setProducts={setProducts}
          onClose={() => setEditingProductId(null)}
        />
      )}
    </div>
  );
};

// ===================== ORDER EDITOR =====================
const OrderEditor = ({ orderId, orders, setOrders, onClose, customers, setCustomers, products, setProducts, setEditingOrderId }) => {
  const editingOrder = orderId ? orders.find((o) => o.id === orderId) : null;
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [customerQuery, setCustomerQuery] = useState(editingOrder?.customerName || "");
  const [customerResults, setCustomerResults] = useState(customers || []);
  const [selectedCustomer, setSelectedCustomer] = useState(editingOrder?.customerId || null);
  const [customerCellPhone, setCustomerCellPhone] = useState(
    editingOrder?.customerCellPhone || editingOrder?.customerCell || editingOrder?.cellPhone || ""
  );

  const [isDelivery, setIsDelivery] = useState(editingOrder?.isDelivery ?? true);
  const [street, setStreet] = useState(editingOrder?.street || "");
  const [number, setNumber] = useState(editingOrder?.number || "");
  const [neighborhood, setNeighborhood] = useState(editingOrder?.neighborhood || "");
  const [stateAddr, setStateAddr] = useState(editingOrder?.state || "");
  const [city, setCity] = useState(editingOrder?.city || "");
  const [apartment, setApartment] = useState(editingOrder?.apartment || false);
  const [numberApartment, setNumberApartment] = useState(editingOrder?.numberApartment || "");

  const [items, setItems] = useState(
    editingOrder?.Items?.map((it) => ({
      productId: it.productId,
      productName: it.productName || it.name || "",
      categoryName: it.categoryName || (it.category && (it.category.name || it.categoryName)) || undefined,
      qty: it.qty || it.quantity || 1,
      price: Number(it.price || it.unitPrice || 0),
      unitType: it.unitType || it.unit || it.Unit || "uni",
      notes: it.notes || it.Notes || it.note || it.Note || "",
    })) || []
  );

  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState(products || []);

  const [discount, setDiscount] = useState(editingOrder?.discount || 0);
  const [deliveryFee, setDeliveryFee] = useState(editingOrder?.deliveryFee || 0);
  const [amountPaid, setAmountPaid] = useState(editingOrder?.amountPaid ?? editingOrder?.AmountPaid ?? 0);

  const [orderStatus, setOrderStatus] = useState(editingOrder?.orderStatus || editingOrder?.status || "OrderPlaced");

  const [deliveryDate, setDeliveryDate] = useState(() => {
    try {
      if (editingOrder?.deliveryDate) {
        const d = parseBackendDateTime(editingOrder.deliveryDate);
        if (d && !isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      }
    } catch {}
    return new Date().toISOString().slice(0, 10);
  });
  const [deliveryTime, setDeliveryTime] = useState(() => {
    try {
      if (editingOrder?.deliveryDate) {
        const d = parseBackendDateTime(editingOrder.deliveryDate);
        if (d && !isNaN(d.getTime())) return d.toTimeString().slice(0, 5);
      }
    } catch {}
    return new Date().toTimeString().slice(0, 5);
  });

  const [showProductEditorId, setShowProductEditorId] = useState(null);
  const [showCustomerEditorId, setShowCustomerEditorId] = useState(null);
  const [showPrintOptionsOrderEditor, setShowPrintOptionsOrderEditor] = useState(false);

  // fetch order details when editing an existing order
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    const fetchOrder = async () => {
      setLoadingOrder(true);
      try {
        const res = await fetch(`/api/orders/${orderId}/items`);
        if (!res.ok) throw new Error('Erro ao carregar pedido');
        const data = await res.json();
        if (cancelled) return;

        setCustomerQuery(data.customerName || "");
        setSelectedCustomer(data.customerId || data.customer || null);
        setIsDelivery(data.isDelivery ?? (!!data.isDelivery));
        setStreet(data.street || (data.address && data.address.street) || "");
        setNumber(data.number || (data.address && data.address.number) || "");
        setNeighborhood(data.neighborhood || (data.address && data.address.neighborhood) || "");
        setStateAddr(data.state || (data.address && data.address.state) || "");
        setCity(data.city || (data.address && data.address.city) || "");
        setApartment(data.apartment ?? (data.address && data.address.apartment) ?? false);
        setNumberApartment(data.numberApartment ?? (data.address && data.address.numberApartment) ?? "");
        // populate phone snapshot from order response when available
        setCustomerCellPhone(
          data.customerCellPhone || data.customerCell || data.customerPhone || data.cellPhone || data.CellPhone || ""
        );

        const incomingItems = data.items || data.Items || [];
        setItems(
          (incomingItems || []).map((it) => ({
            productId: it.productId || it.ProductId || it.id || null,
            productName: it.productName || it.ProductName || it.name || "",
            categoryName: it.categoryName || (it.category && (it.category.name || it.categoryName)) || undefined,
            qty: it.quantity || it.Quantity || it.qty || 1,
            price: Number(it.unitPrice || it.UnitPrice || it.price || 0),
            unitType: it.unitType || it.UnitType || it.unit || it.categoryUnit || (it.category && (it.category.unitType || it.categoryUnit)) || 'uni',
            notes: it.notes || it.Notes || it.note || it.Note || "",
          }))
        );

        setDiscount(data.discount ?? 0);
        setDeliveryFee(data.deliveryFee ?? 0);
        setAmountPaid(data.amountPaid ?? data.AmountPaid ?? 0);
        setOrderStatus(data.orderStatus || data.status || "OrderPlaced");

        if (data.deliveryDate) {
          const d = parseBackendDateTime(data.deliveryDate);
          if (d && !isNaN(d.getTime())) {
            setDeliveryDate(d.toISOString().slice(0, 10));
            setDeliveryTime(d.toTimeString().slice(0, 5));
          }
        }
        // if this is delivery and we have a customer id, refresh address from customer record
        if ((data.isDelivery || data.IsDelivery) && (data.customerId || data.customer)) {
          const cid = data.customerId || data.customer;
          try {
            const cres = await fetch(`/api/customers/${cid}`);
            if (cres.ok) {
              const cdata = await cres.json();
              setStreet((cdata.address && cdata.address.street) || cdata.street || street);
              setNumber((cdata.address && cdata.address.number) || cdata.number || number);
              setNeighborhood((cdata.address && cdata.address.neighborhood) || cdata.neighborhood || neighborhood);
              setStateAddr((cdata.address && cdata.address.state) || cdata.state || stateAddr);
              setCity((cdata.address && cdata.address.city) || cdata.city || city);
              setApartment(cdata.apartment ?? (cdata.address && cdata.address.apartment) ?? apartment);
              setNumberApartment(cdata.numberApartment ?? (cdata.address && cdata.address.numberApartment) ?? numberApartment);
              // prefer canonical customer phone when available
              setCustomerCellPhone(cdata.cellPhone || cdata.CellPhone || cdata.cellphone || "");
            }
          } catch (err) {
            // ignore
          }
        }
      } catch (err) {
        console.error('Erro carregando pedido:', err);
        alert('Erro ao carregar dados do pedido');
      } finally {
        if (!cancelled) setLoadingOrder(false);
      }
    };

    fetchOrder();
    return () => { cancelled = true; };
  }, [orderId]);

  // customer search (local first, then API)
  useEffect(() => {
    // When editing an existing order, avoid triggering the live search;
    // the editor should use the customerId returned by `/api/orders/{id}/items`
    // and fetch `/api/customers/{id}` instead.
    if (orderId) return;
    const q = customerQuery.trim();
    if (!q) return setCustomerResults(customers || []);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers/search?nome=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("Erro");
        const data = await res.json();
        setCustomerResults(Array.isArray(data) ? data : []);
      } catch (err) {
        // fallback to local
        setCustomerResults((customers || []).filter((c) => (c.name || "").toLowerCase().includes(q.toLowerCase())));
      }
    }, 300);
    return () => clearTimeout(t);
  }, [customerQuery, customers, orderId]);

  // product search
  useEffect(() => {
    const q = productQuery.trim();
    if (!q) return setProductResults(products || []);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?name=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error("Erro");
        const data = await res.json();
        setProductResults(Array.isArray(data) ? data : []);
      } catch (err) {
        setProductResults((products || []).filter((p) => (p.name || "").toLowerCase().includes(q.toLowerCase())));
      }
    }, 300);
    return () => clearTimeout(t);
  }, [productQuery, products]);

  // when delivery is enabled and a customer is selected, fetch customer address
  useEffect(() => {
    if (!isDelivery || !selectedCustomer) return;
    let cancelled = false;
    const fetchCustomerAddr = async () => {
      try {
        const res = await fetch(`/api/customers/${selectedCustomer}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setStreet((data.address && data.address.street) || data.street || "");
        setNumber((data.address && data.address.number) || data.number || "");
        setNeighborhood((data.address && data.address.neighborhood) || data.neighborhood || "");
        setStateAddr((data.address && data.address.state) || data.state || "");
        setCity((data.address && data.address.city) || data.city || "");
        setApartment(data.apartment ?? (data.address && data.address.apartment) ?? false);
        setNumberApartment(data.numberApartment ?? (data.address && data.address.numberApartment) ?? "");
      } catch (err) {
        // ignore
      }
    };
    fetchCustomerAddr();
    return () => { cancelled = true; };
  }, [isDelivery, selectedCustomer]);

  const addItemFromProduct = (p) => {
    const unitTypeFromProduct =
      (p && (p.category && (p.category.unitType || p.category.UnitType))) ||
      p.categoryUnit ||
      p.categoryUnitType ||
      p.unit ||
      p.unitType ||
      p.unitOfMeasure ||
      "uni";
    setItems((s) => {
      const existsIdx = s.findIndex((it) => it.productId === p.id);
      if (existsIdx >= 0) {
        // increment quantity if already in the order
        return s.map((it, i) => (i === existsIdx ? { ...it, qty: Number(it.qty || 0) + 1 } : it));
      }
      return [
        ...s,
        {
          productId: p.id,
          productName: p.name,
          categoryName: p.categoryName || (p.category && (p.category.name || p.categoryName)) || undefined,
          qty: 1,
          price: Number(p.price || 0),
          unitType: unitTypeFromProduct,
          notes: "",
        },
      ];
    });
    setProductQuery("");
    setProductResults([]);
  };

  const updateItem = (idx, patch) => setItems((s) => s.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx) => setItems((s) => s.filter((_, i) => i !== idx));

  const itemsSubtotal = items.reduce((sum, it) => sum + (Number(it.qty || 0) * Number(it.price || 0)), 0);
  const total = Math.max(0, itemsSubtotal - Number(discount || 0) + Number(deliveryFee || 0));
  const remaining = Math.max(0, total - Number(amountPaid || 0));

  const saveOrder = async () => {
    if (!customerQuery.trim()) return alert("Informe o nome do cliente");
    if (items.length === 0) return alert("Adicione ao menos um item");

    const composedDeliveryDate = deliveryDate && deliveryTime ? `${deliveryDate}T${deliveryTime}` : null;

    // Validação: não permitir salvar se a data/hora de entrega for anterior ao momento atual
    if (composedDeliveryDate) {
      try {
        const dParts = (deliveryDate || "").split("-");
        const tParts = (deliveryTime || "").split(":");
        if (dParts.length === 3 && tParts.length >= 2) {
          const y = Number(dParts[0]);
          const m = Number(dParts[1]) - 1;
          const d = Number(dParts[2]);
          const hh = Number(tParts[0]);
          const mm = Number(tParts[1]);
          const composedDt = new Date(y, m, d, hh, mm);
          const now = new Date();
          if (composedDt < now) {
            return alert('A data e hora de entrega não podem ser anteriores ao momento atual.');
          }
        }
      } catch (err) {
        // se ocorrer erro na validação, não bloquear o salvamento (fallback)
        console.warn('Erro ao validar data de entrega', err);
      }
    }
    // Normalize status values coming from backend (Portuguese labels) to canonical keys
    const statusMap = {
      'Pedido Realizado': 'OrderPlaced',
      'Pedido Confirmado': 'Confirmed',
      'Concluído': 'Finished',
    };
    const canonicalStatus = statusMap[orderStatus] || orderStatus;

    // Prefer phone from local state (populated from order or selection). If missing,
    // fall back to in-memory customer or fetch the canonical record.
    let customerCell = customerCellPhone || undefined;
    let customerObj = (customers || []).find((c) => String(c.id) === String(selectedCustomer)) || null;
    if (!customerCell && selectedCustomer) {
      try {
        const cres = await fetch(`/api/customers/${selectedCustomer}`);
        if (cres.ok) {
          const cdata = await cres.json();
          customerObj = cdata || customerObj;
          customerCell = cdata.cellPhone || cdata.CellPhone || cdata.cellphone || customerCell;
          if (customerCell) setCustomerCellPhone(customerCell);
        }
      } catch (err) {
        // ignore
      }
    }
    const customerName = customerObj?.name || customerQuery || undefined;

    const payload = {
      OrderId: orderId ?? undefined,
      CustomerId: selectedCustomer ?? undefined,
      Customer: {
        Name: customerName,
        CellPhone: customerCell,
        Street: street || undefined,
        Number: number || undefined,
        Neighborhood: neighborhood || undefined,
        City: city || undefined,
        State: stateAddr || undefined,
        Apartment: apartment ?? undefined,
        NumberApartment: numberApartment || undefined,
      },
      // other fields
      Discount: Number(discount || 0),
      IsDelivery: !!isDelivery,
      DeliveryFee: Number(deliveryFee || 0),
      AmountPaid: Number(amountPaid || 0),
      Items: items.map((it) => ({ ProductId: it.productId, ProductName: it.productName, UnitPrice: Number(it.price), Quantity: Number(it.qty), Notes: it.notes || it.Notes || "" })),
      DeliveryDate: composedDeliveryDate,
      // Send canonical status (and variants) to support different backend conventions
      OrderStatus: canonicalStatus,
      orderStatus: canonicalStatus,
      status: canonicalStatus,
    };

    try {
      console.log('Saving order payload:', payload);
      const res = await fetch("/api/orders/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro na API");
      const saved = await res.json();
      if (orderId) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? saved : o)));
      } else {
        setOrders((prev) => [saved, ...prev]);
        // keep the editor open and switch to the newly created order id
        if (typeof setEditingOrderId === "function" && saved && (saved.id || saved.OrderId || saved.Id)) {
          const newId = saved.id ?? saved.OrderId ?? saved.Id;
          setEditingOrderId(newId);
        }
      }
      // do not call onClose() so the user remains in the editor
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar pedido");
    }
  };

  const printOrder = () => {
    const ids = orderId ? String(orderId) : "";
    const target = ids ? `/api/orders/print?ids=${encodeURIComponent(ids)}` : `/api/orders/print?preview=true`;
    try {
      window.open(target, '_blank');
    } catch (err) {
      console.warn('Não foi possível abrir a janela de impressão', err);
    }
  };

  const printOrderKitchen = () => {
    const ids = orderId ? String(orderId) : "";
    const target = ids
      ? `/api/orders/print/kitchen?ids=${encodeURIComponent(ids)}`
      : `/api/orders/print/kitchen?preview=true`;
    try {
      window.open(target, '_blank');
    } catch (err) {
      console.warn('Não foi possível abrir a janela de impressão da cozinha', err);
    }
  };

  const sendWhatsapp = async () => {
    const statusLabel = OrderStatusDisplay[orderStatus] || orderStatus || 'Pedido';
    const idLabel = orderId ? ` #${orderId}` : '';
    const header = `${statusLabel}${idLabel}\n\n`;

    // Prefer phone from loaded state; fetch canonical customer only if missing
    let phoneRaw = customerCellPhone || '';
    if (!phoneRaw && selectedCustomer) {
      try {
        const cres = await fetch(`/api/customers/${selectedCustomer}`);
        if (cres.ok) {
          const cdata = await cres.json();
          phoneRaw = cdata.cellPhone || cdata.CellPhone || cdata.cellphone || phoneRaw || '';
          if (phoneRaw) setCustomerCellPhone(phoneRaw);
        }
      } catch (err) {
        // ignore
      }
    }
    if (!phoneRaw && selectedCustomer) {
      const mem = (customers || []).find((c) => String(c.id) === String(selectedCustomer));
      phoneRaw = mem?.cellPhone || mem?.CellPhone || phoneRaw || '';
    }
    const phone = String(phoneRaw || '').replace(/\D/g, '');
    const customerLine = `Cliente: ${customerQuery || 'Cliente'}${phone ? ' - ' + phone : ''}\n\n`;

    let itemsMsg = 'Itens\n';
    items.forEach((it) => {
      itemsMsg += `${it.qty}x ${it.productName}\n`;
      if (it.notes) itemsMsg += `    *${it.notes}\n`;
    });
    itemsMsg += '\n';

    const fmt = (v) => Number(v || 0).toFixed(2).replace('.', ',');
    itemsMsg += `Subtotal: ${fmt(itemsSubtotal)}\n`;
    itemsMsg += `Total: ${fmt(total)}\n\n`;

    const deliveryType = isDelivery ? 'Entregar no endereço' : 'Retirar no balcão';
    itemsMsg += `Tipo Entrega: ${deliveryType}\n`;

    const msg = header + customerLine + itemsMsg;
    if (!phone) return alert('Telefone do cliente não disponível para WhatsApp');
    const url = `https://wa.me/55${phone}`;
    try {
      window.open(url, '_blank');
    } catch (err) {
      console.warn('Erro ao abrir WhatsApp', err);
    }
  };

  return (
    <Modal isOpen={true} title={orderId ? "Editar Pedido" : "Novo Pedido"} onClose={onClose} large={true}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cliente</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customerQuery}
              onChange={(e) => { if (!orderId) { setCustomerQuery(e.target.value); setSelectedCustomer(null); } }}
              placeholder="Buscar ou digitar nome do cliente"
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              disabled={!!orderId}
            />
            <button onClick={() => setShowCustomerEditorId(0)} className="px-3 py-2 bg-pink-100 rounded">+ Cliente</button>
          </div>
          {!orderId && customerResults && customerResults.length > 0 && customerQuery && (
            <div className="border bg-white mt-1 max-h-40 overflow-y-auto">
              {customerResults.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setCustomerQuery(c.name);
                    setSelectedCustomer(c.id);
                    setCustomerCellPhone(c.cellPhone || c.CellPhone || "");
                    setCustomerResults([]);
                  }}
                  className="p-2 hover:bg-pink-50 cursor-pointer"
                >
                  {c.name} - {c.cellPhone || c.CellPhone || "-"}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={isDelivery} onChange={(e) => setIsDelivery(e.target.checked)} className="w-4 h-4" /> Entrega?
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2 items-end">
            <div>
              <label className="block text-sm">Data de entrega</label>
              <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm">Hora de entrega</label>
              <input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
                <div>
              <label className="block text-sm">Status</label>
              <div className="flex items-center gap-3">
                <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className="w-full px-3 py-2 border rounded">
                  <option value="OrderPlaced">Pedido Realizado</option>
                  <option value="Confirmed">Confirmado</option>
                  <option value="Finished">Concluído</option>
                </select>
                <div>{statusBadge(orderStatus)}</div>
              </div>
            </div>
          </div>
          {isDelivery && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Rua" className="px-3 py-2 border rounded" />
              <input type="text" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Número" className="px-3 py-2 border rounded" />
              <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className="px-3 py-2 border rounded" />
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" className="px-3 py-2 border rounded" />
              <input type="text" value={stateAddr} onChange={(e) => setStateAddr(e.target.value)} placeholder="Estado" className="px-3 py-2 border rounded" />
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={apartment} onChange={(e) => setApartment(e.target.checked)} className="w-4 h-4" /> É apartamento
                  </label>
                </div>
                {apartment && (
                  <div className="col-span-2">
                    <input type="text" value={numberApartment} onChange={(e) => setNumberApartment(e.target.value)} placeholder="Número do apartamento" className="w-full px-3 py-2 border rounded" />
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Itens</h3>

          <div className="mb-3">
            <div className="flex gap-2">
              <input type="text" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Buscar produto..." className="flex-1 px-3 py-2 border rounded" />
              <button onClick={() => setShowProductEditorId(0)} className="px-3 py-2 bg-pink-100 rounded">+ Produto</button>
            </div>
            {productResults && productResults.length > 0 && productQuery && (
              <div className="border bg-white mt-1 max-h-40 overflow-y-auto">
                {(productResults || []).map((p) => {
                  const existing = items.find((it) => it.productId === p.id);
                  const qty = existing ? existing.qty || 0 : 0;
                  return (
                    <div
                      key={p.id}
                      onClick={existing ? undefined : () => addItemFromProduct(p)}
                      className={
                        `p-2 flex justify-between items-center ${
                          existing ? 'bg-gray-50 text-gray-500 cursor-default' : 'hover:bg-pink-50 cursor-pointer'
                        }`
                      }
                      role={existing ? 'option' : 'button'}
                      aria-disabled={existing ? 'true' : 'false'}
                    >
                      <div>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-sm text-gray-400 ml-2">— R$ {Number(p.price || 0).toFixed(2)}</span>
                      </div>
                      {existing ? (
                        <div className="text-xs text-gray-400">Adicionado x{qty}</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-3 bg-white border rounded space-y-3">
            {items.length === 0 ? (
              <div className="text-sm text-gray-500">Nenhum item adicionado</div>
            ) : (
              items.map((it, idx) => (
                <div key={idx} className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-semibold text-gray-800 text-lg">{it.productName}</div>

                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Qtd</div>
                          <input type="number" className="w-20 px-2 py-1 border rounded text-center" value={it.qty} min={1} onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })} />
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-gray-500">Unit</div>
                          <div className="flex items-center gap-2">
                            <div className="text-right font-medium">R$ {Number(it.price).toFixed(2)}</div>
                            <span className="px-2 py-1 text-sm bg-pink-50 text-pink-600 rounded">{(String(it.unitType || '').toLowerCase().includes('kg')) ? 'kg' : 'uni'}</span>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-gray-500">Subtotal</div>
                          <div className="font-medium">R$ {(Number(it.qty) * Number(it.price)).toFixed(2)}</div>
                        </div>

                        <div>
                          <button onClick={() => removeItem(idx)} className="text-sm text-red-600">Remover</button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="text-xs text-gray-500">Observação</label>
                      <input type="text" value={it.notes || ""} onChange={(e) => updateItem(idx, { notes: e.target.value })} placeholder="Observação do item" className="w-full mt-1 px-2 py-1 border rounded text-sm" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 md:flex md:items-stretch md:justify-between md:gap-4">
            <div className="flex-1">
              <div className="border rounded p-4 bg-gray-50 space-y-3 max-w-xl h-full">
                <div>
                  <label className="block text-sm">Pagamento realizado</label>
                  <div className="flex gap-2 items-center">
                    <input type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(Number(e.target.value))} className="flex-1 px-3 py-2 border rounded" />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setAmountPaid(Number(total.toFixed(2)))} className="px-3 py-1 bg-pink-100 text-pink-700 rounded text-sm">Total</button>
                      <button type="button" onClick={() => setAmountPaid(Number((total / 2).toFixed(2)))} className="px-3 py-1 bg-pink-100 text-pink-700 rounded text-sm">50%</button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm">Desconto</label>
                  <input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm">Taxa de entrega</label>
                  <input type="number" step="0.01" value={deliveryFee} onChange={(e) => setDeliveryFee(Number(e.target.value))} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
            </div>

            <div className="mt-3 md:mt-0 w-full md:w-56 lg:w-64 flex-shrink-0">
              <div className="border rounded p-4 bg-gray-50 text-center h-full flex flex-col justify-center">
                <div className="text-sm text-gray-500">Total</div>
                <div className="text-2xl font-bold text-pink-600">R$ {total.toFixed(2)}</div>

                <div className="text-sm text-gray-500 mt-3">Pago</div>
                <div className="text-lg font-semibold">R$ {Number(amountPaid || 0).toFixed(2)}</div>

                <div className="text-sm text-gray-500 mt-2">Restante</div>
                <div className="text-lg font-semibold text-pink-600">R$ {remaining.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={saveOrder} style={{flex:2}} className="w-full bg-pink-600 text-white px-4 py-3 rounded">Salvar Pedido</button>

            <div className="relative" style={{flex:1}}>
              <button
                onClick={() => setShowPrintOptionsOrderEditor((s) => !s)}
                className="w-full bg-white border px-4 py-3 rounded text-pink-600 flex items-center justify-center gap-2"
                title="Opções de impressão"
              >
                <span>Impressão</span>
                <span aria-hidden>🖨️</span>
              </button>

              {showPrintOptionsOrderEditor && (
                <div className="absolute right-0 bottom-full mb-2 w-44 bg-white border border-gray-200 rounded shadow p-2 z-40">
                  <button
                    onClick={() => { setShowPrintOptionsOrderEditor(false); printOrder(); }}
                    className="w-full text-left bg-white border border-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-50 text-sm"
                  >
                    Imprimir
                  </button>

                  <button
                    onClick={() => { setShowPrintOptionsOrderEditor(false); printOrderKitchen(); }}
                    className="w-full text-left mt-2 bg-white border border-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-50 text-sm"
                  >
                    Imprimir Cozinha
                  </button>
                </div>
              )}
            </div>

            <button onClick={sendWhatsapp} style={{flex:1}} className="w-full bg-green-50 border px-4 py-3 rounded text-green-600">Enviar Whatsapp</button>
            <button onClick={onClose} style={{flex:1}} className="w-full px-4 py-3 border rounded">Cancelar</button>
          </div>
        </div>

        {showProductEditorId !== null && (
          <ProductEditor productId={showProductEditorId === 0 ? null : showProductEditorId} products={products} setProducts={(p) => { setProducts(p); }} onClose={() => setShowProductEditorId(null)} />
        )}

        {showCustomerEditorId !== null && (
          <CustomerEditor customerId={showCustomerEditorId === 0 ? null : showCustomerEditorId} customers={customers} setCustomers={setCustomers} onClose={() => setShowCustomerEditorId(null)} />
        )}
      </div>
    </Modal>
  );
};

// ===================== APP =====================
export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [orders, setOrders] = useState([
    {
      id: 1,
      customerName: "Maria Silva",
      deliveryDate: "2026-01-20T14:00",
      status: "OrderPlaced",
      Items: [
        { productId: 1, productName: "Bolo de Chocolate", qty: 2, price: 50 },
      ],
      total: 100,
    },
  ]);

  const [customers, setCustomers] = useState([
    { id: 1, name: "Maria Silva", email: "maria@example.com", cellPhone: "11 99999-9999" },
    { id: 2, name: "João Santos", email: "joao@example.com", cellPhone: "11 98888-8888" },
  ]);

  const [products, setProducts] = useState([
    { id: 1, name: "Bolo de Chocolate", price: 50, categoryName: "Bolos", categoryId: 1 },
    { id: 2, name: "Cupcake Vanilla", price: 8, categoryName: "Cupcakes", categoryId: 2 },
    { id: 3, name: "Torta de Morango", price: 60, categoryName: "Tortas", categoryId: 3 },
  ]);

  const openOrder = (id) => {
    setEditingOrderId(id);
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders/all");
      if (!res.ok) throw new Error("Erro ao buscar pedidos");
      const data = await res.json();
      const normalized = Array.isArray(data)
        ? data.map((o) => ({
            ...o,
            total: o.total ?? o.Total ?? (o.Items ? o.Items.reduce((s, it) => s + (Number(it.price ?? it.unitPrice ?? 0) * Number(it.qty ?? it.quantity ?? it.count ?? 0)), 0) : 0),
          }))
        : [];
      setOrders(normalized);
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const closeOrder = async () => {
    setEditingOrderId(null);
    await fetchOrders();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar page={page} setPage={setPage} />
      <main className="flex-1 p-8 overflow-y-auto">
        {page === "Dashboard" && (
          <ExternalDashboard orders={orders} customers={customers} products={products} />
        )}
        {page === "Pedidos" && (
          <OrdersPage orders={orders} openOrder={openOrder} />
        )}
        {page === "Clientes" && (
          <CustomersPage customers={customers} setCustomers={setCustomers} />
        )}
        {page === "Produtos" && (
          <ProductsPage products={products} setProducts={setProducts} />
        )}
      </main>
      {editingOrderId !== null && (
        <OrderEditor
          orderId={editingOrderId}
          orders={orders}
          setOrders={setOrders}
          onClose={closeOrder}
          customers={customers}
          setCustomers={setCustomers}
          products={products}
          setProducts={setProducts}
          setEditingOrderId={setEditingOrderId}
        />
      )}
    </div>
  );
}
