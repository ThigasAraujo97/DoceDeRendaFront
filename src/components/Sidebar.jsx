import React from "react";

export const Sidebar = ({ page, setPage }) => (
  <aside className="w-64 bg-pink-100 p-4 hidden md:block">
    <h2 className="text-xl font-bold text-pink-700 mb-6">🍰 Thiago Araujo</h2>
    {['Dashboard', 'Pedidos', 'Clientes', 'Produtos'].map((p) => (
      <button
        key={p}
        onClick={() => setPage(p)}
        className={`block w-full text-left px-3 py-2 rounded mb-2 ${
          page === p ? 'bg-pink-300' : 'hover:bg-pink-200'
        }`}
      >
        {p}
      </button>
    ))}
  </aside>
);

export default Sidebar;
