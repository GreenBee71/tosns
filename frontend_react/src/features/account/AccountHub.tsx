import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../core/api';
import { ConnectDialog } from './ConnectDialog';
import { SnsIcon } from '../../components/SnsIcon';
import { 
  Search, 
  AlertCircle,
  Check
} from 'lucide-react';

// 소셜 플랫폼 아이콘 및 정보 정의 (account_provider.dart 이식)
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
  created_at?: string;
}

export const AccountHub: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'usage' | 'name' | 'status'>('usage');
  
  // 모달 제어 상태
  const [activePlatform, setActivePlatform] = useState<{ id: string; name: string; icon: string } | null>(null);

  // 토스트 상태
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // 계정 현황 가져오기
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/v1/accounts/');
      setAccounts(response.data || []);
    } catch (err) {
      addToast('계정 목록 조회 실패: 서버 연결 상태를 확인하세요.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // 특정 플랫폼의 연동된 계정 검색
  const getConnectedAccount = (platformId: string) => {
    return accounts.find(acc => acc.platform === platformId) || null;
  };

  // 플랫폼 목록 정렬 및 필터링 수행 (account_provider.dart 복제)
  const sortedAndFilteredPlatforms = useMemo(() => {
    // 1. 검색어 필터링
    let list = PLATFORM_DEFS.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. 정렬 알고리즘
    if (sortMode === 'name') {
      // 이름 가나다/ABC 순 정렬
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === 'status') {
      // 연동 완료 계정 우선 배치
      return [...list].sort((a, b) => {
        const aConnected = getConnectedAccount(a.id) !== null;
        const bConnected = getConnectedAccount(b.id) !== null;
        if (aConnected === bConnected) return b.weight - a.weight;
        return aConnected ? -1 : 1;
      });
    } else {
      // 인기순 (기본 가중치 순 정렬)
      return [...list].sort((a, b) => b.weight - a.weight);
    }
  }, [searchQuery, sortMode, accounts]);

  return (
    <div style={{ padding: '0px' }}>
      {/* 타이틀 및 정렬 도구 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>👤</span>
            <h2 style={{ fontSize: '24px', fontWeight: 500, color: '#FFFFFF' }}>어카운트 허브 (Account Hub)</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '13px' }}>
            SNS 플랫폼 계정을 연동하고 안전하게 자격을 관리합니다.
          </p>
        </div>

        {/* 필터 및 검색 유틸 바 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* 정렬 토글 칩 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`premium-chip ${sortMode === 'usage' ? 'active' : ''}`}
              onClick={() => setSortMode('usage')}
            >
              인기순
            </button>
            <button 
              className={`premium-chip ${sortMode === 'name' ? 'active' : ''}`}
              onClick={() => setSortMode('name')}
            >
              이름순
            </button>
            <button 
              className={`premium-chip ${sortMode === 'status' ? 'active' : ''}`}
              onClick={() => setSortMode('status')}
            >
              상태순
            </button>
          </div>

          {/* 검색 박스 */}
          <div className="search-box">
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="플랫폼 검색..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 로딩 뷰 */}
      {isLoading && accounts.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        /* 그리드 리스트 */
        <div className="platform-grid">
          {sortedAndFilteredPlatforms.map(platform => {
            const connected = getConnectedAccount(platform.id);
            
            return (
              <div 
                key={platform.id}
                className={`premium-card interactive ${connected ? 'selected' : ''}`}
                onClick={() => setActivePlatform(platform)}
                style={{ padding: '20px', minHeight: '130px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <SnsIcon platformId={platform.id} size={28} />
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#FFFFFF' }}>{platform.name}</h3>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {platform.category}
                      </span>
                    </div>
                  </div>

                  {/* 상태 배지 */}
                  {connected ? (
                    <span className="status-badge connected">
                      <Check size={10} style={{ marginRight: '3px' }} /> 연동 완료
                    </span>
                  ) : (
                    <span className="status-badge unconnected">
                      미연동
                    </span>
                  )}
                </div>

                {/* 하단 표시 영역 */}
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {connected ? (
                    <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                      {connected.account_name}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      클릭하여 연동
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 검색 결과가 없을 경우 플레이스홀더 */}
      {!isLoading && sortedAndFilteredPlatforms.length === 0 && (
        <div className="empty-placeholder">
          <AlertCircle size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <p>검색 조건에 맞는 플랫폼이 없습니다.</p>
        </div>
      )}

      {/* 모달 렌더링 */}
      {activePlatform && (
        <ConnectDialog
          platformId={activePlatform.id}
          platformName={activePlatform.name}
          platformIcon={<SnsIcon platformId={activePlatform.id} size={24} />}
          connectedAccount={getConnectedAccount(activePlatform.id)}
          onClose={() => setActivePlatform(null)}
          onRefresh={fetchAccounts}
          addToast={addToast}
        />
      )}

      {/* 토스트 알림 컨테이너 */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-bubble ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      <style>{`
        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 6px 16px;
          width: 220px;
          transition: border-color 0.3s ease;
        }

        .search-box:focus-within {
          border-color: var(--primary-color);
        }

        .search-box input {
          background: none;
          border: none;
          outline: none;
          color: #FFFFFF;
          font-family: inherit;
          font-size: 13px;
          width: 100%;
        }

        .search-box input::placeholder {
          color: var(--text-muted);
        }

        .platform-grid {
          display: grid;
          gap: 18px;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(100, 255, 218, 0.1);
          border-radius: 50%;
          border-top-color: var(--primary-color);
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
