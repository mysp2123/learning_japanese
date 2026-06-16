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

// User đại diện cho dữ liệu tài khoản người dùng
type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Password  string    `json:"password,omitempty"`
	FullName  string    `json:"fullName"`
	Avatar    string    `json:"avatar"`
	Level     string    `json:"level"`
	CreatedAt time.Time `json:"createdAt"`
}

// Video đại diện cho một video học tập được người dùng chia sẻ
type Video struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	YoutubeID string    `json:"youtubeId"`
	AddedBy   string    `json:"addedBy"`
	CreatedAt time.Time `json:"createdAt"`
}

// Document đại diện cho tài liệu được tải lên hoặc đính kèm link
type Document struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	URL         string    `json:"url"`
	Category    string    `json:"category"`
	Type        string    `json:"type"`
	Level       string    `json:"level"`
	ItemsCount  string    `json:"itemsCount"`
	UploadedBy  string    `json:"uploadedBy"`
	CreatedAt   time.Time `json:"createdAt"`
}

// VideoComment đại diện cho một bình luận/tin nhắn chat dưới video
type VideoComment struct {
	ID        int       `json:"id"`
	VideoID   int       `json:"videoId"`
	Sender    string    `json:"sender"`
	Avatar    string    `json:"avatar"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

// VideoStatReport đại diện cho thông tin thống kê xem video của từng tài khoản
type VideoStatReport struct {
	VideoID      int       `json:"videoId"`
	Username     string    `json:"username"`
	FullName     string    `json:"fullName"`
	Views        int       `json:"views"`
	WatchSeconds int       `json:"watchSeconds"`
	LastWatched  time.Time `json:"lastWatched"`
}

// Server đại diện cho máy chủ API học tiếng Nhật
type Server struct {
	Addr       string
	apiCache   map[string][]byte
	clients    map[chan Message]bool
	clientsMu  sync.Mutex
	uploadDir  string
	db         *DBManager
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
		clients:    make(map[chan Message]bool),
		uploadDir:  uploadPath,
		db:         NewDBManager(),
	}
}

// InitDB khởi tạo kết nối cơ sở dữ liệu
func (s *Server) InitDB() {
	s.db.Connect()
}

// LoadData đọc các tệp JSON trong thư mục data và lưu vào bộ nhớ đệm
func (s *Server) LoadData(dataPath string) error {
	dataFiles := map[string]string{
		"alphabet":   filepath.Join(dataPath, "alphabet.json"),
		"vocabulary": filepath.Join(dataPath, "vocabulary.json"),
		"kanji":      filepath.Join(dataPath, "kanji.json"),
		"grammar":    filepath.Join(dataPath, "grammar.json"),
		"quizzes":    filepath.Join(dataPath, "quizzes.json"),
		"verbs":      filepath.Join(dataPath, "verbs.json"),
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
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Xử lý các yêu cầu preflight OPTIONS từ trình duyệt
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// ReloadCacheFromDB nạp dữ liệu từ database và lưu vào apiCache để nâng cao tốc độ tải và đảm bảo đồng bộ
func (s *Server) ReloadCacheFromDB() error {
	// 1. Load Vocabulary
	rows, err := s.db.db.Query("SELECT id, word, reading, meaning, level, part_of_speech, example, example_reading, example_meaning FROM user_vocabulary ORDER BY id ASC")
	if err != nil {
		return err
	}
	defer rows.Close()

	type VocabRow struct {
		ID             string `json:"id"`
		Word           string `json:"word"`
		Reading        string `json:"reading"`
		Meaning        string `json:"meaning"`
		Level          string `json:"level"`
		PartOfSpeech   string `json:"part_of_speech"`
		Example        string `json:"example"`
		ExampleReading string `json:"example_reading"`
		ExampleMeaning string `json:"example_meaning"`
	}

	var vocabs []VocabRow
	for rows.Next() {
		var vr VocabRow
		var idVal int
		err := rows.Scan(&idVal, &vr.Word, &vr.Reading, &vr.Meaning, &vr.Level, &vr.PartOfSpeech, &vr.Example, &vr.ExampleReading, &vr.ExampleMeaning)
		if err != nil {
			return err
		}
		vr.ID = fmt.Sprintf("v_db_%d", idVal)
		vocabs = append(vocabs, vr)
	}
	vocabBytes, err := json.Marshal(vocabs)
	if err == nil {
		s.apiCache["vocabulary"] = vocabBytes
	}

	// 2. Load Verbs
	vRows, err := s.db.db.Query("SELECT id, masu, meaning, dictionary, group_num, te, ta, nai, ability, volitional, imperative, causative, prohibitive, conditional, passive FROM user_verbs ORDER BY id ASC")
	if err != nil {
		return err
	}
	defer vRows.Close()

	type VerbRow struct {
		ID          string `json:"id"`
		Masu        string `json:"masu"`
		Meaning     string `json:"meaning"`
		Dictionary  string `json:"dictionary"`
		Group       int    `json:"group"`
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
	}

	var verbs []VerbRow
	for vRows.Next() {
		var vr VerbRow
		var idVal int
		err := vRows.Scan(&idVal, &vr.Masu, &vr.Meaning, &vr.Dictionary, &vr.Group, &vr.Te, &vr.Ta, &vr.Nai, &vr.Ability, &vr.Volitional, &vr.Imperative, &vr.Causative, &vr.Prohibitive, &vr.Conditional, &vr.Passive)
		if err != nil {
			return err
		}
		vr.ID = fmt.Sprintf("verb_db_%d", idVal)
		verbs = append(verbs, vr)
	}
	verbsBytes, err := json.Marshal(verbs)
	if err == nil {
		s.apiCache["verbs"] = verbsBytes
	}

	log.Printf("[DB-Cache] Đã đồng bộ %d từ vựng và %d động từ từ Database vào bộ nhớ đệm!", len(vocabs), len(verbs))
	return nil
}

// SeedDatabase nạp dữ liệu mặc định từ file JSON vào DB nếu bảng rỗng
func (s *Server) SeedDatabase(dataPath string) error {
	// 1. Seed user_vocabulary
	var countVocab int
	err := s.db.db.QueryRow("SELECT COUNT(*) FROM user_vocabulary").Scan(&countVocab)
	if err == nil && countVocab == 0 {
		log.Println("[Seed] Đang nạp từ vựng mặc định từ vocabulary.json vào DB...")
		vocabPath := filepath.Join(dataPath, "vocabulary.json")
		byteValue, err := os.ReadFile(vocabPath)
		if err == nil {
			var vocabs []struct {
				Word           string `json:"word"`
				Reading        string `json:"reading"`
				Meaning        string `json:"meaning"`
				Level          string `json:"level"`
				PartOfSpeech   string `json:"part_of_speech"`
				Example        string `json:"example"`
				ExampleReading string `json:"example_reading"`
				ExampleMeaning string `json:"example_meaning"`
			}
			if err := json.Unmarshal(byteValue, &vocabs); err == nil {
				tx, err := s.db.db.Begin()
				if err == nil {
					stmt, _ := tx.Prepare(`INSERT INTO user_vocabulary 
						(word, reading, meaning, level, part_of_speech, example, example_reading, example_meaning, created_by) 
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'system')`)
					for _, v := range vocabs {
						_, _ = stmt.Exec(v.Word, v.Reading, v.Meaning, v.Level, v.PartOfSpeech, v.Example, v.ExampleReading, v.ExampleMeaning)
					}
					_ = stmt.Close()
					_ = tx.Commit()
					log.Printf("[Seed] Đã nạp thành công %d từ vựng vào DB!", len(vocabs))
				}
			}
		}
	}

	// 2. Seed user_verbs — force reseed if DB has fewer verbs than the full dataset
	var countVerbs int
	err = s.db.db.QueryRow("SELECT COUNT(*) FROM user_verbs").Scan(&countVerbs)
	if err == nil && countVerbs < 418 {
		log.Printf("[Seed] user_verbs có %d mục, cần %d. Đang xoá và nạp lại toàn bộ từ verbs.json...", countVerbs, 418)
		_, _ = s.db.db.Exec("DELETE FROM user_verbs")
		verbsPath := filepath.Join(dataPath, "verbs.json")
		byteValue, err := os.ReadFile(verbsPath)
		if err == nil {
			var verbs []struct {
				Masu        string `json:"masu"`
				Meaning     string `json:"meaning"`
				Dictionary  string `json:"dictionary"`
				Group       int    `json:"group"`
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
			}
			if err := json.Unmarshal(byteValue, &verbs); err == nil {
				tx, err := s.db.db.Begin()
				if err == nil {
					stmt, _ := tx.Prepare(`INSERT INTO user_verbs 
						(masu, meaning, dictionary, group_num, te, ta, nai, ability, volitional, imperative, causative, prohibitive, conditional, passive, created_by) 
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'system')`)
					for _, v := range verbs {
						_, _ = stmt.Exec(v.Masu, v.Meaning, v.Dictionary, v.Group, v.Te, v.Ta, v.Nai, v.Ability, v.Volitional, v.Imperative, v.Causative, v.Prohibitive, v.Conditional, v.Passive)
					}
					_ = stmt.Close()
					_ = tx.Commit()
					log.Printf("[Seed] Đã nạp thành công %d động từ (Group 1+2+3) vào DB!", len(verbs))
				}
			}
		}
	}

	// 3. Seed documents
	var countDocs int
	err = s.db.db.QueryRow("SELECT COUNT(*) FROM documents").Scan(&countDocs)
	if err == nil && countDocs == 0 {
		log.Println("[Seed] Đang nạp tài liệu mặc định vào DB...")
		defaultDocs := []struct {
			Title       string
			Description string
			URL         string
			Category    string
			Type        string
			Level       string
			ItemsCount  string
			UploadedBy  string
		}{
			{
				Title:       "Giáo trình & Sách học Tiếng Nhật N5 - N3",
				Description: "Tuyển tập các giáo trình chính thống từ N5 đến N3 bao gồm Minna no Nihongo, Soumatome và Shinkanzen Masuta.",
				URL:         "https://drive.google.com/drive/folders/1HytgiK1tJaSGW4wUmHYQRbniPYu3-NLh",
				Category:    "curriculum",
				Type:        "folder",
				Level:       "N5 - N3",
				ItemsCount:  "Thư mục lớn",
				UploadedBy:  "system",
			},
			{
				Title:       "Bộ đề thi & Tài liệu ôn luyện JLPT",
				Description: "Tổng hợp đề thi thử năng lực tiếng Nhật các năm kèm đáp án chi tiết giúp học viên chuẩn bị tốt nhất cho kỳ thi thật.",
				URL:         "https://drive.google.com/drive/folders/14cvGKUh4Gu7ojd2JE6FzWL5hCTSFwhaz",
				Category:    "exams",
				Type:        "folder",
				Level:       "Tổng hợp",
				ItemsCount:  "Thư mục lớn",
				UploadedBy:  "system",
			},
			{
				Title:       "Bài tập Ngữ pháp & Đọc hiểu chuyên sâu",
				Description: "Tổng hợp các bài tập luyện tập chuyên sâu về mẫu câu ngữ pháp và các bài khóa đọc hiểu từ cơ bản đến nâng cao.",
				URL:         "https://drive.google.com/drive/folders/17JFLZlqVgwxJFS0BkHAv1I_szVJz-aQB",
				Category:    "practice",
				Type:        "folder",
				Level:       "N4 - N3",
				ItemsCount:  "Thư mục lớn",
				UploadedBy:  "system",
			},
			{
				Title:       "Sách ôn tập Kanji tổng hợp (PDF)",
				Description: "Tài liệu hướng dẫn viết chữ Hán, ghi nhớ âm On/Kun và các tổ hợp từ ghép thông dụng qua sơ đồ trực quan.",
				URL:         "https://drive.google.com/file/d/1HEjpAKw5i9w9WQz9iESB_tmMNkpIdjbp/view",
				Category:    "kanji",
				Type:        "file",
				Level:       "N5 - N3",
				ItemsCount:  "PDF Document",
				UploadedBy:  "system",
			},
			{
				Title:       "Tài liệu bổ trợ nghe nói & giao tiếp Kaiwa",
				Description: "File âm thanh, kịch bản giao tiếp và các chủ đề hội thoại đời sống giúp rèn luyện phản xạ nghe nói tự nhiên.",
				URL:         "https://drive.google.com/drive/folders/1lwUZCcGfAl2HwhrQVz-R4s-dXMEKpuZD",
				Category:    "kaiwa",
				Type:        "folder",
				Level:       "Mọi cấp độ",
				ItemsCount:  "Thư mục lớn",
				UploadedBy:  "system",
			},
		}

		tx, err := s.db.db.Begin()
		if err == nil {
			stmt, _ := tx.Prepare(`INSERT INTO documents 
				(title, description, url, category, type, level, items_count, uploaded_by) 
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`)
			for _, d := range defaultDocs {
				_, _ = stmt.Exec(d.Title, d.Description, d.URL, d.Category, d.Type, d.Level, d.ItemsCount, d.UploadedBy)
			}
			_ = stmt.Close()
			_ = tx.Commit()
			log.Printf("[Seed] Đã nạp thành công %d tài liệu mặc định vào DB!", len(defaultDocs))
		}
	}
	return nil
}
