import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Plus, 
  Send, 
  Clock, 
  Eye, 
  User, 
  MessageSquare, 
  Award,
  Video,
  X
} from 'lucide-react';

const VideoLearning = ({ profile }) => {
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const chatEndRef = useRef(null);
  const chatAreaRef = useRef(null);
  const watchTimerRef = useRef(null);
  const isNewViewRef = useRef(true);
  const userScrolledUpRef = useRef(false);

  // Parse YouTube ID
  const extractYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Fetch all videos
  const fetchVideos = () => {
    fetch(`${window.API_BASE}/videos`)
      .then((res) => res.json())
      .then((data) => {
        setVideos(data || []);
        if (data && data.length > 0 && !activeVideo) {
          setActiveVideo(data[0]);
          isNewViewRef.current = true;
        }
      })
      .catch((err) => console.error('Lỗi tải danh sách video:', err));
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Handle active video change
  useEffect(() => {
    if (activeVideo) {
      // Fetch comments for active video
      fetchComments();
      // Fetch statistics for active video
      fetchStats();

      // Poll comments & stats every 5 seconds
      const interval = setInterval(() => {
        fetchComments();
        fetchStats();
      }, 5000);

      // Start watch time tracking
      isNewViewRef.current = true;
      startWatchTracking();

      return () => {
        clearInterval(interval);
        stopWatchTracking();
      };
    }
  }, [activeVideo]);

  useEffect(() => {
    const area = chatAreaRef.current;
    if (!area) return;

    const handleScroll = () => {
      const threshold = 120;
      const atBottom = area.scrollHeight - area.scrollTop - area.clientHeight < threshold;
      userScrolledUpRef.current = !atBottom;
    };

    area.addEventListener('scroll', handleScroll, { passive: true });
    return () => area.removeEventListener('scroll', handleScroll);
  }, [activeVideo]);

  useEffect(() => {
    if (!userScrolledUpRef.current && chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [comments]);

  const fetchComments = () => {
    if (!activeVideo) return;
    fetch(`${window.API_BASE}/videos/comments?videoId=${activeVideo.id}`)
      .then((res) => res.json())
      .then((data) => setComments(data || []))
      .catch((err) => console.error('Lỗi tải bình luận:', err));
  };

  const fetchStats = () => {
    if (!activeVideo) return;
    fetch(`${window.API_BASE}/videos/stats?videoId=${activeVideo.id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setStats(data || []))
      .catch((err) => console.error('Lỗi tải thống kê:', err));
  };

  // Track watch time: sends 5-second pulses to the API
  const startWatchTracking = () => {
    stopWatchTracking();
    watchTimerRef.current = setInterval(() => {
      if (!activeVideo || !profile) return;
      
      const payload = {
        videoId: activeVideo.id,
        username: profile.username,
        duration: 5,
        isNewView: isNewViewRef.current
      };

      fetch(`${window.API_BASE}/videos/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then((res) => {
          if (res.ok) {
            isNewViewRef.current = false; // Set to false so we only add 1 view per session
          }
        })
        .catch((err) => console.error('Lỗi gửi thống kê xem:', err));
    }, 5000);
  };

  const stopWatchTracking = () => {
    if (watchTimerRef.current) {
      clearInterval(watchTimerRef.current);
      watchTimerRef.current = null;
    }
  };

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activeVideo || !profile) return;

    const payload = {
      videoId: activeVideo.id,
      sender: profile.fullName || profile.username,
      avatar: profile.avatar || '🌸',
      content: newComment.trim()
    };

    fetch(`${window.API_BASE}/videos/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (res.ok) {
          setNewComment('');
          fetchComments();
        }
      })
      .catch((err) => console.error('Lỗi gửi bình luận:', err));
  };

  const handleShareVideo = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const youtubeId = extractYoutubeId(shareUrl);
    if (!youtubeId) {
      setErrorMsg('Đường dẫn YouTube không hợp lệ. Vui lòng nhập link đúng dạng!');
      return;
    }

    if (!shareTitle.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề video.');
      return;
    }

    const payload = {
      title: shareTitle.trim(),
      youtubeId: youtubeId,
      addedBy: profile.fullName || profile.username
    };

    fetch(`${window.API_BASE}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => {
        if (res.ok) {
          setSuccessMsg('Đã chia sẻ video thành công!');
          setShareTitle('');
          setShareUrl('');
          setTimeout(() => {
            setIsShareModalOpen(false);
            setSuccessMsg('');
            fetchVideos();
          }, 1500);
        } else {
          return res.json().then((data) => {
            setErrorMsg(data.error || 'Video này đã tồn tại trên hệ thống.');
          });
        }
      })
      .catch((err) => setErrorMsg('Không thể kết nối đến máy chủ.'));
  };

  // Helper formatting for watch seconds
  const formatWatchTime = (seconds) => {
    if (seconds < 60) return `${seconds} giây`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  return (
    <div className="video-learning-container" style={{ padding: '0.5rem 1rem 2rem 1rem' }}>
      {/* Styles local to component */}
      <style>{`
        .video-learning-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        @media (max-width: 992px) {
          .video-learning-grid {
            grid-template-columns: 1fr;
          }
        }
        .video-player-container {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: 1rem;
          box-shadow: var(--shadow-sm);
        }
        .iframe-wrapper {
          position: relative;
          width: 100%;
          padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
          height: 0;
          border-radius: 8px;
          overflow: hidden;
          background-color: #000;
        }
        .iframe-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
        .video-info-box {
          margin-top: 1rem;
        }
        .video-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }
        .video-meta {
          display: flex;
          gap: 1.5rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }
        .video-meta span {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .video-chat-card {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          display: flex;
          flex-direction: column;
          height: 550px;
          box-shadow: var(--shadow-sm);
        }
        .chat-header {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 1.1rem;
        }
        .chat-messages-area {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .chat-message-item {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .chat-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background-color: var(--bg-secondary);
          display: flex;
          align-items: center;
          justifyContent: center;
          font-size: 1.25rem;
          border: 1px solid var(--border-color);
          overflow: hidden;
        }
        .chat-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .chat-bubble {
          flex: 1;
          background-color: var(--bg-primary);
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border-top-left-radius: 0;
          border: 1px solid var(--border-color);
        }
        .chat-bubble-sender {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 0.2rem;
        }
        .chat-bubble-content {
          font-size: 0.95rem;
          color: var(--text-primary);
          line-height: 1.4;
          word-break: break-word;
        }
        .chat-input-form {
          padding: 1rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          gap: 0.5rem;
        }
        .chat-input-field {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          background-color: var(--bg-primary);
          color: var(--text-primary);
          outline: none;
        }
        .chat-input-field:focus {
          border-color: var(--primary);
        }
        .stats-card {
          margin-top: 1.5rem;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          padding: 1.25rem;
        }
        .stats-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        .stats-table th, .stats-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        .stats-table th {
          font-weight: 700;
          color: var(--text-secondary);
          font-size: 0.85rem;
          text-transform: uppercase;
        }
        .videos-grid-title {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .videos-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1.5rem;
        }
        .video-card-item {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-sm);
        }
        .video-card-item:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary);
        }
        .video-card-thumbnail {
          position: relative;
          padding-bottom: 56.25%;
          background-color: #000;
        }
        .video-card-thumbnail img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .video-card-play-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justifyContent: center;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .video-card-item:hover .video-card-play-overlay {
          opacity: 1;
        }
        .video-card-body {
          padding: 1rem;
        }
        .video-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.4;
          height: 2.8em;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          margin-bottom: 0.5rem;
        }
        .video-card-addedby {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          display: flex;
          align-items: center;
          justifyContent: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content-box {
          background-color: var(--bg-secondary);
          border-radius: var(--border-radius);
          width: 100%;
          max-width: 500px;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }
        .modal-hdr {
          padding: 1.25rem;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-body-form {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
      `}</style>

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Video size={28} style={{ color: 'var(--primary)' }} />
            Học qua Video
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Xem các video học tiếng Nhật được chia sẻ bởi cộng đồng và thảo luận trực tuyến.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsShareModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Plus size={18} />
          Chia sẻ Video
        </button>
      </div>

      {activeVideo ? (
        <div className="video-learning-grid">
          {/* Left Column: Player & Stats */}
          <div>
            <div className="video-player-container">
              <div className="iframe-wrapper">
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=1&enablejsapi=1`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="video-info-box">
                <h2 className="video-title">{activeVideo.title}</h2>
                <div className="video-meta">
                  <span>
                    <User size={14} /> Đăng bởi: {activeVideo.addedBy}
                  </span>
                  <span>
                    <Clock size={14} /> Ngày chia sẻ: {new Date(activeVideo.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>
            </div>
            </div>

            {/* Right Column: Live Chat comments */}
          <div className="video-chat-card">
            <div className="chat-header">
              <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
              Thảo luận Video
            </div>
            <div className="chat-messages-area" ref={chatAreaRef}>
              {comments.length > 0 ? (
                comments.map((comment, i) => (
                  <div key={i} className="chat-message-item">
                    <div className="chat-avatar">
                      {comment.avatar.startsWith('http') || comment.avatar.startsWith('/api') ? (
                        <img src={comment.avatar} alt="Avatar" />
                      ) : (
                        <span>{comment.avatar}</span>
                      )}
                    </div>
                    <div className="chat-bubble">
                      <div className="chat-bubble-sender">{comment.sender}</div>
                      <div className="chat-bubble-content">{comment.content}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '2rem' }}>
                  Chưa có cuộc thảo luận nào cho video này. Hãy gửi lời chào đầu tiên!
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendComment} className="chat-input-form">
              <input
                type="text"
                className="chat-input-field"
                placeholder="Nhập nội dung thảo luận..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={300}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 1.25rem', height: '42px', display: 'flex', alignItems: 'center' }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', backgroundColor: 'var(--bg-secondary)' }}>
          <Video size={48} strokeWidth={1.5} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
          <h3>Chưa có video nào được chia sẻ</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
            Hãy là người đầu tiên chia sẻ một video tự học tiếng Nhật chất lượng từ YouTube!
          </p>
          <button className="btn btn-primary" onClick={() => setIsShareModalOpen(true)}>
            <Plus size={18} style={{ marginRight: '0.4rem' }} /> Chia sẻ video ngay
          </button>
        </div>
      )}

      {/* Video gallery grid (Other videos) */}
      {videos.length > 1 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 className="videos-grid-title">
            <Play size={20} style={{ color: 'var(--primary)' }} />
            Danh sách video khác
          </h3>
          <div className="videos-list-grid">
            {videos.filter(v => activeVideo && v.id !== activeVideo.id).map((video) => (
              <div key={video.id} className="video-card-item" onClick={() => setActiveVideo(video)}>
                <div className="video-card-thumbnail">
                  <img src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} alt={video.title} />
                  <div className="video-card-play-overlay">
                    <Play size={32} color="#fff" />
                  </div>
                </div>
                <div className="video-card-body">
                  <h4 className="video-card-title">{video.title}</h4>
                  <div className="video-card-addedby">Đăng bởi: {video.addedBy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share video Modal */}
      {isShareModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content-box">
            <div className="modal-hdr">
              <h3 style={{ fontWeight: 700 }}>Chia sẻ video học tập</h3>
              <button onClick={() => setIsShareModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleShareVideo} className="modal-body-form">
              {errorMsg && (
                <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem' }}>
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem' }}>
                  {successMsg}
                </div>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Tiêu đề video</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tự học 50 bài Minna no Nihongo"
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  className="chat-input-field"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Đường link YouTube</label>
                <input
                  type="url"
                  placeholder="Ví dụ: https://www.youtube.com/watch?v=..."
                  value={shareUrl}
                  onChange={(e) => setShareUrl(e.target.value)}
                  className="chat-input-field"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsShareModalOpen(false)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary">Lưu và Chia sẻ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLearning;
