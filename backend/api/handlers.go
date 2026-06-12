package api

import (
	"net/http"
)

// HandleAlphabet xử lý yêu cầu lấy bảng chữ cái
func (s *Server) HandleAlphabet(w http.ResponseWriter, r *http.Request) {
	s.serveCachedJSON(w, "alphabet")
}

// HandleVocabulary xử lý yêu cầu lấy danh sách từ vựng
func (s *Server) HandleVocabulary(w http.ResponseWriter, r *http.Request) {
	s.serveCachedJSON(w, "vocabulary")
}

// HandleKanji xử lý yêu cầu lấy danh sách chữ Hán
func (s *Server) HandleKanji(w http.ResponseWriter, r *http.Request) {
	s.serveCachedJSON(w, "kanji")
}

// HandleGrammar xử lý yêu cầu lấy danh sách bài học ngữ pháp
func (s *Server) HandleGrammar(w http.ResponseWriter, r *http.Request) {
	s.serveCachedJSON(w, "grammar")
}

// HandleQuizzes xử lý yêu cầu lấy bộ câu hỏi trắc nghiệm
func (s *Server) HandleQuizzes(w http.ResponseWriter, r *http.Request) {
	s.serveCachedJSON(w, "quizzes")
}

// serveCachedJSON trả trực tiếp chuỗi byte JSON lưu trong bộ nhớ đệm
func (s *Server) serveCachedJSON(w http.ResponseWriter, key string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	data, ok := s.apiCache[key]
	if !ok {
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"error": "Dữ liệu yêu cầu không tồn tại hoặc chưa được nạp"}`))
		return
	}
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}
