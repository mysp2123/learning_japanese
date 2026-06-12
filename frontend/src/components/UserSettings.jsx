import React, { useState, useRef } from 'react';

// Custom inline SVG icons
const UserIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const SaveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const RefreshCwIcon = ({ className, size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AwardIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem', color: 'var(--accent)' }}>
    <circle cx="12" cy="8" r="7" />
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);

function UserSettings({ userLevel, setUserLevel, profile, onProfileUpdate }) {
  const [username, setUsername] = useState(profile?.username || 'Người học');
  const [avatar, setAvatar] = useState(profile?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setUploading(true);
      const response = await fetch('http://localhost:8080/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.avatarUrl) {
          setAvatar(data.avatarUrl);
          // Notify immediate preview update
          const updated = { ...profile, username, avatar: data.avatarUrl };
          onProfileUpdate(updated);
        }
      } else {
        const errData = await response.json();
        alert(errData.error || "Có lỗi xảy ra khi upload ảnh.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Không thể kết nối đến máy chủ để upload ảnh.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const updatedProfile = {
      username: username.trim() || 'Người học',
      avatar: avatar,
    };
    onProfileUpdate(updatedProfile);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleResetProfile = () => {
    if (window.confirm("Bạn có chắc chắn muốn khôi phục hồ sơ mặc định không?")) {
      setUsername('Người học');
      setAvatar('');
      setUserLevel('N5');
      const updated = { username: 'Người học', avatar: '' };
      onProfileUpdate(updated);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Cài Đặt Tài Khoản</h1>
        <p>Thiết lập hồ sơ cá nhân của bạn, bao gồm tên hiển thị, cấp độ học hiện tại và hình ảnh đại diện.</p>
      </div>

      <div className="settings-content-wrapper">
        <form className="settings-form" onSubmit={handleSaveSettings}>
          {/* Avatar Section */}
          <div className="settings-avatar-section">
            <div className="avatar-preview-wrapper" onClick={handleAvatarClick}>
              {avatar ? (
                <img src={avatar} alt="Avatar Preview" className="avatar-preview-img" />
              ) : (
                <div className="avatar-preview-fallback">
                  <UserIcon size={48} />
                </div>
              )}
              <div className="avatar-upload-overlay">
                {uploading ? (
                  <RefreshCwIcon size={24} className="animate-spin" />
                ) : (
                  <CameraIcon />
                )}
              </div>
            </div>
            <div className="avatar-info-text">
              <h3>Ảnh đại diện</h3>
              <p>Hỗ trợ định dạng JPG, PNG, GIF. Kích thước tối đa 5MB.</p>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={handleAvatarClick}
                disabled={uploading}
                style={{ marginTop: '0.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Chọn ảnh khác
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="settings-divider"></div>

          {/* Form Fields */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">Tên hiển thị công khai</label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên hiển thị của bạn..."
              maxLength={30}
              required
            />
            <span className="form-help">Tên này sẽ hiển thị với mọi người trong phòng chat chung.</span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="userLevel">Cấp độ học hiện tại (JLPT)</label>
            <div className="select-control-wrapper">
              <select
                id="userLevel"
                className="form-control select-control"
                value={userLevel}
                onChange={(e) => setUserLevel(e.target.value)}
              >
                <option value="N5">N5 - Sơ cấp nâng bước</option>
                <option value="N4">N4 - Sơ trung cấp hội nhập</option>
                <option value="N3">N3 - Trung cấp bứt phá</option>
              </select>
            </div>
            <span className="form-help">Thay đổi cấp độ sẽ tự động điều chỉnh lộ trình học tập của bạn trên Trang chủ.</span>
          </div>

          {/* Action buttons */}
          <div className="settings-actions">
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              <SaveIcon /> Lưu thay đổi
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleResetProfile}
              disabled={uploading}
            >
              Đặt lại mặc định
            </button>
          </div>

          {/* Success message banner */}
          {saveSuccess && (
            <div className="settings-success-alert animate-fade-in">
              <CheckCircleIcon />
              <span>Đã lưu cài đặt tài khoản thành công!</span>
            </div>
          )}
        </form>

        {/* Sidebar Info Card */}
        <div className="settings-info-card">
          <div className="info-card-header">
            <AwardIcon />
            <h3>Học viên tích cực</h3>
          </div>
          <div className="info-card-body">
            <p><strong>Cấp độ hiện tại:</strong> JLPT {userLevel}</p>
            <p>Lộ trình tương ứng đã được tối ưu hóa cho bạn. Để có kết quả tốt nhất, hãy hoàn thành các bài trắc nghiệm sau mỗi bài học ngữ pháp.</p>
            <div className="progress-mock">
              <div className="progress-mock-text">
                <span>Tiến độ N5</span>
                <span>80%</span>
              </div>
              <div className="progress-mock-bar">
                <div className="progress-mock-fill" style={{ width: '80%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserSettings;
