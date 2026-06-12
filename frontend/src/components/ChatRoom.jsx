import React, { useState, useEffect, useRef } from 'react';

// Custom inline SVG icons
const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

const RefreshCwIcon = ({ className }) => (
  <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

function ChatRoom({ userLevel, profile }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'error'
  const messagesEndRef = useRef(null);

  // Default values if profile is not complete
  const username = profile?.username || 'Người học';
  const avatarUrl = profile?.avatar || '';

  // Get chat history on mount
  useEffect(() => {
    fetchMessages();
    
    // Setup SSE connection
    const eventSource = new EventSource('http://localhost:8080/api/chat/stream');
    
    eventSource.onopen = () => {
      setConnectionStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg && msg.id) {
          setMessages((prev) => {
            // Avoid adding duplicate messages
            if (prev.some((m) => m.id === msg.id)) {
              return prev;
            }
            return [...prev, msg];
          });
        }
      } catch (err) {
        console.error("Failed to parse message event data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource error:", err);
      setConnectionStatus('error');
    };

    // Listen for custom 'connected' event
    eventSource.addEventListener('connected', () => {
      setConnectionStatus('connected');
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Scroll to bottom whenever messages list updates
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageData = {
      sender: username,
      avatar: avatarUrl,
      content: inputText.trim(),
    };

    setInputText('');

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

  // Quick message triggers
  const sendQuickMessage = async (phrase) => {
    const messageData = {
      sender: username,
      avatar: avatarUrl,
      content: phrase,
    };

    try {
      await fetch('http://localhost:8080/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
    } catch (err) {
      console.error("Error sending quick message:", err);
    }
  };

  // Format timestamps
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const quickPhrases = [
    { text: 'Konnichiwa! 🌸', label: 'Chào hỏi' },
    { text: 'Arigatou gozaimasu! 🙏', label: 'Cảm ơn' },
    { text: 'Ganbatte kudasai! 💪', label: 'Cố lên' },
    { text: 'Otsukaresama desu! 🍵', label: 'Vất vả rồi' },
    { text: 'Nihongo wa omoshiroi desu! 🇯🇵', label: 'Thú vị' },
  ];

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="channel-badge">
            <span style={{ marginRight: '0.25rem', fontWeight: 'bold' }}>#</span>
            <span>phong-chat-chung</span>
          </div>
          <p className="channel-desc">Nơi trao đổi kinh nghiệm học tập, hỏi đáp ngữ pháp tiếng Nhật cùng cộng đồng NihongoHub.</p>
        </div>

        <div className="chat-header-status">
          {connectionStatus === 'connected' && (
            <span className="status-indicator online">
              <span className="dot"></span> Trực tuyến
            </span>
          )}
          {connectionStatus === 'connecting' && (
            <span className="status-indicator connecting">
              <span className="dot animate-pulse"></span> Đang kết nối...
            </span>
          )}
          {connectionStatus === 'error' && (
            <button className="status-indicator offline-btn" onClick={fetchMessages}>
              <RefreshCwIcon className="animate-spin" /> Kết nối lại
            </button>
          )}
        </div>
      </div>

      {/* Chat Room Panels */}
      <div className="chat-workspace">
        {/* Messages Panel */}
        <div className="chat-messages-panel">
          <div className="messages-scroller">
            {messages.length > 0 ? (
              messages.map((msg) => {
                const isSelf = msg.sender === username;
                return (
                  <div key={msg.id} className={`chat-message-bubble-wrapper ${isSelf ? 'self' : ''}`}>
                    {/* Sender Avatar */}
                    {!isSelf && (
                      <div className="message-avatar-container">
                        {msg.avatar ? (
                          <img src={msg.avatar} alt={msg.sender} className="message-avatar" />
                        ) : (
                          <div className="message-avatar-fallback">
                            {msg.sender.substring(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="message-content-wrapper">
                      {/* Name & Time */}
                      {!isSelf && (
                        <div className="message-sender-meta">
                          <span className="sender-name">{msg.sender}</span>
                          <span className="message-time">{formatTime(msg.timestamp)}</span>
                        </div>
                      )}

                      {/* Message text */}
                      <div className="message-bubble">
                        <p>{msg.content}</p>
                        {isSelf && (
                          <span className="message-time self">{formatTime(msg.timestamp)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="chat-welcome-box">
                <div className="welcome-icon-wrapper" style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'inline-flex' }}>
                  <SparklesIcon />
                </div>
                <h3>Chào mừng đến với phòng chat chung!</h3>
                <p>Chưa có tin nhắn nào. Hãy là người đầu tiên gửi tin nhắn chào mọi người nhé!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Phrases panel */}
          <div className="chat-quick-phrases">
            <span className="quick-label">Gửi nhanh:</span>
            <div className="phrases-list">
              {quickPhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => sendQuickMessage(phrase.text)}
                  className="quick-phrase-btn"
                  title={phrase.text}
                >
                  {phrase.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input field */}
          <form className="chat-input-bar" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input-field"
              placeholder="Nhập nội dung tin nhắn của bạn..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={connectionStatus === 'error'}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputText.trim() || connectionStatus === 'error'}
            >
              <SendIcon /> Gửi
            </button>
          </form>
        </div>

        {/* Members Sidebar Panel */}
        <div className="chat-members-panel">
          <div className="panel-title">
            <span>Thành viên</span>
          </div>
          <div className="members-list">
            <div className="member-item me">
              <div className="member-avatar-wrapper">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username} className="member-avatar" />
                ) : (
                  <div className="member-avatar-fallback me">
                    {username.substring(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="status-badge online"></span>
              </div>
              <div className="member-detail">
                <span className="member-name">{username} (Bạn)</span>
                <span className="member-status">Trình độ {userLevel}</span>
              </div>
            </div>

            {/* Simulated active users to make the chat room feel lively */}
            <div className="member-item">
              <div className="member-avatar-wrapper">
                <div className="member-avatar-fallback" style={{ backgroundColor: '#a855f7' }}>A</div>
                <span className="status-badge online"></span>
              </div>
              <div className="member-detail">
                <span className="member-name">Anh Nguyễn</span>
                <span className="member-status">Trình độ N3</span>
              </div>
            </div>

            <div className="member-item">
              <div className="member-avatar-wrapper">
                <div className="member-avatar-fallback" style={{ backgroundColor: '#10b981' }}>M</div>
                <span className="status-badge online"></span>
              </div>
              <div className="member-detail">
                <span className="member-name">Minh Hoàng</span>
                <span className="member-status">Trình độ N4</span>
              </div>
            </div>

            <div className="member-item">
              <div className="member-avatar-wrapper">
                <div className="member-avatar-fallback" style={{ backgroundColor: '#f59e0b' }}>Y</div>
                <span className="status-badge online"></span>
              </div>
              <div className="member-detail">
                <span className="member-name">Yuki Chan</span>
                <span className="member-status">Người bản xứ 🎌</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;
