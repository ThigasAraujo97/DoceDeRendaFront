import React, { useEffect, useState } from 'react';

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (ev) => {
      const { type, message, duration } = ev.detail || {};
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, type, message, duration: duration || 4000 }]);
    };
    window.addEventListener('app:toast', handler);
    return () => window.removeEventListener('app:toast', handler);
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), t.duration)
    );
    return () => timers.forEach((id) => clearTimeout(id));
  }, [toasts]);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[99999] w-[90%] md:w-2/3 lg:w-1/2 pointer-events-none">
      <div className="flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto px-4 py-2 rounded border ${t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Toast;
