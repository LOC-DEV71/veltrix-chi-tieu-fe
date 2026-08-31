import React from 'react';
import { X, Gift, ChevronRight } from 'lucide-react';
import './EventsModal.css';

const EventsModal = ({ onClose, onOpenDailyLogin }) => {
  return (
    <div className="events-modal-overlay" onClick={onClose}>
      <div className="events-modal-content" onClick={e => e.stopPropagation()}>
        <div className="events-modal-header">
          <h2>Danh sách Sự kiện</h2>
          <button className="events-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="events-modal-body">
          <div className="event-list-item" onClick={() => { onClose(); onOpenDailyLogin(); }}>
            <div className="event-icon-wrap">
              <Gift size={24} />
            </div>
            <div className="event-info">
              <h3 className="event-title">Điểm danh hàng ngày</h3>
              <p className="event-desc">Nhận khung Avatar độc quyền mỗi ngày</p>
            </div>
            <div className="event-arrow">
              <ChevronRight size={20} />
            </div>
          </div>
          {/* More events can be added here in the future */}
        </div>
      </div>
    </div>
  );
};

export default EventsModal;
