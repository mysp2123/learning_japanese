import React, { useState, useEffect } from 'react';

const KanaGrid = () => {
  const [rows, setRows] = useState([]);
  const [activeTab, setActiveTab] = useState('hiragana');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch alphabet data from Go API
    fetch('http://localhost:8080/api/alphabet')
      .then((res) => res.json())
      .then((data) => {
        setRows(data.rows || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải dữ liệu bảng chữ cái:', err);
        setLoading(false);
      });
  }, []);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.85;
      
      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(v => v.lang === 'ja-JP' || v.lang.startsWith('ja'));
      if (jaVoice) {
        utterance.voice = jaVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCellClick = (char) => {
    speak(char);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải bảng chữ cái...</div>;
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1>Bảng chữ cái Tiếng Nhật 🌸</h1>
        <p style={{ maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
          Làm quen với Hiragana và Katakana. Hãy chọn bảng chữ cái bạn muốn học và nhấp vào từng ô ký tự để nghe âm thanh phát âm chuẩn.
        </p>
      </div>

      <div className="kana-tabs" style={{ marginBottom: '2rem' }}>
        <button
          className={`tab-btn ${activeTab === 'hiragana' ? 'active' : ''}`}
          onClick={() => setActiveTab('hiragana')}
        >
          Hiragana (Chữ mềm)
        </button>
        <button
          className={`tab-btn ${activeTab === 'katakana' ? 'active' : ''}`}
          onClick={() => setActiveTab('katakana')}
        >
          Katakana (Chữ cứng)
        </button>
      </div>

      <div className="kana-grid" style={{ maxWidth: '900px' }}>
        {rows.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.hiragana.map((hVal, colIndex) => {
              const kVal = row.katakana[colIndex];
              const romajiVal = row.romaji[colIndex];
              const char = activeTab === 'hiragana' ? hVal : kVal;

              if (hVal !== '') {
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    className="kana-cell"
                    onClick={() => handleCellClick(char)}
                  >
                    <span className="kana-jp">{char}</span>
                    <span className="kana-romaji">{romajiVal}</span>
                  </button>
                );
              } else {
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="kana-cell empty"
                  ></div>
                );
              }
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default KanaGrid;
