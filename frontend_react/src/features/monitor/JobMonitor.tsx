import React, { useState, useEffect } from 'react';
import { api } from '../../core/api';
import { SnsIcon } from '../../components/SnsIcon';
import { 
  RotateCw, 
  Globe,
  RefreshCw,
  ExternalLink,
  Trash2
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  platform: string;
  progress: number;
  status: 'running' | 'completed' | 'failed' | 'paused';
  icon: string;
  color: string;
  errorLog?: string;
  filePath?: string;
  createdAt?: string;
}

export const JobMonitor: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 1. 백엔드 실시간 작업 큐 동기화
  const fetchJobs = async () => {
    try {
      const response = await api.get('/api/v1/jobs/');
      
      const mappedJobs = response.data.map((job: any) => {
        // 플랫폼별 아이콘 및 테마 색상 지정
        let color = '#4285F4';
        let icon = '📸';
        let platformLabel = String(job.platform).toUpperCase();
        
        const platformLower = String(job.platform).toLowerCase();
        if (platformLower.includes('youtube_shorts')) {
          color = '#FF0000';
          icon = '🩳';
          platformLabel = 'YouTube Shorts';
        } else if (platformLower.includes('youtube')) {
          color = '#FF0000';
          icon = '📺';
          platformLabel = 'YouTube';
        } else if (platformLower.includes('tiktok')) {
          color = '#000000';
          icon = '🎵';
          platformLabel = 'TikTok';
        } else if (platformLower.includes('instagram') || platformLower === 'insta') {
          color = '#E1306C';
          icon = '📸';
          platformLabel = 'Instagram';
        } else if (platformLower.includes('facebook')) {
          color = '#1877F2';
          icon = '👥';
          platformLabel = 'Facebook';
        } else if (platformLower.includes('discord')) {
          color = '#5865F2';
          icon = '💬';
          platformLabel = 'Discord';
        } else if (platformLower.includes('telegram')) {
          color = '#0088cc';
          icon = '✈️';
          platformLabel = 'Telegram';
        }

        // 백엔드 JobStatus 매핑 (PENDING, RUNNING, SUCCESS, FAILED, DELETED)
        let uiStatus: 'running' | 'completed' | 'failed' | 'paused' = 'running';
        let progress = 50;
        
        const statusUpper = String(job.status).toUpperCase();
        if (statusUpper === 'SUCCESS') {
          uiStatus = 'completed';
          progress = 100;
        } else if (statusUpper === 'FAILED' || statusUpper === 'FAIL') {
          uiStatus = 'failed';
          progress = 100;
        } else if (statusUpper === 'PENDING') {
          uiStatus = 'paused';
          progress = 0;
        } else if (statusUpper === 'RUNNING') {
          uiStatus = 'running';
          progress = 60;
        } else if (statusUpper === 'DELETED') {
          uiStatus = 'paused';
          progress = 0;
        }

        return {
          id: String(job.id),
          title: job.title || '제목 없는 업로드',
          platform: platformLabel,
          progress: progress,
          status: uiStatus,
          icon: icon,
          color: color,
          errorLog: job.error_log,
          filePath: job.file_path,
          createdAt: job.created_at
        };
      });
      setJobs(mappedJobs);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  useEffect(() => {
    fetchJobs();
    // 5초 간격 실시간 진행 상황 자동 동기화 롤링
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. 수동 동기화 핸들러
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchJobs();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  // 3. 실패한 작업 백엔드 재시도 트리거
  const handleRetry = async (id: string) => {
    try {
      await api.post(`/api/v1/jobs/${id}/retry`);
      fetchJobs();
    } catch (err) {
      console.error('Failed to retry job:', err);
    }
  };

  // 4. 작업 삭제 (내부 DB 제거)
  const handleDelete = async (id: string) => {
    if (!window.confirm('이 작업 기록을 목록에서 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/api/v1/jobs/${id}?remove_from_db=true&delete_on_sns=false`);
      fetchJobs();
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  return (
    <div style={{ padding: '0px' }}>
      
      {/* 헤더 부분 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>📊</span>
            <h2 style={{ fontSize: '24px', fontWeight: 500, color: '#FFFFFF' }}>작업 모니터 (Job Monitor)</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '13px' }}>
            서버 백엔드에서 전송 중인 활성 업로드 작업과 다중 채널 송출 진행률을 실시간으로 확인합니다.
          </p>
        </div>

        {/* 새로고침 단추 */}
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 18px', 
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 500,
            height: '42px'
          }}
          title="실시간 강제 새로고침"
        >
          <RotateCw size={14} className={isRefreshing ? 'spinner-icon' : ''} />
          <span>실시간 동기화</span>
        </button>
      </div>

      {/* 실시간 큐 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {jobs.length === 0 ? (
          <div className="premium-card empty-placeholder" style={{ padding: '40px' }}>
            <span style={{ fontSize: '40px', marginBottom: '16px' }}>📊</span>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#FFFFFF' }}>현재 대기 중이거나 완료된 배포 작업이 존재하지 않습니다.</p>
            <p style={{ fontSize: '12px', marginTop: '8px', color: 'var(--text-muted)' }}>업로드 런처에서 첫 미디어를 런칭해 보세요!</p>
          </div>
        ) : (
          jobs.map((job) => {
            const isDone = job.status === 'completed';
            const isFailed = job.status === 'failed';
            const isPaused = job.status === 'paused';
            
            // 파일명 추출
            const fileName = job.filePath ? job.filePath.split('/').pop() : '알 수 없는 파일';

            return (
              <div 
                key={job.id}
                className={`premium-card job-row ${isDone ? 'completed' : isFailed ? 'failed' : ''}`}
                style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  {/* 작업 내용 정보 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="job-platform-icon" style={{ backgroundColor: `${job.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <SnsIcon platformId={job.platform} size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#FFFFFF' }}>{job.title}</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Globe size={11} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{job.platform}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>| 파일: {fileName}</span>
                      </div>
                    </div>
                  </div>

                  {/* 제어 단추 및 상태값 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`status-badge ${job.status}`} style={{ marginRight: '4px' }}>
                      {isDone ? '성공 완료' : isFailed ? '배포 실패' : isPaused ? '업로드 대기' : `송출 중 (${job.progress}%)`}
                    </span>

                    {/* 실패 시 재시도 단추 */}
                    {isFailed && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleRetry(job.id)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '6px 12px', 
                          borderRadius: '8px', 
                          fontSize: '12px',
                          height: '32px'
                        }}
                        title="작업 재시도"
                      >
                        <RefreshCw size={12} style={{ color: 'var(--primary-color)' }} />
                        <span style={{ fontWeight: 500 }}>재시도</span>
                      </button>
                    )}

                    {/* 완료 혹은 실패 기록 삭제 단추 */}
                    {(isDone || isFailed) && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleDelete(job.id)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '6px 12px', 
                          borderRadius: '8px', 
                          fontSize: '12px',
                          height: '32px',
                          color: 'var(--error-color)'
                        }}
                        title="기록 지우기"
                      >
                        <Trash2 size={12} style={{ color: 'var(--error-color)' }} />
                        <span style={{ fontWeight: 500 }}>기록 삭제</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 실시간 프로그레스 바 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="progress-bar-bg">
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${job.progress}%`,
                        backgroundColor: isDone ? 'var(--success-color)' : isFailed ? 'var(--error-color)' : isPaused ? 'var(--text-muted)' : 'var(--primary-color)',
                        boxShadow: isDone ? 'none' : isFailed ? 'none' : `0 0 10px ${isPaused ? 'transparent' : 'var(--primary-glow)'}`
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', minWidth: '40px', color: isDone ? 'var(--success-color)' : isFailed ? 'var(--error-color)' : '#FFFFFF' }}>
                    {job.progress}%
                  </span>
                </div>

                {/* YouTube 성공 비디오 링크 제공 */}
                {isDone && (job.platform.includes('YouTube')) && job.errorLog && (
                  <div style={{ 
                    marginTop: '4px', 
                    padding: '12px 16px', 
                    borderRadius: '10px', 
                    backgroundColor: 'rgba(16, 185, 129, 0.05)', 
                    border: '1px dashed rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px'
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>🎉 공식 채널 배포 완료! 실시간 중계 중입니다.</span>
                    <a 
                      href={`https://www.youtube.com/watch?v=${job.errorLog}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ 
                        color: 'var(--primary-color)', 
                        textDecoration: 'none', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontWeight: 500
                      }}
                    >
                      영상 직접 보러가기 <ExternalLink size={14} />
                    </a>
                  </div>
                )}

                {/* 실패 시 오류 디버그 창 */}
                {isFailed && job.errorLog && (
                  <div style={{ 
                    marginTop: '4px', 
                    padding: '12px 16px', 
                    borderRadius: '10px', 
                    backgroundColor: 'rgba(239, 68, 68, 0.03)', 
                    border: '1px solid rgba(239, 68, 68, 0.1)',
                    fontSize: '12px',
                    color: '#EF4444',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.5'
                  }}>
                    <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>❌ 시스템 에러 메시지:</span>
                    {job.errorLog}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .job-row {
          border: 1px solid var(--border-color);
          transition: all 0.3s ease;
        }

        .job-row.completed {
          border-color: rgba(16, 185, 129, 0.15);
          background-color: rgba(16, 185, 129, 0.01);
        }

        .job-row.failed {
          border-color: rgba(239, 68, 68, 0.15);
          background-color: rgba(239, 68, 68, 0.01);
        }

        .job-platform-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
        }

        .progress-bar-bg {
          flex: 1;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

      `}</style>
    </div>
  );
};
