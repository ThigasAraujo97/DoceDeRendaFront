import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import { ProductEditor } from "./ProductsPage";
import { CustomerEditor } from "./CustomersPage";
import { parseBackendDateTime, statusBadge } from "../utils";

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
  const [successMessage, setSuccessMessage] = useState("");

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
        // order response may include a snapshot of customer phone
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
          } catch (err) {}
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

  useEffect(() => {
    // When editing an existing order, do not trigger the live customer search
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
        setCustomerResults((customers || []).filter((c) => (c.name || "").toLowerCase().includes(q.toLowerCase())));
      }
    }, 300);
    return () => clearTimeout(t);
  }, [customerQuery, customers, orderId]);

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
        // also populate phone from canonical customer record
        setCustomerCellPhone(data.cellPhone || data.CellPhone || data.cellphone || "");
      } catch (err) {}
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
    // Canonical status: backend uses OrderPlaced/Confirmed/Finished
    const canonicalStatus = orderStatus || 'OrderPlaced';

    // Customer name/phone: prefer values from UI state. If phone is missing but we have a
    // selectedCustomer id, try fetching the canonical customer before saving.
    const customerName = (customerQuery && customerQuery.trim()) || undefined;
    let customerCell = customerCellPhone || undefined;
    if (!customerCell && selectedCustomer) {
      try {
        const cres = await fetch(`/api/customers/${selectedCustomer}`);
        if (cres.ok) {
          const cdata = await cres.json();
          customerCell = cdata.cellPhone || cdata.CellPhone || cdata.cellphone || undefined;
          if (customerCell) setCustomerCellPhone(customerCell);
        }
      } catch (err) {
        // ignore fetch failure; server will validate
      }
    }

    const payload = {
      OrderId: orderId ?? undefined,
      CustomerId: selectedCustomer ?? undefined,
      // Customer object expected by backend: include name, cell phone and address
      Customer: {
        Name: customerName,
        CellPhone: customerCell || undefined,
        Street: street || undefined,
        Number: number || undefined,
        Neighborhood: neighborhood || undefined,
        City: city || undefined,
        State: stateAddr || undefined,
        Apartment: apartment ?? undefined,
        NumberApartment: numberApartment || undefined,
      },
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
      console.log("Saving order payload:", payload);
      const res = await fetch("/api/orders/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro na API");
      const saved = await res.json();
      if (orderId) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? saved : o)));
        setSuccessMessage('Pedido salvo com sucesso');
      } else {
        setOrders((prev) => [saved, ...prev]);
        setSuccessMessage('Pedido criado com sucesso');
        if (typeof setEditingOrderId === "function" && saved && (saved.id || saved.OrderId || saved.Id)) {
          const newId = saved.id ?? saved.OrderId ?? saved.Id;
          setEditingOrderId(newId);
        }
      }
      // clear success message after a short delay
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar pedido");
    }
  };

  const printOrder = () => {
    const ids = orderId ? String(orderId) : "";
    const target = ids ? `/api/orders/print?ids=${encodeURIComponent(ids)}` : `/api/orders/print?preview=true`;
    try { window.open(target, '_blank'); } catch (err) { console.warn('Não foi possível abrir a janela de impressão', err); }
  };

  const printOrderKitchen = () => {
    const ids = orderId ? String(orderId) : "";
    const target = ids
      ? `/api/orders/print/kitchen?ids=${encodeURIComponent(ids)}`
      : `/api/orders/print/kitchen?preview=true`;
    try { window.open(target, '_blank'); } catch (err) { console.warn('Não foi possível abrir a janela de impressão da cozinha', err); }
  };

  const sendWhatsapp = async () => {
    const statusLabel = {
      OrderPlaced: 'Pedido Realizado', Confirmed: 'Pedido Confirmado', Finished: 'Concluído'
    }[orderStatus] || orderStatus || 'Pedido';
    const idLabel = orderId ? ` #${orderId}` : '';

    // prefer phone from loaded state; fall back to fetching the canonical customer or memory
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
    const customerLine = `*Cliente:* ${customerQuery || 'Cliente'}${phone ? ' - ' + phone : ''}\n\n`;

    // Try to fetch canonical items from API when we have an order id
    let orderItems = null;
    let orderFromApi = null;
    if (orderId) {
      try {
        let res = await fetch(`/api/orders/${orderId}/items`);
        if (res.ok) {
          orderItems = await res.json();
        } else {
          // fallback to fetching the whole order which may include `items`
          res = await fetch(`/api/orders/${orderId}`);
          if (res.ok) {
            orderFromApi = await res.json();
            if (Array.isArray(orderFromApi.items)) orderItems = orderFromApi.items;
          }
        }
      } catch (err) {
        console.warn('Não foi possível buscar itens do pedido:', err);
      }
    }

    // If API didn't return items, fall back to current editor items
    const itemsList = (orderItems && orderItems.length > 0)
      ? orderItems.map((it) => ({ productName: it.productName || it.ProductName || it.name, quantity: it.quantity || it.Quantity || it.qty, total: it.total != null ? it.total : (Number(it.unitPrice || it.UnitPrice || 0) * Number(it.quantity || it.Quantity || it.qty || 0)), notes: it.notes || it.Notes || '' }))
      : items.map((it) => ({ productName: it.productName, quantity: Number(it.qty || 0), total: Number(it.qty || 0) * Number(it.price || 0), notes: it.notes || '' }));

    const fmt = (v) => Number(v || 0).toFixed(2).replace('.', ',');

    // subtotal/total/paid values prefer API values when available
    const subtotalVal = orderFromApi && typeof orderFromApi.total === 'number' ? orderFromApi.items?.reduce((s, x) => s + (Number(x.total || x.Total || 0)), 0) : itemsSubtotal;
    const totalVal = orderFromApi && typeof orderFromApi.total === 'number' ? orderFromApi.total : total;
    const amountPaidVal = orderFromApi && (orderFromApi.amountPaid != null) ? orderFromApi.amountPaid : amountPaid;
    const discountVal = orderFromApi && (orderFromApi.discount != null) ? orderFromApi.discount : discount;
    const deliveryFeeVal = orderFromApi && (orderFromApi.deliveryFee != null) ? orderFromApi.deliveryFee : deliveryFee;

    // delivery/address values prefer API when present
    const isDeliveryVal = orderFromApi && typeof orderFromApi.isDelivery === 'boolean' ? orderFromApi.isDelivery : isDelivery;
    const streetVal = orderFromApi && (orderFromApi.customerStreet || orderFromApi.CustomerStreet) ? (orderFromApi.customerStreet || orderFromApi.CustomerStreet) : street;
    const numberVal = orderFromApi && (orderFromApi.customerNumber || orderFromApi.CustomerNumber) ? (orderFromApi.customerNumber || orderFromApi.CustomerNumber) : number;
    const apartmentVal = orderFromApi && (orderFromApi.apartment != null) ? orderFromApi.apartment : apartment;
    const numberApartmentVal = orderFromApi && (orderFromApi.customerNumberApartment || orderFromApi.CustomerNumberApartment) ? (orderFromApi.customerNumberApartment || orderFromApi.CustomerNumberApartment) : numberApartment;

    // Build items block
    let itemsMsg = '';
    itemsList.forEach((it) => {
      itemsMsg += `${it.quantity}x ${it.productName} - R$ ${fmt(it.total)}`;
      if (it.notes) itemsMsg += ` (${it.notes})`;
      itemsMsg += '\n';
    });

    // Build delivery/address lines
    const deliveryType = isDeliveryVal ? 'Entrega' : 'Retirada';
    let addressLine = '';
    if (isDeliveryVal) {
      const parts = [];
      if (streetVal) parts.push(streetVal);
      if (numberVal) parts.push('Número ' + numberVal);
      if (apartmentVal && numberApartmentVal) parts.push('Condomínio ' + numberApartmentVal);
      if (parts.length) addressLine = `\n*Endereço:* ${parts.join(', ')}`;
    }

    // Compose final message according to requested format
    const header = `*Pedido a Confirmar${idLabel}*\n\n`;
    const itemsHeader = `*Itens*\n`;

    // Financial block: subtotal, optional delivery fee, optional discount, optional paid, total
    let financial = `\n*Subtotal:* ${fmt(subtotalVal)}\n`;
    if (deliveryFeeVal && Number(deliveryFeeVal) > 0) financial += `*Taxa de entrega:* ${fmt(deliveryFeeVal)}\n`;
    if (discountVal && Number(discountVal) > 0) financial += `*Desconto:* ${fmt(discountVal)}\n`;
    if (amountPaidVal && Number(amountPaidVal) > 0) financial += `*Pago:* ${fmt(amountPaidVal)}\n`;
    financial += `*Total:* ${fmt(totalVal)}\n\n`;

    const deliveryBlock = `*Tipo Entrega:* ${deliveryType}${addressLine}`;

    let faltaLine = '';
    if (amountPaidVal && Number(amountPaidVal) > 0) {
      const calc = Number(totalVal || 0) + Number(deliveryFeeVal || 0) - Number(discountVal || 0) - Number(amountPaidVal || 0);
      faltaLine = `*Falta Pagar:* R$ ${fmt(calc)}\n\n`;
    }

    const msg = header + `*Cliente:* ${customerQuery || 'Cliente'}\n\n` + itemsHeader + itemsMsg + financial + faltaLine + deliveryBlock;

    if (!phone) return alert('Telefone do cliente não disponível para WhatsApp');
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
    try { window.open(url, '_blank'); } catch (err) { console.warn('Erro ao abrir WhatsApp', err); }
  };

  return (
    <>
      {successMessage ? (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[90%] md:w-2/3 lg:w-1/2 z-[9999]">
          <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-800 rounded text-center font-medium">
            {successMessage}
          </div>
        </div>
      ) : null}
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
    </>
  );
};

export default OrderEditor;
