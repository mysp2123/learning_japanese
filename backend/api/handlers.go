package api

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// HandleUsers trả về danh sách người dùng (không bao gồm mật khẩu)
func (s *Server) HandleUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusMethodNotAllowed)
		_, _ = w.Write([]byte(`{"error": "Phương thức không được hỗ trợ"}`))
		return
	}

	rows, err := s.db.db.Query("SELECT id, username, full_name, avatar, level, created_at FROM users ORDER BY created_at DESC")
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi truy vấn người dùng: %v"}`, err)))
		return
	}
	defer rows.Close()

	type UserInfo struct {
		ID        int       `json:"id"`
		Username  string    `json:"username"`
		FullName  string    `json:"full_name"`
		Avatar    string    `json:"avatar"`
		Level     string    `json:"level"`
		CreatedAt time.Time `json:"created_at"`
	}

	var users []UserInfo
	for rows.Next() {
		var u UserInfo
		if err := rows.Scan(&u.ID, &u.Username, &u.FullName, &u.Avatar, &u.Level, &u.CreatedAt); err == nil {
			users = append(users, u)
		}
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(users)
}

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

// HandleVerbs xử lý yêu cầu lấy danh sách động từ và các thể chia
func (s *Server) HandleVerbs(w http.ResponseWriter, r *http.Request) {
	s.serveCachedJSON(w, "verbs")
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

// hashPassword băm mật khẩu người dùng bằng thuật toán SHA-256 để lưu trữ an toàn
func hashPassword(password string) string {
	h := sha256.New()
	h.Write([]byte(password))
	return hex.EncodeToString(h.Sum(nil))
}

// HandleRegister xử lý đăng ký tài khoản mới và lưu vào PostgreSQL
func (s *Server) HandleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Phương thức không được hỗ trợ", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
		FullName string `json:"fullName"`
		Avatar   string `json:"avatar"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Dữ liệu đăng ký sai định dạng"}`))
		return
	}

	if req.Username == "" || req.Password == "" || req.FullName == "" {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu và họ tên"}`))
		return
	}

	// Kiểm tra xem tên đăng nhập đã được đăng ký chưa bằng DBManager
	exists, err := s.db.UserExists(req.Username)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error": "Lỗi truy vấn cơ sở dữ liệu"}`))
		return
	}

	if exists {
		w.WriteHeader(http.StatusConflict)
		_, _ = w.Write([]byte(`{"error": "Tên đăng nhập đã được đăng ký trước đó"}`))
		return
	}

	// Tạo tài khoản mới qua DBManager
	err = s.db.CreateUser(req.Username, req.Password, req.FullName, req.Avatar)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error": "Lỗi lưu tài khoản người dùng"}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_, _ = w.Write([]byte(`{"message": "Đăng ký tài khoản thành công"}`))
}

// HandleLogin xác thực thông tin đăng nhập từ cơ sở dữ liệu PostgreSQL
func (s *Server) HandleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Phương thức không được hỗ trợ", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Dữ liệu đăng nhập sai định dạng"}`))
		return
	}

	if req.Username == "" || req.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Vui lòng điền tên đăng nhập và mật khẩu"}`))
		return
	}

	// Xác thực tài khoản qua DBManager
	u, err := s.db.GetUserByUsernameAndPassword(req.Username, req.Password)
	if err == sql.ErrNoRows {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error": "Tên đăng nhập hoặc mật khẩu không chính xác"}`))
		return
	} else if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error": "Lỗi truy vấn tài khoản từ cơ sở dữ liệu"}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(u)
}

// HandleUpdateProfile cập nhật thông tin người dùng trong PostgreSQL
func (s *Server) HandleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Phương thức không được hỗ trợ", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Username string `json:"username"`
		FullName string `json:"fullName"`
		Avatar   string `json:"avatar"`
		Level    string `json:"level"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Dữ liệu yêu cầu sai định dạng"}`))
		return
	}

	if req.Username == "" {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Tên tài khoản người dùng không được để trống"}`))
		return
	}

	// Cập nhật thông tin qua DBManager
	err := s.db.UpdateUserProfile(req.Username, req.FullName, req.Avatar, req.Level)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error": "Lỗi cập nhật thông tin vào cơ sở dữ liệu"}`))
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"message": "Cập nhật thông tin thành công"}`))
}

// HandleGetMessages xử lý yêu cầu lấy danh sách tin nhắn lịch sử từ PostgreSQL
func (s *Server) HandleGetMessages(w http.ResponseWriter, r *http.Request) {
	list, err := s.db.GetRecentMessages()
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error": "Lỗi truy vấn tin nhắn lịch sử"}`))
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	_ = json.NewEncoder(w).Encode(list)
}

// HandlePostMessage xử lý yêu cầu gửi tin nhắn mới và ghi vào PostgreSQL
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

	msg.Timestamp = time.Now()

	// Lưu tin nhắn qua DBManager
	lastID, err := s.db.SaveMessage(msg.Sender, msg.Avatar, msg.Content, msg.Timestamp)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error": "Lỗi lưu tin nhắn vào cơ sở dữ liệu"}`))
		return
	}
	msg.ID = lastID

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
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusMethodNotAllowed)
		_, _ = w.Write([]byte(`{"error": "Phương thức không được hỗ trợ"}`))
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Dung lượng file quá lớn (tối đa 10MB). Vui lòng chọn ảnh nhỏ hơn."}`))
		return
	}

	file, handler, err := r.FormFile("avatar")
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Không tìm thấy trường dữ liệu file 'avatar'. Vui lòng chọn lại ảnh."}`))
		return
	}
	defer func() {
		_ = file.Close()
	}()

	ext := filepath.Ext(handler.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".gif" && ext != ".webp" {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Định dạng ảnh không hợp lệ (chỉ chấp nhận JPG, JPEG, PNG, GIF, WEBP)"}`))
		return
	}

	newFilename := fmt.Sprintf("avatar_%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(s.uploadDir, newFilename)

	dst, err := os.Create(filePath)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error": "Không thể lưu tệp trên máy chủ"}`))
		return
	}
	defer func() {
		_ = dst.Close()
	}()

	if _, err := io.Copy(dst, file); err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error": "Không thể sao chép tệp"}`))
		return
	}

	scheme := "http"
	host := r.Host
	if r.TLS != nil || 
		r.Header.Get("X-Forwarded-Proto") == "https" || 
		r.Header.Get("X-Url-Scheme") == "https" ||
		(!strings.HasPrefix(host, "localhost") && !strings.HasPrefix(host, "127.0.0.1") && !strings.HasPrefix(host, "192.168.")) {
		scheme = "https"
	}
	avatarURL := fmt.Sprintf("%s://%s/api/user/avatar/%s", scheme, host, newFilename)

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
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

// HandleVideos xử lý lấy danh sách video hoặc thêm video mới
func (s *Server) HandleVideos(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		var req struct {
			Title     string `json:"title"`
			YoutubeID string `json:"youtubeId"`
			AddedBy   string `json:"addedBy"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Dữ liệu không đúng định dạng"}`))
			return
		}
		if req.Title == "" || req.YoutubeID == "" || req.AddedBy == "" {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Vui lòng nhập đầy đủ tiêu đề, ID YouTube và tên người đăng"}`))
			return
		}
		lastID, err := s.db.AddVideo(req.Title, req.YoutubeID, req.AddedBy)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"error": "Lỗi khi lưu video vào cơ sở dữ liệu"}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(fmt.Sprintf(`{"id": %d, "message": "Thêm video thành công"}`, lastID)))
	} else {
		list, err := s.db.GetVideos()
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"error": "Lỗi truy vấn danh sách video"}`))
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(list)
	}
}

// HandleVideoComments xử lý bình luận của từng video
func (s *Server) HandleVideoComments(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		var req struct {
			VideoID int    `json:"videoId"`
			Sender  string `json:"sender"`
			Avatar  string `json:"avatar"`
			Content string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Dữ liệu không đúng định dạng"}`))
			return
		}
		if req.VideoID <= 0 || req.Sender == "" || req.Content == "" {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Thông tin bình luận thiếu hoặc sai sót"}`))
			return
		}
		lastID, err := s.db.AddVideoComment(req.VideoID, req.Sender, req.Avatar, req.Content)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"error": "Lỗi khi lưu bình luận"}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(fmt.Sprintf(`{"id": %d, "message": "Đăng bình luận thành công"}`, lastID)))
	} else {
		videoIDStr := r.URL.Query().Get("videoId")
		var videoID int
		_, err := fmt.Sscanf(videoIDStr, "%d", &videoID)
		if err != nil || videoID <= 0 {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Mã video không hợp lệ"}`))
			return
		}
		list, err := s.db.GetVideoComments(videoID)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"error": "Lỗi truy vấn bình luận"}`))
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(list)
	}
}

// HandleVideoStats cập nhật hoặc báo cáo thống kê lượt xem video
func (s *Server) HandleVideoStats(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		var req struct {
			VideoID   int    `json:"videoId"`
			Username  string `json:"username"`
			Duration  int    `json:"duration"`
			IsNewView bool   `json:"isNewView"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Dữ liệu không đúng định dạng"}`))
			return
		}
		if req.VideoID <= 0 || req.Username == "" {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Thiếu mã video hoặc tên tài khoản"}`))
			return
		}
		err := s.db.UpdateVideoStats(req.VideoID, req.Username, req.Duration, req.IsNewView)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"error": "Lỗi cập nhật thống kê video"}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"message": "Cập nhật thống kê thành công"}`))
	} else {
		videoIDStr := r.URL.Query().Get("videoId")
		var videoID int
		_, err := fmt.Sscanf(videoIDStr, "%d", &videoID)
		if err != nil || videoID <= 0 {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Mã video không hợp lệ"}`))
			return
		}
		list, err := s.db.GetVideoStats(videoID)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"error": "Lỗi truy vấn báo cáo thống kê"}`))
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(list)
	}
}

// HandleAddVocabulary xử lý thêm từ vựng mới vào DB
func (s *Server) HandleAddVocabulary(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Word           string `json:"word"`
		Reading        string `json:"reading"`
		Meaning        string `json:"meaning"`
		Level          string `json:"level"`
		PartOfSpeech   string `json:"part_of_speech"`
		Example        string `json:"example"`
		ExampleReading string `json:"example_reading"`
		ExampleMeaning string `json:"example_meaning"`
		CreatedBy      string `json:"created_by"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Dữ liệu yêu cầu không hợp lệ"}`))
		return
	}

	if req.Word == "" || req.Reading == "" || req.Meaning == "" {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Từ vựng, cách đọc và ý nghĩa không được để trống"}`))
		return
	}

	if req.Level == "" {
		req.Level = "N5"
	}
	if req.PartOfSpeech == "" {
		req.PartOfSpeech = "Từ vựng"
	}
	if req.CreatedBy == "" {
		req.CreatedBy = "user"
	}

	_, err := s.db.db.Exec(`INSERT INTO user_vocabulary 
		(word, reading, meaning, level, part_of_speech, example, example_reading, example_meaning, created_by) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		req.Word, req.Reading, req.Meaning, req.Level, req.PartOfSpeech, req.Example, req.ExampleReading, req.ExampleMeaning, req.CreatedBy)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi lưu từ vựng vào cơ sở dữ liệu: %v"}`, err)))
		return
	}

	_ = s.ReloadCacheFromDB()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_, _ = w.Write([]byte(`{"message": "Đã thêm từ vựng thành công"}`))
}

// HandleAddVerb xử lý thêm động từ mới vào DB
func (s *Server) HandleAddVerb(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Masu        string `json:"masu"`
		Meaning     string `json:"meaning"`
		Dictionary  string `json:"dictionary"`
		Te          string `json:"te"`
		Ta          string `json:"ta"`
		Nai         string `json:"nai"`
		Ability     string `json:"ability"`
		Volitional  string `json:"volitional"`
		Imperative  string `json:"imperative"`
		Causative   string `json:"causative"`
		Prohibitive string `json:"prohibitive"`
		Conditional string `json:"conditional"`
		Passive     string `json:"passive"`
		CreatedBy   string `json:"created_by"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Dữ liệu yêu cầu không hợp lệ"}`))
		return
	}

	if req.Masu == "" || req.Meaning == "" || req.Dictionary == "" {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Thể ます, Thể từ điển và ý nghĩa không được để trống"}`))
		return
	}

	if req.CreatedBy == "" {
		req.CreatedBy = "user"
	}

	_, err := s.db.db.Exec(`INSERT INTO user_verbs 
		(masu, meaning, dictionary, te, ta, nai, ability, volitional, imperative, causative, prohibitive, conditional, passive, created_by) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
		req.Masu, req.Meaning, req.Dictionary, req.Te, req.Ta, req.Nai, req.Ability, req.Volitional, req.Imperative, req.Causative, req.Prohibitive, req.Conditional, req.Passive, req.CreatedBy)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi lưu động từ vào cơ sở dữ liệu: %v"}`, err)))
		return
	}

	_ = s.ReloadCacheFromDB()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_, _ = w.Write([]byte(`{"message": "Đã thêm động từ thành công"}`))
}

// HandleStudyList quản lý danh sách ôn tập của người dùng (GET, POST, DELETE)
func (s *Server) HandleStudyList(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		username := r.URL.Query().Get("username")
		if username == "" {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Thiếu tên người dùng"}`))
			return
		}

		rows, err := s.db.db.Query("SELECT item_type, item_id, status FROM user_study_list WHERE username = $1", username)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi truy vấn danh sách ôn tập: %v"}`, err)))
			return
		}
		defer rows.Close()

		type StudyItem struct {
			ItemType string `json:"item_type"`
			ItemID   string `json:"item_id"`
			Status   string `json:"status"`
		}

		var list []StudyItem
		for rows.Next() {
			var item StudyItem
			if err := rows.Scan(&item.ItemType, &item.ItemID, &item.Status); err == nil {
				list = append(list, item)
			}
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(list)

	} else if r.Method == "POST" {
		var req struct {
			Username string `json:"username"`
			ItemType string `json:"item_type"`
			ItemID   string `json:"item_id"`
			Status   string `json:"status"` // 'review' or 'mastered'
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Dữ liệu yêu cầu không hợp lệ"}`))
			return
		}

		if req.Username == "" || req.ItemType == "" || req.ItemID == "" {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Thông tin đầu vào không đầy đủ"}`))
			return
		}

		if req.Status == "" {
			req.Status = "review"
		}

		_, err := s.db.db.Exec(`INSERT INTO user_study_list (username, item_type, item_id, status)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (username, item_type, item_id)
			DO UPDATE SET status = EXCLUDED.status`,
			req.Username, req.ItemType, req.ItemID, req.Status)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi cập nhật danh sách ôn tập: %v"}`, err)))
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"message": "Đã cập nhật danh sách ôn tập thành công"}`))

	} else if r.Method == "DELETE" {
		username := r.URL.Query().Get("username")
		itemType := r.URL.Query().Get("item_type")
		itemID := r.URL.Query().Get("item_id")

		if username == "" || itemType == "" || itemID == "" {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Thông tin đầu vào không đầy đủ để xóa"}`))
			return
		}

		_, err := s.db.db.Exec("DELETE FROM user_study_list WHERE username = $1 AND item_type = $2 AND item_id = $3",
			username, itemType, itemID)

		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi xóa khỏi danh sách ôn tập: %v"}`, err)))
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"message": "Đã xóa khỏi danh sách ôn tập thành công"}`))
	} else {
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

// VocabList đại diện cho một danh sách từ vựng của người dùng
type VocabList struct {
	ID          int       `json:"id"`
	Username    string    `json:"username"`
	ListName    string    `json:"list_name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// VocabListItem đại diện cho một mục trong danh sách từ vựng
type VocabListItem struct {
	ID         int       `json:"id"`
	ListID     int       `json:"list_id"`
	ItemType   string    `json:"item_type"`
	ItemID     string    `json:"item_id"`
	Notes      string    `json:"notes"`
	CreatedAt  time.Time `json:"created_at"`
}

// HandleVocabLists quản lý danh sách từ vựng của người dùng (GET danh sách, POST tạo mới)
func (s *Server) HandleVocabLists(w http.ResponseWriter, r *http.Request) {
	if r.Method == "GET" {
		username := r.URL.Query().Get("username")
		if username == "" {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Thiếu tên người dùng"}`))
			return
		}

		rows, err := s.db.db.Query("SELECT id, username, list_name, description, created_at, updated_at FROM user_vocab_lists WHERE username = $1 ORDER BY updated_at DESC", username)
		if err != nil {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi truy vấn danh sách từ vựng: %v"}`, err)))
			return
		}
		defer rows.Close()

		lists := make([]VocabList, 0)
		for rows.Next() {
			var vl VocabList
			if err := rows.Scan(&vl.ID, &vl.Username, &vl.ListName, &vl.Description, &vl.CreatedAt, &vl.UpdatedAt); err == nil {
				lists = append(lists, vl)
			}
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(lists)

	} else if r.Method == "POST" {
		var req struct {
			Username    string `json:"username"`
			ListName    string `json:"list_name"`
			Description string `json:"description"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Dữ liệu yêu cầu không hợp lệ"}`))
			return
		}

		if req.Username == "" || req.ListName == "" {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Tên danh sách và tên người dùng không được để trống"}`))
			return
		}

		if len(req.ListName) > 255 {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Tên danh sách quá dài (tối đa 255 ký tự)"}`))
			return
		}

		var newID int
		err := s.db.db.QueryRow(
			"INSERT INTO user_vocab_lists (username, list_name, description) VALUES ($1, $2, $3) RETURNING id",
			req.Username, req.ListName, req.Description,
		).Scan(&newID)

		if err != nil {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi tạo danh sách: %v"}`, err)))
			return
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(fmt.Sprintf(`{"id": %d, "message": "Đã tạo danh sách thành công"}`, newID)))

	} else {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

// HandleVocabListsById quản lý danh sách từ vựng theo ID (GET chi tiết, PUT sửa, DELETE xoá)
func (s *Server) HandleVocabListsById(w http.ResponseWriter, r *http.Request) {
	listIDStr := r.URL.Query().Get("id")
	if listIDStr == "" {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Thiếu mã danh sách"}`))
		return
	}

	var listID int
	if _, err := fmt.Sscanf(listIDStr, "%d", &listID); err != nil || listID <= 0 {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Mã danh sách không hợp lệ"}`))
		return
	}

	if r.Method == "GET" {
		rows, err := s.db.db.Query("SELECT id, item_type, item_id, notes, created_at FROM user_vocab_list_items WHERE list_id = $1 ORDER BY created_at ASC", listID)
		if err != nil {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi truy vấn mục trong danh sách: %v"}`, err)))
			return
		}
		defer rows.Close()

		items := make([]VocabListItem, 0)
		for rows.Next() {
			var item VocabListItem
			if err := rows.Scan(&item.ID, &item.ItemType, &item.ItemID, &item.Notes, &item.CreatedAt); err == nil {
				item.ListID = listID
				items = append(items, item)
			}
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(items)

	} else if r.Method == "PUT" {
		var req struct {
			ListName    string `json:"list_name"`
			Description string `json:"description"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Dữ liệu yêu cầu không hợp lệ"}`))
			return
		}

		if req.ListName == "" {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Tên danh sách không được để trống"}`))
			return
		}

		if len(req.ListName) > 255 {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Tên danh sách quá dài (tối đa 255 ký tự)"}`))
			return
		}

		_, err := s.db.db.Exec(
			"UPDATE user_vocab_lists SET list_name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
			req.ListName, req.Description, listID,
		)

		if err != nil {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi cập nhật danh sách: %v"}`, err)))
			return
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"message": "Đã cập nhật danh sách thành công"}`))

	} else if r.Method == "DELETE" {
		_, err := s.db.db.Exec("DELETE FROM user_vocab_lists WHERE id = $1", listID)
		if err != nil {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi xóa danh sách: %v"}`, err)))
			return
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"message": "Đã xóa danh sách thành công"}`))

	} else {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

// HandleVocabListItems quản lý mục trong danh sách từ vựng (POST thêm, DELETE xoá)
func (s *Server) HandleVocabListItems(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		var req struct {
			ListID   int    `json:"list_id"`
			ItemType string `json:"item_type"`
			ItemID   string `json:"item_id"`
			Notes    string `json:"notes"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Dữ liệu yêu cầu không hợp lệ"}`))
			return
		}

		if req.ListID <= 0 || req.ItemType == "" || req.ItemID == "" {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Thông tin mục không đầy đủ"}`))
			return
		}

		_, err := s.db.db.Exec(
			"INSERT INTO user_vocab_list_items (list_id, item_type, item_id, notes) VALUES ($1, $2, $3, $4) ON CONFLICT (list_id, item_type, item_id) DO UPDATE SET notes = EXCLUDED.notes",
			req.ListID, req.ItemType, req.ItemID, req.Notes,
		)

		if err != nil {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi thêm mục vào danh sách: %v"}`, err)))
			return
		}

		_, _ = s.db.db.Exec("UPDATE user_vocab_lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", req.ListID)

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"message": "Đã thêm mục vào danh sách thành công"}`))

	} else if r.Method == "DELETE" {
		listIDStr := r.URL.Query().Get("list_id")
		itemType := r.URL.Query().Get("item_type")
		itemID := r.URL.Query().Get("item_id")

		var listID int
		if _, err := fmt.Sscanf(listIDStr, "%d", &listID); err != nil || listID <= 0 {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Mã danh sách không hợp lệ"}`))
			return
		}

		if itemType == "" || itemID == "" {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Thiếu thông tin mục cần xóa"}`))
			return
		}

		res, err := s.db.db.Exec("DELETE FROM user_vocab_list_items WHERE list_id = $1 AND item_type = $2 AND item_id = $3", listID, itemType, itemID)
		if err != nil {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi xóa mục khỏi danh sách: %v"}`, err)))
			return
		}

		if rowsAffected, _ := res.RowsAffected(); rowsAffected > 0 {
			_, _ = s.db.db.Exec("UPDATE user_vocab_lists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", listID)
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"message": "Đã xóa mục khỏi danh sách thành công"}`))

	} else {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

// HandleDocuments xử lý lấy danh sách tài liệu hoặc thêm tài liệu đính kèm link
func (s *Server) HandleDocuments(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		docs, err := s.db.GetDocuments()
		if err != nil {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi lấy danh sách tài liệu: %v"}`, err)))
			return
		}
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_ = json.NewEncoder(w).Encode(docs)
		return
	}

	if r.Method == http.MethodPost {
		var req struct {
			Title       string `json:"title"`
			Description string `json:"description"`
			URL         string `json:"url"`
			Category    string `json:"category"`
			Type        string `json:"type"`
			Level       string `json:"level"`
			ItemsCount  string `json:"itemsCount"`
			UploadedBy  string `json:"uploadedBy"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Dữ liệu không hợp lệ"}`))
			return
		}

		if req.Title == "" || req.URL == "" {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error": "Tiêu đề và liên kết không được để trống"}`))
			return
		}

		if req.UploadedBy == "" {
			req.UploadedBy = "Cộng đồng"
		}
		if req.Level == "" {
			req.Level = "Tổng hợp"
		}
		if req.Category == "" {
			req.Category = "all"
		}
		if req.Type == "" {
			req.Type = "link"
		}

		lastID, err := s.db.AddDocument(req.Title, req.Description, req.URL, req.Category, req.Type, req.Level, req.ItemsCount, req.UploadedBy)
		if err != nil {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(fmt.Sprintf(`{"error": "Lỗi lưu tài liệu vào DB: %v"}`, err)))
			return
		}

		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(fmt.Sprintf(`{"id": %d, "message": "Chia sẻ tài liệu thành công"}`, lastID)))
		return
	}

	w.WriteHeader(http.StatusMethodNotAllowed)
}

// HandleUploadDocumentFile xử lý tải tài liệu (pdf, docs, xlsx, etc.) lên hệ thống
func (s *Server) HandleUploadDocumentFile(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusMethodNotAllowed)
		_, _ = w.Write([]byte(`{"error": "Phương thức không được hỗ trợ"}`))
		return
	}

	if err := r.ParseMultipartForm(50 << 20); err != nil { // Tối đa 50MB
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Dung lượng file quá lớn (tối đa 50MB)."}`))
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Không tìm thấy file trong yêu cầu."}`))
		return
	}
	defer func() {
		_ = file.Close()
	}()

	ext := strings.ToLower(filepath.Ext(handler.Filename))
	if ext != ".pdf" && ext != ".doc" && ext != ".docx" && ext != ".xls" && ext != ".xlsx" && ext != ".ppt" && ext != ".pptx" && ext != ".txt" && ext != ".zip" && ext != ".rar" {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"error": "Định dạng file không hỗ trợ (chỉ chấp nhận PDF, Word, Excel, PowerPoint, TXT, ZIP, RAR)"}`))
		return
	}

	newFilename := fmt.Sprintf("doc_%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(s.uploadDir, newFilename)

	dst, err := os.Create(filePath)
	if err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error": "Không thể lưu tệp trên máy chủ"}`))
		return
	}
	defer func() {
		_ = dst.Close()
	}()

	if _, err := io.Copy(dst, file); err != nil {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"error": "Không thể sao chép tệp"}`))
		return
	}

	scheme := "http"
	host := r.Host
	if r.TLS != nil || 
		r.Header.Get("X-Forwarded-Proto") == "https" || 
		r.Header.Get("X-Url-Scheme") == "https" ||
		(!strings.HasPrefix(host, "localhost") && !strings.HasPrefix(host, "127.0.0.1") && !strings.HasPrefix(host, "192.168.")) {
		scheme = "https"
	}
	fileURL := fmt.Sprintf("%s://%s/api/documents/files/%s", scheme, host, newFilename)

	// Định dạng itemsCount dựa trên kích thước file
	sizeMB := float64(handler.Size) / (1024 * 1024)
	var itemsCount string
	if sizeMB < 0.1 {
		itemsCount = fmt.Sprintf("%.1f KB | %s", float64(handler.Size)/1024, strings.ToUpper(ext[1:]))
	} else {
		itemsCount = fmt.Sprintf("%.2f MB | %s", sizeMB, strings.ToUpper(ext[1:]))
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(fmt.Sprintf(`{"url": "%s", "filename": "%s", "itemsCount": "%s"}`, fileURL, handler.Filename, itemsCount)))
}

// HandleServeDocumentFile phục vụ tệp tài liệu tĩnh từ thư mục uploads
func (s *Server) HandleServeDocumentFile(w http.ResponseWriter, r *http.Request) {
	filename := filepath.Base(r.URL.Path)
	filePath := filepath.Join(s.uploadDir, filename)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		http.Error(w, "File không tồn tại", http.StatusNotFound)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*")
	http.ServeFile(w, r, filePath)
}
