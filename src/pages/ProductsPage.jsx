import React, { useState, useEffect } from "react";
import { toastError, toastSuccess } from "../utils/toast";
import Modal from "../components/Modal";
import { useTable } from "../hooks/useTable";
import { productStatusLabel } from "../utils";

export const ProductEditor = ({ productId, products, setProducts, onClose }) => {
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
    if (!newCategoryName.trim()) return toastError("Nome da categoria é obrigatório");
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
      toastError("Erro ao criar categoria");
    } finally {
      setCreatingCategory(false);
    }
  };

  const saveProduct = async () => {
    if (!name.trim() || !price || !categoryId) {
      toastError("Nome, preço e categoria são obrigatórios");
      return;
    }

    const payload = {
      ...(productId && { id: productId }),
      name,
      price: parseFloat(price),
      categoryId: categoryId,
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
        toastSuccess(productId ? "Produto atualizado com sucesso" : "Produto criado com sucesso");
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
            <div className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-500">Carregando categorias...</div>
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
                    <option key={id} value={id}>{nameVal}</option>
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

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
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

  useEffect(() => { table.setCurrentPage(1); }, [pageSize]);

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
                <td className="px-4 py-3 text-right font-semibold">R$ {Number(p.price).toFixed(2)}</td>
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

export default ProductsPage;
