import React, { useState, useEffect } from 'react';
import { api } from '../../core/api';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  Zap, 
  Sparkles, 
  Brain, 
  ChevronRight
} from 'lucide-react';

interface SummaryData {
  total_views: number;
  total_likes: number;
  engagement_rate: string;
  top_performing_emotion: string;
  fan_sentiment: string;
}

export const AIInsights: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData>({
    total_views: 142800,
    total_likes: 38400,
    engagement_rate: '26.8%',
    top_performing_emotion: 'Excited (신남)',
    fan_sentiment: 'Positive (긍정적)'
  });
  const [isLoading, setIsLoading] = useState(true);

  // 1. API 데이터 패치 및 폴백 바인딩
  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/v1/media/insights-summary');
      if (response.data) {
        setSummary(response.data);
      }
    } catch (err) {
      console.warn('Insights-summary backend not active, using premium stubs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div style={{ padding: '0px' }}>
      
      {/* 상단 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>📈</span>
          <h2 style={{ fontSize: '24px', fontWeight: 500, color: '#FFFFFF' }}>AI 인사이트 (성장 분석)</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '13px' }}>
          그린비 AI 어드바이저가 소셜 미디어 활동 성과와 팬 감정을 실시간으로 분석합니다.
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* 통계 카드 6분할 그리드 */}
          <div className="stats-grid">
            
            {/* 1. 누적 조회수 */}
            <div className="stat-card premium-card">
              <div className="stat-card-header">
                <div className="icon-circle" style={{ color: 'var(--primary-color)', backgroundColor: 'rgba(100, 255, 218, 0.05)' }}>
                  <Eye size={16} />
                </div>
                <span className="stat-title">누적 조회수</span>
              </div>
              <div className="stat-value-box">
                <span className="stat-value">{summary.total_views.toLocaleString()}</span>
                <span className="trend-up">+12.4%</span>
              </div>
            </div>

            {/* 2. 누적 좋아요 */}
            <div className="stat-card premium-card">
              <div className="stat-card-header">
                <div className="icon-circle" style={{ color: '#E1306C', backgroundColor: 'rgba(225, 48, 108, 0.05)' }}>
                  <Heart size={16} />
                </div>
                <span className="stat-title">누적 좋아요</span>
              </div>
              <div className="stat-value-box">
                <span className="stat-value">{summary.total_likes.toLocaleString()}</span>
                <span className="trend-up">+8.7%</span>
              </div>
            </div>

            {/* 3. 참여율 */}
            <div className="stat-card premium-card">
              <div className="stat-card-header">
                <div className="icon-circle" style={{ color: '#FFD700', backgroundColor: 'rgba(255, 215, 0, 0.05)' }}>
                  <Zap size={16} />
                </div>
                <span className="stat-title">평균 참여율</span>
              </div>
              <div className="stat-value-box">
                <span className="stat-value">{summary.engagement_rate}</span>
                <span className="trend-up">+2.1%</span>
              </div>
            </div>

            {/* 4. 최고 감정 */}
            <div className="stat-card premium-card">
              <div className="stat-card-header">
                <div className="icon-circle" style={{ color: '#A020F0', backgroundColor: 'rgba(160, 32, 240, 0.05)' }}>
                  <Sparkles size={16} />
                </div>
                <span className="stat-title">최고 성과 감정</span>
              </div>
              <div className="stat-value-box" style={{ marginTop: '12px' }}>
                <span className="stat-value-text text-purple">{summary.top_performing_emotion.toUpperCase()}</span>
              </div>
            </div>

            {/* 5. 팬 심도 분석 */}
            <div className="stat-card premium-card">
              <div className="stat-card-header">
                <div className="icon-circle" style={{ color: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                  <Brain size={16} />
                </div>
                <span className="stat-title">팬 심도 감정</span>
              </div>
              <div className="stat-value-box" style={{ marginTop: '12px' }}>
                <span className="stat-value-text text-blue">{summary.fan_sentiment}</span>
              </div>
            </div>

            {/* 6. 성장 예측 */}
            <div className="stat-card premium-card">
              <div className="stat-card-header">
                <div className="icon-circle" style={{ color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                  <TrendingUp size={16} />
                </div>
                <span className="stat-title">성장 가능성</span>
              </div>
              <div className="stat-value-box" style={{ marginTop: '12px' }}>
                <span className="stat-value-text text-green">High Potential</span>
              </div>
            </div>

          </div>

          {/* AI Advisor 분석 리포트 배너 카드 */}
          <div className="ai-report-card">
            <div className="ai-report-header">
              <div className="ai-report-icon-box">
                <Brain size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#FFFFFF' }}>AI 어드바이저 그린비의 실시간 분석</h3>
            </div>
            
            <p className="ai-report-content">
              최근 "신남(Excited)" 감정 상태로 올린 파리 여행 콘텐츠가 다른 콘텐츠 대비 45% 높은 유입률을 보이고 있습니다.
              다음 주말에는 이 분위기를 이어가기 위해 에펠탑 야경 영상에 활기찬 보이스를 더해 업로드하는 것을 추천드려요! 
              구독자들과 실시간 댓글 소통 속도를 올리면 알고리즘 점수가 더욱 수직 상승할 것입니다! 꿀벌처럼 부지런히 날아보세요! 🐝✨
            </p>

            <div className="ai-report-footer">
              <span>추천 실행 시간: 5월 20일 토요일 오후 7:00</span>
              <ChevronRight size={14} style={{ marginLeft: '4px' }} />
            </div>
          </div>

        </div>
      )}

      <style>{`
        .stats-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        }

        .stat-card {
          padding: 24px;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .stat-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .stat-title {
          font-size: 12px;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .stat-value-box {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-top: 16px;
        }

        .stat-value {
          font-size: 26px;
          font-weight: 500;
          color: #FFFFFF;
          letter-spacing: -0.5px;
        }

        .stat-value-text {
          font-size: 18px;
          font-weight: bold;
        }

        .text-purple { color: #A020F0; }
        .text-blue { color: #3B82F6; }
        .text-green { color: #10B981; }

        .trend-up {
          font-size: 11px;
          font-weight: 500;
          color: var(--success-color);
          background-color: rgba(16, 185, 129, 0.08);
          padding: 2px 8px;
          border-radius: 20px;
        }

        /* AI 리포트 카드 */
        .ai-report-card {
          padding: 32px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(100, 255, 218, 0.06) 0%, rgba(11, 25, 44, 0.3) 100%);
          border: 1px solid rgba(100, 255, 218, 0.15);
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }

        .ai-report-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .ai-report-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background-color: rgba(100, 255, 218, 0.1);
          color: var(--primary-color);
        }

        .ai-report-content {
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-secondary);
        }

        .ai-report-footer {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          color: var(--primary-color);
          margin-top: 24px;
          font-weight: 500;
          letter-spacing: 0.5px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};
