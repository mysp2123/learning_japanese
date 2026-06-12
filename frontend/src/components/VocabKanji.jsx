import React, { useState, useEffect } from 'react';

const VocabKanji = ({ userLevel }) => {
  const [activeSubTab, setActiveSubTab] = useState('vocab');
  const [vocabularies, setVocabularies] = useState([]);
  const [kanjis, setKanjis] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchVal, setSearchVal] = useState('');
  const [levelFilter, setLevelFilter] = useState(userLevel || 'all');

  // Mastered words tracking in localStorage
  const [masteredWords, setMasteredWords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nihongo_mastered_words')) || [];
    } catch (e) {
      return [];
    }
  });

  // Synchronize filter when user changes level at Header
  useEffect(() => {
    if (userLevel) {
      setLevelFilter(userLevel);
    }
  }, [userLevel]);

  // Card flips
  const [flippedCards, setFlippedCards] = useState({});

  useEffect(() => {
    // Fetch both vocab and kanji
    Promise.all([
      fetch('http://localhost:8080/api/vocabulary').then((res) => res.json()),
      fetch('http://localhost:8080/api/kanji').then((res) => res.json()),
    ])
      .then(([vocabData, kanjiData]) => {
        setVocabularies(vocabData);
        setKanjis(kanjiData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải dữ liệu từ vựng & chữ Hán:', err);
        setLoading(false);
      });
  }, []);

  const speak = (event, text) => {
    event.stopPropagation(); // Tránh lật thẻ khi bấm nút phát âm
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleFlip = (id) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleMastered = (event, id) => {
    event.stopPropagation(); // Tránh lật thẻ
    setMasteredWords((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((mid) => mid !== id)
        : [...prev, id];
      localStorage.setItem('nihongo_mastered_words', JSON.stringify(updated));
      return updated;
    });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu học tập...</div>;
  }

  // Filter Vocabulary
  const filteredVocab = vocabularies.filter((vocab) => {
    const matchesSearch =
      vocab.word.toLowerCase().includes(searchVal.toLowerCase()) ||
      vocab.reading.toLowerCase().includes(searchVal.toLowerCase()) ||
      vocab.meaning.toLowerCase().includes(searchVal.toLowerCase());
    const matchesLevel = levelFilter === 'all' || vocab.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  // Filter Kanji
  const filteredKanji = kanjis.filter((kanji) => {
    const matchesSearch =
      kanji.kanji.toLowerCase().includes(searchVal.toLowerCase()) ||
      kanji.onyomi.toLowerCase().includes(searchVal.toLowerCase()) ||
      kanji.kunyomi.toLowerCase().includes(searchVal.toLowerCase()) ||
      kanji.meaning.toLowerCase().includes(searchVal.toLowerCase());
    const matchesLevel = levelFilter === 'all' || kanji.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  // Progress Calculations for Vocabulary
  const totalLevelVocabs = filteredVocab.length;
  const masteredLevelCount = filteredVocab.filter((v) => masteredWords.includes(v.id)).length;
  const progressPercent = totalLevelVocabs > 0 ? Math.round((masteredLevelCount / totalLevelVocabs) * 100) : 0;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1>Từ vựng & Chữ Hán (Kanji)</h1>
        <p style={{ maxWidth: '600px', margin: '0.5rem auto 0 auto' }}>
          Học tập từ vựng qua thẻ ghi nhớ (Flashcard) trực quan và tra cứu các chữ Kanji cốt lõi.
        </p>
      </div>

      {/* Switch Sub Tabs */}
      <div className="kana-tabs">
        <button
          className={`tab-btn ${activeSubTab === 'vocab' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubTab('vocab');
            setSearchVal('');
          }}
        >
          Học Từ vựng
        </button>
        <button
          className={`tab-btn ${activeSubTab === 'kanji' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubTab('kanji');
            setSearchVal('');
          }}
        >
          Học Chữ Hán (Kanji)
        </button>
      </div>

      {/* Search & Filter (No SVG Icons) */}
      <div className="vocab-search-bar">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '1rem' }}
            placeholder={
              activeSubTab === 'vocab'
                ? 'Tìm kiếm từ vựng, cách đọc, ý nghĩa...'
                : 'Tìm kiếm Kanji, âm đọc, ý nghĩa...'
            }
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="all">Tất cả cấp độ</option>
          <option value="N5">Cấp độ N5</option>
          <option value="N4">Cấp độ N4</option>
          <option value="N3">Cấp độ N3</option>
        </select>
      </div>

      {/* Study Progress Bar for Vocabulary */}
      {activeSubTab === 'vocab' && totalLevelVocabs > 0 && (
        <div
          className="card"
          style={{
            padding: '1.25rem 1.75rem',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            borderLeft: '4px solid var(--success)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '700' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Tiến độ học tập ({levelFilter === 'all' ? 'Tất cả' : levelFilter}):
            </span>
            <span style={{ color: 'var(--success)' }}>
              {masteredLevelCount} / {totalLevelVocabs} từ đã thuộc ({progressPercent}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: 'var(--success)',
                transition: 'width 0.3s ease',
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Subtab Contents */}
      {activeSubTab === 'vocab' ? (
        <div id="vocab-section">
          {filteredVocab.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
              Không có từ vựng nào thuộc cấp độ này hoặc phù hợp bộ lọc.
            </div>
          ) : (
            <div className="vocab-grid">
              {filteredVocab.map((vocab) => {
                const isFlipped = !!flippedCards[vocab.id];
                const isMastered = masteredWords.includes(vocab.id);
                return (
                  <div
                    key={vocab.id}
                    className="flashcard-wrapper"
                    onClick={() => toggleFlip(vocab.id)}
                  >
                    <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
                      {/* Front */}
                      <div className="card-front">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span className="card-level">{vocab.level}</span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn"
                              style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                backgroundColor: isMastered ? 'var(--success-light)' : 'var(--bg-primary)',
                                color: isMastered ? 'var(--success)' : 'var(--text-secondary)',
                                border: '1px solid',
                                borderColor: isMastered ? 'var(--success)' : 'var(--border-color)',
                                borderRadius: '15px',
                              }}
                              onClick={(e) => toggleMastered(e, vocab.id)}
                            >
                              {isMastered ? '✓ Đã thuộc' : 'Chưa thuộc'}
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                                borderRadius: '15px',
                              }}
                              onClick={(e) => speak(e, vocab.word)}
                            >
                              Đọc
                            </button>
                          </div>
                        </div>
                        <div className="card-main-jp">{vocab.word}</div>
                        <div className="card-kana">{vocab.reading}</div>
                        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: 'auto' }}>
                          Nhấp để xem nghĩa
                        </div>
                      </div>

                      {/* Back */}
                      <div className="card-back">
                        <div className="card-level">{vocab.level}</div>
                        <div className="card-meaning">{vocab.meaning}</div>
                        <div className="card-pos">{vocab.part_of_speech}</div>

                        {vocab.example && (
                          <div className="card-example-box">
                            <div className="card-example-jp">{vocab.example}</div>
                            <div className="card-example-vi">{vocab.example_meaning}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div id="kanji-section">
          {filteredKanji.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
              Không có chữ Hán nào thuộc cấp độ này hoặc phù hợp bộ lọc.
            </div>
          ) : (
            <div className="kanji-detail-grid">
              {filteredKanji.map((kanji) => (
                <div key={kanji.kanji} className="card kanji-card">
                  <div
                    className="kanji-glyph-box"
                    onClick={(e) => speak(e, kanji.kanji)}
                    title="Phát âm"
                    style={{ cursor: 'pointer' }}
                  >
                    {kanji.kanji}
                  </div>
                  <div className="kanji-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="kanji-meaning">{kanji.meaning}</div>
                      <span className="card-level" style={{ margin: 0 }}>
                        {kanji.level}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Số nét: {kanji.strokes}
                    </div>

                    <div className="kanji-readings" style={{ marginTop: '0.25rem' }}>
                      <div>
                        <strong>Onyomi:</strong> {kanji.onyomi}
                      </div>
                      <div>
                        <strong>Kunyomi:</strong> {kanji.kunyomi}
                      </div>
                    </div>

                    {kanji.examples && kanji.examples.length > 0 && (
                      <div className="kanji-examples">
                        {kanji.examples.map((ex, exIdx) => (
                          <div key={exIdx} className="kanji-example-item">
                            <span className="kanji-ex-jp">
                              {ex.word} ({ex.reading})
                            </span>
                            <span className="kanji-ex-vi">{ex.meaning}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VocabKanji;
