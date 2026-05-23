import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../core/api';
import { 
  FolderClosed, 
  FolderPlus, 
  Trash2, 
  ArrowLeft, 
  Plus, 
  Image, 
  Video, 
  Loader2, 
  Eye, 
  Download, 
  X,
  Sparkles
} from 'lucide-react';

interface Project {
  id: number;
  title: string;
  description: string;
  assetCount?: number;
  created_at?: string;
}

interface Asset {
  id: number;
  project_id: number;
  asset_type: 'video' | 'image';
  file_path: string;
  created_at?: string;
  fullUrl?: string; // Backend might provide it, otherwise we resolve it
}

export const MediaLibrary: React.FC = () => {
  // 1. 상태 선언
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  
  // 모달 제어
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // 자산 풀 스크린 뷰어 모달
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  // 알림 토스트
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // 2. API 호출 로직
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/v1/media/projects');
      setProjects(response.data || []);
    } catch (err) {
      addToast('프로젝트 목록 조회 실패: 서버 연결 상태를 확인하세요.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssetsForProject = async (projectId: number) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/v1/media/projects/${projectId}/assets`);
      setAssets(response.data || []);
    } catch (err) {
      addToast('프로젝트 자산 목록 조회에 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 3. 프로젝트 생성 (POST)
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      addToast('프로젝트 제목을 입력하세요.', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', newTitle);
      formData.append('description', newDesc);

      await api.post('/api/v1/media/projects', formData);
      addToast('새로운 프로젝트 폴더가 생성되었습니다.', 'success');
      setNewTitle('');
      setNewDesc('');
      setShowCreateModal(false);
      fetchProjects();
    } catch (err) {
      addToast('프로젝트 폴더 생성 실패', 'error');
    }
  };

  // 4. 프로젝트 삭제 (DELETE)
  const handleDeleteProject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 동작 막기
    if (!window.confirm('프로젝트 폴더와 내부 모든 자산이 영구 삭제됩니다. 계속하시겠습니까?')) {
      return;
    }

    try {
      await api.delete(`/api/v1/media/projects/${id}`);
      addToast('프로젝트가 성공적으로 삭제되었습니다.', 'success');
      fetchProjects();
    } catch (err) {
      addToast('프로젝트 삭제 실패', 'error');
    }
  };

  // 5. 자산 업로드 (POST)
  const triggerAssetSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAssetUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentProject || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    setIsUploadingAsset(true);
    addToast('자산을 업로드 중입니다...', 'success');

    try {
      const formData = new FormData();
      formData.append('project_id', currentProject.id.toString());
      formData.append('asset_type', file.name.toLowerCase().endsWith('.mp4') ? 'video' : 'image');
      formData.append('file', file);

      await api.post('/api/v1/media/assets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      addToast('자산이 라이브러리에 안전하게 보관되었습니다!', 'success');
      fetchAssetsForProject(currentProject.id);
      
      // 프로젝트 카드 자산 갯수 갱신용 목록 리프레시
      fetchProjects();
    } catch (err) {
      addToast('자산 업로드 실패', 'error');
    } finally {
      setIsUploadingAsset(false);
    }
  };

  // 6. 자산 삭제 (DELETE)
  const handleDeleteAsset = async (assetId: number) => {
    if (!window.confirm('이 콘텐츠 자산을 라이브러리에서 영구히 삭제하시겠습니까?')) {
      return;
    }

    try {
      await api.delete(`/api/v1/media/assets/${assetId}`);
      addToast('자산이 삭제되었습니다.', 'success');
      if (currentProject) {
        fetchAssetsForProject(currentProject.id);
        fetchProjects();
      }
    } catch (err) {
      addToast('자산 삭제 실패', 'error');
    }
  };

  // 7. 폴더 클릭 핸들러
  const handleOpenFolder = (project: Project) => {
    setCurrentProject(project);
    fetchAssetsForProject(project.id);
  };

  // 8. 목록 복귀 핸들러
  const handleBackToFolders = () => {
    setCurrentProject(null);
    setAssets([]);
  };

  // 이미지 또는 비디오 리얼 URL 해결기
  const resolveMediaUrl = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    // Vite proxy handles path prefixing
    return path.startsWith('/') ? path : `/${path}`;
  };

  return (
    <div style={{ padding: '0px' }}>
      
      {/* 상태 1: 프로젝트 폴더 전체 조회 뷰 */}
      {!currentProject && (
        <>
          {/* 헤더 바 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>📂</span>
                <h2 style={{ fontSize: '24px', fontWeight: 500, color: '#FFFFFF' }}>미디어 라이브러리 (Media Library)</h2>
              </div>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '13px' }}>
                프로젝트별로 미디어 자산을 체계적으로 분류하고 안전하게 자격을 보관합니다.
              </p>
            </div>

            {/* 신규 폴더 생성 버튼 */}
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '48px', borderRadius: '10px' }}
            >
              <FolderPlus size={16} />
              <span>신규 프로젝트 생성</span>
            </button>
          </div>

          {/* 로딩 뷰 */}
          {isLoading && projects.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-placeholder-box">
              <FolderClosed size={64} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>아직 생성된 프로젝트가 존재하지 않습니다.</p>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowCreateModal(true)}
                style={{ marginTop: '16px' }}
              >
                첫 번째 폴더 만들기
              </button>
            </div>
          ) : (
            /* 폴더 그리드 */
            <div className="folders-grid">
              {projects.map(project => (
                <div 
                  key={project.id}
                  className="folder-card premium-card interactive"
                  onClick={() => handleOpenFolder(project)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span className="folder-emoji">📂</span>
                    <button 
                      type="button"
                      className="btn-trash"
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      title="폴더 삭제"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <h3 className="folder-title">{project.title}</h3>
                    <p className="folder-desc">{project.description || '상세 설명 없음'}</p>
                  </div>

                  <div className="folder-footer">
                    <span className="asset-count-badge">
                      <Sparkles size={10} style={{ marginRight: '4px' }} />
                      자산 {project.assetCount || 0}개
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 상태 2: 특정 프로젝트 내부 자산 목록 조회 뷰 */}
      {currentProject && (
        <>
          {/* 헤더 바 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-circle"
                onClick={handleBackToFolders}
                title="폴더 목록으로 돌아가기"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 500, color: '#FFFFFF' }}>{currentProject.title}</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '12px' }}>
                  {currentProject.description || '상세 설명 없음'}
                </p>
              </div>
            </div>

            {/* 자산 직접 추가 */}
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleAssetUploadChange}
                accept=".mp4,.png,.jpg,.jpeg"
              />
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={triggerAssetSelect}
                disabled={isUploadingAsset}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '48px', borderRadius: '10px' }}
              >
                {isUploadingAsset ? <Loader2 className="spinner-icon" size={16} /> : <Plus size={16} />}
                <span>새 자산 업로드</span>
              </button>
            </div>
          </div>

          <div className="section-divider" style={{ margin: '0 0 32px 0' }}></div>

          {/* 자산 갯수 카운트 뷰 */}
          {isLoading && assets.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
              <div className="loading-spinner"></div>
            </div>
          ) : assets.length === 0 ? (
            <div className="empty-placeholder-box">
              <Image size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>이 폴더는 현재 비어있습니다.</p>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={triggerAssetSelect}
                style={{ marginTop: '16px' }}
              >
                미디어 자산 추가
              </button>
            </div>
          ) : (
            /* 자산 카드 리스트 그리드 */
            <div className="assets-grid">
              {assets.map(asset => {
                const isImg = asset.asset_type === 'image';
                const fileUrl = resolveMediaUrl(asset.file_path);

                return (
                  <div 
                    key={asset.id}
                    className="asset-card premium-card interactive"
                    onClick={() => setPreviewAsset(asset)}
                  >
                    {/* 카드 탑 프리뷰 박스 */}
                    <div className="asset-preview-box">
                      {isImg ? (
                        <img src={fileUrl} className="asset-thumbnail" alt="Asset Thumbnail" />
                      ) : (
                        <div className="video-fallback-box">
                          <Video size={36} style={{ color: 'var(--primary-color)' }} />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>동영상 자산</span>
                        </div>
                      )}

                      {/* 호버 시 오버레이 단추들 */}
                      <div className="hover-action-overlay">
                        <button 
                          type="button"
                          className="btn-overlay-circle"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewAsset(asset);
                          }}
                          title="미리보기"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          type="button"
                          className="btn-overlay-circle"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAsset(asset.id);
                          }}
                          style={{ color: 'var(--error-color)' }}
                          title="영구 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* 카드 하단 정보 텍스트 */}
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isImg ? (
                          <Image size={12} style={{ color: 'var(--primary-color)' }} />
                        ) : (
                          <Video size={12} style={{ color: '#10B981' }} />
                        )}
                        <span className="asset-title">자산 ID #{asset.id}</span>
                      </div>
                      <span className="asset-type-tag">{asset.asset_type.toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 모달 1: 신규 프로젝트 생성 다이얼로그 모달 */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content premium-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 500 }}>📁 신규 프로젝트 폴더 생성</h2>
              <button 
                type="button" 
                className="btn btn-secondary btn-circle"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '8px' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="input-label">프로젝트 이름</label>
                  <input 
                    type="text" 
                    className="premium-input"
                    placeholder="예: 2024 유튜브 쇼츠 캠페인"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="input-label">프로젝트 설명 (선택)</label>
                  <textarea 
                    className="premium-input"
                    placeholder="프로젝트 목적 또는 상세 내용을 작성하세요"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">생성하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 모달 2: 자산 고해상도 전체화면 미리보기 뷰어 모달 */}
      {previewAsset && (
        <div className="modal-backdrop viewer-backdrop" onClick={() => setPreviewAsset(null)}>
          <div className="viewer-container" onClick={(e) => e.stopPropagation()}>
            <div className="viewer-header">
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                자산 ID #{previewAsset.id} 미리보기 ({previewAsset.asset_type.toUpperCase()})
              </span>
              <button 
                type="button" 
                className="btn-overlay-circle btn-viewer-close"
                onClick={() => setPreviewAsset(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="viewer-body">
              {previewAsset.asset_type === 'image' ? (
                <img 
                  src={resolveMediaUrl(previewAsset.file_path)} 
                  className="viewer-main-media" 
                  alt="High Res Preview" 
                />
              ) : (
                <video 
                  src={resolveMediaUrl(previewAsset.file_path)} 
                  className="viewer-main-media" 
                  controls 
                  autoPlay
                />
              )}
            </div>

            <div className="viewer-footer">
              <a 
                href={resolveMediaUrl(previewAsset.file_path)} 
                download={`asset_${previewAsset.id}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontSize: '13px' }}
              >
                <Download size={14} />
                <span>원본 내려받기</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 컨테이너 */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-bubble ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      <style>{`
        /* 폴더 그리드 */
        .folders-grid {
          display: grid;
          gap: 24px;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        }

        .folder-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 200px;
          border: 1px solid var(--border-color);
          position: relative;
        }

        .folder-emoji {
          font-size: 36px;
        }

        .folder-title {
          font-size: 16px;
          font-weight: 500;
          color: #FFFFFF;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .folder-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .folder-footer {
          margin-top: 24px;
          display: flex;
          align-items: center;
        }

        .asset-count-badge {
          display: inline-flex;
          align-items: center;
          background-color: rgba(100, 255, 218, 0.08);
          color: var(--primary-color);
          border: 1px solid rgba(100, 255, 218, 0.15);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
        }

        .btn-trash {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .btn-trash:hover {
          color: var(--error-color);
          background-color: rgba(239, 68, 68, 0.08);
        }

        .btn-circle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          padding: 0;
        }

        .empty-placeholder-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px dashed var(--border-color);
          border-radius: 16px;
          padding: 80px 0;
          text-align: center;
        }

        /* 자산 그리드 */
        .assets-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        }

        .asset-card {
          padding: 0px;
          overflow: hidden;
          border: 1px solid var(--border-color);
        }

        .asset-preview-box {
          height: 160px;
          background-color: rgba(255, 255, 255, 0.01);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid var(--border-color);
          overflow: hidden;
        }

        .asset-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .asset-card:hover .asset-thumbnail {
          transform: scale(1.05);
        }

        .video-fallback-box {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* 호버 오버레이 */
        .hover-action-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(11, 25, 44, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .asset-card:hover .hover-action-overlay {
          opacity: 1;
        }

        .btn-overlay-circle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-overlay-circle:hover {
          background-color: var(--primary-color);
          color: var(--bg-color);
          border-color: var(--primary-color);
        }

        .asset-title {
          font-size: 13px;
          color: #FFFFFF;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .asset-type-tag {
          display: inline-block;
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 0.5px;
          margin-top: 6px;
        }

        /* 자산 뷰어 모달 */
        .viewer-backdrop {
          background-color: rgba(5, 10, 20, 0.95);
        }

        .viewer-container {
          width: 90vw;
          max-width: 900px;
          height: 80vh;
          display: flex;
          flex-direction: column;
          background-color: #0B192C;
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
        }

        .viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border-color);
        }

        .viewer-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #030811;
          overflow: hidden;
          padding: 24px;
        }

        .viewer-main-media {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 8px;
        }

        .viewer-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid var(--border-color);
        }

        .btn-viewer-close:hover {
          background-color: var(--error-color) !important;
          border-color: var(--error-color) !important;
          color: #FFFFFF !important;
        }
      `}</style>
    </div>
  );
};
