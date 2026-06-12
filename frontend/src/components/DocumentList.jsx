import React, { useState } from 'react';

// Custom inline SVG icons
const SearchIcon = ({ className }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
  </svg>
);

const FolderIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </svg>
);

const FileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const InfoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

function DocumentList() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const documents = [
    {
      id: 'doc1',
      title: 'Giáo trình & Sách học Tiếng Nhật N5 - N3',
      description: 'Tuyển tập các giáo trình chính thống từ N5 đến N3 bao gồm Minna no Nihongo, Soumatome và Shinkanzen Masuta.',
      url: 'https://drive.google.com/drive/folders/1HytgiK1tJaSGW4wUmHYQRbniPYu3-NLh',
      category: 'curriculum',
      type: 'folder',
      level: 'N5 - N3',
      itemsCount: 'Thư mục lớn',
    },
    {
      id: 'doc2',
      title: 'Bộ đề thi & Tài liệu ôn luyện JLPT',
      description: 'Tổng hợp đề thi thử năng lực tiếng Nhật các năm kèm đáp án chi tiết giúp học viên chuẩn bị tốt nhất cho kỳ thi thật.',
      url: 'https://drive.google.com/drive/folders/14cvGKUh4Gu7ojd2JE6FzWL5hCTSFwhaz',
      category: 'exams',
      type: 'folder',
      level: 'Tổng hợp',
      itemsCount: 'Thư mục lớn',
    },
    {
      id: 'doc3',
      title: 'Bài tập Ngữ pháp & Đọc hiểu chuyên sâu',
      description: 'Tổng hợp các bài tập luyện tập chuyên sâu về mẫu câu ngữ pháp và các bài khóa đọc hiểu từ cơ bản đến nâng cao.',
      url: 'https://drive.google.com/drive/folders/17JFLZlqVgwxJFS0BkHAv1I_szVJz-aQB',
      category: 'practice',
      type: 'folder',
      level: 'N4 - N3',
      itemsCount: 'Thư mục lớn',
    },
    {
      id: 'doc4',
      title: 'Sách ôn tập Kanji tổng hợp (PDF)',
      description: 'Tài liệu hướng dẫn viết chữ Hán, ghi nhớ âm On/Kun và các tổ hợp từ ghép thông dụng qua sơ đồ trực quan.',
      url: 'https://drive.google.com/file/d/1HEjpAKw5i9w9WQz9iESB_tmMNkpIdjbp/view',
      category: 'kanji',
      type: 'file',
      level: 'N5 - N3',
      itemsCount: 'PDF Document',
    },
    {
      id: 'doc5',
      title: 'Tài liệu bổ trợ nghe nói & giao tiếp Kaiwa',
      description: 'File âm thanh, kịch bản giao tiếp và các chủ đề hội thoại đời sống giúp rèn luyện phản xạ nghe nói tự nhiên.',
      url: 'https://drive.google.com/drive/folders/1lwUZCcGfAl2HwhrQVz-R4s-dXMEKpuZD',
      category: 'kaiwa',
      type: 'folder',
      level: 'Mọi cấp độ',
      itemsCount: 'Thư mục lớn',
    },
  ];

  const categories = [
    { value: 'all', label: 'Tất cả tài liệu' },
    { value: 'curriculum', label: 'Giáo trình học' },
    { value: 'exams', label: 'Luyện thi JLPT' },
    { value: 'practice', label: 'Bài tập chuyên sâu' },
    { value: 'kanji', label: 'Chữ Hán Kanji' },
    { value: 'kaiwa', label: 'Luyện nghe & Kaiwa' },
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h1>Thư Viện Tài Liệu Học Tập</h1>
        <p>Kho lưu trữ tài liệu, giáo trình, đề thi thử JLPT từ nguồn Google Drive được sắp xếp khoa học phục vụ cho việc tự học hiệu quả.</p>
      </div>

      {/* Search & Categories Navbar */}
      <div className="documents-toolbar">
        <div className="doc-search-wrapper">
          <SearchIcon className="doc-search-icon" />
          <input
            type="text"
            className="doc-search-input"
            placeholder="Tìm kiếm giáo trình, đề thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="doc-categories">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`doc-cat-btn ${activeCategory === cat.value ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length > 0 ? (
        <div className="docs-grid">
          {filteredDocs.map((doc) => (
            <div className="doc-card" key={doc.id}>
              <div className="doc-card-top">
                <div className={`doc-icon-badge ${doc.type}`}>
                  {doc.type === 'folder' ? <FolderIcon /> : <FileIcon />}
                </div>
                <span className="doc-level-badge">{doc.level}</span>
              </div>

              <div className="doc-card-body">
                <h3 className="doc-title">{doc.title}</h3>
                <p className="doc-description">{doc.description}</p>
              </div>

              <div className="doc-card-footer">
                <span className="doc-meta-info">{doc.itemsCount}</span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="doc-action-btn"
                >
                  Mở tài liệu <ExternalLinkIcon />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="docs-empty-state">
          <div className="empty-icon" style={{ color: 'var(--text-secondary)', marginBottom: '1rem', display: 'inline-flex' }}>
            <InfoIcon />
          </div>
          <h3>Không tìm thấy tài liệu phù hợp</h3>
          <p>Thử tìm kiếm với từ khóa khác hoặc chuyển danh mục hiển thị.</p>
        </div>
      )}

      {/* Helpful learning tip */}
      <div className="doc-tip-banner">
        <div className="tip-badge">Mẹo tự học</div>
        <p>Hãy tải và in các tập tin bài tập ra giấy để dễ dàng theo dõi, kết hợp luyện viết chữ Kanji mỗi ngày bằng công cụ **Bảng viết** ngay trên hệ thống của chúng tôi.</p>
      </div>
    </div>
  );
}

export default DocumentList;
