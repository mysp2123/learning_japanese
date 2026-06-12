import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
            <Route path="/chat" element={<ChatRoom userLevel={userLevel} profile={profile} />} />
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
    </div>
  );
}

export default App;
