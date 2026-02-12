import React, { useState, useEffect } from "react";
import { toastError, toastSuccess } from "../utils/toast";
import Modal from "../components/Modal";
import { useTable } from "../hooks/useTable";

export const CustomerEditor = ({ customerId, customers, setCustomers, onClose }) => {
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
          toastError("Erro ao carregar dados do cliente");
        } finally {
          setLoading(false);
        }
      };
      fetchCustomer();
    }
  }, [customerId]);

  const saveCustomer = async () => {
    if (!name.trim()) {
      toastError("Nome é obrigatório");
      return;
    }

    const phoneDigits = cellPhone.replace(/\D/g, "");
    if (phoneDigits.length !== 11) {
      toastError("Telefone deve conter exatamente 11 dígitos (DDD + número)");
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
        toastSuccess(customerId ? "Cliente atualizado com sucesso" : "Cliente criado com sucesso");
        onClose();
      } else {
        toastError("Erro na API");
      }
    } catch {
      toastError("Erro na API");
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

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
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

  useEffect(() => { table.setCurrentPage(1); }, [pageSize]);

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

export default CustomersPage;
