import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, BookOpen, Volume2, Award, Calendar, ChevronRight, Check, Flame, BarChart2 } from 'lucide-react';

const QUICK_QUIZZES = {
  N5: [
    {
      question: "あした 友達___会います。",
      options: ["に", "を", "で", "が"],
      correct: 0,
      explanation: "Động từ '会います' (gặp gỡ) đi với trợ từ 'ni' để chỉ đối tượng được gặp."
    },
    {
      question: "机の上に 本___あります。",
      options: ["が", "を", "ni", "は"],
      correct: 0,
      explanation: "Trợ từ 'ga' đứng trước động từ tồn tại 'あります' để chỉ chủ thể tồn tại."
    },
    {
      question: "李さんは 日本語___上手です。",
      options: ["が", "を", "ni", "で"],
      correct: 0,
      explanation: "Tính từ đuôi na '上手' (giỏi) đi kèm với trợ từ 'ga' để chỉ lĩnh vực giỏi."
    },
    {
      question: "タクシー___会社へ行きます。",
      options: ["で", "に", "を", "へ"],
      correct: 0,
      explanation: "Trợ từ 'de' chỉ phương tiện đi lại hoặc công cụ thực hiện hành động."
    }
  ],
  N4: [
    {
      question: "日本へ行く___、パスポートが必要です。",
      options: ["とき", "たら", "から", "ので"],
      correct: 0,
      explanation: "Sử dụng 'toki' (khi) để nối mệnh đề chỉ thời điểm hành động xảy ra."
    },
    {
      question: "ケーキを___しまいました。",
      options: ["食べて", "食べないで", "食べたら", "食べる"],
      correct: 0,
      explanation: "Mẫu câu V-te + shimaimasu diễn tả hành động đã hoàn thành ngoài ý muốn."
    },
    {
      question: "先生は 私に 本u___ました。",
      options: ["ください", "くれ", "あげ", "もらい"],
      correct: 1,
      explanation: "Động từ 'kuremasu' (cho, tặng) dùng khi ai đó làm gì cho bản thân mình."
    }
  ],
  N3: [
    {
      question: "日本で生活する___、日本語は不可欠だ。",
      options: ["にあたって", "に際して", "において", "について"],
      correct: 0,
      explanation: "Mẫu 'ni atatte' có nghĩa là 'nhân dịp/vào thời điểm chuẩn bị làm gì đó quan trọng'."
    },
    {
      question: "彼女は 歌が 上手な___、ダンスも得意だ。",
      options: ["ばかりでなく", "ものの", "かわりに", "うえに"],
      correct: 0,
      explanation: "Mẫu 'bakari de naku' có nghĩa là 'không chỉ... mà còn...'"
    }
  ]
};

const LearningDashboard = ({ profile, userLevel, navigate }) => {
  const username = profile?.username || 'Người học';

  const [masteredWords, setMasteredWords] = useState([]);
  const [quizHighScore, setQuizHighScore] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);
  
  // New States
  const [weakWords, setWeakWords] = useState([]);
  const [correctToday, setCorrectToday] = useState(0);
  const [totalToday, setTotalToday] = useState(0);
  const [videoViewedToday, setVideoViewedToday] = useState(false);
  const [dailyVocab, setDailyVocab] = useState([]);
  const [revealedIds, setRevealedIds] = useState({});

  // Quick Quiz States
  const [activeQuickQuiz, setActiveQuickQuiz] = useState(null);
  const [hasAnsweredQuiz, setHasAnsweredQuiz] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(-1);

  useEffect(() => {
    try {
      setMasteredWords(JSON.parse(localStorage.getItem('nihongo_mastered_words')) || []);
    } catch (e) {
      setMasteredWords([]);
    }

    try {
      setWeakWords(JSON.parse(localStorage.getItem('nihongo_weak_words')) || []);
    } catch (e) {
      setWeakWords([]);
    }

    const todayStr = new Date().toLocaleDateString('en-CA');
    const savedDate = localStorage.getItem('nihongo_stats_date');
    if (savedDate === todayStr) {
      setCorrectToday(parseInt(localStorage.getItem('nihongo_correct_today') || '0', 10));
      setTotalToday(parseInt(localStorage.getItem('nihongo_total_today') || '0', 10));
    } else {
      setCorrectToday(0);
      setTotalToday(0);
    }

    const savedVideoDate = localStorage.getItem('nihongo_video_viewed_date');
    setVideoViewedToday(savedVideoDate === todayStr);

    const totalScore =
      (parseInt(localStorage.getItem(`nihongo_quiz_high_score_${userLevel}_standard`) || '0', 10) || 0) +
      (parseInt(localStorage.getItem(`nihongo_quiz_high_score_${userLevel}_listening`) || '0', 10) || 0) +
      (parseInt(localStorage.getItem(`nihongo_quiz_high_score_${userLevel}_kana`) || '0', 10) || 0);
    setQuizHighScore(totalScore);

    const now = Date.now();
    let weekMin = 0;
    for (let i = 0; i < 7; i++) {
      const val = localStorage.getItem(`nihongo_week_min_${i}`);
      if (val) weekMin += parseInt(val, 10) || 0;
    }
    setWeeklyMinutes(weekMin);

    const lastActive = localStorage.getItem('nihongo_last_active_date');
    const savedStreak = parseInt(localStorage.getItem('nihongo_streak') || '0', 10);
    let currentStreak = savedStreak;
    if (lastActive) {
      const diffTime = Math.abs(new Date(todayStr) - new Date(lastActive));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 1) {
        currentStreak = 0;
        localStorage.setItem('nihongo_streak', '0');
      }
    }
    setStreakDays(currentStreak);
  }, [userLevel]);

  // Fetch vocabulary and generate 3 random daily recommendations
  useEffect(() => {
    fetch(`${window.API_BASE}/vocabulary`)
      .then((res) => res.json())
      .then((data) => {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const savedDate = localStorage.getItem('nihongo_daily_vocab_date');
        const savedItems = localStorage.getItem('nihongo_daily_vocab_items');
        
        let selected = [];
        if (savedDate === todayStr && savedItems) {
          try {
            selected = JSON.parse(savedItems);
          } catch (e) {}
        }
        
        if (selected.length === 0 && data && data.length > 0) {
          const levelPool = data.filter((v) => v.level === userLevel);
          const pool = levelPool.length > 0 ? levelPool : data;
          const shuffled = [...pool].sort(() => Math.random() - 0.5);
          selected = shuffled.slice(0, 3).map(v => ({
            id: v.id,
            word: v.word,
            reading: v.reading,
            meaning: v.meaning,
            level: v.level
          }));
          localStorage.setItem('nihongo_daily_vocab_date', todayStr);
          localStorage.setItem('nihongo_daily_vocab_items', JSON.stringify(selected));
        }
        setDailyVocab(selected);
      })
      .catch((err) => console.error('Lỗi lấy từ vựng gợi ý:', err));
  }, [userLevel]);

  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(voice => voice.lang.startsWith('ja'));
      if (jaVoice) utterance.voice = jaVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleMarkAsMastered = (wordId) => {
    try {
      const saved = localStorage.getItem('nihongo_mastered_words');
      let currentMastered = saved ? JSON.parse(saved) : [];
      if (!currentMastered.includes(wordId)) {
        currentMastered.push(wordId);
        localStorage.setItem('nihongo_mastered_words', JSON.stringify(currentMastered));
        setMasteredWords(currentMastered);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVisitVideos = () => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    localStorage.setItem('nihongo_video_viewed_date', todayStr);
    setVideoViewedToday(true);
    navigate('/videos');
  };

  // Select and setup the active Quick Quiz for today
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const levelPool = QUICK_QUIZZES[userLevel] || QUICK_QUIZZES.N5;
    
    const savedDate = localStorage.getItem('nihongo_quick_quiz_date');
    let qIdx = 0;
    
    if (savedDate === todayStr) {
      qIdx = parseInt(localStorage.getItem('nihongo_quick_quiz_index') || '0', 10);
      setHasAnsweredQuiz(localStorage.getItem('nihongo_quick_quiz_answered') === 'true');
      setSelectedChoice(parseInt(localStorage.getItem('nihongo_quick_quiz_choice') || '-1', 10));
    } else {
      qIdx = Math.floor(Math.random() * levelPool.length);
      localStorage.setItem('nihongo_quick_quiz_date', todayStr);
      localStorage.setItem('nihongo_quick_quiz_index', qIdx.toString());
      localStorage.setItem('nihongo_quick_quiz_answered', 'false');
      localStorage.setItem('nihongo_quick_quiz_choice', '-1');
      setHasAnsweredQuiz(false);
      setSelectedChoice(-1);
    }
    
    setActiveQuickQuiz(levelPool[qIdx] || levelPool[0]);
  }, [userLevel]);

  const handleAnswerQuickQuiz = (choiceIdx) => {
    setSelectedChoice(choiceIdx);
    setHasAnsweredQuiz(true);
    localStorage.setItem('nihongo_quick_quiz_answered', 'true');
    localStorage.setItem('nihongo_quick_quiz_choice', choiceIdx.toString());
    
    const isCorrect = choiceIdx === activeQuickQuiz.correct;
    
    // Reward the user by incrementing stats correctToday/totalToday
    const todayStr = new Date().toLocaleDateString('en-CA');
    const newTotal = totalToday + 1;
    const newCorrect = correctToday + (isCorrect ? 1 : 0);
    localStorage.setItem('nihongo_stats_date', todayStr);
    localStorage.setItem('nihongo_total_today', newTotal.toString());
    localStorage.setItem('nihongo_correct_today', newCorrect.toString());
    setTotalToday(newTotal);
    setCorrectToday(newCorrect);
  };

  const levelTargets = useMemo(() => {
    const map = {
      N5: { label: 'N5', next: 'N4', wordsTarget: 300, kanjiTarget: 100, grammarTarget: 80 },
      N4: { label: 'N4', next: 'N3', wordsTarget: 800, kanjiTarget: 300, grammarTarget: 200 },
      N3: { label: 'N3', next: 'N2', wordsTarget: 2000, kanjiTarget: 650, grammarTarget: 400 },
    };
    return map[userLevel] || map.N5;
  }, [userLevel]);

  const wordProgress = Math.min(100, Math.round((masteredWords.length / levelTargets.wordsTarget) * 100));

  const weekData = useMemo(() => {
    const days = [];
    const today = new Date();
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const val = parseInt(localStorage.getItem(`nihongo_week_min_${i}`) || '0', 10) || 0;
      const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
      days.push({ label: labels[dayIndex], value: val });
    }
    const maxVal = Math.max(...days.map((d) => d.value), 30);
    return days.map((d) => ({
      ...d,
      heightPercent: Math.max(6, (d.value / maxVal) * 100),
    }));
  }, [weeklyMinutes]);

  return (
    <div className="dashboard-page">
      <style>{`
        .dashboard-page {
          max-width: 100%;
          padding: 1rem;
        }
        .dash-hero {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 2rem 2.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .dash-hero h1 {
          font-size: 1.75rem;
          font-weight: 800;
          margin: 0;
          color: #0f172a;
        }
        .dash-hero p {
          color: #64748b;
          margin: 0.25rem 0 0 0;
          font-size: 0.95rem;
        }
        .dash-level-badge {
          background: #0f172a;
          color: #fff;
          padding: 0.4rem 1rem;
          border-radius: 99px;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.02em;
        }
        .dash-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 900px) {
          .dash-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 500px) {
          .dash-stats-grid {
            grid-template-columns: 1fr;
          }
        }
        .dash-stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.1rem 1.25rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .dash-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.06);
          border-color: #0f172a;
        }
        .dash-stat-label {
          font-size: 0.78rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.35rem;
        }
        .dash-stat-value {
          font-size: 1.6rem;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.1;
        }
        .dash-stat-sub {
          font-size: 0.78rem;
          color: #94a3b8;
          margin-top: 0.35rem;
        }
        .dash-main-grid {
          display: grid;
          grid-template-columns: 5fr 3fr;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 992px) {
          .dash-main-grid {
            grid-template-columns: 1fr;
          }
        }
        .dash-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          margin-bottom: 1.25rem;
        }
        .dash-card:last-child {
          margin-bottom: 0;
        }
        .dash-card h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 700;
          color: #0f172a;
        }
        .dash-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 0.4rem;
          height: 140px;
          padding-top: 1.25rem;
        }
        .dash-chart-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
        }
        .dash-chart-bar {
          width: 100%;
          max-width: 28px;
          border-radius: 4px 4px 0 0;
          background: #0f172a;
          min-height: 4px;
          transition: height 0.4s ease;
        }
        .dash-chart-val {
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 600;
        }
        .dash-chart-label {
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: 600;
        }
        .dash-progress-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.9rem;
        }
        .dash-progress-row:last-child {
          margin-bottom: 0;
        }
        .dash-progress-label {
          width: 80px;
          font-size: 0.82rem;
          color: #475569;
          font-weight: 600;
        }
        .dash-progress-track {
          flex: 1;
          height: 7px;
          border-radius: 99px;
          background: #f1f5f9;
          overflow: hidden;
        }
        .dash-progress-fill {
          height: 100%;
          border-radius: 99px;
          background: #0f172a;
          transition: width 0.4s ease;
        }
        .dash-progress-pct {
          width: 34px;
          font-size: 0.75rem;
          color: #64748b;
          text-align: right;
          font-weight: 700;
        }
        .dash-journey {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .dash-journey-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.85rem 1rem;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dash-journey-item:hover {
          border-color: #0f172a;
          background: #ffffff;
        }
        .dash-journey-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: #0f172a;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .dash-journey-text {
          flex: 1;
        }
        .dash-journey-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f172a;
        }
        .dash-journey-sub {
          font-size: 0.75rem;
          color: #64748b;
        }
        .dash-challenge {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem;
        }
        .dash-challenge h3 {
          margin: 0 0 0.75rem 0;
        }
        .dash-challenge p {
          font-size: 0.9rem;
          color: #475569;
          margin: 0 0 1rem 0;
          line-height: 1.5;
        }
        .dash-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 0.65rem 1rem;
          border-radius: 8px;
          border: none;
          background: #0f172a;
          color: #fff;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .dash-btn:hover {
          background: #1e293b;
        }

        /* Alert Banner */
        .dash-alert-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }
        .dash-alert-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .dash-alert-icon {
          color: #ef4444;
          flex-shrink: 0;
        }
        .dash-alert-info h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: #991b1b;
        }
        .dash-alert-info p {
          margin: 0.15rem 0 0 0;
          font-size: 0.85rem;
          color: #b91c1c;
        }
        .dash-alert-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: #ef4444;
          color: #ffffff;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.15s ease;
          white-space: nowrap;
        }
        .dash-alert-btn:hover {
          background: #dc2626;
        }

        /* Missions Checklist */
        .dash-mission-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .dash-mission-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: all 0.15s ease;
        }
        .dash-mission-item.completed {
          background: #f0fdf4;
          border-color: #bbf7d0;
          opacity: 0.85;
        }
        .dash-mission-checkbox {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 2px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 0.1rem;
          transition: all 0.15s ease;
        }
        .dash-mission-item.completed .dash-mission-checkbox {
          background: #22c55e;
          border-color: #22c55e;
          color: #ffffff;
        }
        .dash-mission-content {
          flex: 1;
        }
        .dash-mission-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0f172a;
        }
        .dash-mission-item.completed .dash-mission-title {
          text-decoration: line-through;
          color: #64748b;
        }
        .dash-mission-sub {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.15rem;
        }
        .dash-mission-link {
          font-size: 0.75rem;
          color: #0f172a;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
          display: inline-block;
          margin-top: 0.25rem;
        }

        /* Daily Recommendations */
        .dash-vocab-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        @media (max-width: 768px) {
          .dash-vocab-cards {
            grid-template-columns: 1fr;
          }
        }
        .dash-vocab-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          min-height: 150px;
          justify-content: space-between;
          position: relative;
          transition: all 0.15s ease;
        }
        .dash-vocab-card:hover {
          border-color: #cbd5e1;
        }
        .dash-vocab-word {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 0.25rem;
        }
        .dash-vocab-info {
          font-size: 0.85rem;
          color: #475569;
          margin-bottom: 0.5rem;
          min-height: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .dash-vocab-reveal-btn {
          font-size: 0.78rem;
          background: #e2e8f0;
          color: #475569;
          border: none;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .dash-vocab-reveal-btn:hover {
          background: #cbd5e1;
        }
        .dash-vocab-actions {
          display: flex;
          gap: 0.4rem;
          width: 100%;
        }
        .dash-vocab-btn-action {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.2rem;
          padding: 0.4rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #0f172a;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dash-vocab-btn-action:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        .dash-vocab-btn-action.mastered {
          background: #d1fae5;
          color: #065f46;
          border-color: #a7f3d0;
          cursor: default;
        }

        /* Quick Quiz Card */
        .quick-quiz-question {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 1rem;
        }
        .quick-quiz-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .quick-quiz-opt-btn {
          padding: 0.6rem;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #0f172a;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .quick-quiz-opt-btn:hover:not(:disabled) {
          border-color: #0f172a;
          background: #f8fafc;
        }
        .quick-quiz-opt-btn.correct {
          background: #d1fae5;
          border-color: #10b981;
          color: #065f46;
        }
        .quick-quiz-opt-btn.incorrect {
          background: #fee2e2;
          border-color: #ef4444;
          color: #991b1b;
        }
        .quick-quiz-opt-btn.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .quick-quiz-feedback {
          padding: 0.85rem 1rem;
          border-radius: 8px;
          margin-top: 0.5rem;
          font-size: 0.85rem;
        }
        .quick-quiz-feedback.success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }
        .quick-quiz-feedback.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }
      `}</style>

      <div className="dash-hero">
        <div>
          <h1>Xin chào, {username}</h1>
          <p>Tổng quan tiến độ học tập tiếng Nhật — Trình độ {userLevel}</p>
        </div>
        <span className="dash-level-badge">{userLevel}</span>
      </div>

      {weakWords.length > 0 && (
        <div className="dash-alert-banner">
          <div className="dash-alert-info">
            <AlertTriangle size={20} className="dash-alert-icon" />
            <div>
              <h4>Sổ tay từ yếu ({weakWords.length} từ)</h4>
              <p>Bạn có một số từ vựng thường trả lời sai. Hãy ôn tập lại để cải thiện điểm số!</p>
            </div>
          </div>
          <button className="dash-alert-btn" onClick={() => navigate('/quizzes')}>
            Ôn tập ngay <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="dash-stats-grid">
        {/* Chuỗi học tập */}
        <div className="dash-stat-card" onClick={() => navigate('/quizzes')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '8px',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Flame size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.04em' }}>CHUỖI HỌC TẬP</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{streakDays} ngày</div>
          </div>
        </div>

        {/* Hôm nay tập */}
        <div className="dash-stat-card" onClick={() => navigate('/quizzes')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderRadius: '8px',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.04em' }}>HÔM NAY TẬP</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{correctToday} / {totalToday} câu</div>
          </div>
        </div>

        {/* Tỷ lệ chính xác */}
        <div className="dash-stat-card" onClick={() => navigate('/quizzes')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BarChart2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.04em' }}>TỶ LỆ CHÍNH XÁC</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {totalToday > 0 ? Math.round((correctToday / totalToday) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Từ đã thuộc */}
        <div className="dash-stat-card" onClick={() => navigate('/vocabulary')} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderRadius: '8px',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.04em' }}>TỪ ĐÃ THUỘC</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{masteredWords.length} từ</div>
          </div>
        </div>
      </div>

      <div className="dash-main-grid">
        <div>
          {dailyVocab.length > 0 && (
            <div className="dash-card">
              <h3>Gợi ý từ vựng hôm nay ({userLevel})</h3>
              <div className="dash-vocab-cards">
                {dailyVocab.map((vocab) => {
                  const isRevealed = revealedIds[vocab.id];
                  const isMastered = masteredWords.includes(vocab.id);
                  return (
                    <div key={vocab.id} className="dash-vocab-card">
                      <div style={{ width: '100%' }}>
                        <div className="dash-vocab-word">{vocab.word}</div>
                        <div className="dash-vocab-info">
                          {isRevealed ? (
                            <>
                              <div style={{ fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.2rem' }}>
                                {vocab.reading}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                {vocab.meaning}
                              </div>
                            </>
                          ) : (
                            <button 
                              className="dash-vocab-reveal-btn" 
                              onClick={() => setRevealedIds(prev => ({ ...prev, [vocab.id]: true }))}
                            >
                              Xem phiên âm & nghĩa
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="dash-vocab-actions">
                        <button 
                          className="dash-vocab-btn-action" 
                          onClick={() => speakWord(vocab.word)}
                          title="Nghe phát âm"
                        >
                          <Volume2 size={14} />
                        </button>
                        <button 
                          className={`dash-vocab-btn-action ${isMastered ? 'mastered' : ''}`}
                          onClick={() => !isMastered && handleMarkAsMastered(vocab.id)}
                          disabled={isMastered}
                        >
                          {isMastered ? (
                            <>
                              <Check size={14} /> Thuộc
                            </>
                          ) : (
                            'Đã thuộc'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="dash-card">
            <h3>Hoạt động 7 ngày qua</h3>
            <div className="dash-chart">
              {weekData.map((d, i) => (
                <div key={i} className="dash-chart-col">
                  <div className="dash-chart-val">{d.value}p</div>
                  <div className="dash-chart-bar" style={{ height: `${d.heightPercent}%` }} />
                  <div className="dash-chart-label">{d.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-card">
            <h3>Mục tiêu cấp độ {userLevel}</h3>
            <div className="dash-progress-row">
              <div className="dash-progress-label">Từ vựng</div>
              <div className="dash-progress-track">
                <div className="dash-progress-fill" style={{ width: `${wordProgress}%` }} />
              </div>
              <div className="dash-progress-pct">{wordProgress}%</div>
            </div>
            <div className="dash-progress-row">
              <div className="dash-progress-label">Kanji</div>
              <div className="dash-progress-track">
                <div
                  className="dash-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.round((masteredWords.length || 0) / levelTargets.kanjiTarget * 100))}%`,
                  }}
                />
              </div>
              <div className="dash-progress-pct">
                {Math.min(100, Math.round((masteredWords.length || 0) / levelTargets.kanjiTarget * 100))}%
              </div>
            </div>
            <div className="dash-progress-row">
              <div className="dash-progress-label">Ngữ pháp</div>
              <div className="dash-progress-track">
                <div
                  className="dash-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.round((masteredWords.length || 0) / levelTargets.grammarTarget * 100))}%`,
                  }}
                />
              </div>
              <div className="dash-progress-pct">
                {Math.min(100, Math.round((masteredWords.length || 0) / levelTargets.grammarTarget * 100))}%
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="dash-card">
            <h3>Nhiệm vụ hàng ngày</h3>
            <div className="dash-mission-list">
              {/* Mission 1 */}
              <div className={`dash-mission-item ${correctToday >= 10 ? 'completed' : ''}`}>
                <div className="dash-mission-checkbox">
                  {correctToday >= 10 && <Check size={14} />}
                </div>
                <div className="dash-mission-content">
                  <div className="dash-mission-title">Luyện tập hàng ngày</div>
                  <div className="dash-mission-sub">Trả lời đúng 10 câu trắc nghiệm hôm nay (Đạt: {correctToday}/10)</div>
                  {correctToday < 10 && (
                    <span className="dash-mission-link" onClick={() => navigate('/quizzes')}>
                      Luyện tập ngay
                    </span>
                  )}
                </div>
              </div>

              {/* Mission 2 */}
              {weakWords.length > 0 ? (
                <div className={`dash-mission-item ${totalToday >= 5 ? 'completed' : ''}`}>
                  <div className="dash-mission-checkbox">
                    {totalToday >= 5 && <Check size={14} />}
                  </div>
                  <div className="dash-mission-content">
                    <div className="dash-mission-title">Cải thiện từ yếu</div>
                    <div className="dash-mission-sub">Luyện tập sổ tay từ yếu (Đạt: {totalToday}/5 câu hỏi)</div>
                    {totalToday < 5 && (
                      <span className="dash-mission-link" onClick={() => navigate('/quizzes')}>
                        Ôn tập từ yếu
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`dash-mission-item ${totalToday >= 5 ? 'completed' : ''}`}>
                  <div className="dash-mission-checkbox">
                    {totalToday >= 5 && <Check size={14} />}
                  </div>
                  <div className="dash-mission-content">
                    <div className="dash-mission-title">Rèn luyện phản xạ</div>
                    <div className="dash-mission-sub">Làm ít nhất 5 câu hỏi trắc nghiệm bất kỳ (Đạt: {totalToday}/5)</div>
                    {totalToday < 5 && (
                      <span className="dash-mission-link" onClick={() => navigate('/quizzes')}>
                        Luyện tập ngay
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Mission 3 */}
              <div className={`dash-mission-item ${videoViewedToday ? 'completed' : ''}`}>
                <div className="dash-mission-checkbox">
                  {videoViewedToday && <Check size={14} />}
                </div>
                <div className="dash-mission-content">
                  <div className="dash-mission-title">Khám phá video</div>
                  <div className="dash-mission-sub">Ghé thăm chuyên mục học qua Video hôm nay</div>
                  {!videoViewedToday && (
                    <span className="dash-mission-link" onClick={handleVisitVideos}>
                      Xem video ngay
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {activeQuickQuiz && (
            <div className="dash-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0 }}>Thử thách nhanh 5s ({userLevel})</h3>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>Hàng ngày</span>
              </div>
              <p className="quick-quiz-question">{activeQuickQuiz.question}</p>
              <div className="quick-quiz-options">
                {activeQuickQuiz.options.map((opt, idx) => {
                  const isSelected = selectedChoice === idx;
                  const isCorrect = idx === activeQuickQuiz.correct;
                  let btnClass = '';
                  if (hasAnsweredQuiz) {
                    if (isCorrect) btnClass = 'correct';
                    else if (isSelected) btnClass = 'incorrect';
                    else btnClass = 'disabled';
                  } else if (isSelected) {
                    btnClass = 'selected';
                  }
                  return (
                    <button
                      key={idx}
                      className={`quick-quiz-opt-btn ${btnClass}`}
                      onClick={() => !hasAnsweredQuiz && handleAnswerQuickQuiz(idx)}
                      disabled={hasAnsweredQuiz}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {hasAnsweredQuiz && (
                <div className={`quick-quiz-feedback ${selectedChoice === activeQuickQuiz.correct ? 'success' : 'error'}`}>
                  <strong>
                    {selectedChoice === activeQuickQuiz.correct ? 'Chính xác!' : 'Chưa đúng rồi'}
                  </strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', lineHeight: '1.4' }}>
                    {activeQuickQuiz.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="dash-card">
            <h3>Lộ trình tiếp theo</h3>
            <ul className="dash-journey">
              <li className="dash-journey-item" onClick={() => navigate('/vocabulary')}>
                <div className="dash-journey-icon">T</div>
                <div className="dash-journey-text">
                  <div className="dash-journey-title">Từ vựng & Kanji</div>
                  <div className="dash-journey-sub">Mở rộng vốn từ hôm nay</div>
                </div>
              </li>
              <li className="dash-journey-item" onClick={() => navigate('/grammar')}>
                <div className="dash-journey-icon">N</div>
                <div className="dash-journey-text">
                  <div className="dash-journey-title">Ngữ pháp</div>
                  <div className="dash-journey-sub">Cấu trúc nền tảng</div>
                </div>
              </li>
              <li className="dash-journey-item" onClick={() => navigate('/quizzes')}>
                <div className="dash-journey-icon">Q</div>
                <div className="dash-journey-text">
                  <div className="dash-journey-title">Trắc nghiệm</div>
                  <div className="dash-journey-sub">Kiểm tra sau mỗi chủ đề</div>
                </div>
              </li>
              <li className="dash-journey-item" onClick={() => navigate('/videos')}>
                <div className="dash-journey-icon">V</div>
                <div className="dash-journey-text">
                  <div className="dash-journey-title">Học qua Video</div>
                  <div className="dash-journey-sub">Xem và thảo luận</div>
                </div>
              </li>
            </ul>
          </div>

          <div className="dash-challenge">
            <h3>Thử thách hôm nay</h3>
            <p>
              {streakDays < 3
                ? 'Bắt đầu chuỗi 3 ngày đầu tiên để nhận huy hiệu!'
                : streakDays < 7
                  ? 'Bạn đã có streak tốt. Cố lên thêm vài ngày nữa!'
                  : 'Tuyệt vời! Hãy duy trì streak để bứt phá.'}
            </p>
            <button className="dash-btn" onClick={() => navigate('/quizzes')}>
              Luyện tập ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningDashboard;
