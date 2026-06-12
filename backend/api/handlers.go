package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"
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

// HandleChatMessages điều phối yêu cầu lấy hoặc gửi tin nhắn chat
func (s *Server) HandleChatMessages(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		s.HandlePostMessage(w, r)
	} else {
		s.HandleGetMessages(w, r)
	}
}

// HandleGetMessages xử lý yêu cầu lấy danh sách tin nhắn lịch sử
func (s *Server) HandleGetMessages(w http.ResponseWriter, r *http.Request) {
	s.messagesMu.RLock()
	defer s.messagesMu.RUnlock()

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(s.messages)
}

// HandlePostMessage xử lý yêu cầu gửi tin nhắn mới
func (s *Server) HandlePostMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Phương thức không được hỗ trợ", http.StatusMethodNotAllowed)
		return
	}

	var msg Message
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Dữ liệu tin nhắn sai định dạng"}`))
		return
	}

	s.messagesMu.Lock()
	msg.ID = len(s.messages) + 1
	msg.Timestamp = time.Now()
	s.messages = append(s.messages, msg)
	// Giới hạn 100 tin nhắn gần nhất
	if len(s.messages) > 100 {
		s.messages = s.messages[len(s.messages)-100:]
	}
	s.messagesMu.Unlock()

	// Phát sóng (Broadcast) đến các SSE client đang lắng nghe
	s.clientsMu.Lock()
	for ch := range s.clients {
		select {
		case ch <- msg:
		default:
			// Buffer đầy, bỏ qua để tránh nghẽn
		}
	}
	s.clientsMu.Unlock()

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(msg)
}

// HandleChatStream xử lý kết nối Server-Sent Events (SSE) để phát chat real-time
func (s *Server) HandleChatStream(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Trình duyệt không hỗ trợ EventStream", http.StatusInternalServerError)
		return
	}

	// Đăng ký channel mới nhận tin nhắn
	ch := make(chan Message, 10)
	s.clientsMu.Lock()
	s.clients[ch] = true
	s.clientsMu.Unlock()

	defer func() {
		s.clientsMu.Lock()
		delete(s.clients, ch)
		s.clientsMu.Unlock()
		close(ch)
	}()

	// Gửi tin nhắn ping kiểm tra kết nối đầu tiên
	_, _ = fmt.Fprintf(w, "event: connected\ndata: {}\n\n")
	flusher.Flush()

	for {
		select {
		case msg := <-ch:
			data, err := json.Marshal(msg)
			if err == nil {
				_, _ = fmt.Fprintf(w, "data: %s\n\n", string(data))
				flusher.Flush()
			}
		case <-r.Context().Done():
			return
		}
	}
}

// HandleUploadAvatar xử lý việc tải lên file ảnh đại diện của người dùng
func (s *Server) HandleUploadAvatar(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Phương thức không được hỗ trợ", http.StatusMethodNotAllowed)
		return
	}

	// Giới hạn dung lượng upload là 5MB
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Dung lượng file tải lên quá lớn (tối đa 5MB)"}`))
		return
	}

	file, handler, err := r.FormFile("avatar")
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Không tìm thấy trường dữ liệu file 'avatar'"}`))
		return
	}
	defer func() {
		_ = file.Close()
	}()

	// Kiểm tra phần mở rộng tệp
	ext := filepath.Ext(handler.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" && ext != ".webp" {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Định dạng ảnh không hợp lệ (chỉ chấp nhận JPG, JPEG, PNG, GIF, WEBP)"}`))
		return
	}

	// Đặt tên tệp duy nhất để tránh trùng lặp
	newFilename := fmt.Sprintf("avatar_%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(s.uploadDir, newFilename)

	dst, err := os.Create(filePath)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error": "Không thể lưu tệp trên máy chủ"}`))
		return
	}
	defer func() {
		_ = dst.Close()
	}()

	if _, err := io.Copy(dst, file); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error": "Không thể sao chép tệp"}`))
		return
	}

	avatarURL := fmt.Sprintf("http://localhost:8080/api/user/avatar/%s", newFilename)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(fmt.Sprintf(`{"avatarUrl": "%s"}`, avatarURL)))
}

// HandleServeAvatar phục vụ ảnh đại diện tĩnh từ thư mục uploads
func (s *Server) HandleServeAvatar(w http.ResponseWriter, r *http.Request) {
	filename := filepath.Base(r.URL.Path)
	filePath := filepath.Join(s.uploadDir, filename)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.Error(w, "File không tồn tại", http.StatusNotFound)
		return
	}

	http.ServeFile(w, r, filePath)
}
