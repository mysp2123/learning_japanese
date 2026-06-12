package main

import (
	"log"
	"net/http"
	"path/filepath"

	"learning_japan/backend/api"
)

func main() {
	// Khởi tạo đối tượng máy chủ API trên cổng 8080
	server := api.NewServer(":8080")

	// Xác định thư mục chứa dữ liệu JSON học liệu
	dataPath := filepath.Join("data")

	// Nạp dữ liệu học tập vào RAM trước khi khởi chạy HTTP server
	if err := server.LoadData(dataPath); err != nil {
		log.Fatalf("[Lỗi] Không thể nạp dữ liệu học tập: %v", err)
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
	mux.HandleFunc("/api/user/avatar", server.EnableCORS(server.HandleUploadAvatar))
	mux.HandleFunc("/api/user/avatar/", server.EnableCORS(server.HandleServeAvatar))

	log.Printf("[Khởi động] Go REST API Server đang hoạt động trên cổng %s...", server.Addr)
	log.Printf("[Hướng dẫn] Bạn có thể kiểm tra dữ liệu bảng chữ cái tại: http://localhost%s/api/alphabet", server.Addr)

	// Khởi chạy máy chủ HTTP
	if err := http.ListenAndServe(server.Addr, mux); err != nil {
		log.Fatalf("[Lỗi] Không thể khởi chạy HTTP server: %v", err)
	}
}
