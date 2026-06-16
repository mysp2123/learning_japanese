import React, { useState } from 'react';

const AVATAR_PRESETS = [
  { emoji: '🌸', name: 'Anh Đào' },
  { emoji: '🗻', name: 'Phú Sĩ' },
  { emoji: '🦊', name: 'Kitsune' },
  { emoji: '🥷', name: 'Ninja' },
  { emoji: '🍣', name: 'Sushi' },
  { emoji: '🏯', name: 'Himeji' },
];

function AuthPage({ onLoginSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🌸');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Handle Login via PostgreSQL API
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin đăng nhập.');
      return;
    }

    try {
      const response = await fetch(`${window.API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password: password
        })
      });

      if (response.ok) {
        const matchedUser = await response.json();
        const profileData = {
          username: matchedUser.fullName || matchedUser.username,
          avatar: matchedUser.avatar || '🌸',
          level: matchedUser.level || 'N5',
          rawUsername: matchedUser.username
        };
        
        localStorage.setItem('nihongohub_profile', JSON.stringify(profileData));
        setSuccessMessage('Đăng nhập thành công! Đang tải hệ thống...');
        setTimeout(() => {
          onLoginSuccess(profileData);
        }, 1000);
      } else {
        const errData = await response.json();
        setErrorMessage(errData.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };

  // Handle Register via PostgreSQL API
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password || !fullName.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin đăng ký.');
      return;
    }

    try {
      const response = await fetch(`${window.API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password: password,
          fullName: fullName.trim(),
          avatar: selectedAvatar
        })
      });

      if (response.ok) {
        setSuccessMessage('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
        setFullName('');
        setPassword('');
        setTimeout(() => {
          setIsLoginTab(true);
          setSuccessMessage('');
          setShowPassword(false);
        }, 1500);
      } else {
        const errData = await response.json();
        setErrorMessage(errData.error || 'Tên đăng nhập này đã được sử dụng.');
      }
    } catch (err) {
      console.error("Register error:", err);
      setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card-wrapper">
        <div className="auth-brand">
          <img src="/logo.png" alt="NihongoHub Logo" className="auth-logo" />
          <h2 className="auth-title">NihongoHub</h2>
          <p className="auth-subtitle">Học tiếng Nhật tối giản & thông minh</p>
        </div>

        {/* Tab Selector */}
        <div className="auth-tabs">
          <button 
            type="button" 
            className={`auth-tab-btn ${isLoginTab ? 'active' : ''}`}
            onClick={() => { 
              setIsLoginTab(true); 
              setErrorMessage(''); 
              setSuccessMessage('');
              setShowPassword(false);
            }}
          >
            Đăng nhập
          </button>
          <button 
            type="button" 
            className={`auth-tab-btn ${!isLoginTab ? 'active' : ''}`}
            onClick={() => { 
              setIsLoginTab(false); 
              setErrorMessage(''); 
              setSuccessMessage('');
              setShowPassword(false);
            }}
          >
            Đăng ký
          </button>
        </div>

        {/* Feedback Alert Messages */}
        {errorMessage && <div className="auth-alert error">{errorMessage}</div>}
        {successMessage && <div className="auth-alert success">{successMessage}</div>}

        {/* Auth Forms */}
        {isLoginTab ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label>Tên đăng nhập</label>
              <input 
                type="text" 
                placeholder="Nhập tên đăng nhập" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Mật khẩu</label>
              <div className="password-input-wrapper" style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Nhập mật khẩu" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    padding: '5px'
                  }}
                >
                  {showPassword ? 'ẨN' : 'HIỆN'}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">Đăng nhập</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label>Họ và tên</label>
              <input 
                type="text" 
                placeholder="Nhập họ và tên của bạn" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Tên đăng nhập</label>
              <input 
                type="text" 
                placeholder="Tên đăng nhập viết liền không dấu" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu</label>
              <div className="password-input-wrapper" style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Nhập mật khẩu tự chọn" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '45px', width: '100%', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    padding: '5px'
                  }}
                >
                  {showPassword ? 'ẨN' : 'HIỆN'}
                </button>
              </div>
            </div>

            {/* Avatar Selector */}
            <div className="form-group">
              <label>Chọn biểu tượng đại diện</label>
              <div className="avatar-grid">
                {AVATAR_PRESETS.map((av) => (
                  <button
                    key={av.name}
                    type="button"
                    className={`avatar-preset-btn ${selectedAvatar === av.emoji ? 'active' : ''}`}
                    onClick={() => setSelectedAvatar(av.emoji)}
                    title={av.name}
                  >
                    <span className="avatar-emoji">{av.emoji}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="auth-submit-btn register">Đăng ký tài khoản</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthPage;
