import React from "react";

const Dashboard = ({ orders = [], customers = [], products = [] }) => {
  const totalOrders = orders?.length || 0;
  const totalRevenue = (orders || []).reduce((sum, o) => sum + (Number(o?.total) || 0), 0);
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
          {['OrderPlaced', 'Confirmed', 'Finished'].map((status) => {
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
          <p className="text-sm text-gray-700">Pedidos Concluídos: <strong>{orders.filter((o) => o.status === 'Finished').length}</strong></p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
