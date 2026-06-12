import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Custom inline SVG icons
const ChevronDownIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a3 3 0 0 0 5.4 0" />
  </svg>
);

const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

function Topbar({ userLevel, setUserLevel, profile, notifications = [], markAsRead, markAllAsRead }) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Safe default values
  const username = profile?.username || 'Người học';
  const avatarUrl = profile?.avatar || '';

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    setDropdownOpen(false);
    if (notif.url) {
      navigate(notif.url);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return new Date(timestamp).toLocaleDateString('vi-VN');
    } catch (e) {
      return '';
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h2 className="topbar-title"></h2>
      </div>

      <div className="topbar-right">
        {/* Global Level Selector */}
        <div className="topbar-level-selector">
          <span className="level-label">Trình độ:</span>
          <div className="select-wrapper">
            <select
              value={userLevel}
              onChange={(e) => setUserLevel(e.target.value)}
              className="level-select"
            >
              <option value="N5">N5 - Sơ cấp</option>
              <option value="N4">N4 - Sơ trung cấp</option>
              <option value="N3">N3 - Trung cấp</option>
            </select>
            <ChevronDownIcon className="select-icon" />
          </div>
        </div>

        {/* Notifications Dropdown */}
        <div className="notification-container" ref={dropdownRef}>
          <button 
            className="topbar-btn" 
            title="Thông báo"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <BellIcon />
            {unreadCount > 0 && <span className="btn-badge">{unreadCount}</span>}
          </button>

          {dropdownOpen && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <h3>Thông báo</h3>
                {unreadCount > 0 && (
                  <button className="mark-all-read-btn" onClick={markAllAsRead}>
                    Đọc tất cả
                  </button>
                )}
              </div>
              
              <div className="notifications-list">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`notification-item ${notif.read ? '' : 'unread'}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className={`notification-icon-wrapper ${notif.type}`}>
                        {notif.type === 'chat' ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="notification-item-content">
                        <span className="notification-title">{notif.title}</span>
                        <span className="notification-desc">{notif.message}</span>
                        <span className="notification-time">{formatTimeAgo(notif.timestamp)}</span>
                      </div>
                      
                      {!notif.read && <span className="unread-dot"></span>}
                    </div>
                  ))
                ) : (
                  <div className="notifications-empty">
                    Không có thông báo nào.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="topbar-divider"></div>

        {/* User Profile Info */}
        <div className="topbar-profile">
          <div className="profile-avatar-container">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="profile-avatar" />
            ) : (
              <div className="profile-avatar-fallback">
                <UserIcon />
              </div>
            )}
          </div>
          <div className="profile-info">
            <span className="profile-name">{username}</span>
            <span className="profile-role">Học viên {userLevel}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
