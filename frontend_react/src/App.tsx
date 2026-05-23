import { useState } from 'react';
import { 
  FolderClosed, 
  TrendingUp, 
  Rocket, 
  Activity, 
  User 
} from 'lucide-react';
import { AccountHub } from './features/account/AccountHub';
import { UploadLauncher } from './features/upload/UploadLauncher';
import { MediaLibrary } from './features/media_library/MediaLibrary';
import { JobMonitor } from './features/monitor/JobMonitor';
import { AIInsights } from './features/analytics/AIInsights';

function App() {
  const [selectedIndex, setSelectedIndex] = useState<number>(4); // 어카운트 허브를 디폴트로 설정

  // 5개 그리드 네비게이션 아이템 정보
  const navItems = [
    { id: 0, icon: FolderClosed, title: '미디어 라이브러리', subtitle: '프로젝트 및 자산 관리' },
    { id: 1, icon: TrendingUp, title: 'AI 인사이트', subtitle: '성과 및 트렌드 분석' },
    { id: 2, icon: Rocket, title: '업로드 런처', subtitle: 'SNS 통합 업데이트' },
    { id: 3, icon: Activity, title: '작업 모니터', subtitle: '진행 상황 실시간 추적' },
    { id: 4, icon: User, title: '어카운트 허브', subtitle: '플랫폼 연동 관리' },
  ];

  // 활성 탭 화면 렌더러
  const renderContent = () => {
    switch (selectedIndex) {
      case 0:
        return <MediaLibrary />;
      case 1:
        return <AIInsights />;
      case 2:
        return <UploadLauncher />;
      case 3:
        return <JobMonitor />;
      case 4:
      default:
        return <AccountHub />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)' }}>
      {/* 메인 랩퍼 */}
      <div style={{ padding: '32px 32px 0 32px', width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
        
        {/* 상단 브랜드 헤더 영역 */}
        <div className="brand-header">
          <h1 className="brand-title">GreenBee SNS Uploader <span style={{ color: 'var(--primary-color)', fontSize: '13px', marginLeft: '8px', fontWeight: 'normal', opacity: 0.8 }}>(React Engine Active)</span></h1>
          <span className="badge-premium">React v2.0 Premium</span>
        </div>

        {/* 반응형 6타일 그리드 네비게이션 바 */}
        <div className="nav-grid" style={{ marginTop: '24px' }}>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = selectedIndex === item.id;
            
            return (
              <div 
                key={item.id}
                className={`nav-tile ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedIndex(item.id)}
              >
                <div className="tile-icon-box">
                  <IconComponent size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                  <span className="tile-title">{item.title}</span>
                  <span className="tile-subtitle">{item.subtitle}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 구분선 */}
        <div className="section-divider"></div>
      </div>

      {/* 하단 동적 페이지 로드 영역 */}
      <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', padding: '0 32px 32px 32px', width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
        {renderContent()}
      </div>

      {/* 탭 텍스트 스타일 가이드용 플레이스홀더 스타일 */}
      <style>{`
        .tab-placeholder {
          color: var(--text-secondary);
          font-size: 16px;
          text-align: center;
          padding: 64px 0;
          background-color: var(--surface-color);
          border: 1px dashed var(--border-color);
          border-radius: 16px;
        }
      `}</style>
    </div>
  );
}

export default App;
