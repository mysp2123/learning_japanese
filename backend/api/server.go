package api

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
)

// Server đại diện cho máy chủ API học tiếng Nhật
type Server struct {
	Addr     string
	apiCache map[string][]byte
}

// NewServer khởi tạo một đối tượng Server mới
func NewServer(addr string) *Server {
	return &Server{
		Addr:     addr,
		apiCache: make(map[string][]byte),
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
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Xử lý các yêu cầu preflight OPTIONS từ trình duyệt
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}
