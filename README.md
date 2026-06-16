# NihongoHub — Nền Tảng Học Tiếng Nhật Toàn Diện

NihongoHub là một ứng dụng Full-Stack hiện đại hỗ trợ tự học tiếng Nhật từ cơ bản đến nâng cao. Nền tảng kết hợp các công cụ học tập tương tác trực quan, theo dõi tiến độ cá nhân hóa và thư viện chia sẻ tài liệu từ cộng đồng học viên.

---

## Tính Năng Nổi Bật

### 1. Bảng Điều Khiển Học Tập (Dashboard)
* **Thống kê thời gian thực (Premium Stats Grid)**: Theo dõi chuỗi học tập (Streak), số câu hỏi đã luyện tập hôm nay, tỷ lệ trả lời chính xác (%) và tổng số từ vựng đã thuộc.
* **Gợi ý từ vựng hàng ngày**: Đề xuất ngẫu nhiên 3 từ vựng phù hợp với trình độ hiện tại của người dùng (N5, N4, N3...).
* **Bảng viết Kanji ảo (Writing Pad)**: Luyện viết chữ Kanji nét vẽ chuẩn xác ngay trên trình duyệt.
<img width="1694" height="859" alt="image" src="https://github.com/user-attachments/assets/77d566f3-e8f9-4920-bd15-bc7eaa84415a" />

### 2. Các Chế Độ Học & Kiểm Tra Đa Dạng
* **Bảng chữ cái tương tác (Kana Grid)**: Học Hiragana và Katakana kèm audio phát âm bản xứ.
* **Luyện tập & Phản xạ (Quiz Runner)**:
  * Trắc nghiệm tiêu chuẩn (Standard).
  * Luyện nghe phản xạ (Listening Quiz).
  * Chạy đua thời gian (Time Attack).
  * Flashcard tự động (Auto-playing Flashcards).
<img width="796" height="840" alt="image" src="https://github.com/user-attachments/assets/7cf7b668-8cc6-4446-a86a-ad8e5343060a" />


### 3. Thư Viện Tài Liệu Cộng Đồng (Community Library)
* Hỗ trợ tải lên và chia sẻ các tệp tài liệu tự học (`.pdf`, `.docx`, `.xlsx`...) hoặc đính kèm liên kết ngoài (Google Drive).
* Tìm kiếm và phân loại tài liệu theo trình độ (N5, N4, N3, General).
<img width="1491" height="515" alt="image" src="https://github.com/user-attachments/assets/f34bec5d-2ee4-44ac-9209-1c327ac05d88" />
<img width="402" height="566" alt="image" src="https://github.com/user-attachments/assets/dba87f1c-c2da-41f9-9ff9-3ad0b0d1b12a" />


### 4. Học Qua Video & Chat Bot AI
* Xem các bài giảng ngữ pháp/từ vựng trực quan và thảo luận dưới phần bình luận.
* Phòng Chat mô phỏng hội thoại tiếng Nhật cùng trợ lý học tập AI.
<img width="1691" height="860" alt="image" src="https://github.com/user-attachments/assets/fb5e8137-df10-4fd4-b7e7-688fdf648b7f" />

---

## Công Nghệ Sử Dụng

### Frontend
* **Core**: React.js (Vite)
* **Icons**: Lucide Icons
* **Styling**: Vanilla CSS (thiết kế tối giản, đơn sắc, cấu trúc lưới linh hoạt và phản hồi tốt trên mobile).

### Backend
* **Language**: Go (Golang)
* **Database**: PostgreSQL (quản lý người dùng, tài liệu cộng đồng, tiến độ học tập).
* **Caching**: In-Memory Cache tự động đồng bộ hóa với Database để tối ưu hóa hiệu năng truy vấn.

### DevOps & Web Server
* **Reverse Proxy**: Nginx (điều hướng và phân tải giữa Static Frontend và API Backend).

---

## Cấu Trúc Thư Mục Dự Án

```text
├── backend/
│   ├── api/             # HTTP Handlers, DB Connections, Server Engine
│   ├── data/            # Bản sao học liệu gốc (JSON) & Script Import dữ liệu động từ file Excel
│   └── main.go          # Điểm khởi chạy của Go backend service (Port: 8081)
├── frontend/
│   ├── dist/            # Sản phẩm build tĩnh của Frontend
│   ├── src/
│   │   ├── components/  # Chứa các Component UI (Dashboard, QuizRunner, DocumentList...)
│   │   ├── App.jsx      # Thiết lập Routes và Quản lý State toàn cục
│   │   ├── index.css    # Hệ thống Design Tokens và CSS Variables
│   │   └── main.jsx
│   └── package.json
└── README.md
```

---

## Hướng Dẫn Cài Đặt & Chạy Dưới Local

### 1. Chuẩn Bị Cơ Sở Dữ Liệu (PostgreSQL)
Tạo một cơ sở dữ liệu PostgreSQL trên máy của bạn và chạy mã nguồn cấu hình schema (được lưu tại `backend/api/db.go`). Hệ thống tự động nhận dạng kết nối thông qua các biến môi trường sau:
```bash
# Đặt các biến môi trường hệ thống (hoặc file .env)
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_password
DB_NAME=learning_japanese
SSL_MODE=disable
```

### 2. Khởi Chạy Backend (Go)
Di chuyển vào thư mục `backend`, cài đặt các thư viện phụ thuộc và chạy ứng dụng:
```bash
cd backend
go mod tidy
go run main.go
```
*Backend sẽ lắng nghe tại cổng `http://localhost:8081`.*

### 3. Khởi Chạy Frontend (Vite)
Di chuyển vào thư mục `frontend`, cài đặt packages và chạy môi trường phát triển:
```bash
cd frontend
npm install
npm run dev
```
*Frontend sẽ chạy tại cổng `http://localhost:5173`.*

### 4. Cấu Hình Nginx Reverse Proxy (Khuyên Dùng)
Để chạy hoàn chỉnh môi trường Production và tránh lỗi CORS, cấu hình Nginx làm Proxy ngược như sau:
```nginx
server {
    listen 80;
    server_name localhost;

    # Serving Frontend Static files
    location / {
        root C:/Users/vuongnt/learning_japanese/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxying API requests to Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 20M; # Cho phép upload tài liệu lớn hơn
    }
}
```

---

## Đóng Góp & Phát Triển
1. Mọi tính năng mới nên được phát triển trên nhánh `dev`.
2. Sau khi kiểm thử cục bộ hoàn tất, tiến hành gộp (merge) nhánh `dev` vào nhánh chính `main` trước khi đẩy (push) lên máy chủ Git Production.
