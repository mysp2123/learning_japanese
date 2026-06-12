import React, { useState } from 'react';
import KanaGrid from './components/KanaGrid';
import VocabKanji from './components/VocabKanji';
import GrammarList from './components/GrammarList';
import QuizRunner from './components/QuizRunner';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [userLevel, setUserLevel] = useState('N5'); // Global student level state: N5, N4, N3

  const renderContent = () => {
    switch (activeTab) {
      case 'alphabet':
        return <KanaGrid />;
      case 'vocabulary':
        return <VocabKanji userLevel={userLevel} />;
      case 'grammar':
        return <GrammarList userLevel={userLevel} />;
      case 'quizzes':
        return <QuizRunner userLevel={userLevel} />;
      case 'home':
      default:
        return renderLearningPath();
    }
  };

  // Render a personalized learning path based on selected level
  const renderLearningPath = () => {
    if (userLevel === 'N5') {
      return (
        <>
          <div className="hero">
            <h1>Lộ trình học Tiếng Nhật N5 (Sơ cấp) 🌸</h1>
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
                <button className="btn btn-secondary" onClick={() => setActiveTab('alphabet')}>
                  Học ngay
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 2</span>
                <h3>Tập viết nét chữ</h3>
                <p>Sử dụng bảng vẽ Canvas lớn 400x400 để tập đồ theo thứ tự nét viết chuẩn xác.</p>
                <button className="btn btn-secondary" onClick={() => setActiveTab('alphabet')}>
                  Tập viết
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 3</span>
                <h3>Học từ vựng nền tảng</h3>
                <p>Nạp thêm từ vựng sơ cấp N5 thông qua hệ thống thẻ Flashcard lật thông minh.</p>
                <button className="btn btn-secondary" onClick={() => setActiveTab('vocabulary')}>
                  Xem từ vựng
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 4</span>
                <h3>Cấu trúc ngữ pháp</h3>
                <p>Nghiên cứu các mẫu ngữ pháp mở đầu quan trọng như khẳng định danh từ và yêu cầu lịch sự.</p>
                <button className="btn btn-secondary" onClick={() => setActiveTab('grammar')}>
                  Xem ngữ pháp
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 5</span>
                <h3>Trắc nghiệm thử sức</h3>
                <p>Tham gia làm đề trắc nghiệm N5 để kiểm tra kiến thức và nhận pháo hoa giấy chúc mừng.</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('quizzes')}>
                  Luyện tập
                </button>
              </div>
            </div>
          </div>
        </>
      );
    } else if (userLevel === 'N4') {
      return (
        <>
          <div className="hero">
            <h1>Lộ trình học Tiếng Nhật N4 (Sơ trung cấp) 🎏</h1>
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
                <button className="btn btn-secondary" onClick={() => setActiveTab('vocabulary')}>
                  Học từ vựng
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 2</span>
                <h3>Mẫu câu Trải nghiệm</h3>
                <p>Học các mẫu ngữ pháp N4 trung cấp liên kết câu như miêu tả trải nghiệm đã từng làm gì.</p>
                <button className="btn btn-secondary" onClick={() => setActiveTab('grammar')}>
                  Học ngữ pháp
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 3</span>
                <h3>Kiểm tra năng lực N4</h3>
                <p>Tham gia làm bài thi thử để đánh giá mức độ ghi nhớ các từ vựng và cấu trúc ngữ pháp N4.</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('quizzes')}>
                  Làm trắc nghiệm
                </button>
              </div>
            </div>
          </div>
        </>
      );
    } else {
      // N3 Path
      return (
        <>
          <div className="hero">
            <h1>Lộ trình học Tiếng Nhật N3 (Trung cấp) 🦊</h1>
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
                <button className="btn btn-secondary" onClick={() => setActiveTab('vocabulary')}>
                  Học chữ Hán
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 2</span>
                <h3>Ngữ pháp diễn đạt ý chí</h3>
                <p>Luyện tập các cấu trúc ngữ pháp N3 biểu thị sự cố gắng tạo thói quen tốt hàng ngày.</p>
                <button className="btn btn-secondary" onClick={() => setActiveTab('grammar')}>
                  Học ngữ pháp
                </button>
              </div>

              <div className="card path-step-card">
                <span className="path-step-num">Bước 3</span>
                <h3>Đề trắc nghiệm tổng hợp N3</h3>
                <p>Đánh giá tổng quát năng lực trung cấp bằng bộ câu hỏi trắc nghiệm N3 chuyên sâu.</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('quizzes')}>
                  Bắt đầu thi
                </button>
              </div>
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header & Navigation (Loại bỏ hoàn toàn icon SVG) */}
      <header className="header">
        <div className="container nav-wrapper">
          <div className="logo" onClick={() => setActiveTab('home')}>
            <span className="logo-ja">日本語</span>
            <span>NihongoHub</span>
          </div>
          
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <ul className="nav-menu">
              <li className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}>
                <button onClick={() => setActiveTab('home')}>Trang chủ</button>
              </li>
              <li className={`nav-item ${activeTab === 'alphabet' ? 'active' : ''}`}>
                <button onClick={() => setActiveTab('alphabet')}>Bảng chữ cái</button>
              </li>
              <li className={`nav-item ${activeTab === 'vocabulary' ? 'active' : ''}`}>
                <button onClick={() => setActiveTab('vocabulary')}>Từ vựng & Kanji</button>
              </li>
              <li className={`nav-item ${activeTab === 'grammar' ? 'active' : ''}`}>
                <button onClick={() => setActiveTab('grammar')}>Ngữ pháp</button>
              </li>
              <li className={`nav-item ${activeTab === 'quizzes' ? 'active' : ''}`}>
                <button onClick={() => setActiveTab('quizzes')}>Trắc nghiệm</button>
              </li>
            </ul>

            {/* Global Level Selector Dropdown */}
            <div className="level-selector-wrapper">
              <span className="level-selector-label">Cấp độ học:</span>
              <select
                className="level-selector-select"
                value={userLevel}
                onChange={(e) => setUserLevel(e.target.value)}
              >
                <option value="N5">N5 (Sơ cấp)</option>
                <option value="N4">N4 (Sơ trung cấp)</option>
                <option value="N3">N3 (Trung cấp)</option>
              </select>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main" style={{ flexGrow: 1 }}>
        <div className="container">{renderContent()}</div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-logo">
            <span
              className="logo-ja"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--text-light)',
                padding: '0.1rem 0.4rem',
              }}
            >
              日本語
            </span>
            <span>NihongoHub</span>
          </div>
          <div className="footer-credits">
            &copy; 2026 NihongoHub. Lộ trình học tiếng Nhật thông minh & tối giản.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
