import React from "react";
import { FiX } from "react-icons/fi";

const NotificationSidebar = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAllRead,
  readIds
}) => {
  return (
    <>
      <div
        className={`pd-notif-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
      />
      <div className={`pd-notif-sidebar ${isOpen ? "show" : ""}`}>
        <div className="pd-notif-head">
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <button className="pd-notif-mark-read" onClick={onMarkAllRead}>
              Mark all read
            </button>
          )}
          <button className="pd-notif-close" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>
        <div className="pd-notif-body">
          <div className="pd-notif-date">Today</div>
          {notifications.map((n) => (
            <div
              className={`pd-notif-item ${n.unread && !readIds.includes(n.id) ? "unread" : ""}`}
              key={n.id}
            >
              <div
                className="pd-notif-icon"
                style={{ background: n.bg, color: n.color }}
              >
                {n.icon}
              </div>
              <div className="pd-notif-content">
                <div className="pd-notif-title">{n.title}</div>
                <div className="pd-notif-desc">{n.desc}</div>
                <div className="pd-notif-time">{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default NotificationSidebar;
