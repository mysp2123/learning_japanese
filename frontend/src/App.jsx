import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import KanaGrid from './components/KanaGrid';
import VocabKanji from './components/VocabKanji';
import GrammarList from './components/GrammarList';
import QuizRunner from './components/QuizRunner';
import DocumentList from './components/DocumentList';
import ChatRoom from './components/ChatRoom';
import UserSettings from './components/UserSettings';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Global student level state: N5, N4, N3
  const [userLevel, setUserLevel] = useState(() => {
    const savedProfile = localStorage.getItem('nihongohub_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.level) return parsed.level;
      } catch (e) {}
    }
    return 'N5';
  });

  // Global user profile state: name, avatar
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('nihongohub_profile');
    return saved ? JSON.parse(saved) : { username: 'Người học', avatar: '' };
  });

  // Notifications state
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('nihongohub_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const initial = [
      {
        id: 'system_welcome',
        type: 'system',
        title: 'Chào mừng đến với NihongoHub!',
        message: 'Hãy bắt đầu lộ trình tự học tiếng Nhật hiệu quả cùng chúng tôi.',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: 'system_tip',
        type: 'system',
        title: 'Mẹo tự học',
        message: 'Tải và in giáo trình trong mục Tài liệu học tập để học hiệu quả hơn.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false
      }
    ];
    localStorage.setItem('nihongohub_notifications', JSON.stringify(initial));
    return initial;
  });

  // Toasts state
  const [toasts, setToasts] = useState([]);

  // Chat messages state
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Refs to avoid EventSource re-creation on navigation
  const currentPathRef = useRef(currentPath);
  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const addNotification = (notif) => {
    setNotifications((prev) => {
      const updated = [notif, ...prev].slice(0, 50);
      localStorage.setItem('nihongohub_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const addToast = (toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markAsRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem('nihongohub_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem('nihongohub_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markChatNotificationsAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => n.type === 'chat' ? { ...n, read: true } : n);
      localStorage.setItem('nihongohub_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const fetchMessages = async () => {
    try {
      setConnectionStatus('connecting');
      const response = await fetch('http://localhost:8080/api/chat/messages');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setMessages(data);
        }
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (err) {
      console.error("Error loading chat messages:", err);
      setConnectionStatus('error');
    }
  };

  const sendMessage = async (content) => {
    const messageData = {
      sender: profile?.username || 'Người học',
      avatar: profile?.avatar || '',
      content: content.trim(),
    };

    try {
      const response = await fetch('http://localhost:8080/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        console.error("Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // SSE setup
  useEffect(() => {
    fetchMessages();

    const eventSource = new EventSource('http://localhost:8080/api/chat/stream');
    
    eventSource.onopen = () => {
      setConnectionStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg && msg.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) {
              return prev;
            }
            return [...prev, msg];
          });

          const currentProfile = profileRef.current;
          const isSelf = msg.sender === currentProfile?.username;
          
          if (!isSelf && currentPathRef.current !== '/chat') {
            const newNotif = {
              id: `chat_${msg.id}_${Date.now()}`,
              type: 'chat',
              title: `Tin nhắn từ ${msg.sender}`,
              message: msg.content,
              timestamp: msg.timestamp || new Date().toISOString(),
              read: false,
              url: '/chat'
            };
            
            setNotifications((prev) => {
              const updated = [newNotif, ...prev].slice(0, 50);
              localStorage.setItem('nihongohub_notifications', JSON.stringify(updated));
              return updated;
            });

            addToast({
              id: Date.now() + Math.random(),
              title: msg.sender,
              content: msg.content,
              avatar: msg.avatar
            });
          }
        }
      } catch (err) {
        console.error("Failed to parse message event:", err);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus('error');
    };

    eventSource.addEventListener('connected', () => {
      setConnectionStatus('connected');
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleProfileUpdate = (updatedProfile) => {
    const newProfile = { ...updatedProfile, level: userLevel };
    setProfile(newProfile);
    localStorage.setItem('nihongohub_profile', JSON.stringify(newProfile));
  };

  const handleLevelChange = (newLevel) => {
    setUserLevel(newLevel);
    const newProfile = { ...profile, level: newLevel };
    setProfile(newProfile);
    localStorage.setItem('nihongohub_profile', JSON.stringify(newProfile));

    // Add level change system notification
    const newNotif = {
      id: `system_level_${Date.now()}`,
      type: 'system',
      title: 'Cập nhật trình độ học',
      message: `Chúc mừng! Bạn đã đổi trình độ học tập sang ${newLevel}. Hãy khám phá lộ trình học tập phù hợp!`,
      timestamp: new Date().toISOString(),
      read: false
    };
    addNotification(newNotif);
  };

  // Render a personalized learning path based on selected level
  const renderLearningPath = () => {
    if (userLevel === 'N5') {
      return (
        <div className="learning-path-wrapper">
          <div className="hero">
            <h1>Lộ trình học Tiếng Nhật N5 (Sơ cấp)</h1>
            <p>Chào mừng bạn! Dưới đây là lộ trình 5 bước được tối ưu hóa cho người mới bắt đầu học tiếng Nhật.</p>
          </div>

          <div className="path-container">
            <div className="path-title-wrapper">
              <h2>Lộ trình học tập của bạn</h2>
              <span className="path-badge">Trình độ: N5</span>
            </div>

            <div className="path-steps">
              <div className="card path-step-card">
                <span className="path-step-num">Bước 1</span>
                <h3>Học bảng chữ cái</h3>
                <p>Ghi nhớ mặt chữ Hiragana và Katakana thông qua bảng âm tiết trực quan chuẩn W3C.</p>
                <button className="btn btn-secondary" onClick={() => navigate('/alphabet')}>
                  Học ngay
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 2</span>
                <h3>Tập viết nét chữ</h3>
                <p>Sử dụng bảng vẽ Canvas lớn 400x400 để tập đồ theo thứ tự nét viết chuẩn xác.</p>
                <button className="btn btn-secondary" onClick={() => navigate('/alphabet')}>
                  Tập viết
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 3</span>
                <h3>Học từ vựng nền tảng</h3>
                <p>Nạp thêm từ vựng sơ cấp N5 thông qua hệ thống thẻ Flashcard lật thông minh.</p>
                <button className="btn btn-secondary" onClick={() => navigate('/vocabulary')}>
                  Xem từ vựng
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 4</span>
                <h3>Cấu trúc ngữ pháp</h3>
                <p>Nghiên cứu các mẫu ngữ pháp mở đầu quan trọng như khẳng định danh từ và yêu cầu lịch sự.</p>
                <button className="btn btn-secondary" onClick={() => navigate('/grammar')}>
                  Xem ngữ pháp
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 5</span>
                <h3>Trắc nghiệm thử sức</h3>
                <p>Tham gia làm đề trắc nghiệm N5 để kiểm tra kiến thức và nhận pháo hoa giấy chúc mừng.</p>
                <button className="btn btn-primary" onClick={() => navigate('/quizzes')}>
                  Luyện tập
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (userLevel === 'N4') {
      return (
        <div className="learning-path-wrapper">
          <div className="hero">
            <h1>Lộ trình học Tiếng Nhật N4 (Sơ trung cấp)</h1>
            <p>Tuyệt vời! Bạn đã có kiến thức nền tảng. Hãy bắt đầu nâng cấp kỹ năng của mình qua 3 bước dưới đây.</p>
          </div>

          <div className="path-container">
            <div className="path-title-wrapper">
              <h2>Lộ trình học tập của bạn</h2>
              <span className="path-badge">Trình độ: N4</span>
            </div>

            <div className="path-steps">
              <div className="card path-step-card">
                <span className="path-step-num">Bước 1</span>
                <h3>Mở rộng vốn Từ vựng</h3>
                <p>Tăng cường vốn từ vựng N4 thường gặp trong đời sống hàng ngày và các kỳ thi năng lực.</p>
                <button className="btn btn-secondary" onClick={() => navigate('/vocabulary')}>
                  Học từ vựng
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 2</span>
                <h3>Mẫu câu Trải nghiệm</h3>
                <p>Học các mẫu ngữ pháp N4 trung cấp liên kết câu như miêu tả trải nghiệm đã từng làm gì.</p>
                <button className="btn btn-secondary" onClick={() => navigate('/grammar')}>
                  Học ngữ pháp
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 3</span>
                <h3>Kiểm tra năng lực N4</h3>
                <p>Tham gia làm bài thi thử để đánh giá mức độ ghi nhớ các từ vựng và cấu trúc ngữ pháp N4.</p>
                <button className="btn btn-primary" onClick={() => navigate('/quizzes')}>
                  Làm trắc nghiệm
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // N3 Path
      return (
        <div className="learning-path-wrapper">
          <div className="hero">
            <h1>Lộ trình học Tiếng Nhật N3 (Trung cấp)</h1>
            <p>Thử thách bản thân ở mức độ trung cấp nâng cao! Tập trung vào chữ Hán Kanji và cấu trúc diễn đạt phức tạp.</p>
          </div>

          <div className="path-container">
            <div className="path-title-wrapper">
              <h2>Lộ trình học tập của bạn</h2>
              <span className="path-badge">Trình độ: N3</span>
            </div>

            <div className="path-steps">
              <div className="card path-step-card">
                <span className="path-step-num">Bước 1</span>
                <h3>Học chữ Hán Kanji N3</h3>
                <p>Tra cứu chữ Hán, số nét viết, cách đọc âm On/Kun và các ví dụ ghép từ phức tạp hơn.</p>
                <button className="btn btn-secondary" onClick={() => navigate('/vocabulary')}>
                  Học chữ Hán
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 2</span>
                <h3>Ngữ pháp diễn đạt ý chí</h3>
                <p>Luyện tập các cấu trúc ngữ pháp N3 biểu thị sự cố gắng tạo thói quen tốt hàng ngày.</p>
                <button className="btn btn-secondary" onClick={() => navigate('/grammar')}>
                  Học ngữ pháp
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 3</span>
                <h3>Đề trắc nghiệm tổng hợp N3</h3>
                <p>Đánh giá tổng quát năng lực trung cấp bằng bộ câu hỏi trắc nghiệm N3 chuyên sâu.</p>
                <button className="btn btn-primary" onClick={() => navigate('/quizzes')}>
                  Bắt đầu thi
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar - Cố định bên trái */}
      <Sidebar />

      {/* Vùng nội dung bên phải */}
      <div className="app-main-wrapper">
        {/* Topbar - Cố định trên cùng */}
        <Topbar 
          userLevel={userLevel} 
          setUserLevel={handleLevelChange} 
          profile={profile} 
          notifications={notifications}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
        />

        {/* Nội dung trang thay đổi theo Router */}
        <main className="app-content">
          <Routes>
            <Route path="/" element={renderLearningPath()} />
            <Route path="/alphabet" element={<KanaGrid />} />
            <Route path="/vocabulary" element={<VocabKanji userLevel={userLevel} />} />
            <Route path="/grammar" element={<GrammarList userLevel={userLevel} />} />
            <Route path="/quizzes" element={<QuizRunner userLevel={userLevel} />} />
            <Route path="/documents" element={<DocumentList />} />
            <Route path="/chat" element={
              <ChatRoom 
                userLevel={userLevel} 
                profile={profile} 
                messages={messages}
                connectionStatus={connectionStatus}
                sendMessage={sendMessage}
                fetchMessages={fetchMessages}
                markChatNotificationsAsRead={markChatNotificationsAsRead}
              />
            } />
            <Route path="/settings" element={
              <UserSettings 
                userLevel={userLevel} 
                setUserLevel={handleLevelChange} 
                profile={profile} 
                onProfileUpdate={handleProfileUpdate} 
              />
            } />
          </Routes>
        </main>
      </div>

      {/* Floating Toast Notification Popup */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast-item" onClick={() => { navigate('/chat'); removeToast(toast.id); }}>
            <div className="toast-avatar-container">
              {toast.avatar ? (
                <img src={toast.avatar} alt={toast.title} className="toast-avatar-img" />
              ) : (
                <div className="toast-avatar-fallback">
                  {toast.title.substring(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div className="toast-body">
              <span className="toast-header-text">{toast.title}</span>
              <span className="toast-message">{toast.content}</span>
            </div>
            <button 
              className="toast-close-btn" 
              onClick={(e) => { 
                e.stopPropagation(); 
                removeToast(toast.id); 
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
