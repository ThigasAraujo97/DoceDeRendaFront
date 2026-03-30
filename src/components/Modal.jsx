import React from "react";

export const Modal = ({ isOpen, title, children, onClose, large }) => {
  if (!isOpen) return null;
  const sizeClass = large ? "w-11/12 md:w-11/12 lg:w-4/5 max-w-7xl" : "w-96";
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50 p-4">
      <div className={`bg-slate-800 rounded-lg shadow-lg ${sizeClass} max-h-[92vh] flex flex-col`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-200">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
