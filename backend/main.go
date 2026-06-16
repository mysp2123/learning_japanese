package main

import (
	"log"
	"net/http"
	"path/filepath"

	"learning_japan/backend/api"
)

func main() {
	// Khởi tạo đối tượng máy chủ API trên cổng 8080
	server := api.NewServer(":8081")

	// Khởi tạo kết nối cơ sở dữ liệu PostgreSQL
	server.InitDB()

	// Xác định thư mục chứa dữ liệu JSON học liệu
	dataPath := filepath.Join("data")

	// Nạp dữ liệu học tập vào RAM trước khi khởi chạy HTTP server
	if err := server.LoadData(dataPath); err != nil {
		log.Fatalf("[Lỗi] Không thể nạp dữ liệu học tập: %v", err)
	}

	// Tự động nạp dữ liệu từ file JSON vào DB và đồng bộ ngược lại cache
	if err := server.SeedDatabase(dataPath); err != nil {
		log.Printf("[Cảnh báo] Không thể seed cơ sở dữ liệu: %v", err)
	}
	if err := server.ReloadCacheFromDB(); err != nil {
		log.Printf("[Cảnh báo] Không thể đồng bộ dữ liệu từ DB: %v", err)
	}

	// Thiết lập các Endpoint định tuyến qua các Module Handlers
	mux := http.NewServeMux()
	mux.HandleFunc("/api/alphabet", server.EnableCORS(server.HandleAlphabet))
	mux.HandleFunc("/api/vocabulary", server.EnableCORS(server.HandleVocabulary))
	mux.HandleFunc("/api/kanji", server.EnableCORS(server.HandleKanji))
	mux.HandleFunc("/api/grammar", server.EnableCORS(server.HandleGrammar))
	mux.HandleFunc("/api/quizzes", server.EnableCORS(server.HandleQuizzes))
	mux.HandleFunc("/api/chat/messages", server.EnableCORS(server.HandleChatMessages))
	mux.HandleFunc("/api/chat/stream", server.EnableCORS(server.HandleChatStream))
	mux.HandleFunc("/api/auth/register", server.EnableCORS(server.HandleRegister))
	mux.HandleFunc("/api/auth/login", server.EnableCORS(server.HandleLogin))
	mux.HandleFunc("/api/users", server.EnableCORS(server.HandleUsers))
	mux.HandleFunc("/api/user/profile", server.EnableCORS(server.HandleUpdateProfile))
	mux.HandleFunc("/api/user/avatar", server.EnableCORS(server.HandleUploadAvatar))
	mux.HandleFunc("/api/user/avatar/", server.EnableCORS(server.HandleServeAvatar))
	mux.HandleFunc("/api/videos", server.EnableCORS(server.HandleVideos))
	mux.HandleFunc("/api/videos/comments", server.EnableCORS(server.HandleVideoComments))
	mux.HandleFunc("/api/videos/stats", server.EnableCORS(server.HandleVideoStats))
	mux.HandleFunc("/api/verbs", server.EnableCORS(server.HandleVerbs))
	mux.HandleFunc("/api/vocabulary/add", server.EnableCORS(server.HandleAddVocabulary))
	mux.HandleFunc("/api/verbs/add", server.EnableCORS(server.HandleAddVerb))
	mux.HandleFunc("/api/vocab-lists", server.EnableCORS(server.HandleVocabLists))
	mux.HandleFunc("/api/vocab-lists/items", server.EnableCORS(server.HandleVocabListItems))
	mux.HandleFunc("/api/vocab-lists/by-id", server.EnableCORS(server.HandleVocabListsById))
	mux.HandleFunc("/api/study-list", server.EnableCORS(server.HandleStudyList))
	mux.HandleFunc("/api/documents", server.EnableCORS(server.HandleDocuments))
	mux.HandleFunc("/api/documents/upload", server.EnableCORS(server.HandleUploadDocumentFile))
	mux.HandleFunc("/api/documents/files/", server.EnableCORS(server.HandleServeDocumentFile))

	log.Printf("[Khởi động] Go REST API Server đang hoạt động trên cổng %s...", server.Addr)
	log.Printf("[Hướng dẫn] Bạn có thể kiểm tra dữ liệu bảng chữ cái tại: http://localhost%s/api/alphabet", server.Addr)

	// Khởi chạy máy chủ HTTP
	if err := http.ListenAndServe(server.Addr, mux); err != nil {
		log.Fatalf("[Lỗi] Không thể khởi chạy HTTP server: %v", err)
	}
}
