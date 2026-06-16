import React from 'react';

const Modal = ({ isOpen, title, message, onConfirm, onCancel, type = 'confirm', confirmLabel = 'Đồng ý', cancelLabel = 'Hủy bỏ' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close-icon" onClick={onCancel}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          {type === 'confirm' && (
            <button className="btn btn-secondary" onClick={onCancel} style={{ marginRight: '0.75rem' }}>
              {cancelLabel}
            </button>
          )}
          <button 
            className={`btn ${type === 'confirm' ? 'btn-primary' : 'btn-primary'}`} 
            onClick={() => {
              if (onConfirm) onConfirm();
              else onCancel();
            }}
          >
            {type === 'alert' ? 'Đóng' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
