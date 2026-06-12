import React from 'react';

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

function Topbar({ userLevel, setUserLevel, profile }) {
  // Safe default values
  const username = profile?.username || 'Người học';
  const avatarUrl = profile?.avatar || '';

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

        {/* Notifications Mock */}
        <button className="topbar-btn" title="Thông báo">
          <BellIcon />
          <span className="btn-badge"></span>
        </button>

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
