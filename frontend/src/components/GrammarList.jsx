import React, { useState, useEffect } from 'react';

const GrammarList = ({ userLevel }) => {
  const [grammars, setGrammars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8080/api/grammar')
      .then((res) => res.json())
      .then((data) => {
        setGrammars(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải dữ liệu ngữ pháp:', err);
        setLoading(false);
      });
  }, []);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải ngữ pháp...</div>;
  }

  // Filter grammars matching the selected student level
  const filteredGrammars = grammars.filter((g) => g.level === userLevel);

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1>Cấu trúc Ngữ pháp Tiếng Nhật</h1>
        <p style={{ maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
          Học và ôn luyện các cấu trúc ngữ pháp thông dụng phân chia theo cấp độ bạn đang học.
        </p>
      </div>

      {filteredGrammars.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
          Chưa có bài học ngữ pháp nào được thiết lập cho trình độ {userLevel}. Vui lòng chọn cấp độ khác.
        </div>
      ) : (
        <div className="grammar-list">
          {filteredGrammars.map((grammar) => (
            <div key={grammar.id} className="card grammar-card">
              <div className="grammar-header">
                <span className="grammar-title">{grammar.title}</span>
                <span className="grammar-level">{grammar.level}</span>
              </div>

              <div className="grammar-structure">
                <strong>Cấu trúc:</strong> {grammar.structure}
              </div>

              <div className="grammar-explanation">{grammar.explanation}</div>

              <div className="grammar-examples">
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Các ví dụ mẫu:
                </h4>
                {grammar.examples.map((ex, idx) => (
                  <div key={idx} className="grammar-example-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <div>
                        <div className="grammar-ex-jp">{ex.sentence}</div>
                        <div className="grammar-ex-reading">{ex.reading}</div>
                        <div className="grammar-ex-vi">{ex.meaning}</div>
                      </div>
                      <button
                        className="btn btn-secondary"
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                        }}
                        onClick={() => speak(ex.sentence)}
                      >
                        Phát âm
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GrammarList;
