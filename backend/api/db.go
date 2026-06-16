package api

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/lib/pq"
)

// DBManager quản lý kết nối và các truy vấn PostgreSQL
type DBManager struct {
	db *sql.DB
}

// NewDBManager khởi tạo đối tượng quản lý database
func NewDBManager() *DBManager {
	return &DBManager{}
}

// Connect kết nối và khởi tạo bảng trong PostgreSQL
func (m *DBManager) Connect() {
	connStr := "postgres://postgres:Abcd1234@localhost:5432/nihongohub?sslmode=disable"
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("[DB Lỗi] Không thể kết nối cơ sở dữ liệu: %v", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatalf("[DB Lỗi] Không thể ping cơ sở dữ liệu: %v", err)
	}

	m.db = db
	log.Println("[DB] Kết nối thành công đến PostgreSQL!")

	// Khởi tạo bảng bao gồm các bảng video học tập mới
	createTablesSQL := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(50) UNIQUE NOT NULL,
		password VARCHAR(255) NOT NULL,
		full_name VARCHAR(100) NOT NULL,
		avatar TEXT DEFAULT '🌸',
		level VARCHAR(10) DEFAULT 'N5',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS messages (
		id SERIAL PRIMARY KEY,
		sender VARCHAR(100) NOT NULL,
		avatar TEXT NOT NULL,
		content TEXT NOT NULL,
		timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS videos (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		youtube_id VARCHAR(50) UNIQUE NOT NULL,
		added_by VARCHAR(50) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS video_comments (
		id SERIAL PRIMARY KEY,
		video_id INT NOT NULL,
		sender VARCHAR(100) NOT NULL,
		avatar TEXT NOT NULL,
		content TEXT NOT NULL,
		timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS video_stats (
		id SERIAL PRIMARY KEY,
		video_id INT NOT NULL,
		username VARCHAR(50) NOT NULL,
		views INT DEFAULT 0,
		watch_seconds INT DEFAULT 0,
		last_watched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(video_id, username)
	);

	CREATE TABLE IF NOT EXISTS user_vocabulary (
		id SERIAL PRIMARY KEY,
		word VARCHAR(255) NOT NULL,
		reading VARCHAR(255) NOT NULL,
		meaning TEXT NOT NULL,
		level VARCHAR(10) NOT NULL,
		part_of_speech VARCHAR(100) NOT NULL,
		example TEXT,
		example_reading TEXT,
		example_meaning TEXT,
		created_by VARCHAR(50) DEFAULT 'system'
	);

	CREATE TABLE IF NOT EXISTS user_verbs (
		id SERIAL PRIMARY KEY,
		masu VARCHAR(255) NOT NULL,
		meaning TEXT NOT NULL,
		dictionary VARCHAR(255) NOT NULL,
		group_num SMALLINT DEFAULT 0,
		te VARCHAR(255),
		ta VARCHAR(255),
		nai VARCHAR(255),
		ability VARCHAR(255),
		volitional VARCHAR(255),
		imperative VARCHAR(255),
		causative VARCHAR(255),
		prohibitive VARCHAR(255),
		conditional VARCHAR(255),
		passive VARCHAR(255),
		created_by VARCHAR(50) DEFAULT 'system'
	);

	CREATE TABLE IF NOT EXISTS user_study_list (
		username VARCHAR(50) NOT NULL,
		item_type VARCHAR(20) NOT NULL,
		item_id VARCHAR(50) NOT NULL,
		status VARCHAR(20) DEFAULT 'review',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY(username, item_type, item_id)
	);

	CREATE TABLE IF NOT EXISTS user_vocab_lists (
		id SERIAL PRIMARY KEY,
		username VARCHAR(50) NOT NULL,
		list_name VARCHAR(255) NOT NULL,
		description TEXT DEFAULT '',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS user_vocab_list_items (
		id SERIAL PRIMARY KEY,
		list_id INT NOT NULL REFERENCES user_vocab_lists(id) ON DELETE CASCADE,
		item_type VARCHAR(20) NOT NULL,
		item_id VARCHAR(50) NOT NULL,
		notes TEXT DEFAULT '',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(list_id, item_type, item_id)
	);

	CREATE TABLE IF NOT EXISTS documents (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		description TEXT DEFAULT '',
		url TEXT NOT NULL,
		category VARCHAR(50) DEFAULT 'all',
		type VARCHAR(20) DEFAULT 'file',
		level VARCHAR(50) DEFAULT 'Tổng hợp',
		items_count VARCHAR(100) DEFAULT '',
		uploaded_by VARCHAR(100) DEFAULT 'system',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	`
	_, err = m.db.Exec(createTablesSQL)
	if err != nil {
		log.Fatalf("[DB Lỗi] Không thể khởi tạo bảng: %v", err)
	}

	// Migration: add group_num column if it doesn't exist yet (for existing databases)
	_, _ = m.db.Exec(`ALTER TABLE user_verbs ADD COLUMN IF NOT EXISTS group_num SMALLINT DEFAULT 0`)
	
	// Migration: ensure avatar columns can hold long URLs / base64 strings
	_, _ = m.db.Exec(`ALTER TABLE users ALTER COLUMN avatar TYPE TEXT`)
	_, _ = m.db.Exec(`ALTER TABLE messages ALTER COLUMN avatar TYPE TEXT`)
	_, _ = m.db.Exec(`ALTER TABLE video_comments ALTER COLUMN avatar TYPE TEXT`)

	log.Println("[DB] Đã thiết lập các bảng database thành công!")
}

// GetUserByUsernameAndPassword truy vấn thông tin người dùng khi đăng nhập
func (m *DBManager) GetUserByUsernameAndPassword(username, password string) (*User, error) {
	hashed := hashPassword(password)
	var u User
	err := m.db.QueryRow("SELECT id, username, full_name, avatar, level, created_at FROM users WHERE username = $1 AND password = $2",
		username, hashed).Scan(&u.ID, &u.Username, &u.FullName, &u.Avatar, &u.Level, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// UserExists kiểm tra sự tồn tại của tên đăng nhập
func (m *DBManager) UserExists(username string) (bool, error) {
	var count int
	err := m.db.QueryRow("SELECT COUNT(*) FROM users WHERE username = $1", username).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// CreateUser tạo người dùng mới
func (m *DBManager) CreateUser(username, password, fullName, avatar string) error {
	hashed := hashPassword(password)
	if avatar == "" {
		avatar = "🌸"
	}
	_, err := m.db.Exec("INSERT INTO users (username, password, full_name, avatar, level) VALUES ($1, $2, $3, $4, $5)",
		username, hashed, fullName, avatar, "N5")
	return err
}

// UpdateUserProfile cập nhật họ tên, avatar và level người dùng
func (m *DBManager) UpdateUserProfile(username, fullName, avatar, level string) error {
	_, err := m.db.Exec("UPDATE users SET full_name = $1, avatar = $2, level = $3 WHERE username = $4",
		fullName, avatar, level, username)
	return err
}

// SaveMessage lưu tin nhắn chat vào database
func (m *DBManager) SaveMessage(sender, avatar, content string, timestamp time.Time) (int, error) {
	var lastID int
	err := m.db.QueryRow("INSERT INTO messages (sender, avatar, content, timestamp) VALUES ($1, $2, $3, $4) RETURNING id",
		sender, avatar, content, timestamp).Scan(&lastID)
	return lastID, err
}

// GetRecentMessages lấy danh sách tin nhắn lịch sử (tối đa 100 tin gần nhất)
func (m *DBManager) GetRecentMessages() ([]Message, error) {
	rows, err := m.db.Query("SELECT id, sender, avatar, content, timestamp FROM messages ORDER BY timestamp DESC LIMIT 100")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]Message, 0)
	for rows.Next() {
		var msg Message
		if err := rows.Scan(&msg.ID, &msg.Sender, &msg.Avatar, &msg.Content, &msg.Timestamp); err != nil {
			continue
		}
		list = append(list, msg)
	}

	// Đảo ngược để xếp theo thứ tự thời gian tăng dần (cũ đến mới)
	for i, j := 0, len(list)-1; i < j; i, j = i+1, j-1 {
		list[i], list[j] = list[j], list[i]
	}

	return list, nil
}

// AddVideo lưu một video học tập mới vào database
func (m *DBManager) AddVideo(title, youtubeID, addedBy string) (int, error) {
	var lastID int
	err := m.db.QueryRow("INSERT INTO videos (title, youtube_id, added_by) VALUES ($1, $2, $3) RETURNING id",
		title, youtubeID, addedBy).Scan(&lastID)
	return lastID, err
}

// GetVideos lấy danh sách tất cả video học tập
func (m *DBManager) GetVideos() ([]Video, error) {
	rows, err := m.db.Query("SELECT id, title, youtube_id, added_by, created_at FROM videos ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]Video, 0)
	for rows.Next() {
		var v Video
		if err := rows.Scan(&v.ID, &v.Title, &v.YoutubeID, &v.AddedBy, &v.CreatedAt); err != nil {
			continue
		}
		list = append(list, v)
	}
	return list, nil
}

// AddVideoComment lưu bình luận dưới video
func (m *DBManager) AddVideoComment(videoID int, sender, avatar, content string) (int, error) {
	var lastID int
	err := m.db.QueryRow("INSERT INTO video_comments (video_id, sender, avatar, content) VALUES ($1, $2, $3, $4) RETURNING id",
		videoID, sender, avatar, content).Scan(&lastID)
	return lastID, err
}

// GetVideoComments lấy danh sách bình luận của một video cụ thể
func (m *DBManager) GetVideoComments(videoID int) ([]VideoComment, error) {
	rows, err := m.db.Query("SELECT id, video_id, sender, avatar, content, timestamp FROM video_comments WHERE video_id = $1 ORDER BY timestamp ASC", videoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]VideoComment, 0)
	for rows.Next() {
		var c VideoComment
		if err := rows.Scan(&c.ID, &c.VideoID, &c.Sender, &c.Avatar, &c.Content, &c.Timestamp); err != nil {
			continue
		}
		list = append(list, c)
	}
	return list, nil
}

// UpdateVideoStats cập nhật lượt xem và số giây xem của tài khoản
func (m *DBManager) UpdateVideoStats(videoID int, username string, duration int, isNewView bool) error {
	viewIncrement := 0
	if isNewView {
		viewIncrement = 1
	}

	query := `
		INSERT INTO video_stats (video_id, username, views, watch_seconds, last_watched)
		VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
		ON CONFLICT (video_id, username) DO UPDATE SET
			views = video_stats.views + EXCLUDED.views,
			watch_seconds = video_stats.watch_seconds + EXCLUDED.watch_seconds,
			last_watched = CURRENT_TIMESTAMP
	`
	_, err := m.db.Exec(query, videoID, username, viewIncrement, duration)
	return err
}

// GetVideoStats lấy thông kê xem video của từng tài khoản
func (m *DBManager) GetVideoStats(videoID int) ([]VideoStatReport, error) {
	query := `
		SELECT vs.video_id, vs.username, COALESCE(u.full_name, vs.username) as full_name, vs.views, vs.watch_seconds, vs.last_watched
		FROM video_stats vs
		LEFT JOIN users u ON vs.username = u.username
		WHERE vs.video_id = $1
		ORDER BY vs.watch_seconds DESC
	`
	rows, err := m.db.Query(query, videoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]VideoStatReport, 0)
	for rows.Next() {
		var r VideoStatReport
		if err := rows.Scan(&r.VideoID, &r.Username, &r.FullName, &r.Views, &r.WatchSeconds, &r.LastWatched); err != nil {
			continue
		}
		list = append(list, r)
	}
	return list, nil
}

// AddDocument thêm tài liệu mới vào database
func (m *DBManager) AddDocument(title, description, url, category, docType, level, itemsCount, uploadedBy string) (int, error) {
	var lastID int
	query := `INSERT INTO documents (title, description, url, category, type, level, items_count, uploaded_by) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`
	err := m.db.QueryRow(query, title, description, url, category, docType, level, itemsCount, uploadedBy).Scan(&lastID)
	return lastID, err
}

// GetDocuments lấy danh sách tất cả tài liệu xếp theo thời gian mới nhất trước
func (m *DBManager) GetDocuments() ([]Document, error) {
	rows, err := m.db.Query("SELECT id, title, description, url, category, type, level, items_count, uploaded_by, created_at FROM documents ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]Document, 0)
	for rows.Next() {
		var d Document
		if err := rows.Scan(&d.ID, &d.Title, &d.Description, &d.URL, &d.Category, &d.Type, &d.Level, &d.ItemsCount, &d.UploadedBy, &d.CreatedAt); err != nil {
			continue
		}
		list = append(list, d)
	}
	return list, nil
}
