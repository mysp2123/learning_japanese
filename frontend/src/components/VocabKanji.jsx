import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const VocabKanji = ({ userLevel, profile }) => {
  const [activeSubTab, setActiveSubTab] = useState('vocab');
  const [vocabularies, setVocabularies] = useState([]);
  const [kanjis, setKanjis] = useState([]);
  const [verbs, setVerbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedVerbs, setExpandedVerbs] = useState({});
  const [studyList, setStudyList] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Search & Filters
  const [searchVal, setSearchVal] = useState('');
  const [levelFilter, setLevelFilter] = useState(userLevel || 'all');
  const [verbViewMode, setVerbViewMode] = useState('list'); // 'list' | 'table'
  const [verbFilter, setVerbFilter] = useState('all'); // 'all' | 'saved'

  // Mastered words tracking in localStorage (fallback / legacy)
  const [masteredWords, setMasteredWords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nihongo_mastered_words')) || [];
    } catch (e) {
      return [];
    }
  });

  // Daily Session States
  const [dailyWords, setDailyWords] = useState([]);
  const [dailyCurrentIdx, setDailyCurrentIdx] = useState(0);
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [dailyFlipped, setDailyFlipped] = useState(false);
  const [slideDirection, setSlideDirection] = useState(''); // 'slide-left' | 'slide-right' | ''
  const [dailyLimit, setDailyLimit] = useState(10);
  const [dailySource, setDailySource] = useState('all'); // 'all' | 'my-list'
  const [sessionStarted, setSessionStarted] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const username = profile?.rawUsername || 'guest';

  const showAlert = (title, message) => {
    setModalConfig({ isOpen: true, title, message, type: 'alert', onConfirm: null });
  };

  const showModal = (title, message, type, onConfirm) => {
    setModalConfig({ isOpen: true, title, message, type, onConfirm });
  };

  // Synchronize filter when user changes level at Header
  useEffect(() => {
    if (userLevel) {
      setLevelFilter(userLevel);
    }
  }, [userLevel]);

  // Card flips in the main list
  const [flippedCards, setFlippedCards] = useState({});

  const fetchStudyList = () => {
    if (!username || username === 'guest') return;
    fetch(`${window.API_BASE}/study-list?username=${username}`)
      .then((res) => res.json())
      .then((data) => {
        setStudyList(data || []);
      })
      .catch((err) => console.error('Lỗi tải danh sách ôn tập:', err));
  };

  const fetchMainData = () => {
    Promise.all([
      fetch(`${window.API_BASE}/vocabulary`).then((res) => res.json()),
      fetch(`${window.API_BASE}/kanji`).then((res) => res.json()),
      fetch(`${window.API_BASE}/verbs`).then((res) => res.json()),
    ])
      .then(([vocabData, kanjiData, verbsData]) => {
        setVocabularies(vocabData);
        setKanjis(kanjiData);
        setVerbs(verbsData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải dữ liệu học tập:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMainData();
  }, []);

  useEffect(() => {
    fetchStudyList();
  }, [username]);

  const handleToggleStudyList = async (event, itemType, itemId) => {
    event.stopPropagation();
    if (username === 'guest') {
      showAlert('Thông báo', 'Vui lòng đăng nhập để thêm từ vào danh sách ôn tập!');
      return;
    }

    const isExist = studyList.some(
      (item) => item.item_type === itemType && String(item.item_id) === String(itemId)
    );

    try {
      if (isExist) {
        const res = await fetch(
          `${window.API_BASE}/study-list?username=${username}&item_type=${itemType}&item_id=${itemId}`,
          { method: 'DELETE' }
        );
        if (res.ok) {
          setStudyList((prev) =>
            prev.filter(
              (item) => !(item.item_type === itemType && String(item.item_id) === String(itemId))
            )
          );
        }
      } else {
        const res = await fetch(`${window.API_BASE}/study-list`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username,
            item_type: itemType,
            item_id: String(itemId),
            status: 'review',
          }),
        });
        if (res.ok) {
          setStudyList((prev) => [
            ...prev,
            { item_type: itemType, item_id: String(itemId), status: 'review' },
          ]);
        }
      }
    } catch (err) {
      console.error('Lỗi cập nhật danh sách ôn tập:', err);
    }
  };

  const handleUpdateStatus = async (event, itemType, itemId, currentStatus) => {
    event.stopPropagation();
    if (username === 'guest') {
      showAlert('Thông báo', 'Vui lòng đăng nhập để lưu tiến độ học tập!');
      return;
    }

    const nextStatus = currentStatus === 'mastered' ? 'review' : 'mastered';

    try {
      const res = await fetch(`${window.API_BASE}/study-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          item_type: itemType,
          item_id: String(itemId),
          status: nextStatus,
        }),
      });
      if (res.ok) {
        setStudyList((prev) => {
          const isExist = prev.some(
            (item) => item.item_type === itemType && String(item.item_id) === String(itemId)
          );
          if (isExist) {
            return prev.map((item) =>
              item.item_type === itemType && String(item.item_id) === String(itemId)
                ? { ...item, status: nextStatus }
                : item
            );
          } else {
            return [
              ...prev,
              { item_type: itemType, item_id: String(itemId), status: nextStatus },
            ];
          }
        });
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái học tập:', err);
    }
  };

  const isSavedForReview = (itemType, itemId) => {
    return studyList.some(
      (item) => item.item_type === itemType && String(item.item_id) === String(itemId)
    );
  };

  const getStudyItemStatus = (itemType, itemId) => {
    const found = studyList.find(
      (item) => item.item_type === itemType && String(item.item_id) === String(itemId)
    );
    return found ? found.status : null;
  };

  // Reset daily session setup when switching to daily tab
  useEffect(() => {
    if (activeSubTab === 'daily') {
      setSessionStarted(false);
      setDailyWords([]);
    }
  }, [activeSubTab]);

  const startDailySession = (limitVal, sourceVal) => {
    const activeLimit = limitVal !== undefined ? limitVal : dailyLimit;
    const activeSource = sourceVal !== undefined ? sourceVal : dailySource;

    let candidates = [];
    if (activeSource === 'my-list') {
      const reviewItemIds = studyList
        .filter((item) => item.item_type === 'vocab' && item.status === 'review')
        .map((item) => String(item.item_id));
      candidates = vocabularies.filter((v) => reviewItemIds.includes(String(v.id)));
    } else {
      const levelVocabs = vocabularies.filter((v) => levelFilter === 'all' || v.level === levelFilter);
      candidates = levelVocabs;
    }

    if (candidates.length === 0) {
      setDailyWords([]);
      setSessionStarted(true);
      return;
    }

    // Shuffle and pick activeLimit
    const selected = [...candidates].sort(() => Math.random() - 0.5).slice(0, activeLimit);

    setDailyWords(selected);
    setDailyCurrentIdx(0);
    setDailyCompleted(false);
    setDailyFlipped(false);
    setSlideDirection('');
    setSessionStarted(true);
  };

  const handleDailyMastered = (event, id, isMastered) => {
    event.stopPropagation();
    
    // Set slide animation class
    setSlideDirection(isMastered ? 'slide-right' : 'slide-left');
    
    // legacy support
    setMasteredWords((prev) => {
      let updated;
      if (isMastered) {
        updated = prev.includes(id) ? prev : [...prev, id];
      } else {
        updated = prev.filter((mid) => mid !== id);
      }
      localStorage.setItem('nihongo_mastered_words', JSON.stringify(updated));
      return updated;
    });

    if (username !== 'guest') {
      const nextStatus = isMastered ? 'mastered' : 'review';
      fetch(`${window.API_BASE}/study-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          item_type: 'vocab',
          item_id: String(id),
          status: nextStatus,
        }),
      }).then((res) => {
        if (res.ok) {
          setStudyList((prev) => {
            const isExist = prev.some((item) => item.item_type === 'vocab' && String(item.item_id) === String(id));
            if (isExist) {
              return prev.map((item) =>
                item.item_type === 'vocab' && String(item.item_id) === String(id)
                  ? { ...item, status: nextStatus }
                  : item
              );
            } else {
              return [...prev, { item_type: 'vocab', item_id: String(id), status: nextStatus }];
            }
          });
        }
      });
    }

    // Wait for the animation to complete (300ms) before rendering next card
    setTimeout(() => {
      setDailyFlipped(false);
      setSlideDirection('');
      if (dailyCurrentIdx === dailyWords.length - 1) {
        setDailyCompleted(true);
      } else {
        setDailyCurrentIdx((prev) => prev + 1);
      }
    }, 300);
  };

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
    const currentStatus = getStudyItemStatus('vocab', id);
    const isMastered = currentStatus === 'mastered' || masteredWords.includes(id);

    setMasteredWords((prev) => {
      const updated = isMastered
        ? prev.filter((mid) => mid !== id)
        : [...prev, id];
      localStorage.setItem('nihongo_mastered_words', JSON.stringify(updated));
      return updated;
    });

    if (username !== 'guest') {
      const nextStatus = isMastered ? 'review' : 'mastered';
      fetch(`${window.API_BASE}/study-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          item_type: 'vocab',
          item_id: String(id),
          status: nextStatus,
        }),
      }).then((res) => {
        if (res.ok) {
          setStudyList((prev) => {
            const isExist = prev.some((item) => item.item_type === 'vocab' && String(item.item_id) === String(id));
            if (isExist) {
              return prev.map((item) =>
                item.item_type === 'vocab' && String(item.item_id) === String(id)
                  ? { ...item, status: nextStatus }
                  : item
              );
            } else {
              return [...prev, { item_type: 'vocab', item_id: String(id), status: nextStatus }];
            }
          });
        }
      });
    }
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

  // Filter Verbs
  const filteredVerbs = verbs.filter((verb) => {
    const term = searchVal.toLowerCase();
    return (
      verb.masu.toLowerCase().includes(term) ||
      verb.dictionary.toLowerCase().includes(term) ||
      verb.meaning.toLowerCase().includes(term) ||
      verb.te.toLowerCase().includes(term) ||
      verb.ta.toLowerCase().includes(term) ||
      verb.nai.toLowerCase().includes(term) ||
      verb.ability.toLowerCase().includes(term) ||
      verb.volitional.toLowerCase().includes(term) ||
      verb.imperative.toLowerCase().includes(term) ||
      verb.causative.toLowerCase().includes(term) ||
      verb.prohibitive.toLowerCase().includes(term) ||
      verb.conditional.toLowerCase().includes(term) ||
      verb.passive.toLowerCase().includes(term)
    );
  }).filter((verb) => {
    if (verbFilter === 'saved') return isSavedForReview('verb', verb.id);
    return true;
  });

  // Progress Calculations for Vocabulary
  const totalLevelVocabs = filteredVocab.length;
  const masteredLevelCount = filteredVocab.filter((v) => getStudyItemStatus('vocab', v.id) === 'mastered' || masteredWords.includes(v.id)).length;
  const progressPercent = totalLevelVocabs > 0 ? Math.round((masteredLevelCount / totalLevelVocabs) * 100) : 0;

  const renderDailySetup = () => {
    const myListCount = studyList.filter((item) => item.item_type === 'vocab' && item.status === 'review').length;

    return (
      <div 
        className="card" 
        style={{
          maxWidth: '500px',
          margin: '2rem auto',
          padding: '2.5rem',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: '800', textAlign: 'center', color: 'var(--text-primary)' }}>
          Thiết lập phiên ôn tập
        </h2>

        {/* Nguồn từ vựng */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            NGUỒN TỪ VỰNG ÔN TẬP
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div 
              style={{
                padding: '1rem',
                border: '1.5px solid',
                borderColor: dailySource === 'all' ? 'var(--primary)' : 'var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setDailySource('all')}
            >
              <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '0.95rem' }}>
                Tất cả từ vựng hệ thống
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Ôn luyện từ vựng ngẫu nhiên dựa theo cấp độ học tập hiện tại.
              </div>
            </div>

            <div 
              style={{
                padding: '1rem',
                border: '1.5px solid',
                borderColor: dailySource === 'my-list' ? 'var(--primary)' : 'var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-primary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: username === 'guest' ? 0.6 : 1,
              }}
                  onClick={() => {
                    if (username === 'guest') {
                      showAlert('Thông báo', 'Vui lòng đăng nhập để sử dụng tính năng lưu từ vựng ôn tập!');
                      return;
                    }
                    setDailySource('my-list');
              }}
            >
              <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Từ vựng của tôi</span>
                {username !== 'guest' && (
                  <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', backgroundColor: 'var(--border-color)', borderRadius: '10px', fontWeight: '600' }}>
                    {myListCount} từ lưu ôn
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Chỉ ôn luyện các từ vựng bạn đã bấm Đang ôn (★) trong kho từ.
              </div>
            </div>
          </div>
        </div>

        {/* Cấp độ ôn tập */}
        {dailySource === 'all' && (
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              CẤP ĐỘ ÔN TẬP (JLPT)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['all', 'N5', 'N4', 'N3'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  style={{
                    flex: 1,
                    minWidth: '60px',
                    padding: '0.65rem 0.5rem',
                    border: '1.5px solid',
                    borderColor: levelFilter === lvl ? 'var(--primary)' : 'var(--border-color)',
                    backgroundColor: levelFilter === lvl ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                    color: levelFilter === lvl ? 'var(--primary)' : 'var(--text-primary)',
                    fontWeight: '700',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '0.9rem'
                  }}
                  onClick={() => setLevelFilter(lvl)}
                >
                  {lvl === 'all' ? 'Tất cả' : lvl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Số lượng thẻ */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            SỐ LƯỢNG FLASHCARD MUỐN HỌC
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[5, 10, 15, 20, 30].map((num) => (
              <button
                key={num}
                type="button"
                style={{
                  flex: 1,
                  minWidth: '60px',
                  padding: '0.65rem 0.5rem',
                  border: '1px solid',
                  borderColor: dailyLimit === num ? 'var(--primary)' : 'var(--border-color)',
                  backgroundColor: dailyLimit === num ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                  color: dailyLimit === num ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: '700',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.9rem'
                }}
                onClick={() => setDailyLimit(num)}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        <button 
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '0.85rem',
            fontSize: '1rem',
            fontWeight: '700',
            backgroundColor: 'var(--primary)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => {
            if (dailySource === 'my-list' && myListCount === 0) {
              showModal('Thông báo', 'Danh sách ôn tập cá nhân của bạn hiện đang trống. Vui lòng chọn "Tất cả từ vựng hệ thống" hoặc thêm từ vựng trước!');
              return;
            }
            startDailySession(dailyLimit, dailySource);
          }}
        >
          Bắt đầu ôn tập
        </button>
      </div>
    );
  };

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
        <button
          className={`tab-btn ${activeSubTab === 'verbs' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubTab('verbs');
            setSearchVal('');
          }}
        >
          Kho Động Từ
        </button>
        <button
          className={`tab-btn ${activeSubTab === 'daily' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubTab('daily');
          }}
        >
          Ôn tập hàng ngày
        </button>
      </div>

      {/* Search & Filter (No SVG Icons) */}
      {activeSubTab !== 'daily' && (
        <div className="vocab-search-bar" style={{ justifyContent: 'flex-start' }}>
          {activeSubTab !== 'daily' && (
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '1rem' }}
                placeholder={
                  activeSubTab === 'vocab'
                    ? 'Tìm kiếm từ vựng, cách đọc, ý nghĩa...'
                    : activeSubTab === 'verbs'
                    ? 'Tìm kiếm động từ, cách chia, ý nghĩa...'
                    : 'Tìm kiếm Kanji, âm đọc, ý nghĩa...'
                }
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
            </div>
          )}
          {activeSubTab !== 'verbs' && activeSubTab !== 'daily' && (
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
          )}
          {(activeSubTab === 'vocab' || activeSubTab === 'verbs') && (
            <button
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                transition: 'all 0.2s ease',
                marginLeft: 'auto',
              }}
              onClick={() => setShowAddModal(true)}
            >
              <span>➕ Thêm {activeSubTab === 'vocab' ? 'từ vựng' : 'động từ'}</span>
            </button>
          )}
        </div>
      )}

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
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              className="btn"
                              style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                backgroundColor: isSavedForReview('vocab', vocab.id) ? 'var(--primary-light)' : 'var(--bg-primary)',
                                color: isSavedForReview('vocab', vocab.id) ? 'var(--primary)' : 'var(--text-secondary)',
                                border: '1px solid',
                                borderColor: isSavedForReview('vocab', vocab.id) ? 'var(--primary)' : 'var(--border-color)',
                                borderRadius: '15px',
                              }}
                              onClick={(e) => handleToggleStudyList(e, 'vocab', vocab.id)}
                              title={isSavedForReview('vocab', vocab.id) ? "Bỏ lưu ôn tập" : "Lưu vào danh sách ôn tập"}
                            >
                              {isSavedForReview('vocab', vocab.id) ? '★ Đang ôn' : '☆ Lưu ôn'}
                            </button>
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
      ) : activeSubTab === 'kanji' ? (
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
      ) : activeSubTab === 'verbs' ? (
        <div id="verbs-section">
          <style>{`
            /* ---- Verbs toolbar ---- */
            .verbs-toolbar {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              margin-bottom: 1.25rem;
              flex-wrap: wrap;
            }
            .verbs-toolbar-group {
              display: flex;
              align-items: center;
              gap: 0.4rem;
              border: 1px solid var(--border-color);
              border-radius: 8px;
              padding: 0.3rem;
              background-color: var(--bg-secondary);
            }
            .verbs-toolbar-btn {
              display: flex;
              align-items: center;
              gap: 0.35rem;
              padding: 0.35rem 0.75rem;
              border: none;
              border-radius: 6px;
              background: transparent;
              color: var(--text-secondary);
              font-size: 0.85rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.15s ease;
            }
            .verbs-toolbar-btn.active {
              background-color: var(--bg-primary);
              color: var(--text-primary);
              box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            .verbs-toolbar-filter {
              padding: 0.4rem 0.85rem;
              border: 1px solid var(--border-color);
              border-radius: 8px;
              background-color: var(--bg-secondary);
              color: var(--text-secondary);
              font-size: 0.85rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.15s ease;
            }
            .verbs-toolbar-filter.active {
              border-color: var(--primary);
              color: var(--primary);
              background-color: var(--bg-primary);
            }
            .verbs-stats {
              margin-left: auto;
              font-size: 0.82rem;
              color: var(--text-secondary);
              font-weight: 500;
            }

            /* ---- List mode ---- */
            .verbs-list {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            }
            .verb-item {
              background-color: var(--bg-secondary);
              border: 1px solid var(--border-color);
              border-radius: var(--border-radius);
              overflow: hidden;
              box-shadow: var(--shadow-sm);
              transition: all 0.2s ease;
            }
            .verb-item.expanded {
              box-shadow: var(--shadow-md);
              border-color: var(--primary);
            }
            .verb-hdr {
              padding: 1rem 1.25rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
              cursor: pointer;
              user-select: none;
            }
            .verb-hdr:hover {
              background-color: var(--bg-primary);
            }
            .verb-hdr-left {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              flex-wrap: wrap;
            }
            .verb-masu {
              font-size: 1.2rem;
              font-weight: 700;
              color: var(--text-primary);
              font-family: var(--font-japanese);
            }
            .verb-dict {
              font-size: 0.85rem;
              color: var(--text-secondary);
              background-color: var(--bg-primary);
              padding: 0.15rem 0.5rem;
              border-radius: 5px;
              border: 1px solid var(--border-color);
            }
            .verb-meaning {
              font-size: 0.95rem;
              color: var(--text-primary);
              font-weight: 500;
            }
            .verb-chevron {
              color: var(--text-secondary);
              transition: transform 0.2s ease;
              flex-shrink: 0;
            }
            .verb-item.expanded .verb-chevron {
              transform: rotate(180deg);
            }
            .verb-body {
              padding: 1.25rem;
              border-top: 1px solid var(--border-color);
              background-color: var(--bg-primary);
            }
            .verb-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
              gap: 0.75rem;
            }
            .verb-conjugation-card {
              background-color: var(--bg-secondary);
              border: 1px solid var(--border-color);
              border-radius: 8px;
              padding: 0.75rem;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .verb-conjugation-card:hover {
              transform: translateY(-2px);
              border-color: var(--primary);
              box-shadow: var(--shadow-sm);
            }
            .conjugation-title {
              font-size: 0.75rem;
              color: var(--text-secondary);
              font-weight: 700;
              margin-bottom: 0.25rem;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .conjugation-value {
              font-size: 1.05rem;
              font-weight: 700;
              color: var(--primary);
              font-family: var(--font-japanese);
            }

            /* ---- Table mode ---- */
            .verbs-table-wrap {
              overflow-x: auto;
              border: 1px solid var(--border-color);
              border-radius: var(--border-radius);
            }
            .verbs-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.88rem;
              background-color: var(--bg-secondary);
            }
            .verbs-table thead th {
              padding: 0.75rem 1rem;
              text-align: left;
              background-color: var(--bg-primary);
              color: var(--text-secondary);
              font-size: 0.78rem;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 1px solid var(--border-color);
              white-space: nowrap;
              position: sticky;
              top: 0;
            }
            .verbs-table tbody tr {
              border-bottom: 1px solid var(--border-color);
              transition: background-color 0.12s ease;
            }
            .verbs-table tbody tr:last-child { border-bottom: none; }
            .verbs-table tbody tr:hover { background-color: var(--bg-primary); }
            .verbs-table tbody td {
              padding: 0.75rem 1rem;
              vertical-align: middle;
              color: var(--text-primary);
            }
            .verbs-table tbody td.jp-cell {
              font-family: var(--font-japanese);
              font-size: 1rem;
              font-weight: 700;
            }
            .verbs-table tbody td.dict-cell {
              font-family: var(--font-japanese);
              color: var(--text-secondary);
              font-size: 0.9rem;
            }
            .verbs-table tbody td.conj-cell {
              font-family: var(--font-japanese);
              color: var(--primary);
              font-size: 0.9rem;
            }
          `}</style>

          {/* Verb Toolbar */}
          <div className="verbs-toolbar">
            {/* View toggle */}
            <div className="verbs-toolbar-group" title="Chế độ hiển thị">
              <button
                className={`verbs-toolbar-btn ${verbViewMode === 'list' ? 'active' : ''}`}
                onClick={() => setVerbViewMode('list')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Dạng List
              </button>
              <button
                className={`verbs-toolbar-btn ${verbViewMode === 'table' ? 'active' : ''}`}
                onClick={() => setVerbViewMode('table')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
                </svg>
                Dạng Bảng
              </button>
            </div>

            {/* Filter: All / Saved */}
            <button
              className={`verbs-toolbar-filter ${verbFilter === 'all' ? 'active' : ''}`}
              onClick={() => setVerbFilter('all')}
            >
              Tất cả ({verbs.length})
            </button>
            <button
              className={`verbs-toolbar-filter ${verbFilter === 'saved' ? 'active' : ''}`}
              onClick={() => setVerbFilter('saved')}
            >
              Đang ôn ({studyList.filter((i) => i.item_type === 'verb').length})
            </button>

            <span className="verbs-stats">
              Hiển thị {filteredVerbs.length} động từ
            </span>
          </div>

          {filteredVerbs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              Không tìm thấy động từ nào phù hợp với bộ lọc.
            </div>
          ) : verbViewMode === 'table' ? (
            /* ====== TABLE MODE ====== */
            <div className="verbs-table-wrap">
              <table className="verbs-table">
                <thead>
                  <tr>
                    <th style={{ width: '44px' }}></th>
                    <th>Thể ます</th>
                    <th>Từ Điển</th>
                    <th>Nghĩa</th>
                    <th>Thể て</th>
                    <th>Thể た</th>
                    <th>Thể ない</th>
                    <th>Khả Năng</th>
                    <th>Ý Định</th>
                    <th>Mệnh Lệnh</th>
                    <th>Sai Khiến</th>
                    <th>Cấm Chỉ</th>
                    <th>Điều Kiện</th>
                    <th>Bị Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVerbs.map((verb) => (
                    <tr key={verb.id}>
                      <td>
                        <button
                          style={{
                            padding: '0.15rem 0.4rem',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            backgroundColor: isSavedForReview('verb', verb.id) ? 'var(--primary-light)' : 'var(--bg-primary)',
                            color: isSavedForReview('verb', verb.id) ? 'var(--primary)' : 'var(--text-secondary)',
                            border: '1px solid',
                            borderColor: isSavedForReview('verb', verb.id) ? 'var(--primary)' : 'var(--border-color)',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                          onClick={(e) => handleToggleStudyList(e, 'verb', verb.id)}
                          title={isSavedForReview('verb', verb.id) ? 'Bỏ lưu' : 'Lưu ôn'}
                        >
                          {isSavedForReview('verb', verb.id) ? '★' : '☆'}
                        </button>
                      </td>
                      <td className="jp-cell" style={{ cursor: 'pointer' }} onClick={(e) => speak(e, verb.masu)} title="Phát âm">{verb.masu}</td>
                      <td className="dict-cell" style={{ cursor: 'pointer' }} onClick={(e) => speak(e, verb.dictionary)} title="Phát âm">{verb.dictionary}</td>
                      <td style={{ fontWeight: 500 }}>{verb.meaning}</td>
                      <td className="conj-cell">{verb.te || '—'}</td>
                      <td className="conj-cell">{verb.ta || '—'}</td>
                      <td className="conj-cell">{verb.nai || '—'}</td>
                      <td className="conj-cell">{verb.ability || '—'}</td>
                      <td className="conj-cell">{verb.volitional || '—'}</td>
                      <td className="conj-cell">{verb.imperative || '—'}</td>
                      <td className="conj-cell">{verb.causative || '—'}</td>
                      <td className="conj-cell">{verb.prohibitive || '—'}</td>
                      <td className="conj-cell">{verb.conditional || '—'}</td>
                      <td className="conj-cell">{verb.passive || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* ====== LIST MODE ====== */
            <div className="verbs-list">
              {filteredVerbs.map((verb) => {
                const isExpanded = !!expandedVerbs[verb.id];

                const forms = [
                  { label: 'Thể ます', value: verb.masu },
                  { label: 'Thể Từ Điển', value: verb.dictionary },
                  { label: 'Thể て', value: verb.te },
                  { label: 'Thể た', value: verb.ta },
                  { label: 'Thể ない', value: verb.nai },
                  { label: 'Khả Năng', value: verb.ability },
                  { label: 'Ý Định', value: verb.volitional },
                  { label: 'Mệnh Lệnh', value: verb.imperative },
                  { label: 'Sai Khiến', value: verb.causative },
                  { label: 'Cấm Chỉ', value: verb.prohibitive },
                  { label: 'Điều Kiện', value: verb.conditional },
                  { label: 'Bị Động', value: verb.passive },
                ];

                const toggleVerbExpand = (id) => {
                  setExpandedVerbs((prev) => ({ ...prev, [id]: !prev[id] }));
                };

                return (
                  <div key={verb.id} className={`verb-item ${isExpanded ? 'expanded' : ''}`}>
                    <div className="verb-hdr" onClick={() => toggleVerbExpand(verb.id)}>
                      <div className="verb-hdr-left">
                        <button
                          className="btn"
                          style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            backgroundColor: isSavedForReview('verb', verb.id) ? 'var(--primary-light)' : 'var(--bg-primary)',
                            color: isSavedForReview('verb', verb.id) ? 'var(--primary)' : 'var(--text-secondary)',
                            border: '1px solid',
                            borderColor: isSavedForReview('verb', verb.id) ? 'var(--primary)' : 'var(--border-color)',
                            borderRadius: '15px',
                            flexShrink: 0,
                          }}
                          onClick={(e) => handleToggleStudyList(e, 'verb', verb.id)}
                          title={isSavedForReview('verb', verb.id) ? 'Bỏ lưu ôn tập' : 'Lưu vào danh sách ôn tập'}
                        >
                          {isSavedForReview('verb', verb.id) ? '★ Đang ôn' : '☆ Lưu ôn'}
                        </button>
                        <span className="verb-masu">{verb.masu}</span>
                        <span className="verb-dict">Từ điển: {verb.dictionary}</span>
                        <span className="verb-meaning">{verb.meaning}</span>
                      </div>
                      <span className="verb-chevron">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="verb-body">
                        <div className="verb-grid">
                          {forms.map((f, fIdx) => (
                            <div
                              key={fIdx}
                              className="verb-conjugation-card"
                              onClick={(e) => speak(e, f.value)}
                              title="Bấm để phát âm"
                            >
                              <div className="conjugation-title">{f.label}</div>
                              <div className="conjugation-value">{f.value || '—'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div id="daily-section">
          {!sessionStarted ? (
            renderDailySetup()
          ) : dailyWords.length === 0 ? (
            <div 
              className="card" 
              style={{
                maxWidth: '500px',
                margin: '2rem auto',
                textAlign: 'center',
                padding: '2.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Không tìm thấy từ vựng nào</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Không có từ vựng nào phù hợp với thiết lập nguồn và cấp độ bạn chọn.
              </p>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSessionStarted(false)}
              >
                Quay lại thiết lập
              </button>
            </div>
          ) : dailyCompleted ? (
            <div className="card" style={{
              maxWidth: '500px',
              margin: '2rem auto',
              textAlign: 'center',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
              border: '2px solid var(--success)',
              borderRadius: 'var(--border-radius)',
              backgroundColor: 'var(--bg-secondary)'
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem' }}>
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                <path d="M12 2a7.7 7.7 0 0 1 7.54 8H4.46A7.7 7.7 0 0 1 12 2z" />
              </svg>
              <h2 style={{ color: 'var(--success)', fontWeight: '800' }}>Hoàn thành Ôn tập!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: '0' }}>
                Chúc mừng bạn đã hoàn thành phiên ôn luyện <strong>{dailyWords.length} từ vựng</strong> hôm nay! Hãy tiếp tục duy trì thói quen học tập để đạt kết quả tốt nhất.
              </p>
              <button className="btn btn-primary" onClick={() => setSessionStarted(false)} style={{ marginTop: '0.5rem' }}>
                Thiết lập phiên mới
              </button>
            </div>
          ) : (
            <div style={{ maxWidth: '450px', margin: '1rem auto' }}>
              {/* Daily Progress */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '700' }}>
                <span style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-primary)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.8rem' }}>
                  Thẻ {dailyCurrentIdx + 1} / {dailyWords.length}
                </span>
              </div>
              
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-primary)', borderRadius: '3px', marginBottom: '1.25rem', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{
                  width: `${((dailyCurrentIdx) / dailyWords.length) * 100}%`,
                  height: '100%',
                  backgroundColor: 'var(--primary)',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* Flipped Card Container */}
              <div 
                className={`flashcard-wrapper ${slideDirection}`} 
                style={{ height: '280px', marginBottom: '2rem' }}
                onClick={() => setDailyFlipped(!dailyFlipped)}
              >
                <div className={`flashcard ${dailyFlipped ? 'flipped' : ''}`} style={{ height: '100%' }}>
                  {/* Front */}
                  <div className="card-front" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', border: '1.5px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span className="card-level" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>{dailyWords[dailyCurrentIdx]?.level}</span>
                      <button 
                        className="btn btn-secondary" 
                        style={{ 
                          padding: '0.3rem 0.75rem', 
                          fontSize: '0.8rem', 
                          borderRadius: '15px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                        onClick={(e) => speak(e, dailyWords[dailyCurrentIdx]?.word)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </svg>
                        Nghe
                      </button>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="card-main-jp" style={{ fontSize: '2.75rem', fontWeight: '800', fontFamily: 'var(--font-japanese)', marginBottom: '0.5rem' }}>{dailyWords[dailyCurrentIdx]?.word}</div>
                      <div className="card-kana" style={{ fontSize: '1.35rem', color: 'var(--text-secondary)' }}>{dailyWords[dailyCurrentIdx]?.reading}</div>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', opacity: 0.8 }}>Chạm vào thẻ để xem nghĩa</div>
                  </div>

                  {/* Back */}
                  <div className="card-back" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1.5px solid var(--border-color)', borderRadius: '12px', backgroundColor: 'var(--bg-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <span className="card-level" style={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>{dailyWords[dailyCurrentIdx]?.level}</span>
                      <span className="card-pos" style={{ margin: 0, padding: '0.2rem 0.6rem', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>{dailyWords[dailyCurrentIdx]?.part_of_speech}</span>
                    </div>
                    
                    <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                      <div className="card-meaning" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{dailyWords[dailyCurrentIdx]?.meaning}</div>
                    </div>
                    
                    {dailyWords[dailyCurrentIdx]?.example ? (
                      <div className="card-example-box" style={{ 
                        marginTop: 'auto', 
                        marginBottom: 'auto', 
                        borderLeft: '3px solid var(--primary)', 
                        paddingLeft: '0.75rem',
                        textAlign: 'left'
                      }}>
                        <div className="card-example-jp" style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{dailyWords[dailyCurrentIdx]?.example}</div>
                        <div className="card-example-vi" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{dailyWords[dailyCurrentIdx]?.example_meaning}</div>
                      </div>
                    ) : (
                      <div style={{ height: '1px' }}></div>
                    )}
                    
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', textAlign: 'center', fontWeight: '600' }}>Chạm vào thẻ để quay lại</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center' }}>
                <button 
                  className="btn" 
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--danger)',
                    border: '1.5px solid var(--danger)',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={(e) => handleDailyMastered(e, dailyWords[dailyCurrentIdx]?.id, false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Chưa thuộc
                </button>
                <button 
                  className="btn" 
                  style={{
                    flex: 1,
                    padding: '0.85rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--success)',
                    border: '1.5px solid var(--success)',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={(e) => handleDailyMastered(e, dailyWords[dailyCurrentIdx]?.id, true)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Đã thuộc
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100,
            backdropFilter: 'blur(4px)',
            padding: '1rem'
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="card modal-content" 
            style={{
              width: '100%',
              maxWidth: '550px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              animation: 'modalSlideIn 0.3s ease',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <style>{`
              @keyframes modalSlideIn {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              .modal-form-group {
                margin-bottom: 1.25rem;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
              }
              .modal-form-group label {
                font-weight: 600;
                color: var(--text-primary);
                font-size: 0.9rem;
              }
              .modal-form-group input, .modal-form-group select, .modal-form-group textarea {
                background-color: var(--bg-primary);
                border: 1px solid var(--border-color);
                color: var(--text-primary);
                padding: 0.75rem;
                border-radius: 8px;
                font-size: 0.95rem;
                outline: none;
                transition: border-color 0.2s;
              }
              .modal-form-group input:focus, .modal-form-group select:focus, .modal-form-group textarea:focus {
                border-color: var(--primary);
              }
              .modal-form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
              }
            `}</style>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                Thêm {activeSubTab === 'vocab' ? 'Từ vựng mới' : 'Động từ mới'}
              </h2>
              <button 
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.2rem'
                }}
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData.entries());
              data.created_by = username;

              const endpoint = activeSubTab === 'vocab' ? '/api/vocabulary/add' : '/api/verbs/add';
              try {
                const res = await fetch(`${window.API_BASE}${endpoint}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                });
                if (res.ok) {
                  showAlert('Thông báo', 'Đã thêm thành công!');
                  setShowAddModal(false);
                  fetchMainData();
                } else {
                  const errText = await res.text();
                  showAlert('Lỗi', `Lỗi: ${errText}`);
                }
              } catch (err) {
                showAlert('Lỗi', `Lỗi kết nối: ${err.message}`);
              }
            }}>
              {activeSubTab === 'vocab' ? (
                <>
                  <div className="modal-form-grid">
                    <div className="modal-form-group">
                      <label>Từ vựng (Kanji/Kana) *</label>
                      <input name="word" required placeholder="Ví dụ: 食べる" />
                    </div>
                    <div className="modal-form-group">
                      <label>Cách đọc (Reading) *</label>
                      <input name="reading" required placeholder="Ví dụ: たべる" />
                    </div>
                  </div>

                  <div className="modal-form-group">
                    <label>Ý nghĩa *</label>
                    <input name="meaning" required placeholder="Ví dụ: Ăn" />
                  </div>

                  <div className="modal-form-grid">
                    <div className="modal-form-group">
                      <label>Cấp độ (JLPT)</label>
                      <select name="level" defaultValue="N5">
                        <option value="N5">N5</option>
                        <option value="N4">N4</option>
                        <option value="N3">N3</option>
                      </select>
                    </div>
                    <div className="modal-form-group">
                      <label>Từ loại (Part of Speech)</label>
                      <input name="part_of_speech" placeholder="Ví dụ: Động từ nhóm 2" />
                    </div>
                  </div>

                  <div className="modal-form-group">
                    <label>Ví dụ (Tiếng Nhật) - Tùy chọn</label>
                    <input name="example" placeholder="Ví dụ: 朝ご飯を食べる" />
                  </div>

                  <div className="modal-form-grid">
                    <div className="modal-form-group">
                      <label>Cách đọc ví dụ</label>
                      <input name="example_reading" placeholder="Ví dụ: あさごはんuをたべる" />
                    </div>
                    <div className="modal-form-group">
                      <label>Dịch nghĩa ví dụ</label>
                      <input name="example_meaning" placeholder="Ví dụ: Ăn sáng" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="modal-form-grid">
                    <div className="modal-form-group">
                      <label>Thể ます *</label>
                      <input name="masu" required placeholder="Ví dụ: あきます" />
                    </div>
                    <div className="modal-form-group">
                      <label>Thể Từ Điển *</label>
                      <input name="dictionary" required placeholder="Ví dụ: 開く" />
                    </div>
                  </div>

                  <div className="modal-form-group">
                    <label>Ý nghĩa (Nghĩa tiếng Việt) *</label>
                    <input name="meaning" required placeholder="Ví dụ: mở (cửa)" />
                  </div>

                  <h3 style={{ fontSize: '1rem', marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                    Các thể chia động từ (Tùy chọn)
                  </h3>

                  <div className="modal-form-grid">
                    <div className="modal-form-group">
                      <label>Thể て</label>
                      <input name="te" placeholder="Ví dụ: あいて" />
                    </div>
                    <div className="modal-form-group">
                      <label>Thể た</label>
                      <input name="ta" placeholder="Ví dụ: あいた" />
                    </div>
                  </div>

                  <div className="modal-form-grid">
                    <div className="modal-form-group">
                      <label>Thể ない</label>
                      <input name="nai" placeholder="Ví dụ: あかない" />
                    </div>
                    <div className="modal-form-group">
                      <label>Thể Khả Năng</label>
                      <input name="ability" placeholder="Ví dụ: あける" />
                    </div>
                  </div>

                  <div className="modal-form-grid">
                    <div className="modal-form-group">
                      <label>Thể Ý Định</label>
                      <input name="volitional" placeholder="Ví dụ: あこう" />
                    </div>
                    <div className="modal-form-group">
                      <label>Thể Mệnh Lệnh</label>
                      <input name="imperative" placeholder="Ví dụ: あけ" />
                    </div>
                  </div>

                  <div className="modal-form-grid">
                    <div className="modal-form-group">
                      <label>Thể Sai Khiến</label>
                      <input name="causative" placeholder="Ví dụ: あかせる" />
                    </div>
                    <div className="modal-form-group">
                      <label>Thể Cấm Chỉ</label>
                      <input name="prohibitive" placeholder="Ví dụ: あくな" />
                    </div>
                  </div>

                  <div className="modal-form-grid">
                    <div className="modal-form-group">
                      <label>Thể Điều Kiện</label>
                      <input name="conditional" placeholder="Ví dụ: あけは" />
                    </div>
                    <div className="modal-form-group">
                      <label>Thể Bị Động</label>
                      <input name="passive" placeholder="Ví dụ: あかれる" />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '8px' }}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', backgroundColor: 'var(--primary)', color: '#ffffff', border: 'none' }}
                >
                  Thêm mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Modal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={() => {
          if (modalConfig.onConfirm) modalConfig.onConfirm();
          setModalConfig({ ...modalConfig, isOpen: false });
        }}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>
  );
};

export default VocabKanji;
