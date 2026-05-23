import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../../core/api';
import { SnsIcon } from '../../components/SnsIcon';
import { 
  Rocket, 
  CloudUpload, 
  FileCheck, 
  CheckSquare, 
  Square, 
  Loader2
} from 'lucide-react';

// 소셜 플랫폼 정보 정의 (기존과 동일하게 가중치 및 카테고리 구성)
const PLATFORM_DEFS = [
  { id: 'youtube', name: 'YouTube', icon: '📺', category: 'video', weight: 100 },
  { id: 'youtube_shorts', name: 'YouTube Shorts', icon: '🩳', category: 'short', weight: 95 },
  { id: 'insta', name: 'Instagram', icon: '📸', category: 'sns', weight: 90 },
  { id: 'x', name: 'X (Twitter)', icon: '🐦', category: 'sns', weight: 88 },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', category: 'short', weight: 85 },
  { id: 'facebook', name: 'Facebook Reels', icon: '👥', category: 'sns', weight: 80 },
  { id: 'telegram', name: 'Telegram Bot', icon: '✈️', category: 'chat', weight: 75 },
  { id: 'discord', name: 'Discord Webhook', icon: '👾', category: 'chat', weight: 70 },
  { id: 'slack', name: 'Slack Bot', icon: '💬', category: 'chat', weight: 65 },
  { id: 'threads', name: 'Threads', icon: '🧵', category: 'sns', weight: 60 },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', category: 'sns', weight: 55 },
  { id: 'pinterest', name: 'Pinterest', icon: '📌', category: 'sns', weight: 50 },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', category: 'sns', weight: 45 },
  { id: 'line', name: 'LINE VOOM', icon: '🟢', category: 'chat', weight: 40 },
  { id: 'reddit', name: 'Reddit', icon: '👽', category: 'sns', weight: 35 },
  { id: 'naver_blog', name: 'Naver Blog', icon: '💚', category: 'blog', weight: 30 },
  { id: 'naver_cafe', name: 'Naver Cafe', icon: '☕', category: 'blog', weight: 25 },
  { id: 'medium', name: 'Medium', icon: '📝', category: 'blog', weight: 20 },
  { id: 'wordpress', name: 'WordPress', icon: '🌐', category: 'blog', weight: 15 },
  { id: 'afreecatv', name: 'AfreecaTV', icon: '⭐', category: 'video', weight: 10 },
  { id: 'vimeo', name: 'Vimeo', icon: '📹', category: 'video', weight: 8 },
  { id: 'behance', name: 'Behance', icon: '🎨', category: 'portfolio', weight: 5 },
  { id: 'dribbble', name: 'Dribbble', icon: '🏀', category: 'portfolio', weight: 4 },
];

interface Account {
  id: number;
  platform: string;
  account_name: string;
  token: any;
}

export const UploadLauncher: React.FC = () => {
  // 1. 상태값 선언
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());
  
  const [isUploading, setIsUploading] = useState(false);
  const [sortMode, setSortMode] = useState<'usage' | 'name' | 'status'>('usage');
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // 토스트 생성기
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // 2. 연동 완료된 플랫폼 조회 (어카운트 허브 상태 동기화)
  const fetchAccounts = async () => {
    try {
      const response = await api.get('/api/v1/accounts/');
      const activePlatformIds = new Set<string>();
      if (response.data) {
        response.data.forEach((acc: Account) => {
          activePlatformIds.add(acc.platform);
        });
      }
      setConnectedPlatforms(activePlatformIds);
    } catch (err) {
      addToast('계정 정보 조회에 실패하여 연동 상태를 가져오지 못했습니다.', 'error');
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // 3. 드래그 앤 드롭 파일 선택 핸들러
  const handleFile = (file: File) => {
    const validExtensions = ['.mp4', '.png', '.jpg', '.jpeg'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      addToast('지원하지 않는 파일 형식입니다. MP4, PNG, JPG 파일만 가능합니다.', 'error');
      return;
    }

    setSelectedFile(file);
    
    // 이미지 파일의 경우 즉시 프리뷰 로드
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // 4. 플랫폼 토글 및 전체 선택 핸들러
  const togglePlatform = (id: string) => {
    if (!connectedPlatforms.has(id)) {
      addToast('먼저 어카운트 허브에서 이 채널을 연동해 주세요!', 'error');
      return;
    }
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isAllSelected = useMemo(() => {
    const activeDefs = PLATFORM_DEFS.filter(p => connectedPlatforms.has(p.id));
    if (activeDefs.length === 0) return false;
    return activeDefs.every(p => selectedPlatforms.has(p.id));
  }, [selectedPlatforms, connectedPlatforms]);

  const toggleAll = () => {
    const activeIds = PLATFORM_DEFS.filter(p => connectedPlatforms.has(p.id)).map(p => p.id);
    if (isAllSelected) {
      setSelectedPlatforms(new Set());
    } else {
      setSelectedPlatforms(new Set(activeIds));
    }
  };

  // 5. 정렬 알고리즘 적용
  const sortedPlatforms = useMemo(() => {
    if (sortMode === 'name') {
      return [...PLATFORM_DEFS].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === 'status') {
      return [...PLATFORM_DEFS].sort((a, b) => {
        const aConnected = connectedPlatforms.has(a.id);
        const bConnected = connectedPlatforms.has(b.id);
        if (aConnected === bConnected) return b.weight - a.weight;
        return aConnected ? -1 : 1;
      });
    } else {
      return [...PLATFORM_DEFS].sort((a, b) => b.weight - a.weight);
    }
  }, [sortMode, connectedPlatforms]);

  // 6. 업로드 (로켓 발사) 처리
  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      addToast('업로드할 동영상 또는 이미지 파일을 선택해 주세요.', 'error');
      return;
    }
    if (selectedPlatforms.size === 0) {
      addToast('배포할 플랫폼 채널을 최소 한 개 이상 선택해 주세요.', 'error');
      return;
    }
    if (!title.trim()) {
      addToast('콘텐츠 제목을 입력해 주세요.', 'error');
      return;
    }

    // 1. 유튜브 파일 유형 밸리데이션 (이미지 차단)
    const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(selectedFile.name);
    if ((selectedPlatforms.has('youtube') || selectedPlatforms.has('youtube_shorts')) && !isVideo) {
      addToast('📺 YouTube 및 YouTube Shorts는 이미지 업로드를 허용하지 않습니다. 동영상 파일(MP4 등)을 지정해 주세요.', 'error');
      return;
    }

    // 2. 파일 크기 제한 밸리데이션 (100MB)
    if (selectedFile.size > 100 * 1024 * 1024) {
      addToast('⚠️ 100MB를 초과하는 대용량 미디어 파일은 로컬 업로드 사양을 제한합니다.', 'error');
      return;
    }

    // 발사 확인 모달 팝업 활성화
    setShowConfirmModal(true);
  };

  // 실시간 다중 송출 발사 확정
  const confirmAndLaunch = async () => {
    if (!selectedFile) return;
    setShowConfirmModal(false);
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('tags', tags);
      formData.append('platforms', Array.from(selectedPlatforms).join(','));
      formData.append('file', selectedFile);

      await api.post('/api/v1/jobs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
         },
      });

      // 발사 완료 축하 모달 팝업 활성화
      setShowSuccessModal(true);
      
      // 인풋 및 선택 상태 초기화
      setTitle('');
      setDescription('');
      setTags('');
      setSelectedFile(null);
      setFilePreview(null);
      setSelectedPlatforms(new Set());
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || '업로드 도중 알 수 없는 에러가 발생했습니다.';
      addToast(`로켓 발사 실패: ${errMsg}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '0px' }}>
      <form onSubmit={handleLaunch}>
        
        {/* 상단 런처 헤더 */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🚀</span>
            <h2 style={{ fontSize: '24px', fontWeight: 500, color: '#FFFFFF' }}>업로드 런처 (Launch Pad)</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '13px' }}>
            선택한 미디어 자산을 여러 SNS 플랫폼에 즉시 또는 예약 배포합니다.
          </p>
        </div>

        {/* 구분 바 및 채널 선택 영역 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '4px', height: '24px', backgroundColor: 'var(--primary-color)', borderRadius: '2px' }}></div>
            <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#FFFFFF' }}>배포 플랫폼 선택</h3>
          </div>

          {/* 정렬 및 토글 버튼 그룹 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className={`premium-chip ${sortMode === 'usage' ? 'active' : ''}`} onClick={() => setSortMode('usage')}>인기순</button>
              <button type="button" className={`premium-chip ${sortMode === 'name' ? 'active' : ''}`} onClick={() => setSortMode('name')}>이름순</button>
              <button type="button" className={`premium-chip ${sortMode === 'status' ? 'active' : ''}`} onClick={() => setSortMode('status')}>상태순</button>
            </div>
            
            <button 
              type="button" 
              className="premium-chip"
              onClick={toggleAll}
            >
              {isAllSelected ? (
                <>
                  <CheckSquare size={14} style={{ color: 'var(--primary-color)' }} />
                  <span>전체 해제</span>
                </>
              ) : (
                <>
                  <Square size={14} />
                  <span>플랫폼 전체 선택</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 22종 SNS 플랫폼 선택 그리드 */}
        <div className="sns-tile-grid" style={{ marginBottom: '40px' }}>
          {sortedPlatforms.map(platform => {
            const isConnected = connectedPlatforms.has(platform.id);
            const isSelected = selectedPlatforms.has(platform.id);

            return (
              <div
                key={platform.id}
                className={`sns-tile premium-card interactive ${isSelected ? 'selected' : ''} ${!isConnected ? 'disabled-tile' : ''}`}
                onClick={() => togglePlatform(platform.id)}
              >
                <div className={`tile-icon-wrapper ${isConnected ? 'active' : ''}`}>
                  <SnsIcon platformId={platform.id} size={24} />
                </div>
                <span className="tile-title-text">{platform.name}</span>
                <span className={`tile-status-text ${isConnected ? 'connected' : 'unconnected'}`}>
                  {isConnected ? '연동됨' : '미연동'}
                </span>
              </div>
            );
          })}
        </div>

        {/* 구분 바 및 업로드 미디어 입력 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '48px', marginBottom: '24px' }}>
          <div style={{ width: '4px', height: '24px', backgroundColor: 'var(--primary-color)', borderRadius: '2px' }}></div>
          <h3 style={{ fontSize: '20px', fontWeight: 500, color: '#FFFFFF' }}>업로드 미디어 및 콘텐츠 정보</h3>
        </div>

        {/* 미디어 선택 & 업로드 폼 분할 섹션 (데스크톱 반응형) */}
        <div className="form-split-layout">
          
          {/* 왼쪽: 드래그 앤 드롭 파일 피커 박스 */}
          <div 
            className={`file-drop-box premium-card ${isDragOver ? 'dragover' : ''} ${selectedFile ? 'selected' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={triggerFileSelect}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={onFileChange} 
              accept=".mp4,.png,.jpg,.jpeg"
            />
            
            {selectedFile ? (
              <div className="file-info-container">
                {filePreview ? (
                  <img src={filePreview} className="file-preview-img" alt="Preview" />
                ) : (
                  <div className="icon-badge">
                    <FileCheck size={48} style={{ color: 'var(--primary-color)' }} />
                  </div>
                )}
                <div style={{ marginTop: '16px' }}>
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div className="icon-badge">
                  <CloudUpload size={48} style={{ color: 'var(--text-muted)' }} />
                </div>
                <h3 className="file-box-title">미디어 파일 업로드 (Drag & Drop)</h3>
                <p className="file-box-subtitle">MP4 동영상 또는 PNG, JPG 이미지를 끌어다 놓으세요</p>
              </div>
            )}
          </div>

          {/* 오른쪽: 콘텐츠 정보 입력 폼 */}
          <div className="upload-fields-card premium-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="field-label">콘텐츠 제목</label>
                <input 
                  type="text" 
                  className="premium-input" 
                  placeholder="영상이나 이미지의 제목을 입력하세요"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="field-label">상세 설명</label>
                <textarea 
                  className="premium-input text-area" 
                  placeholder="플랫폼에 표시될 설명을 작성하세요"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <label className="field-label">해시태그</label>
                <input 
                  type="text" 
                  className="premium-input" 
                  placeholder="쉼표(,)로 구분하여 입력 (예: shorts, ai, daily)"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                />
              </div>
            </div>
          </div>

        </div>

        {/* 하단 로켓 발사 단독 액션 영역 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '48px', marginBottom: '24px' }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isUploading}
            style={{ 
              height: '56px', 
              padding: '0 48px', 
              borderRadius: '14px', 
              fontSize: '18px', 
              fontWeight: 'bold',
              boxShadow: '0 8px 30px rgba(0, 242, 254, 0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
          >
            {isUploading ? (
              <>
                <Loader2 className="spinner-icon" size={20} />
                <span>업로드 진행 중...</span>
              </>
            ) : (
              <>
                <Rocket size={20} />
                <span>업로드 (로켓 발사)</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* 발사 확정 확인 모달 (Confirm Modal) */}
      {showConfirmModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal premium-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px' }}>🚀</span>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>콘텐츠 다중 송출 발사</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              작성하신 동영상/이미지 미디어를 선택하신 플랫폼으로 배포(로켓 발사)하시겠습니까?
            </p>
            
            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>파일명</span>
                <span style={{ color: '#FFFFFF', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>제목</span>
                <span style={{ color: '#FFFFFF', fontWeight: 500 }}>{title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>송출 대상</span>
                <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                  {Array.from(selectedPlatforms).map(id => PLATFORM_DEFS.find(p => p.id === id)?.name).join(', ')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                className="premium-chip" 
                onClick={() => setShowConfirmModal(false)}
                style={{ height: '40px', padding: '0 20px', borderRadius: '8px', fontSize: '14px' }}
              >
                취소
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={confirmAndLaunch}
                style={{ height: '40px', padding: '0 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold' }}
              >
                배포 확정 (발사!)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 발사 완료 축하 모달 (Success Modal) */}
      {showSuccessModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal premium-card" style={{ textAlign: 'center', maxWidth: '440px', padding: '40px 32px' }}>
            <div style={{ fontSize: '56px', marginBottom: '20px', animation: 'bounce 1s infinite' }}>🎉</div>
            <h3 style={{ fontSize: '22px', fontWeight: 600, color: '#FFFFFF', marginBottom: '12px' }}>로켓 송출 발사 성공!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '28px' }}>
              선택하신 미디어 자산이 등록된 플랫폼 송출 대기열에 성공적으로 예약 완료되었습니다. <br />
              실시간 작업 모니터 탭에서 발행 진행률을 확인하실 수 있습니다!
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => {
                  setShowSuccessModal(false);
                  const navTiles = document.querySelectorAll('.nav-tile');
                  if (navTiles && navTiles[4]) {
                    (navTiles[4] as HTMLElement).click();
                  }
                }}
                style={{ width: '100%', height: '48px', borderRadius: '10px', fontSize: '15px', fontWeight: 'bold' }}
              >
                실시간 작업 모니터로 이동
              </button>
              <button 
                type="button" 
                className="premium-chip" 
                onClick={() => setShowSuccessModal(false)}
                style={{ width: '100%', height: '40px', borderRadius: '10px', fontSize: '13px' }}
              >
                런처 대시보드에 남기
              </button>
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
        .form-split-layout {
          display: grid;
          grid-template-columns: 2fr 3fr;
          gap: 32px;
          align-items: stretch;
        }

        @media (max-width: 900px) {
          .form-split-layout {
            grid-template-columns: 1fr;
          }
        }

        /* 드롭 박스 */
        .file-drop-box {
          height: 100%;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px dashed var(--border-color);
          cursor: pointer;
          position: relative;
        }

        /* 프리미엄 글래스모피즘 모달 스타일 */
        .custom-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(10, 25, 47, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.25s ease;
        }

        .custom-modal {
          width: 90%;
          max-width: 500px;
          padding: 32px;
          border: 1px solid var(--border-hover);
          background-color: rgba(23, 42, 69, 0.95);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px var(--primary-glow);
          transform: translateY(0);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border-radius: 16px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .file-drop-box:hover {
          border-color: var(--border-hover);
        }

        .file-drop-box.dragover {
          border-color: var(--primary-color);
          background-color: var(--surface-hover);
          box-shadow: 0 0 20px var(--primary-glow);
        }

        .icon-badge {
          display: inline-flex;
          padding: 20px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.03);
          margin-bottom: 16px;
        }

        .file-box-title {
          font-size: 16px;
          font-weight: 500;
          color: #FFFFFF;
          margin-bottom: 8px;
        }

        .file-box-subtitle {
          font-size: 12px;
          color: var(--text-muted);
        }

        .file-info-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          height: 100%;
          justify-content: center;
        }

        .file-preview-img {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 12px;
          border: 1px solid var(--border-hover);
        }

        .file-name {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #FFFFFF;
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: center;
        }

        .file-size {
          display: block;
          font-size: 12px;
          color: var(--primary-color);
          font-weight: 500;
          margin-top: 4px;
          text-align: center;
        }

        /* 폼 카드 */
        .upload-fields-card {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .text-area {
          resize: none;
          font-family: inherit;
        }

        /* SNS 플랫폼 타일 그리드 */
        .sns-tile-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          margin-bottom: 48px;
        }

        .sns-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px 8px;
          min-height: 120px;
          border: 1px solid var(--border-color);
          text-align: center;
        }

        .sns-tile .tile-icon-wrapper {
          padding: 10px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.03);
          margin-bottom: 12px;
          transition: all 0.25s ease;
        }

        .sns-tile .tile-icon-wrapper.active {
          background-color: rgba(100, 255, 218, 0.08);
        }

        .sns-tile.selected .tile-icon-wrapper {
          background-color: var(--primary-color);
          color: var(--bg-color);
        }

        .sns-tile.disabled-tile {
          opacity: 0.45;
          cursor: not-allowed !important;
        }

        .sns-tile.disabled-tile:hover {
          transform: none !important;
          border-color: var(--border-color) !important;
          background-color: var(--surface-color) !important;
        }

        .sns-tile .tile-title-text {
          font-size: 13px;
          font-weight: 500;
          color: #FFFFFF;
          margin-bottom: 4px;
          max-width: 110px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sns-tile.selected .tile-title-text {
          color: var(--primary-color);
        }

        .sns-tile .tile-status-text {
          font-size: 10px;
          font-weight: 400;
        }

        .sns-tile .tile-status-text.connected {
          color: var(--success-color);
        }

        .sns-tile .tile-status-text.unconnected {
          color: var(--error-color);
          opacity: 0.8;
        }

        .spinner-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
