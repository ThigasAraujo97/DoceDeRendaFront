import React from "react";

export const OrderStatusDisplay = {
  OrderPlaced: "Pedido Realizado",
  Confirmed: "Pedido Confirmado",
  Finished: "Concluído",
};

export const parseBackendDateTime = (dateString) => {
  if (!dateString) return null;
  const tryIso = new Date(dateString);
  if (!isNaN(tryIso.getTime())) return tryIso;
  const m = String(dateString).match(/^(\d{2})\/(\d{2})\/(\d{4})[ T](\d{2}):(\d{2})$/);
  if (m) {
    const [, dd, mm, yyyy, hh, min] = m;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
  }
  const m2 = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (m2) {
    const [, yyyy, mm, dd, hh, min] = m2;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min));
  }
  return null;
};

export const productStatusLabel = (s) => {
  if (!s) return "-";
  const map = { Activated: "Ativo", Removed: "Removido" };
  return map[s] || s;
};

export const statusBadge = (status, variant = "block") => {
  const raw = status || "";
  // Accept either internal keys (OrderPlaced/Confirmed/Finished) or Portuguese labels
  let key = raw;
  if (!Object.prototype.hasOwnProperty.call(OrderStatusDisplay, key)) {
    // try to find matching key by label
    const found = Object.keys(OrderStatusDisplay).find((k) => OrderStatusDisplay[k] === raw);
    if (found) key = found;
  }
  const label = OrderStatusDisplay[key] || raw || "-";
  const baseBlock = "block w-full text-center rounded-md py-1 text-sm font-semibold";
  const baseInline = "inline-block px-3 py-1 text-sm font-semibold rounded";
  const base = variant === "inline" ? baseInline : baseBlock;
  if (key === "Confirmed") return (
    <span className={`${base} bg-green-50 border border-green-200 text-green-700`}>{label}</span>
  );
  if (key === "Finished") return (
    <span className={`${base} bg-blue-50 border border-blue-200 text-blue-700`}>{label}</span>
  );
  // default -> OrderPlaced (amarelo claro)
  return (
    <span className={`${base} bg-yellow-50 border border-yellow-200 text-yellow-800`}>{label}</span>
  );
};
