import React, { useState, useEffect } from 'react';

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

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LinkIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

function DocumentList({ profile }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shareType, setShareType] = useState('link'); // 'link' or 'file'
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('curriculum');
  const [level, setLevel] = useState('Tổng hợp');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${window.API_BASE}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data || []);
      } else {
        console.error("Lỗi lấy danh sách tài liệu từ server");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      let finalUrl = url;
      let finalType = 'link';
      let itemsCount = 'Liên kết';

      if (shareType === 'file') {
        if (!file) {
          setErrorMsg('Vui lòng chọn file để tải lên.');
          setIsSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch(`${window.API_BASE}/documents/upload`, {
          method: 'POST',
          body: formData
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || 'Lỗi tải tệp lên máy chủ.');
        }

        const uploadData = await uploadRes.json();
        finalUrl = uploadData.url;
        finalType = 'file';
        itemsCount = uploadData.itemsCount || 'PDF Document';
      } else {
        if (!url) {
          setErrorMsg('Vui lòng nhập liên kết tài liệu.');
          setIsSubmitting(false);
          return;
        }
      }

      const res = await fetch(`${window.API_BASE}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          url: finalUrl,
          category,
          type: finalType,
          level,
          itemsCount,
          uploadedBy: profile?.username || 'Thành viên'
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        setUrl('');
        setFile(null);
        setCategory('curriculum');
        setLevel('Tổng hợp');
        fetchDocuments();
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Lỗi lưu thông tin tài liệu.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <style>{`
        /* Share Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: #ffffff;
          border-radius: 12px;
          width: 90%;
          max-width: 520px;
          padding: 2rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #e2e8f0;
          animation: modalFadeIn 0.2s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .modal-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .modal-close-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
        }
        .modal-close-btn:hover {
          color: #0f172a;
        }
        .form-group {
          margin-bottom: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .form-group label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #334155;
        }
        .form-group input[type="text"],
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 0.65rem 0.85rem;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.9rem;
          outline: none;
          font-family: inherit;
          background-color: #ffffff;
          color: #0f172a;
          box-sizing: border-box;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #0f172a;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .share-type-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .share-type-btn {
          flex: 1;
          padding: 0.5rem;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;
        }
        .share-type-btn.active {
          border-color: #0f172a;
          background: #0f172a;
          color: #ffffff;
        }
        .modal-error {
          padding: 0.75rem 1rem;
          border-radius: 8px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          font-size: 0.82rem;
          margin-bottom: 1.25rem;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        .doc-icon-badge.link {
          background-color: #f0fdf4;
          color: #166534;
        }
        .doc-uploaded-by {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
          display: block;
        }
        .documents-header-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .btn-share {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          border: none;
          background-color: #0f172a;
          color: #ffffff;
          transition: background-color 0.15s;
        }
        .btn-share:hover {
          background-color: #1e293b;
        }
        .doc-card-community-label {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 600;
          margin-top: 0.4rem;
        }
      `}</style>

      <div className="documents-header-wrapper">
        <div className="documents-header" style={{ flex: 1, minWidth: '280px' }}>
          <h1>Thư Viện Tài Liệu Học Tập</h1>
          <p>Chia sẻ và khai thác kho tài liệu tự học, đề thi thử JLPT từ cộng đồng học viên NihongoHub.</p>
        </div>
        <button className="btn-share" onClick={() => setIsModalOpen(true)}>
          <PlusIcon /> Chia sẻ tài liệu
        </button>
      </div>

      {/* Search & Categories Navbar */}
      <div className="documents-toolbar">
        <div className="doc-search-wrapper">
          <SearchIcon className="doc-search-icon" />
          <input
            type="text"
            className="doc-search-input"
            placeholder="Tìm kiếm tài liệu..."
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
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Đang tải kho tài liệu...
        </div>
      ) : filteredDocs.length > 0 ? (
        <div className="docs-grid">
          {filteredDocs.map((doc) => (
            <div className="doc-card" key={doc.id}>
              <div className="doc-card-top">
                <div className={`doc-icon-badge ${doc.type}`}>
                  {doc.type === 'folder' ? <FolderIcon /> : doc.type === 'file' ? <FileIcon /> : <LinkIcon />}
                </div>
                <span className="doc-level-badge">{doc.level}</span>
              </div>

              <div className="doc-card-body">
                <h3 className="doc-title">{doc.title}</h3>
                <p className="doc-description">{doc.description}</p>
                <span className="doc-card-community-label">
                  Người chia sẻ: {doc.uploadedBy || 'Cộng đồng'}
                </span>
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


      {/* Document Upload / Share Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chia sẻ tài liệu mới</h2>
              <button className="modal-close-btn" onClick={() => !isSubmitting && setIsModalOpen(false)} disabled={isSubmitting}>
                <CloseIcon />
              </button>
            </div>

            {errorMsg && <div className="modal-error">{errorMsg}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Hình thức chia sẻ</label>
                <div className="share-type-tabs">
                  <button
                    type="button"
                    className={`share-type-btn ${shareType === 'link' ? 'active' : ''}`}
                    onClick={() => setShareType('link')}
                    disabled={isSubmitting}
                  >
                    Gắn liên kết (Drive/Docs)
                  </button>
                  <button
                    type="button"
                    className={`share-type-btn ${shareType === 'file' ? 'active' : ''}`}
                    onClick={() => setShareType('file')}
                    disabled={isSubmitting}
                  >
                    Tải tệp lên (PDF, DOCX, XLSX)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Tiêu đề tài liệu</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giáo trình Minna no Nihongo N5"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>Mô tả chi tiết</label>
                <textarea
                  placeholder="Mô tả tóm tắt nội dung tài liệu..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  disabled={isSubmitting}
                />
              </div>

              {shareType === 'link' ? (
                <div className="form-group">
                  <label>Đường dẫn liên kết (URL)</label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required={shareType === 'link'}
                    disabled={isSubmitting}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>Chọn tệp từ máy tính</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                    onChange={(e) => setFile(e.target.files[0])}
                    required={shareType === 'file'}
                    disabled={isSubmitting}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Chấp nhận PDF, Word, Excel, PowerPoint, ZIP, RAR (Tối đa 50MB)
                  </span>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Danh mục</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={isSubmitting}>
                    <option value="curriculum">Giáo trình học</option>
                    <option value="exams">Luyện thi JLPT</option>
                    <option value="practice">Bài tập chuyên sâu</option>
                    <option value="kanji">Chữ Hán Kanji</option>
                    <option value="kaiwa">Luyện nghe & Kaiwa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Trình độ</label>
                  <select value={level} onChange={(e) => setLevel(e.target.value)} disabled={isSubmitting}>
                    <option value="Tổng hợp">Tổng hợp</option>
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N5 - N3">N5 - N3</option>
                    <option value="Mọi cấp độ">Mọi cấp độ</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  style={{ border: '1px solid #cbd5e1', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: 'none',
                    fontWeight: 700
                  }}
                >
                  {isSubmitting ? 'Đang chia sẻ...' : 'Chia sẻ ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentList;
