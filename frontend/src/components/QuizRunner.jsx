import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Headphones, 
  Type, 
  Languages, 
  Volume2, 
  Trophy, 
  Award, 
  Sparkles,
  Inbox,
  PenTool,
  Timer,
  Flame,
  CheckCircle2,
  BarChart2,
  Play,
  Pause,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

const SENTENCE_QUIZZES = [
  {
    sentence: "私は毎日**日本語**を勉強します。",
    target: "日本語",
    options: ["nihongo", "nihonjin", "nihon", "nippon"],
    correct: 0,
    explanation: "日本語 (nihongo) nghĩa là 'tiếng Nhật'. Câu hoàn chỉnh: 'Tôi học tiếng Nhật mỗi ngày.'",
    audioText: "日本語",
    fullAudioText: "私は毎日日本語を勉強します。"
  },
  {
    sentence: "あの**先生**はとても親切です。",
    target: "先生",
    options: ["gakusei", "sensei", "isha", "kaishain"],
    correct: 1,
    explanation: "先生 (sensei) nghĩa là 'giáo viên/thầy cô'. Câu hoàn chỉnh: 'Giáo viên kia rất thân thiện.'",
    audioText: "先生",
    fullAudioText: "あの先生はとても親切です。"
  },
  {
    sentence: "お**酒**を飲みすぎました。",
    target: "酒",
    options: ["sake", "mizu", "ocha", "biiru"],
    correct: 0,
    explanation: "酒 (sake) nghĩa là 'rượu'. Câu hoàn chỉnh: 'Tôi đã uống quá nhiều rượu.'",
    audioText: "酒",
    fullAudioText: "お酒を飲みすぎました。"
  },
  {
    sentence: "日本料理の中で**寿司**が一番好きです。",
    target: "寿司",
    options: ["sashimi", "sushi", "tempura", "ramen"],
    correct: 1,
    explanation: "寿司 (sushi) nghĩa là 'món sushi'. Câu hoàn chỉnh: 'Trong các món ăn Nhật, tôi thích sushi nhất.'",
    audioText: "寿司",
    fullAudioText: "日本料理の中で寿司が一番好きです。"
  },
  {
    sentence: "明日**友達**と映画を見に行きます。",
    target: "友達",
    options: ["kazoku", "kodomo", "tomodachi", "sensei"],
    correct: 2,
    explanation: "友達 (tomodachi) nghĩa là 'bạn bè'. Câu hoàn chỉnh: 'Ngày mai tôi sẽ đi xem phim với bạn.'",
    audioText: "友達",
    fullAudioText: "明日友達と映画を見に行きます。"
  },
  {
    sentence: "英語の**辞書**を買いたいです。",
    target: "辞書",
    options: ["hon", "zasshi", "shinbun", "jisho"],
    correct: 3,
    explanation: "辞書 (jisho) nghĩa là 'từ điển'. Câu hoàn chỉnh: 'Tôi muốn mua một cuốn từ điển tiếng Anh.'",
    audioText: "辞書",
    fullAudioText: "英語の辞書を買いたいです。"
  },
  {
    sentence: "この**部屋**は少し暗いです。",
    target: "部屋",
    options: ["heya", "ie", "niwa", "mado"],
    correct: 0,
    explanation: "部屋 (heya) nghĩa là 'căn phòng'. Câu hoàn chỉnh: 'Căn phòng này hơi tối.'",
    audioText: "部屋",
    fullAudioText: "この部屋は少し暗いです。"
  },
  {
    sentence: "どうぞよろしくお**願い**します。",
    target: "願い",
    type: "input",
    correctText: "negai",
    explanation: "願い (negai) xuất phát từ động từ 求める/願う. Cụm từ: 'Rất mong nhận được sự giúp đỡ của bạn.'",
    audioText: "願い",
    fullAudioText: "どうぞよろしくお願いします。"
  },
  {
    sentence: "この**携帯** điện thoại là mới.",
    target: "携帯",
    type: "input",
    correctText: "keitai",
    explanation: "携帯 (keitai) nghĩa là 'di động'. Câu hoàn chỉnh: 'Điện thoại di động này mới.'",
    audioText: "携帯",
    fullAudioText: "この携帯\n電話は新しいです。"
  },
  {
    sentence: "今日は**月曜日**です。",
    target: "月曜日",
    options: ["getsuyoubi", "kayoubi", "suiyoubi", "mokuyoubi"],
    correct: 0,
    explanation: "月曜日 (getsuyoubi) nghĩa là 'thứ Hai'. Câu hoàn chỉnh: 'Hôm nay là thứ Hai.'",
    audioText: "月曜日",
    fullAudioText: "今日は月曜日です。"
  }
];

// Kana to Romaji Mapping & Helper
const kanaToRomajiMap = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'na': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'dji', 'づ': 'dzu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  'びゃ': 'bya', 'biu': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
  
  'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
  'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
  'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
  'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
  'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
  'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
  'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
  'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
  'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
  'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
  'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
  'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
  'ダ': 'da', 'ヂ': 'dji', 'ヅ': 'dzu', 'デ': 'de', 'ド': 'do',
  'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
  'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
  'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
  'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
  'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
  'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
  'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒょ': 'hyo',
  'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
  'リャ': 'rya', 'リュ': 'ryu', 'リょ': 'ryo',
  'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
  'ジャ': 'ja', 'ジュ': 'ju', 'ジョ': 'jo',
  'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
  'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
  'ー': '-'
};

function convertKanaToRomaji(text) {
  if (!text) return '';
  let result = '';
  let i = 0;
  while (i < text.length) {
    if (i + 1 < text.length) {
      const char2 = text.substring(i, i + 2);
      if (kanaToRomajiMap[char2]) {
        result += kanaToRomajiMap[char2];
        i += 2;
        continue;
      }
    }
    const char1 = text.charAt(i);
    if (char1 === 'っ' || char1 === 'ッ') {
      if (i + 1 < text.length) {
        const nextChar = text.charAt(i + 1);
        let nextRomaji = '';
        if (i + 2 < text.length && kanaToRomajiMap[text.substring(i + 1, i + 3)]) {
          nextRomaji = kanaToRomajiMap[text.substring(i + 1, i + 3)];
        } else {
          nextRomaji = kanaToRomajiMap[nextChar] || '';
        }
        if (nextRomaji) {
          result += nextRomaji.charAt(0);
        }
      }
      i += 1;
      continue;
    }
    result += kanaToRomajiMap[char1] || char1;
    i += 1;
  }
  return result;
}

const QuizRunner = ({ userLevel }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [vocabList, setVocabList] = useState([]);
  const [alphabetRows, setAlphabetRows] = useState([]);
  const [quizMode, setQuizMode] = useState(null); // 'standard' | 'listening' | 'kana' | 'sentence' | 'time_attack' | 'write_kana' | 'weak_words' | 'auto_flashcard'
  const [generatedQuizzes, setGeneratedQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Mode settings
  const [kanaType, setKanaType] = useState('all'); // 'all' | 'hiragana' | 'katakana'
  const [questionCount, setQuestionCount] = useState(10);
  const [kanaSetupComplete, setKanaSetupComplete] = useState(false);
  const [writeContent, setWriteContent] = useState('kana'); // 'kana' | 'vocab'
  const [writeLevel, setWriteLevel] = useState('all'); // 'all' | 'N5' | 'N4' | 'N3'
  const [writeDifficulty, setWriteDifficulty] = useState('all'); // 'all' | 'easy' | 'medium' | 'hard'
  const [timeLeft, setTimeLeft] = useState(60);
  const [timeAttackActive, setTimeAttackActive] = useState(false);
  const [timeAttackLevel, setTimeAttackLevel] = useState('all'); // 'all' | 'N5' | 'N4' | 'N3'

  // Streak & Statistics states
  const [streak, setStreak] = useState(0);
  const [correctToday, setCorrectToday] = useState(0);
  const [totalToday, setTotalToday] = useState(0);

  // Auto Flashcard states
  const [flashcardSpeed, setFlashcardSpeed] = useState(3); // in seconds
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [flashcardContent, setFlashcardContent] = useState('kana'); // 'kana' | 'vocab'
  const [flashcardLevel, setFlashcardLevel] = useState('all');

  // Confetti Canvas Ref
  const confettiCanvasRef = useRef(null);
  const animationRef = useRef(null);
  const autoPlayTimerRef = useRef(null);
  // Filter quizzes by the global level
  const filteredQuizzes = quizzes.filter((q) => q.level === userLevel);
  
  const activeQuizzes = (quizMode === 'listening' || quizMode === 'kana' || quizMode === 'write_kana' || quizMode === 'sentence' || quizMode === 'time_attack' || quizMode === 'weak_words' || quizMode === 'auto_flashcard') 
    ? generatedQuizzes 
    : filteredQuizzes;

  // Load stats and streak on mount
  useEffect(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
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
    setStreak(currentStreak);

    const savedDate = localStorage.getItem('nihongo_stats_date');
    if (savedDate !== todayStr) {
      localStorage.setItem('nihongo_stats_date', todayStr);
      localStorage.setItem('nihongo_correct_today', '0');
      localStorage.setItem('nihongo_total_today', '0');
      setCorrectToday(0);
      setTotalToday(0);
    } else {
      setCorrectToday(parseInt(localStorage.getItem('nihongo_correct_today') || '0', 10));
      setTotalToday(parseInt(localStorage.getItem('nihongo_total_today') || '0', 10));
    }
  }, []);

  const updateStats = (isCorrect) => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const lastActive = localStorage.getItem('nihongo_last_active_date');
    let currentStreak = parseInt(localStorage.getItem('nihongo_streak') || '0', 10);

    if (!lastActive) {
      currentStreak = 1;
    } else if (lastActive !== todayStr) {
      const diffTime = Math.abs(new Date(todayStr) - new Date(lastActive));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    } else if (currentStreak === 0) {
      currentStreak = 1;
    }
    
    localStorage.setItem('nihongo_last_active_date', todayStr);
    localStorage.setItem('nihongo_streak', currentStreak.toString());
    setStreak(currentStreak);

    const newTotal = totalToday + 1;
    const newCorrect = correctToday + (isCorrect ? 1 : 0);
    localStorage.setItem('nihongo_stats_date', todayStr);
    localStorage.setItem('nihongo_total_today', newTotal.toString());
    localStorage.setItem('nihongo_correct_today', newCorrect.toString());
    setTotalToday(newTotal);
    setCorrectToday(newCorrect);
  };

  const addToWeakWords = (question) => {
    if (!question) return;
    const saved = localStorage.getItem('nihongo_weak_words');
    const weakList = saved ? JSON.parse(saved) : [];
    if (!weakList.some((q) => q.question === question.question)) {
      weakList.push({
        ...question,
        id: question.id || `weak_${Date.now()}_${Math.random()}`
      });
      localStorage.setItem('nihongo_weak_words', JSON.stringify(weakList));
    }
  };

  const removeFromWeakWords = (questionText) => {
    const saved = localStorage.getItem('nihongo_weak_words');
    if (!saved) return;
    let weakList = JSON.parse(saved);
    weakList = weakList.filter((q) => q.question !== questionText);
    localStorage.setItem('nihongo_weak_words', JSON.stringify(weakList));
  };

  // Load high score when level changes or mode changes
  useEffect(() => {
    const savedHighScore = localStorage.getItem(`nihongo_quiz_high_score_${userLevel}_${quizMode}`);
    setHighScore(savedHighScore ? parseInt(savedHighScore, 10) : 0);
  }, [userLevel, quizMode]);

  // Time Attack Countdown Timer
  useEffect(() => {
    let timerId = null;
    if (quizMode === 'time_attack' && timeAttackActive && timeLeft > 0 && !showResult) {
      timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (quizMode === 'time_attack' && timeAttackActive && timeLeft <= 0 && !showResult) {
      setTimeAttackActive(false);
      setShowResult(true);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [quizMode, timeAttackActive, timeLeft, showResult]);

  // Auto Flashcard playback logic
  useEffect(() => {
    if (quizMode === 'auto_flashcard' && isAutoPlaying && !showResult && activeQuizzes.length > 0) {
      autoPlayTimerRef.current = setInterval(() => {
        setIsFlipped((prev) => {
          if (!prev) {
            // First tick: flip and speak
            const currentQ = activeQuizzes[currentIdx];
            if (currentQ && currentQ.wordToSpeak) {
              speakWord(currentQ.wordToSpeak);
            }
            return true;
          } else {
            // Second tick: move next and unflip
            setIsFlipped(false);
            setCurrentIdx((idx) => {
              if (idx === activeQuizzes.length - 1) {
                return 0; // loop back
              } else {
                return idx + 1;
              }
            });
            return false;
          }
        });
      }, (flashcardSpeed * 1000) / 2); // Split speed in half: half duration hidden, half duration revealed
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [quizMode, isAutoPlaying, flashcardSpeed, activeQuizzes, currentIdx, showResult]);

  // Speak when moving to a new auto flashcard if not playing automatically
  useEffect(() => {
    if (quizMode === 'auto_flashcard' && !isAutoPlaying && activeQuizzes.length > 0) {
      const currentQ = activeQuizzes[currentIdx];
      if (currentQ && currentQ.wordToSpeak && !isFlipped) {
        speakWord(currentQ.wordToSpeak);
      }
    }
  }, [currentIdx, quizMode, isAutoPlaying]);

  useEffect(() => {
    // Pre-fetch standard quizzes, vocabularies, and alphabet rows
    Promise.all([
      fetch(`${window.API_BASE}/quizzes`).then((res) => res.json()),
      fetch(`${window.API_BASE}/vocabulary`).then((res) => res.json()),
      fetch(`${window.API_BASE}/alphabet`).then((res) => res.json()).catch(() => ({ rows: [] }))
    ])
      .then(([quizData, vocabData, alphabetData]) => {
        setQuizzes(quizData);
        setVocabList(vocabData);
        setAlphabetRows(alphabetData.rows || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải dữ liệu trắc nghiệm:', err);
        setLoading(false);
      });
  }, []);

  // Reset quiz state whenever user changes their level at Header
  useEffect(() => {
    handleRestart();
  }, [userLevel]);

  const generateListeningQuizzes = (vocabData, level) => {
    const levelVocab = vocabData.filter((v) => v.level === level);
    if (levelVocab.length === 0) return [];
    
    const shuffled = [...levelVocab].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);
    
    return selected.map((item) => {
      const type = Math.random() > 0.5 ? 'meaning' : 'reading';
      const questionText = type === 'meaning' 
        ? "Hãy nghe và chọn ý nghĩa tiếng Việt chính xác của từ vừa phát âm:" 
        : "Hãy nghe và chọn cách viết/đọc Hiragana chính xác của từ vừa phát âm:";
      
      const correctVal = type === 'meaning' ? item.meaning : item.reading;
      const otherWords = levelVocab.filter((v) => v.id !== item.id);
      const distractors = otherWords
        .map((w) => (type === 'meaning' ? w.meaning : w.reading))
        .filter((val, index, self) => self.indexOf(val) === index)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      while (distractors.length < 3) {
        distractors.push(type === 'meaning' ? "Từ ngẫu nhiên" : "ながれ");
      }
      
      const options = [correctVal, ...distractors].sort(() => Math.random() - 0.5);
      const correctIdx = options.indexOf(correctVal);
      
      return {
        id: `listening_${item.id}`,
        question: questionText,
        wordToSpeak: item.word,
        options: options,
        correct: correctIdx,
        explanation: `Từ vừa phát âm là 「${item.word}」 (${item.reading}) nghĩa là "${item.meaning}".`,
        category: "Luyện nghe",
        level: level
      };
    });
  };

  const generateKanaQuizzes = (rows, type = 'all', count = 10, qType = 'choice') => {
    if (!rows || rows.length === 0) return [];
    
    const charsList = [];
    rows.forEach((row) => {
      row.hiragana.forEach((hVal, colIndex) => {
        const kVal = row.katakana[colIndex];
        const romajiVal = row.romaji[colIndex];
        if (hVal !== '') {
          charsList.push({ hVal, kVal, romajiVal });
        }
      });
    });
    
    if (charsList.length === 0) return [];
    
    const shuffled = [...charsList].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    
    return selected.map((charObj) => {
      let isHiragana = true;
      if (type === 'hiragana') isHiragana = true;
      else if (type === 'katakana') isHiragana = false;
      else isHiragana = Math.random() > 0.5;

      const char = isHiragana ? charObj.hVal : charObj.kVal;
      const typeStr = isHiragana ? 'Hiragana' : 'Katakana';
      
      const questionText = qType === 'input'
        ? `Viết phiên âm (Romaji) chính xác của chữ ${typeStr} sau: 「${char}」`
        : `Chọn phiên âm (Romaji) chính xác của chữ ${typeStr} sau: 「${char}」`;
        
      const correctVal = charObj.romajiVal;
      
      if (qType === 'input') {
        return {
          id: `kana_${char}`,
          type: 'input',
          question: questionText,
          correctText: correctVal,
          explanation: `Chữ ${typeStr} 「${char}」 có phiên âm Romaji chính xác là "${correctVal}".`,
          category: "Bảng chữ cái",
          wordToSpeak: char,
          audioText: char,
          fullAudioText: char
        };
      }

      const otherRomajis = charsList
        .map((c) => c.romajiVal)
        .filter((r) => r !== correctVal && r !== '');
      
      const distractors = [...new Set(otherRomajis)]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      const options = [correctVal, ...distractors].sort(() => Math.random() - 0.5);
      const correctIdx = options.indexOf(correctVal);
      
      return {
        id: `kana_${char}`,
        type: 'choice',
        question: questionText,
        options: options,
        correct: correctIdx,
        explanation: `Chữ ${typeStr} 「${char}」 có phiên âm Romaji chính xác là "${correctVal}".`,
        category: "Bảng chữ cái",
        wordToSpeak: char
      };
    });
  };

  const generateVocabWriteQuizzes = (vocabData, level, difficulty, count) => {
    let pool = [...vocabData];
    if (level !== 'all') {
      pool = pool.filter((v) => v.level === level);
    }
    if (difficulty !== 'all') {
      pool = pool.filter((v) => {
        const len = v.word.length;
        if (difficulty === 'easy') return len <= 2;
        if (difficulty === 'medium') return len > 2 && len <= 4;
        return len > 4;
      });
    }
    if (pool.length === 0) return [];
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count);
    return shuffled.map((v) => {
      const romajiText = convertKanaToRomaji(v.reading);
      return {
        id: `write_vocab_${v.id}`,
        type: 'input',
        question: `Viết phiên âm Romaji của từ sau: 「${v.word}」 (${v.meaning})`,
        correctText: romajiText,
        explanation: `Từ 「${v.word}」 đọc là 「${v.reading}」 (Romaji: ${romajiText}). Nghĩa là: ${v.meaning}.`,
        wordToSpeak: v.word,
        audioText: v.word,
        fullAudioText: v.word,
        category: "Tự viết Phiên âm"
      };
    });
  };

  const generateAutoFlashcards = (rows, vocabData, contentMode, level, count = 20) => {
    if (contentMode === 'kana') {
      if (!rows || rows.length === 0) return [];
      const charsList = [];
      rows.forEach((row) => {
        row.hiragana.forEach((hVal, colIndex) => {
          const kVal = row.katakana[colIndex];
          const romajiVal = row.romaji[colIndex];
          if (hVal !== '') {
            charsList.push({ hVal, kVal, romajiVal });
          }
        });
      });
      const shuffled = [...charsList].sort(() => Math.random() - 0.5).slice(0, count);
      return shuffled.map((charObj) => {
        const isHiragana = Math.random() > 0.5;
        const char = isHiragana ? charObj.hVal : charObj.kVal;
        const typeStr = isHiragana ? 'Hiragana' : 'Katakana';
        return {
          id: `fc_kana_${char}`,
          word: char,
          reading: charObj.romajiVal,
          meaning: `Chữ ${typeStr}`,
          wordToSpeak: char
        };
      });
    } else {
      let pool = [...vocabData];
      if (level !== 'all') {
        pool = pool.filter((v) => v.level === level);
      }
      if (pool.length === 0) return [];
      const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count);
      return shuffled.map((v) => ({
        id: `fc_vocab_${v.id}`,
        word: v.word,
        reading: v.reading,
        meaning: v.meaning,
        wordToSpeak: v.word
      }));
    }
  };

  const speakWord = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.75;
      
      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(v => v.lang === 'ja-JP' || v.lang.startsWith('ja'));
      if (jaVoice) {
        utterance.voice = jaVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speak automatically when in listening mode and a new question appears
  useEffect(() => {
    if (quizMode === 'listening' && !showResult && activeQuizzes.length > 0) {
      const currentQ = activeQuizzes[currentIdx];
      if (currentQ && currentQ.wordToSpeak) {
        const timer = setTimeout(() => {
          speakWord(currentQ.wordToSpeak);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIdx, quizMode, showResult, generatedQuizzes]);

  // Trigger Confetti and update high score when results page shows
  useEffect(() => {
    if (showResult) {
      setTimeAttackActive(false);
      setIsAutoPlaying(false);
      const currentSaved = localStorage.getItem(`nihongo_quiz_high_score_${userLevel}_${quizMode}`);
      const currentHighScore = currentSaved ? parseInt(currentSaved, 10) : 0;
      if (score > currentHighScore) {
        localStorage.setItem(`nihongo_quiz_high_score_${userLevel}_${quizMode}`, score.toString());
        setIsNewRecord(true);
        setHighScore(score);
        if (score > 0) {
          startConfetti();
        }
      } else {
        setIsNewRecord(false);
      }

      if (quizMode !== 'time_attack' && quizMode !== 'weak_words' && score === activeQuizzes.length && activeQuizzes.length > 0) {
        startConfetti();
      }
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showResult]);

  const startConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#fecdd3', '#fde047', '#86efac', '#93c5fd', '#c084fc', '#fda4af', '#a5f3fc'];
    const particles = [];
    
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height - 20,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 5 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 6 - 3,
      });
    }

    let frameCount = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allOutOfScreen = true;
      
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y / 30) * 0.5;
        p.rotation += p.rotationSpeed;

        if (p.y < canvas.height) {
          allOutOfScreen = false;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      frameCount++;
      
      if (frameCount < 350 && !allOutOfScreen) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animate();
  };

  const handleSelectOption = (optIdx) => {
    if (hasAnswered) return;
    setSelectedOpt(optIdx);
    setHasAnswered(true);

    const question = activeQuizzes[currentIdx];
    const isCorrect = optIdx === question.correct;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      updateStats(true);
      if (quizMode === 'weak_words') {
        removeFromWeakWords(question.question);
      }
      
      // Pronounce when answered correctly!
      if (quizMode === 'kana' && question.wordToSpeak) {
        speakWord(question.wordToSpeak);
      } else if (quizMode === 'sentence') {
        speakWord(question.audioText);
        setTimeout(() => {
          speakWord(question.fullAudioText);
        }, 1200);
      } else if (question.wordToSpeak) {
        speakWord(question.wordToSpeak);
      }

      if (quizMode === 'time_attack') {
        setTimeLeft((prev) => prev + 2);
        setTimeout(() => {
          setHasAnswered(false);
          setSelectedOpt(null);
          if (currentIdx === activeQuizzes.length - 1) {
            const shuffled = [...activeQuizzes].sort(() => Math.random() - 0.5);
            setGeneratedQuizzes(shuffled);
            setCurrentIdx(0);
          } else {
            setCurrentIdx((prev) => prev + 1);
          }
        }, 250);
      }
    } else {
      updateStats(false);
      addToWeakWords(question);
      if (quizMode === 'time_attack') {
        setTimeLeft((prev) => Math.max(0, prev - 5));
        setTimeout(() => {
          setHasAnswered(false);
          setSelectedOpt(null);
          if (currentIdx === activeQuizzes.length - 1) {
            const shuffled = [...activeQuizzes].sort(() => Math.random() - 0.5);
            setGeneratedQuizzes(shuffled);
            setCurrentIdx(0);
          } else {
            setCurrentIdx((prev) => prev + 1);
          }
        }, 600);
      }
    }
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (hasAnswered) return;

    setHasAnswered(true);
    const question = activeQuizzes[currentIdx];
    const isCorrect = inputValue.trim().toLowerCase() === question.correctText.toLowerCase();

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setSelectedOpt('correct');
      updateStats(true);
      if (quizMode === 'weak_words') {
        removeFromWeakWords(question.question);
      }

      // Pronounce when answered correctly!
      speakWord(question.audioText);
      setTimeout(() => {
        speakWord(question.fullAudioText);
      }, 1200);

      if (quizMode === 'time_attack') {
        setTimeLeft((prev) => prev + 2);
        setTimeout(() => {
          setHasAnswered(false);
          setSelectedOpt(null);
          setInputValue('');
          if (currentIdx === activeQuizzes.length - 1) {
            const shuffled = [...activeQuizzes].sort(() => Math.random() - 0.5);
            setGeneratedQuizzes(shuffled);
            setCurrentIdx(0);
          } else {
            setCurrentIdx((prev) => prev + 1);
          }
        }, 250);
      }
    } else {
      setSelectedOpt('incorrect');
      updateStats(false);
      addToWeakWords(question);

      if (quizMode === 'time_attack') {
        setTimeLeft((prev) => Math.max(0, prev - 5));
        setTimeout(() => {
          setHasAnswered(false);
          setSelectedOpt(null);
          setInputValue('');
          if (currentIdx === activeQuizzes.length - 1) {
            const shuffled = [...activeQuizzes].sort(() => Math.random() - 0.5);
            setGeneratedQuizzes(shuffled);
            setCurrentIdx(0);
          } else {
            setCurrentIdx((prev) => prev + 1);
          }
        }, 600);
      }
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setHasAnswered(false);
    setInputValue('');
    if (currentIdx === activeQuizzes.length - 1) {
      setShowResult(true);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }
    setCurrentIdx(0);
    setScore(0);
    setSelectedOpt(null);
    setHasAnswered(false);
    setInputValue('');
    setShowResult(false);
    setIsNewRecord(false);
    setIsFlipped(false);
    setIsAutoPlaying(false);

    if (quizMode === 'listening') {
      const generated = generateListeningQuizzes(vocabList, userLevel);
      setGeneratedQuizzes(generated);
    } else if (quizMode === 'kana') {
      const generated = generateKanaQuizzes(alphabetRows, kanaType, questionCount, 'choice');
      setGeneratedQuizzes(generated);
      setKanaSetupComplete(true);
    } else if (quizMode === 'write_kana') {
      if (writeContent === 'vocab') {
        const generated = generateVocabWriteQuizzes(vocabList, writeLevel, writeDifficulty, questionCount);
        setGeneratedQuizzes(generated);
      } else {
        const generated = generateKanaQuizzes(alphabetRows, 'all', questionCount, 'input');
        setGeneratedQuizzes(generated);
      }
      setKanaSetupComplete(true);
    } else if (quizMode === 'sentence') {
      const shuffled = [...SENTENCE_QUIZZES].sort(() => Math.random() - 0.5);
      setGeneratedQuizzes(shuffled.slice(0, 10));
    } else if (quizMode === 'time_attack') {
      let pool = [...quizzes];
      if (timeAttackLevel !== 'all') {
        pool = pool.filter((q) => q.level === timeAttackLevel);
      }
      if (pool.length > 0) {
        const shuffled = pool.sort(() => Math.random() - 0.5);
        setGeneratedQuizzes(shuffled);
        setTimeLeft(60);
        setTimeAttackActive(true);
        setKanaSetupComplete(true);
      }
    } else if (quizMode === 'weak_words') {
      const saved = localStorage.getItem('nihongo_weak_words');
      const weakList = saved ? JSON.parse(saved) : [];
      setGeneratedQuizzes(weakList);
      setKanaSetupComplete(true);
    } else if (quizMode === 'auto_flashcard') {
      const generated = generateAutoFlashcards(alphabetRows, vocabList, flashcardContent, flashcardLevel, 20);
      setGeneratedQuizzes(generated);
      setKanaSetupComplete(true);
    }
  };

  const handleSelectMode = (mode) => {
    setQuizMode(mode);
    setKanaSetupComplete(false);
    
    if (mode === 'standard') {
      setCurrentIdx(0);
      setScore(0);
      setSelectedOpt(null);
      setHasAnswered(false);
      setInputValue('');
      setShowResult(false);
      setIsNewRecord(false);
    } else if (mode === 'listening') {
      const generated = generateListeningQuizzes(vocabList, userLevel);
      setGeneratedQuizzes(generated);
      setCurrentIdx(0);
      setScore(0);
      setSelectedOpt(null);
      setHasAnswered(false);
      setInputValue('');
      setShowResult(false);
      setIsNewRecord(false);
    } else if (mode === 'sentence') {
      const shuffled = [...SENTENCE_QUIZZES].sort(() => Math.random() - 0.5);
      setGeneratedQuizzes(shuffled.slice(0, 10));
      setCurrentIdx(0);
      setScore(0);
      setSelectedOpt(null);
      setHasAnswered(false);
      setInputValue('');
      setShowResult(false);
      setIsNewRecord(false);
    }
  };

  const handleBackToModes = () => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
    }
    setQuizMode(null);
    setIsAutoPlaying(false);
    setIsFlipped(false);
    handleRestart();
  };

  const getResultMessage = () => {
    if (quizMode === 'time_attack') {
      if (score >= 30) {
        return {
          icon: 'trophy',
          title: 'KỶ LỤC GIA PHẢN XẠ!',
          desc: `Bạn có tốc độ phản xạ đáng kinh ngạc với ${score} câu trả lời đúng!`,
        };
      } else if (score >= 15) {
        return {
          icon: 'award',
          title: 'KẾT QUẢ RẤT TỐT!',
          desc: `Bạn đã trả lời đúng ${score} câu. Hãy tiếp tục luyện tập để nhanh hơn nữa nhé!`,
        };
      } else {
        return {
          icon: 'sparkles',
          title: 'CỐ GẮNG HƠN NỮA!',
          desc: `Bạn đã trả lời đúng ${score} câu. Luyện tập nhiều lần sẽ giúp phản xạ nhanh hơn!`,
        };
      }
    }

    if (quizMode === 'weak_words') {
      return {
        icon: 'trophy',
        title: 'HOÀN THÀNH ÔN TẬP!',
        desc: `Bạn đã ôn tập xong các từ vựng yếu. Bạn trả lời đúng ${score}/${activeQuizzes.length} từ!`,
      };
    }

    const percentage = activeQuizzes.length > 0 ? (score / activeQuizzes.length) * 100 : 0;
    if (percentage === 100) {
      return {
        icon: 'trophy',
        title: 'TUYỆT ĐỈNH VÔ SONG!',
        desc: 'Bạn đã trả lời đúng hoàn toàn tất cả câu hỏi! Hãy tiếp tục duy trì phong độ này nhé!',
      };
    } else if (percentage >= 70) {
      return {
        icon: 'award',
        title: 'XUẤT SẮC QUÁ!',
        desc: 'Bạn chỉ còn một chút nữa là đạt điểm tuyệt đối rồi. Tiếp tục phát huy nhé!',
      };
    } else {
      return {
        icon: 'sparkles',
        title: 'CỐ GẮNG LÊN NÀO!',
        desc: 'Đừng nản chí nhé! Hãy xem lại các cấu trúc đã học và thử lại một lần nữa nhé!',
      };
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Đang tải câu hỏi...</div>;
  }

  const resMsg = getResultMessage();

  // Render Mode Selection Screen
  if (quizMode === null) {
    return (
      <div className="quiz-container">

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontWeight: 800 }}>Luyện tập & Phản xạ</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Chọn chế độ học phù hợp để rèn luyện tiếng Nhật mỗi ngày.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {/* Card Mode 1: Standard */}
          <div className="card mode-selection-card" onClick={() => handleSelectMode('standard')} style={{
            padding: '2rem',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            transition: 'all 0.2s ease'
          }}>
            <BookOpen size={40} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Trắc nghiệm Tổng hợp</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Kiểm tra ngữ pháp, từ vựng và chữ Hán bằng bộ câu hỏi trắc nghiệm chuẩn JLPT {userLevel}.
            </p>
            <button className="btn btn-secondary" style={{ marginTop: 'auto', pointerEvents: 'none' }}>Bắt đầu học</button>
          </div>

          {/* Card Mode 2: Listening */}
          <div className="card mode-selection-card" onClick={() => handleSelectMode('listening')} style={{
            padding: '2rem',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            transition: 'all 0.2s ease'
          }}>
            <Headphones size={40} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Luyện nghe Trắc nghiệm</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Nghe âm thanh phát âm và chọn ý nghĩa tiếng Việt hoặc chữ viết phù hợp của từ vựng {userLevel}.
            </p>
            <button className="btn btn-secondary" style={{ marginTop: 'auto', pointerEvents: 'none' }}>Bắt đầu nghe</button>
          </div>

          {/* Card Mode 3: Alphabet Choice */}
          <div className="card mode-selection-card" onClick={() => handleSelectMode('kana')} style={{
            padding: '2rem',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            transition: 'all 0.2s ease'
          }}>
            <Type size={40} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Trắc nghiệm Bảng chữ</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Luyện chọn nhanh Romaji phiên âm cho các chữ cái Hiragana & Katakana.
            </p>
            <button className="btn btn-secondary" style={{ marginTop: 'auto', pointerEvents: 'none' }}>Thực hành ngay</button>
          </div>

          {/* Card Mode 4: Write Romaji */}
          <div className="card mode-selection-card" onClick={() => handleSelectMode('write_kana')} style={{
            padding: '2rem',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            transition: 'all 0.2s ease'
          }}>
            <PenTool size={40} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Tự viết Phiên âm</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Chế độ tự nhập câu trả lời Romaji trực tiếp để kiểm tra khả năng ghi nhớ viết từ.
            </p>
            <button className="btn btn-secondary" style={{ marginTop: 'auto', pointerEvents: 'none' }}>Thử sức ngay</button>
          </div>

          {/* Card Mode 5: Sentence Quiz */}
          <div className="card mode-selection-card" onClick={() => handleSelectMode('sentence')} style={{
            padding: '2rem',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            transition: 'all 0.2s ease'
          }}>
            <Languages size={40} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Phiên âm trong Câu</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Tìm từ vựng thích hợp hoặc nhập phiên âm Romaji của từ được bôi đậm trong câu.
            </p>
            <button className="btn btn-secondary" style={{ marginTop: 'auto', pointerEvents: 'none' }}>Luyện câu</button>
          </div>

          {/* Card Mode 6: Time Attack */}
          <div className="card mode-selection-card" onClick={() => handleSelectMode('time_attack')} style={{
            padding: '2rem',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            transition: 'all 0.2s ease'
          }}>
            <Timer size={40} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Thử thách Phản xạ</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Chạy đua với 60 giây. Trả lời đúng cộng 2 giây, trả lời sai trừ 5 giây. Không giới hạn số câu.
            </p>
            <button className="btn btn-secondary" style={{ marginTop: 'auto', pointerEvents: 'none' }}>Đua thời gian</button>
          </div>

          {/* Card Mode 7: Weak Words */}
          <div className="card mode-selection-card" onClick={() => handleSelectMode('weak_words')} style={{
            padding: '2rem',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            transition: 'all 0.2s ease'
          }}>
            <Inbox size={40} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Sổ tay Từ yếu</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Ôn tập riêng các từ vựng bạn đã từng làm sai. Trả lời đúng 1 lần sẽ tự xóa khỏi danh sách.
            </p>
            <button className="btn btn-secondary" style={{ marginTop: 'auto', pointerEvents: 'none' }}>Xem sổ tay</button>
          </div>

          {/* Card Mode 8: Auto Flashcard */}
          <div className="card mode-selection-card" onClick={() => handleSelectMode('auto_flashcard')} style={{
            padding: '2rem',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            transition: 'all 0.2s ease'
          }}>
            <Sparkles size={40} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Flashcard Tự động</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Chế độ phát thẻ tự lật & phát giọng âm tiếng Nhật rảnh tay với tốc độ có thể tùy chỉnh.
            </p>
            <button className="btn btn-secondary" style={{ marginTop: 'auto', pointerEvents: 'none' }}>Chạy tự động</button>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty state for the active mode (before setup)
  if (activeQuizzes.length === 0 && quizMode !== 'kana' && quizMode !== 'write_kana' && quizMode !== 'time_attack' && quizMode !== 'weak_words' && quizMode !== 'auto_flashcard') {
    return (
      <div className="quiz-container">
        <button className="btn btn-secondary" onClick={handleBackToModes} style={{ marginBottom: '1.5rem' }}>
          ← Chọn chế độ khác
        </button>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
          <Inbox size={48} strokeWidth={1.5} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
          <h3 style={{ marginTop: '1rem' }}>Chưa có câu hỏi cho cấp độ này</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Hiện tại chưa có câu hỏi nào được cập nhật cho trình độ {userLevel} ở chế độ này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      {/* Confetti canvas (only active on perfect score screen) */}
      {showResult && score === activeQuizzes.length && activeQuizzes.length > 0 && (
        <canvas ref={confettiCanvasRef} className="confetti-canvas" style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', width: '100%', height: '100%', zIndex: 999 }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontWeight: 800 }}>
            {quizMode === 'listening' && 'Luyện nghe Trắc nghiệm'}
            {quizMode === 'standard' && 'Luyện tập Trắc nghiệm'}
            {quizMode === 'kana' && 'Trắc nghiệm Bảng chữ cái'}
            {quizMode === 'write_kana' && 'Tự viết Phiên âm Romaji'}
            {quizMode === 'sentence' && 'Trắc nghiệm Phiên âm Câu'}
            {quizMode === 'time_attack' && 'Thử thách Phản xạ'}
            {quizMode === 'weak_words' && 'Ôn tập Sổ tay Từ yếu'}
            {quizMode === 'auto_flashcard' && 'Flashcard Tự động'}
          </h1>
        </div>
        <button className="btn btn-secondary" onClick={handleBackToModes}>
          Quay lại chế độ
        </button>
      </div>

      <div className="quiz-card">
        {/* 1. SETUP CARDS FOR MODES */}
        
        {/* Kana Choice Setup Card */}
        {quizMode === 'kana' && !kanaSetupComplete && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Cấu hình luyện tập Bảng chữ cái</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Bảng chữ cái:</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className={`btn ${kanaType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setKanaType('all')}
                >
                  Tất cả
                </button>
                <button 
                  className={`btn ${kanaType === 'hiragana' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setKanaType('hiragana')}
                >
                  Hiragana
                </button>
                <button 
                  className={`btn ${kanaType === 'katakana' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setKanaType('katakana')}
                >
                  Katakana
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Số lượng câu hỏi:</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    className={`btn ${questionCount === num ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setQuestionCount(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => {
                const generated = generateKanaQuizzes(alphabetRows, kanaType, questionCount, 'choice');
                if (generated.length === 0) {
                  alert("Không tải được bảng chữ cái!");
                  return;
                }
                setGeneratedQuizzes(generated);
                setKanaSetupComplete(true);
                setCurrentIdx(0);
                setScore(0);
                setSelectedOpt(null);
                setHasAnswered(false);
                setShowResult(false);
                setIsNewRecord(false);
              }}
            >
              Bắt đầu luyện tập
            </button>
          </div>
        )}

        {/* Write Romaji Setup Card */}
        {quizMode === 'write_kana' && !kanaSetupComplete && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Cấu hình tự viết Phiên âm</h2>
            
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Nội dung ôn tập:</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className={`btn ${writeContent === 'kana' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setWriteContent('kana')}
                >
                  Bảng chữ cái
                </button>
                <button 
                  className={`btn ${writeContent === 'vocab' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setWriteContent('vocab')}
                >
                  Từ vựng bản xứ
                </button>
              </div>
            </div>

            {writeContent === 'vocab' && (
              <>
                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Cấp độ JLPT:</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['all', 'N5', 'N4', 'N3'].map((lvl) => (
                      <button
                        key={lvl}
                        className={`btn ${writeLevel === lvl ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setWriteLevel(lvl)}
                      >
                        {lvl === 'all' ? 'Tất cả' : lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Độ dài của từ:</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className={`btn ${writeDifficulty === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setWriteDifficulty('all')}
                    >
                      Mọi độ dài
                    </button>
                    <button 
                      className={`btn ${writeDifficulty === 'easy' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setWriteDifficulty('easy')}
                    >
                      {"Từ ngắn (≤2 ký tự)"}
                    </button>
                    <button 
                      className={`btn ${writeDifficulty === 'medium' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setWriteDifficulty('medium')}
                    >
                      Từ vừa (3-4 ký tự)
                    </button>
                    <button 
                      className={`btn ${writeDifficulty === 'hard' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setWriteDifficulty('hard')}
                    >
                      {"Từ dài (>4 ký tự)"}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Số lượng câu hỏi:</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    className={`btn ${questionCount === num ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setQuestionCount(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => {
                let generated = [];
                if (writeContent === 'vocab') {
                  generated = generateVocabWriteQuizzes(vocabList, writeLevel, writeDifficulty, questionCount);
                } else {
                  generated = generateKanaQuizzes(alphabetRows, 'all', questionCount, 'input');
                }

                if (generated.length === 0) {
                  alert("Không tìm thấy từ vựng nào khớp với cấu hình lựa chọn của bạn!");
                  return;
                }

                setGeneratedQuizzes(generated);
                setKanaSetupComplete(true);
                setCurrentIdx(0);
                setScore(0);
                setSelectedOpt(null);
                setHasAnswered(false);
                setInputValue('');
                setShowResult(false);
                setIsNewRecord(false);
              }}
            >
              Bắt đầu kiểm tra
            </button>
          </div>
        )}

        {/* Time Attack Setup Card */}
        {quizMode === 'time_attack' && !kanaSetupComplete && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Cấu hình Thử thách Phản xạ</h2>
            
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Trình độ từ vựng:</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['all', 'N5', 'N4', 'N3'].map((lvl) => (
                  <button
                    key={lvl}
                    className={`btn ${timeAttackLevel === lvl ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTimeAttackLevel(lvl)}
                  >
                    {lvl === 'all' ? 'Tất cả' : lvl}
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => {
                let pool = [...quizzes];
                if (timeAttackLevel !== 'all') {
                  pool = pool.filter((q) => q.level === timeAttackLevel);
                }

                if (pool.length === 0) {
                  alert("Không tìm thấy câu hỏi nào cho cấp độ này!");
                  return;
                }

                const shuffled = pool.sort(() => Math.random() - 0.5);
                setGeneratedQuizzes(shuffled);
                setTimeLeft(60);
                setTimeAttackActive(true);
                setKanaSetupComplete(true);
                setCurrentIdx(0);
                setScore(0);
                setSelectedOpt(null);
                setHasAnswered(false);
                setInputValue('');
                setShowResult(false);
                setIsNewRecord(false);
              }}
            >
              Bắt đầu thử thách (60 giây)
            </button>
          </div>
        )}

        {/* Weak Words Setup Card */}
        {quizMode === 'weak_words' && !kanaSetupComplete && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Sổ tay Ôn tập Từ yếu</h2>
            
            {(() => {
              const saved = localStorage.getItem('nihongo_weak_words');
              const weakList = saved ? JSON.parse(saved) : [];
              if (weakList.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    <Inbox size={48} style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }} />
                    <p style={{ fontWeight: 600 }}>Tuyệt vời! Bạn không có từ vựng yếu nào trong danh sách.</p>
                    <p style={{ fontSize: '0.85rem' }}>Hãy tiếp tục làm trắc nghiệm, các từ bạn trả lời sai sẽ được ghi lại ở đây.</p>
                  </div>
                );
              }

              return (
                <div>
                  <p style={{ marginBottom: '1.5rem' }}>
                    Hiện bạn có <strong style={{ color: '#ef4444' }}>{weakList.length}</strong> câu hỏi đã từng trả lời sai trong hệ thống.
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setGeneratedQuizzes(weakList);
                      setKanaSetupComplete(true);
                      setCurrentIdx(0);
                      setScore(0);
                      setSelectedOpt(null);
                      setHasAnswered(false);
                      setInputValue('');
                      setShowResult(false);
                      setIsNewRecord(false);
                    }}
                  >
                    Bắt đầu ôn tập ({weakList.length} câu)
                  </button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Auto Flashcard Setup Card */}
        {quizMode === 'auto_flashcard' && !kanaSetupComplete && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Cấu hình Flashcard Tự động</h2>
            
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Nội dung ôn:</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className={`btn ${flashcardContent === 'kana' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFlashcardContent('kana')}
                >
                  Bảng chữ cái
                </button>
                <button 
                  className={`btn ${flashcardContent === 'vocab' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFlashcardContent('vocab')}
                >
                  Từ vựng bản xứ
                </button>
              </div>
            </div>

            {flashcardContent === 'vocab' && (
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Cấp độ JLPT:</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['all', 'N5', 'N4', 'N3'].map((lvl) => (
                    <button
                      key={lvl}
                      className={`btn ${flashcardLevel === lvl ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setFlashcardLevel(lvl)}
                    >
                      {lvl === 'all' ? 'Tất cả' : lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Tốc độ lật thẻ:</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {[2, 3, 5].map((s) => (
                  <button
                    key={s}
                    className={`btn ${flashcardSpeed === s ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFlashcardSpeed(s)}
                  >
                    {s} giây
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="btn btn-primary"
              onClick={() => {
                const generated = generateAutoFlashcards(alphabetRows, vocabList, flashcardContent, flashcardLevel, 20);
                if (generated.length === 0) {
                  alert("Không có dữ liệu phù hợp với cấu hình của bạn!");
                  return;
                }
                setGeneratedQuizzes(generated);
                setKanaSetupComplete(true);
                setCurrentIdx(0);
                setIsFlipped(false);
                setIsAutoPlaying(true);
                setShowResult(false);
              }}
            >
              Bắt đầu phát tự động
            </button>
          </div>
        )}

        {/* 2. PLAYING PANEL (QUIZ SCREEN OR FLASHCARD SCREEN) */}
        
        {/* Render Auto Flashcard Play Mode */}
        {quizMode === 'auto_flashcard' && kanaSetupComplete && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <span>Thẻ {currentIdx + 1} / {activeQuizzes.length}</span>
              <span>Tốc độ: {flashcardSpeed}s</span>
            </div>

            {/* Flashcard Frame */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              style={{
                minHeight: '260px',
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                marginBottom: '1.5rem',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Front of card */}
              {!isFlipped ? (
                <div>
                  <div style={{ fontSize: '4.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {activeQuizzes[currentIdx]?.word}
                  </div>
                  <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Chạm để xem phiên âm & nghĩa
                  </div>
                </div>
              ) : (
                /* Back of card */
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    {activeQuizzes[currentIdx]?.reading}
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {activeQuizzes[currentIdx]?.meaning}
                  </div>
                  <div style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Chạm để quay lại chữ gốc
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIdx((idx) => (idx === 0 ? activeQuizzes.length - 1 : idx - 1));
                }}
              >
                Trước
              </button>

              <button 
                className="btn btn-primary"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isAutoPlaying ? <Pause size={18} /> : <Play size={18} />}
                {isAutoPlaying ? 'Tạm dừng' : 'Tự chạy'}
              </button>

              <button 
                className="btn btn-secondary"
                onClick={() => {
                  const currentQ = activeQuizzes[currentIdx];
                  if (currentQ && currentQ.wordToSpeak) {
                    speakWord(currentQ.wordToSpeak);
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Volume2 size={18} />
                Đọc âm
              </button>

              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIdx((idx) => (idx === activeQuizzes.length - 1 ? 0 : idx + 1));
                }}
              >
                Tiếp theo
              </button>
            </div>
          </div>
        )}

        {/* Render Standard Quiz / Time Attack / Weak Words playing view */}
        {quizMode !== 'auto_flashcard' && kanaSetupComplete && (!showResult ? (
          <div>
            {/* Progress metrics */}
            <div className="quiz-progress" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>
                {quizMode === 'time_attack' ? `Đúng: ${score} câu` : `Câu hỏi ${currentIdx + 1} / ${activeQuizzes.length}`}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {quizMode === 'time_attack' ? `Kỷ lục chế độ: ${highScore} câu` : `Kỷ lục: ${highScore} / ${activeQuizzes.length}`}
              </span>
              {quizMode === 'time_attack' && (
                <span style={{ fontWeight: 600, color: timeLeft <= 10 ? '#ef4444' : 'var(--primary)' }}>
                  Thời gian: {timeLeft}s
                </span>
              )}
              {quizMode !== 'kana' && quizMode !== 'sentence' && quizMode !== 'time_attack' && quizMode !== 'weak_words' && (
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Cấp độ: {userLevel}</span>
              )}
            </div>

            {/* Flat Solid Time Attack Progress Bar */}
            {quizMode === 'time_attack' && (
              <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.5rem', marginBottom: '1rem' }}>
                <div style={{
                  width: `${Math.min(100, (timeLeft / 60) * 100)}%`,
                  height: '100%',
                  backgroundColor: timeLeft <= 10 ? '#ef4444' : 'var(--primary)',
                  transition: 'width 0.2s linear'
                }} />
              </div>
            )}

            {/* Sentence highlights */}
            {quizMode === 'sentence' ? (
              <div style={{ margin: '1.5rem 0', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <span 
                  dangerouslySetInnerHTML={{ 
                    __html: activeQuizzes[currentIdx]?.sentence.replace(
                      /\*\*(.*?)\*\*/g, 
                      `<span class="sentence-highlight" style="color: var(--primary); text-decoration: underline; font-weight: 700; cursor: pointer;">$1</span>`
                    ) 
                  }}
                  onClick={(e) => {
                    if (e.target.classList.contains('sentence-highlight')) {
                      speakWord(activeQuizzes[currentIdx]?.audioText);
                    }
                  }}
                />
              </div>
            ) : (
              /* Question text */
              <h2 style={{ fontSize: '1.25rem', margin: '1.5rem 0', lineHeight: 1.5 }}>
                {activeQuizzes[currentIdx]?.question}
              </h2>
            )}

            {/* Audio Button for Listening Quizzes */}
            {activeQuizzes[currentIdx]?.wordToSpeak && quizMode === 'listening' && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
                <button
                  className="btn"
                  onClick={() => speakWord(activeQuizzes[currentIdx]?.wordToSpeak)}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  title="Phát lại âm thanh"
                >
                  <Volume2 size={32} />
                </button>
              </div>
            )}

            {/* Input or Options Buttons rendering */}
            {activeQuizzes[currentIdx]?.type === 'input' ? (
              <form onSubmit={handleInputSubmit} style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1.2rem' }}>
                  <input
                    type="text"
                    placeholder="Nhập phiên âm Romaji của từ được tô màu..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={hasAnswered}
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem',
                      fontSize: '1rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: 'var(--border-radius)',
                      outline: 'none',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                    required
                  />
                </div>
                {!hasAnswered && (
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Kiểm tra đáp án
                  </button>
                )}
              </form>
            ) : (
              <div className="quiz-options">
                {activeQuizzes[currentIdx]?.options.map((option, i) => {
                  let btnClass = 'quiz-option';
                  if (hasAnswered) {
                    if (i === activeQuizzes[currentIdx].correct) {
                      btnClass += ' correct';
                    } else if (selectedOpt === i) {
                      btnClass += ' incorrect';
                    }
                  }

                  return (
                    <button
                      key={i}
                      className={btnClass}
                      onClick={() => handleSelectOption(i)}
                      disabled={hasAnswered}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        marginBottom: '0.75rem',
                        textAlign: 'left',
                        fontSize: '1rem',
                        fontWeight: '600',
                        borderRadius: 'var(--border-radius)',
                        border: '2px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        cursor: hasAnswered ? 'default' : 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Answer Feedbacks */}
            {hasAnswered && (
              <div
                className={`quiz-feedback show ${
                  (selectedOpt === activeQuizzes[currentIdx].correct || selectedOpt === 'correct') ? 'correct' : 'incorrect'
                }`}
                style={{
                  padding: '1.25rem',
                  borderRadius: 'var(--border-radius)',
                  marginTop: '1.5rem',
                  backgroundColor: (selectedOpt === activeQuizzes[currentIdx].correct || selectedOpt === 'correct') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${(selectedOpt === activeQuizzes[currentIdx].correct || selectedOpt === 'correct') ? '#10b981' : '#ef4444'}`,
                  color: (selectedOpt === activeQuizzes[currentIdx].correct || selectedOpt === 'correct') ? '#10b981' : '#ef4444'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  {(selectedOpt === activeQuizzes[currentIdx].correct || selectedOpt === 'correct') ? 'Chính xác rồi!' : 'Chưa đúng mất rồi'}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {activeQuizzes[currentIdx].type === 'input' && (
                    <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
                      Đáp án đúng: <span style={{ color: '#10b981' }}>{activeQuizzes[currentIdx].correctText}</span>
                    </div>
                  )}
                  {activeQuizzes[currentIdx].explanation}
                </div>
              </div>
            )}

            <div className="quiz-footer" style={{ marginTop: '1.5rem', minHeight: '40px' }}>
              {hasAnswered && quizMode !== 'time_attack' && (
                <button className="btn btn-primary" onClick={handleNext} style={{ float: 'right' }}>
                  {currentIdx === activeQuizzes.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* 3. RESULTS SCREEN PANEL */
          <div className="quiz-result" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              {resMsg.icon === 'trophy' && <Trophy size={64} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />}
              {resMsg.icon === 'award' && <Award size={64} strokeWidth={1.5} style={{ color: 'var(--primary)' }} />}
              {resMsg.icon === 'sparkles' && <Sparkles size={64} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} />}
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>{resMsg.title}</h2>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{resMsg.desc}</p>
 
            <div className="result-score" style={{ fontSize: '4.5rem', fontWeight: 900, color: 'var(--primary)', margin: '1rem 0' }}>
              {quizMode === 'time_attack' ? `${score} câu` : `${score} / ${activeQuizzes.length}`}
            </div>

            {isNewRecord && (
              <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.25rem', margin: '0.5rem 0 1rem 0' }}>
                Kỷ lục mới! Bạn đã đạt điểm số cao nhất!
              </div>
            )}
            
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              {quizMode === 'time_attack'
                ? `Kỷ lục của bạn: ${Math.max(highScore, score)} câu`
                : `Kỷ lục của bạn: ${Math.max(highScore, score)} / ${activeQuizzes.length}`
              }
            </div>
 
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleRestart}>
                Làm lại bài
              </button>
              <button className="btn btn-secondary" onClick={handleBackToModes}>
                Đổi chế độ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizRunner;
