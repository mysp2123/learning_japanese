import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, BookOpen, User, X, Check, Save } from 'lucide-react';
import Modal from './Modal';

const VocabListsPage = ({ profile }) => {
  const username = profile?.rawUsername || 'guest';
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeListId, setActiveListId] = useState(null);
  const [items, setItems] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [errors, setErrors] = useState({});

  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [listNotesPrefix, setListNotesPrefix] = useState('');

  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'alert', onConfirm: null });

  const showAlert = (title, message) => {
    setModalConfig({ isOpen: true, title, message, type: 'alert', onConfirm: null });
  };

  const showModal = (title, message, type, onConfirm) => {
    setModalConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const fetchLists = () => {
    if (!username || username === 'guest') {
      setLoading(false);
      return;
    }

    fetch(`${window.API_BASE}/vocab-lists?username=${username}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setLists(data || []);
      })
      .catch((err) => console.error('Lỗi tải danh sách:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLists();
  }, [username]);

  const fetchListItems = (listId) => {
    fetch(`${window.API_BASE}/vocab-lists/by-id?id=${listId}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data || []);
        setActiveListId(listId);
      })
      .catch((err) => console.error('Lỗi tải mục:', err));
  };

  const handleCreateList = () => {
    const errs = {};
    if (!newListName.trim()) errs.name = 'Tên danh sách không được để trống';
    if (newListName.trim().length > 255) errs.name = 'Tên danh sách quá dài (tối đa 255 ký tự)';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    fetch(`${window.API_BASE}/vocab-lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username,
        list_name: newListName.trim(),
        description: newListDesc.trim(),
      }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || 'Lỗi tạo danh sách'); });
        return res.json();
      })
      .then(() => {
        setNewListName('');
        setNewListDesc('');
        setShowCreateModal(false);
        setErrors({});
        fetchLists();
      })
      .catch((err) => setErrors({ form: err.message }));
  };

  const handleUpdateList = (listId) => {
    fetch(`${window.API_BASE}/vocab-lists/by-id?id=${listId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        list_name: editingList.name,
        description: editingList.description,
      }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error || 'Lỗi cập nhật danh sách'); });
        setEditingList(null);
        fetchLists();
      })
      .catch((err) => showAlert('Lỗi', err.message));
  };

  const handleDeleteList = (listId, listName) => {
    showModal(
      'Xác nhận xoá',
      `Xoá danh sách "${listName}"? Tất cả các mục trong danh sách cũng sẽ bị xoá.`,
      'confirm',
      () => {
        fetch(`${window.API_BASE}/vocab-lists/by-id?id=${listId}`, { method: 'DELETE' })
          .then((res) => {
            if (!res.ok) return res.json().then((d) => { throw new Error(d.error); });
            if (activeListId === listId) {
              setActiveListId(null);
              setItems([]);
            }
            fetchLists();
          })
          .catch((err) => showAlert('Lỗi', err.message));
      }
    );
  };

  const handleAddNoteAndAdd = () => {
    const note = listNotesPrefix.trim();
    if (!note) {
      showAlert('Thông báo', 'Vui lòng nhập ghi chú cho mục');
      return;
    }

    fetch(`${window.API_BASE}/vocab-lists/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        list_id: activeListId,
        item_type: 'user_created',
        item_id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        notes: note,
      }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error); });
        setListNotesPrefix('');
        fetchListItems(activeListId);
      })
      .catch((err) => showAlert('Lỗi', err.message));
  };

  const handleDeleteItem = (itemId, itemType) => {
    fetch(`${window.API_BASE}/vocab-lists/items?list_id=${activeListId}&item_type=${encodeURIComponent(itemType)}&item_id=${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => { throw new Error(d.error); });
        fetchListItems(activeListId);
      })
      .catch((err) => showAlert('Lỗi', err.message));
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="vocab-lists-page" style={{ padding: '1rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <style>{`
        .vocab-lists-page {
          font-family: var(--font, inherit);
          color: var(--text-primary);
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .page-header h2 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .list-card {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 1.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .list-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.06);
          border-color: #0f172a;
        }
        .list-card.active {
          border-color: #0f172a;
          box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.12);
        }
        .list-card h4 {
          margin: 0 0 0.4rem 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          padding-right: 2rem;
        }
        .list-card .list-meta {
          display: flex;
          gap: 0.75rem;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }
        .list-card .list-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          margin-bottom: 0.75rem;
          min-height: 2.6em;
        }
        .list-card .list-count-badge {
          display: inline-block;
          background-color: #f1f5f9;
          color: #0f172a;
          padding: 0.2rem 0.6rem;
          border-radius: 99px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .list-actions {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          display: flex;
          gap: 0.35rem;
        }
        .list-action-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.3rem;
          border-radius: 6px;
          color: var(--text-secondary);
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .list-action-btn:hover {
          background-color: #f1f5f9;
          color: #ef4444;
        }
        .detail-section {
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 1.5rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
      `}</style>

      <div className="page-header">
        <h2>
          <BookOpen size={24} style={{ color: 'var(--primary)' }} />
          Danh sách từ vựng của bạn
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={18} />
          Tạo danh sách mới
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Đang tải danh sách...
        </div>
      ) : lists.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', border: '2px dashed #e2e8f0', borderRadius: '10px', backgroundColor: '#ffffff' }}>
          <BookOpen size={48} strokeWidth={1.5} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '0.5rem' }}>Chưa có danh sách từ vựng nào</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
            Tạo danh sách theo chủ đề riêng của bạn (ví dụ: "Món ăn", "Du lịch", "Thi N3"), sau đó thêm từ vựng vào để học hiệu quả!
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} style={{ marginRight: '0.4rem' }} />
            Tạo danh sách đầu tiên
          </button>
        </div>
      ) : (
        <>
          <div className="list-grid">
            {lists.map((list) => (
              <div
                key={list.id}
                className={`list-card ${activeListId === list.id ? 'active' : ''}`}
                onClick={() => fetchListItems(list.id)}
              >
                <div className="list-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="list-action-btn"
                    onClick={() => {
                      setEditingList({ id: list.id, name: list.list_name, description: list.description || '' });
                    }}
                    title="Sửa"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    className="list-action-btn"
                    onClick={() => handleDeleteList(list.id, list.list_name)}
                    title="Xoá"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <h4>{list.list_name}</h4>
                <div className="list-meta">
                  <span>{formatDate(list.created_at)}</span>
                </div>
                {list.description && (
                  <div className="list-desc">{list.description}</div>
                )}
              </div>
            ))}
          </div>

          {activeListId && (
            <div className="detail-section">
              <h3 style={{ marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={20} style={{ color: 'var(--primary)' }} />
                {lists.find((l) => l.id === activeListId)?.list_name || 'Chi tiết danh sách'}
              </h3>

              <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="chat-input-field"
                  placeholder="Nhập từ vựng hoặc ghi chú..."
                  value={listNotesPrefix}
                  onChange={(e) => setListNotesPrefix(e.target.value)}
                  style={{
                    flex: '1 1 280px',
                    minWidth: '220px',
                    boxSizing: 'border-box',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.6rem 0.9rem',
                    fontSize: '0.9rem',
                    backgroundColor: '#fff',
                    color: '#0f172a',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNoteAndAdd(); } }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddNoteAndAdd}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1.1rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={16} />
                  Thêm mục
                </button>
              </div>

              {items.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#64748b',
                  padding: '2rem',
                  border: '1px dashed #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#f8fafc'
                }}>
                  Danh sách này còn trống. Thêm từ vựng, câu mẫu, hoặc ghi chú của riêng bạn vào!
                </div>
              ) : (
                <div>
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        padding: '0.85rem 0.75rem',
                        borderBottom: index === items.length - 1 ? 'none' : '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.2rem', fontSize: '0.95rem' }}>
                          {item.notes}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Loại: {item.item_type} · ID: {item.item_id}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.item_id, item.item_type)}
                        title="Xoá mục"
                        style={{
                          flexShrink: 0,
                          color: '#94a3b8',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.3rem',
                          borderRadius: '6px',
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => { setShowCreateModal(false); setErrors({}); }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', width: '100%', maxWidth: '480px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>Tạo danh sách từ vựng mới</h3>
              <button
                onClick={() => { setShowCreateModal(false); setErrors({}); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {errors.form && (
                <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid #fecaca' }}>
                  {errors.form}
                </div>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' }}>Tên danh sách</label>
                <input
                  type="text"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.9rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: '#fff', color: '#0f172a', outline: 'none' }}
                  placeholder="Ví dụ: Từ vựng món ăn Nhật Bản"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  maxLength={255}
                />
                {errors.name && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{errors.name}</span>}
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' }}>Mô tả (tuỳ chọn)</label>
                <textarea
                  style={{ width: '100%', boxSizing: 'border-box', minHeight: '70px', padding: '0.65rem 0.9rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: '#fff', color: '#0f172a', outline: 'none', resize: 'vertical' }}
                  placeholder="Mô tả ngắn gọn về chủ đề danh sách..."
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreateModal(false); setErrors({}); }} style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#475569', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Huỷ
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCreateList} style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Tạo danh sách
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline edit modal */}
      {editingList && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditingList(null)}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', width: '100%', maxWidth: '480px', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>Sửa tên danh sách</h3>
              <button
                onClick={() => setEditingList(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' }}>Tên danh sách</label>
                <input
                  type="text"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.65rem 0.9rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: '#fff', color: '#0f172a', outline: 'none' }}
                  value={editingList.name}
                  onChange={(e) => setEditingList({ ...editingList, name: e.target.value })}
                  maxLength={255}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e' }}>Mô tả</label>
                <textarea
                  style={{ width: '100%', boxSizing: 'border-box', minHeight: '70px', padding: '0.65rem 0.9rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: '#fff', color: '#0f172a', outline: 'none', resize: 'vertical' }}
                  value={editingList.description}
                  onChange={(e) => setEditingList({ ...editingList, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setEditingList(null)} style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#475569', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Huỷ
                </button>
                <button type="button" onClick={() => handleUpdateList(editingList.id)} style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Save size={16} />
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Modal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={() => {
          if (modalConfig.onConfirm) modalConfig.onConfirm();
          setModalConfig({ ...modalConfig, isOpen: false });
        }}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
      />
    </div>
  );
};

export default VocabListsPage;
