import React from "react";
import { NavLink } from "react-router-dom";

export const Sidebar = () => (
  <aside className="w-64 bg-pink-100 p-4 hidden md:block min-h-screen">
    <h2 className="text-xl font-bold text-pink-700 mb-6">🍰 Doce De Renda</h2>
    <nav>
      <NavLink
        to="/dashboard"
        className={({ isActive }) => `block w-full text-left px-3 py-2 rounded mb-2 ${isActive ? 'bg-pink-300' : 'hover:bg-pink-200'}`}
        onClick={() => {
          // dispatch a global event so Dashboard can refresh even when already active
          try {
            window.dispatchEvent(new Event('dashboard:refresh'));
          } catch (e) {
            // ignore in environments without window
          }
        }}
      >
        Dashboard
      </NavLink>
      <NavLink to="/pedidos" className={({isActive}) => `block w-full text-left px-3 py-2 rounded mb-2 ${isActive ? 'bg-pink-300' : 'hover:bg-pink-200'}`}>
        Pedidos
      </NavLink>
      <NavLink to="/clientes" className={({isActive}) => `block w-full text-left px-3 py-2 rounded mb-2 ${isActive ? 'bg-pink-300' : 'hover:bg-pink-200'}`}>
        Clientes
      </NavLink>
      <NavLink to="/produtos" className={({isActive}) => `block w-full text-left px-3 py-2 rounded mb-2 ${isActive ? 'bg-pink-300' : 'hover:bg-pink-200'}`}>
        Produtos
      </NavLink>
    </nav>
  </aside>
);

export default Sidebar;
