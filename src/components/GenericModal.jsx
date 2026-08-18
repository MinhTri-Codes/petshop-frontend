import React from 'react';
import { X } from 'lucide-react';

const GenericModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  icon: Icon, 
  actions,
  maxWidth = "max-w-xl",
  zIndex = "z-[100]"
}) => {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 sm:p-6`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className={`relative w-full ${maxWidth} bg-[#fbf9f8] rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 bg-white flex items-center justify-between shrink-0">
          <h2 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
            {Icon && <Icon className="text-primary" size={24} />}
            {title}
          </h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 bg-surface-container-low hover:bg-error hover:text-white rounded-full flex items-center justify-center text-outline transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="px-6 py-4 bg-white border-t border-outline-variant/30 flex items-center justify-end gap-3 shrink-0">
            {actions}
          </div>
        )}

      </div>
    </div>
  );
};

export default GenericModal;
