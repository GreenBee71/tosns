import React, { useState, useEffect } from 'react';
import { api } from '../../core/api';
import { Trash2, Shield, X } from 'lucide-react';

interface ConnectDialogProps {
  platformId: string;
  platformName: string;
  platformIcon: React.ReactNode;
  connectedAccount: any;
  onClose: () => void;
  onRefresh: () => void;
  addToast: (msg: string, type: 'success' | 'error') => void;
}

export const ConnectDialog: React.FC<ConnectDialogProps> = ({
  platformId,
  platformName,
  platformIcon,
  connectedAccount,
  onClose,
  onRefresh,
  addToast,
}) => {
  const [accountName, setAccountName] = useState('');
  const [fields, setFields] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. 플랫폼별 수동 입력 필드 정보 정의 (connect_dialog.dart 로직 복제)
  const getFieldsForPlatform = (platform: string, existingTokens: any) => {
    switch (platform) {
      case 'youtube':
      case 'youtube_shorts':
        return [
          { key: 'client_id', label: 'Client ID', value: existingTokens?.client_id || '', obscure: false },
          { key: 'client_secret', label: 'Client Secret', value: existingTokens?.client_secret || '', obscure: true },
          { key: 'refresh_token', label: 'Refresh Token', value: existingTokens?.refresh_token || '', obscure: true },
        ];
      case 'x':
        return [
          { key: 'api_key', label: 'API Key', value: existingTokens?.api_key || '', obscure: false },
          { key: 'api_secret', label: 'API Secret', value: existingTokens?.api_secret || '', obscure: true },
          { key: 'access_token', label: 'Access Token', value: existingTokens?.access_token || '', obscure: false },
          { key: 'access_token_secret', label: 'Access Token Secret', value: existingTokens?.access_token_secret || '', obscure: true },
        ];
      case 'insta':
      case 'facebook':
        return [
          { key: 'access_token', label: 'Long-Lived Access Token', value: existingTokens?.access_token || '', obscure: true },
        ];
      case 'tiktok':
        return [
          { key: 'access_token', label: 'Access Token', value: existingTokens?.access_token || '', obscure: true },
          { key: 'refresh_token', label: 'Refresh Token', value: existingTokens?.refresh_token || '', obscure: true },
          { key: 'open_id', label: 'Open ID', value: existingTokens?.open_id || '', obscure: false },
        ];
      case 'telegram':
        return [
          { key: 'bot_token', label: 'Bot Token (from @BotFather)', value: existingTokens?.bot_token || '', obscure: true },
          { key: 'chat_id', label: 'Chat ID (e.g. -100...)', value: existingTokens?.chat_id || '', obscure: false },
        ];
      case 'discord':
        return [
          { key: 'webhook_url', label: 'Webhook URL', value: existingTokens?.webhook_url || '', obscure: true },
        ];
      case 'slack':
        return [
          { key: 'bot_token', label: 'Bot Token (xoxb-...)', value: existingTokens?.bot_token || '', obscure: true },
          { key: 'channel_id', label: 'Channel ID (e.g. C12345)', value: existingTokens?.channel_id || '', obscure: false },
        ];
      case 'pinterest':
        return [
          { key: 'access_token', label: 'Access Token', value: existingTokens?.access_token || '', obscure: true },
          { key: 'board_id', label: 'Board ID', value: existingTokens?.board_id || '', obscure: false },
        ];
      case 'linkedin':
        return [
          { key: 'access_token', label: 'Access Token', value: existingTokens?.access_token || '', obscure: true },
          { key: 'author_urn', label: 'Author URN (urn:li:person/organization:...)', value: existingTokens?.author_urn || '', obscure: false },
        ];
      default:
        return [
          { key: 'access_token', label: 'Access Token / API Key', value: existingTokens?.access_token || '', obscure: true },
        ];
    }
  };

  useEffect(() => {
    if (connectedAccount) {
      setAccountName(connectedAccount.account_name || '');
      let tokens = {};
      try {
        if (connectedAccount.token) {
          tokens = typeof connectedAccount.token === 'string' 
            ? JSON.parse(connectedAccount.token) 
            : connectedAccount.token;
        }
      } catch (err) {
        console.error('Error parsing token data', err);
      }
      setFields(getFieldsForPlatform(platformId, tokens));
    } else {
      setAccountName('');
      setFields(getFieldsForPlatform(platformId, null));
    }
  }, [connectedAccount, platformId]);

  // 2. 입력값 핸들러
  const handleFieldChange = (key: string, value: string) => {
    setFields(prev => prev.map(f => f.key === key ? { ...f, value } : f));
  };

  // 3. 수동 정보 저장 (POST/PUT)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      addToast('계정 이름을 입력해 주세요.', 'error');
      return;
    }
    if (fields.some(f => !f.value.trim())) {
      addToast('모든 필수 연동 정보를 입력해 주세요.', 'error');
      return;
    }

    const tokenData: Record<string, string> = {};
    fields.forEach(f => {
      tokenData[f.key] = f.value.trim(); // 공백 문자 실수 방지를 위해 자동 트림(Trim) 적용
    });

    // Discord Webhook URL 밸리데이션 검증
    if (platformId === 'discord') {
      const webhookUrl = tokenData['webhook_url'] || '';
      if (!webhookUrl.startsWith('https://discord.com/api/webhooks/') && !webhookUrl.startsWith('https://discordapp.com/api/webhooks/')) {
        addToast('올바른 Discord Webhook URL 형식(https://discord.com/api/webhooks/...)이 아닙니다.', 'error');
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload = {
        platform: platformId,
        account_name: accountName.trim(),
        token: JSON.stringify(tokenData)
      };

      if (connectedAccount) {
        await api.put(`/api/v1/accounts/${connectedAccount.id}`, payload);
        addToast('계정 연동 정보가 정상적으로 수정되었습니다.', 'success');
      } else {
        await api.post('/api/v1/accounts/', payload);
        addToast('새로운 계정이 성공적으로 연동되었습니다.', 'success');
      }
      onRefresh();
      onClose();
    } catch (err) {
      addToast('계정 정보 저장에 실패했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. 연동 해제 (DELETE)
  const handleDelete = async () => {
    if (!connectedAccount) return;
    if (!window.confirm(`'${connectedAccount.account_name}' 계정 연동을 정말 해제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/api/v1/accounts/${connectedAccount.id}`);
      addToast('계정 연동이 해제되었습니다.', 'success');
      onRefresh();
      onClose();
    } catch (err) {
      addToast('연동 해제 실패: 통신 상태를 확인하세요.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // 5. OAuth 간편 간편 로그인 팝업 호출
  const handleOAuthLogin = () => {
    const targetPlatform = (platformId === 'insta' || platformId === 'facebook') ? 'insta' : platformId;
    const origin = window.location.origin;
    const oauthUrl = `${origin}/api/v1/oauth/${targetPlatform}/login?platform=${platformId === 'facebook' ? 'facebook' : 'instagram'}`;
    
    // 팝업 창을 띄워 깔끔하게 OAuth 수행
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      oauthUrl,
      'TOSNS_OAuth_Login',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
    );

    // 팝업이 닫혔는지 감지하여 자동 리프레시
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        addToast('간편 로그인이 완료되었는지 확인 중입니다...', 'success');
        setTimeout(() => {
          onRefresh();
        }, 1500);
      }
    }, 1000);
  };

  // 6. OAuth 간편 로그인 지원 여부 확인
  const isOAuthSupported = ['youtube', 'youtube_shorts', 'tiktok', 'insta', 'facebook'].includes(platformId);
  const getOAuthLabel = () => {
    if (platformId.startsWith('youtube')) return 'Google 계정으로 로그인';
    if (platformId === 'tiktok') return 'TikTok 계정으로 로그인';
    return 'Meta(Facebook) 계정으로 로그인';
  };
  const getOAuthColor = () => {
    if (platformId.startsWith('youtube')) return '#4285F4';
    if (platformId === 'tiktok') return '#000000';
    return '#1877F2';
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content premium-card">
        {/* 모달 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="modal-icon-box">{platformIcon}</div>
            <h2 style={{ fontSize: '20px', fontWeight: 500 }}>
              {connectedAccount ? '계정 정보 수정' : '계정 연동'} - {platformName}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {connectedAccount && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ padding: '8px', borderRadius: '10px', color: 'var(--error-color)' }}
                title="계정 연동 해제"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '8px', borderRadius: '10px' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* OAuth 간편 로그인 영역 */}
            {isOAuthSupported && (
              <div className="oauth-section">
                <span className="oauth-badge">
                  <Shield size={12} style={{ marginRight: '6px' }} /> 추천: 간편 로그인으로 안전하게 연동
                </span>
                <button
                  type="button"
                  className="btn"
                  onClick={handleOAuthLogin}
                  style={{
                    backgroundColor: getOAuthColor(),
                    color: '#FFFFFF',
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    fontWeight: 500,
                    marginTop: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                >
                  {getOAuthLabel()}
                </button>

                <div className="oauth-divider">
                  <span>또는 수동 입력 (고급)</span>
                </div>
              </div>
            )}

            {/* 계정 이름 필드 */}
            <div>
              <label className="field-label">계정 이름 (예: 나의 공식 {platformName} {platformId.startsWith('youtube') ? '채널' : '계정'})</label>
              <input
                type="text"
                className="premium-input"
                placeholder="계정을 구분할 수 있는 이름을 적어주세요"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                required
              />
            </div>

            {/* 플랫폼별 동적 비밀값 입력 필드 */}
            <div style={{ display: 'grid', gridTemplateColumns: fields.length === 1 ? '1fr' : '1fr 1fr', gap: '16px' }}>
              {fields.map(f => (
                <div key={f.key} style={{ gridColumn: fields.length === 1 ? 'span 1' : 'auto' }}>
                  <label className="field-label">{f.label}</label>
                  <input
                    type={f.obscure ? 'password' : 'text'}
                    className="premium-input"
                    placeholder={`${f.label} 값을 입력하세요`}
                    value={f.value}
                    onChange={e => handleFieldChange(f.key, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>

          </div>

          {/* 모달 풋터 액션 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              취소
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? '저장 중...' : connectedAccount ? '정보 수정' : '연동하기'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(11, 25, 44, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.25s ease;
        }

        .modal-content {
          width: 100%;
          max-width: 650px;
          border-color: var(--border-hover);
          background-color: #0D1117;
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.05);
          color: #FFFFFF;
        }

        .oauth-section {
          padding: 20px;
          border-radius: 14px;
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          text-align: center;
        }

        .oauth-badge {
          display: inline-flex;
          align-items: center;
          font-size: 11px;
          color: var(--text-secondary);
          background-color: rgba(100, 255, 218, 0.08);
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid rgba(100, 255, 218, 0.15);
        }

        .oauth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin-top: 24px;
          color: var(--text-muted);
          font-size: 11px;
          letter-spacing: 0.8px;
        }

        .oauth-divider::before,
        .oauth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-color);
        }

        .oauth-divider span {
          padding: 0 16px;
        }


        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
