import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const baseButtonClass = "flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95";
  
  return (
    <div className="flex justify-center items-center mt-8 space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${baseButtonClass} ${
          currentPage === 1
            ? 'bg-surface-variant text-outline/50 cursor-not-allowed shadow-none'
            : 'bg-white text-on-surface hover:bg-surface-container-low hover:text-primary border border-outline-variant/50'
        }`}
        aria-label="Previous Page"
      >
        <ChevronLeft size={18} />
      </button>

      {startPage > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className={`${baseButtonClass} bg-white text-on-surface hover:bg-surface-container-low hover:text-primary border border-outline-variant/50`}
          >
            1
          </button>
          {startPage > 2 && (
            <span className="flex items-center justify-center w-8 text-outline">
              <MoreHorizontal size={18} />
            </span>
          )}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`${baseButtonClass} ${
            currentPage === page
              ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105 pointer-events-none'
              : 'bg-white text-on-surface hover:bg-surface-container-low hover:text-primary border border-outline-variant/50'
          }`}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="flex items-center justify-center w-8 text-outline">
              <MoreHorizontal size={18} />
            </span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className={`${baseButtonClass} bg-white text-on-surface hover:bg-surface-container-low hover:text-primary border border-outline-variant/50`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${baseButtonClass} ${
          currentPage === totalPages
            ? 'bg-surface-variant text-outline/50 cursor-not-allowed shadow-none'
            : 'bg-white text-on-surface hover:bg-surface-container-low hover:text-primary border border-outline-variant/50'
        }`}
        aria-label="Next Page"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

export default Pagination;
