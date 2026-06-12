package api

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// Message đại diện cho một tin nhắn trong phòng chat
type Message struct {
	ID        int       `json:"id"`
	Sender    string    `json:"sender"`
	Avatar    string    `json:"avatar"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

// Server đại diện cho máy chủ API học tiếng Nhật
type Server struct {
	Addr       string
	apiCache   map[string][]byte
	messages   []Message
	messagesMu sync.RWMutex
	clients    map[chan Message]bool
	clientsMu  sync.Mutex
	uploadDir  string
}

// NewServer khởi tạo một đối tượng Server mới
func NewServer(addr string) *Server {
	uploadPath := filepath.Join("uploads")
	if err := os.MkdirAll(uploadPath, 0755); err != nil {
		log.Printf("[Cảnh báo] Không thể tạo thư mục upload: %v", err)
	}

	return &Server{
		Addr:       addr,
		apiCache:   make(map[string][]byte),
		messages:   make([]Message, 0),
		clients:    make(map[chan Message]bool),
		uploadDir:  uploadPath,
	}
}

// LoadData đọc các tệp JSON trong thư mục data và lưu vào bộ nhớ đệm
func (s *Server) LoadData(dataPath string) error {
	dataFiles := map[string]string{
		"alphabet":   filepath.Join(dataPath, "alphabet.json"),
		"vocabulary": filepath.Join(dataPath, "vocabulary.json"),
		"kanji":      filepath.Join(dataPath, "kanji.json"),
		"grammar":    filepath.Join(dataPath, "grammar.json"),
		"quizzes":    filepath.Join(dataPath, "quizzes.json"),
	}

	for key, path := range dataFiles {
		cleanPath := filepath.Clean(path)
		file, err := os.Open(cleanPath)
		if err != nil {
			return fmt.Errorf("không thể mở tệp %s: %w", path, err)
		}
		
		// Đảm bảo đóng file sau khi đọc xong
		defer func(f *os.File) {
			_ = f.Close()
		}(file)

		byteValue, err := io.ReadAll(file)
		if err != nil {
			return fmt.Errorf("không thể đọc tệp %s: %w", path, err)
		}

		// Xác thực cú pháp JSON để đảm bảo tệp dữ liệu sạch
		var temp interface{}
		if err := json.Unmarshal(byteValue, &temp); err != nil {
			return fmt.Errorf("tệp JSON %s sai định dạng: %w", path, err)
		}

		s.apiCache[key] = byteValue
		log.Printf("[API-Cache] Đã nạp thành công: %s (%d bytes)", path, len(byteValue))
	}
	return nil
}

// EnableCORS xử lý CORS giúp các ứng dụng khách (như React dev server) gọi API chéo cổng an toàn
func (s *Server) EnableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Xử lý các yêu cầu preflight OPTIONS từ trình duyệt
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}
