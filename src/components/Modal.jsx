import React from "react";

export const Modal = ({ isOpen, title, children, onClose, large }) => {
  if (!isOpen) return null;
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

export default Modal;
