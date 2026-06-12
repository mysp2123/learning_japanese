import React, { useState, useEffect, useRef } from 'react';

const QuizRunner = ({ userLevel }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Confetti Canvas Ref
  const confettiCanvasRef = useRef(null);
  const animationRef = useRef(null);
  
  // Load high score when level changes
  useEffect(() => {
    const savedHighScore = localStorage.getItem(`nihongo_quiz_high_score_${userLevel}`);
    setHighScore(savedHighScore ? parseInt(savedHighScore, 10) : 0);
  }, [userLevel]);

  // Filter quizzes by the global level
  const filteredQuizzes = quizzes.filter((q) => q.level === userLevel);

  useEffect(() => {
    fetch('http://localhost:8080/api/quizzes')
      .then((res) => res.json())
      .then((data) => {
        setQuizzes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải câu hỏi trắc nghiệm:', err);
        setLoading(false);
      });
  }, []);

  // Reset quiz state whenever user changes their level at Header
  useEffect(() => {
    handleRestart();
  }, [userLevel]);

  // Trigger Confetti and update high score when results page shows
  useEffect(() => {
    if (showResult) {
      const currentSaved = localStorage.getItem(`nihongo_quiz_high_score_${userLevel}`);
      const currentHighScore = currentSaved ? parseInt(currentSaved, 10) : 0;
      if (score > currentHighScore) {
        localStorage.setItem(`nihongo_quiz_high_score_${userLevel}`, score.toString());
        setIsNewRecord(true);
        setHighScore(score);
      } else {
        setIsNewRecord(false);
      }

      if (score === filteredQuizzes.length && filteredQuizzes.length > 0) {
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

    // Resize canvas to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#fecdd3', '#fde047', '#86efac', '#93c5fd', '#c084fc', '#fda4af', '#a5f3fc'];
    const particles = [];
    
    // Create 150 particles
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
      
      // Stop animation loop after 350 frames or if all particles fell down
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

    const question = filteredQuizzes[currentIdx];
    if (optIdx === question.correct) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelectedOpt(null);
    setHasAnswered(false);
    if (currentIdx === filteredQuizzes.length - 1) {
      setShowResult(true);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleRestart = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setCurrentIdx(0);
    setScore(0);
    setSelectedOpt(null);
    setHasAnswered(false);
    setShowResult(false);
    setIsNewRecord(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải câu hỏi...</div>;
  }

  if (filteredQuizzes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '3rem' }}>🍵</div>
        <h3 style={{ marginTop: '1rem' }}>Chưa có câu hỏi trắc nghiệm</h3>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Hiện tại chưa có câu hỏi trắc nghiệm nào được cập nhật cho cấp độ {userLevel}.
        </p>
      </div>
    );
  }

  const currentQuestion = filteredQuizzes[currentIdx];

  const getResultMessage = () => {
    const percentage = (score / filteredQuizzes.length) * 100;
    if (percentage === 100) {
      return {
        emoji: '👑🎉🌸',
        title: 'TUYỆT ĐỈNH VÔ SONG!',
        desc: 'Bạn đã trả lời đúng hoàn toàn tất cả câu hỏi! Hãy đón nhận cơn mưa pháo hoa chúc mừng nhé! 💮',
      };
    } else if (percentage >= 70) {
      return {
        emoji: '👍🦊✨',
        title: 'XUẤT SẮC QUÁ!',
        desc: 'Bạn chỉ còn một chút nữa là đạt điểm tuyệt đối rồi. Tiếp tục phát huy nhé! 🎏',
      };
    } else {
      return {
        emoji: '💪🍵🌱',
        title: 'CỐ GẮNG LÊN NÀO!',
        desc: 'Đừng nản chí nhé! Hãy xem lại các cấu trúc đã học và thử lại một lần nữa nhé! 🍱',
      };
    }
  };

  const resMsg = getResultMessage();

  return (
    <div className="quiz-container">
      {/* Confetti canvas (only active on perfect score screen) */}
      {showResult && score === filteredQuizzes.length && (
        <canvas ref={confettiCanvasRef} className="confetti-canvas" />
      )}

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1>Luyện tập Trắc nghiệm 📝</h1>
        <p>Luyện tập trắc nghiệm được biên soạn riêng theo cấp độ {userLevel} của bạn.</p>
      </div>

      <div className="quiz-card">
        {!showResult ? (
          <div>
            <div className="quiz-progress" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>
                Câu hỏi {currentIdx + 1} / {filteredQuizzes.length}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Kỷ lục: {highScore} / {filteredQuizzes.length}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Cấp độ: {userLevel}</span>
            </div>

            <div className="quiz-question">
              {currentQuestion.question} <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>({currentQuestion.category})</span>
            </div>

            <div className="quiz-options">
              {currentQuestion.options.map((option, i) => {
                let btnClass = 'quiz-option';
                if (hasAnswered) {
                  if (i === currentQuestion.correct) {
                    btnClass += ' correct';
                  } else if (i === selectedOpt) {
                    btnClass += ' incorrect';
                  }
                }

                return (
                  <button
                    key={i}
                    className={btnClass}
                    onClick={() => handleSelectOption(i)}
                    disabled={hasAnswered}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {hasAnswered && (
              <div
                className={`quiz-feedback show ${
                  selectedOpt === currentQuestion.correct ? 'correct' : 'incorrect'
                }`}
              >
                <div className="quiz-feedback-title">
                  {selectedOpt === currentQuestion.correct ? 'Chính xác rồi! 🌸' : 'Chưa đúng mất rồi 🦊'}
                </div>
                <div className="quiz-explanation">{currentQuestion.explanation}</div>
              </div>
            )}

            <div className="quiz-footer">
              {hasAnswered && (
                <button className="btn btn-primary" onClick={handleNext}>
                  {currentIdx === filteredQuizzes.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="quiz-result">
            <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'cute-hover-bounce 0.4s ease alternate infinite' }}>
              {resMsg.emoji}
            </div>
            <h2>{resMsg.title}</h2>
            <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{resMsg.desc}</p>
 
            <div className="result-score" style={{ fontSize: '4.5rem', fontWeight: 900, color: 'var(--primary)' }}>
              {score} / {filteredQuizzes.length}
            </div>

            {isNewRecord && (
              <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem', margin: '0.5rem 0 1rem 0' }}>
                🎉 Kỷ lục mới! Bạn đã đạt điểm số cao nhất!
              </div>
            )}
            
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Kỷ lục của bạn: {Math.max(highScore, score)} / {filteredQuizzes.length}
            </div>
 
            <button className="btn btn-primary" onClick={handleRestart} style={{ marginTop: '1rem' }}>
              Làm lại bài thi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizRunner;
