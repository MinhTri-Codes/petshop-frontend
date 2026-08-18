import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName, title = "Xác nhận xóa", message = "Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác." }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          
          <h2 className="text-xl font-extrabold text-on-surface mb-2">{title}</h2>
          
          <p className="text-outline font-medium mb-4">
            {message}
          </p>
          
          {itemName && (
            <div className="p-3 bg-surface-container-low rounded-xl text-on-surface font-bold text-sm mb-6 border border-outline-variant/30">
              {itemName}
            </div>
          )}
          
          <div className="flex gap-3 mt-6">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-error hover:bg-error/90 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Trash2 size={18} />
              Xóa ngay
            </button>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-outline hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
