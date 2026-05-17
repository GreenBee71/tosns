# Antigravity 세션 관리 및 계정 분리 가이드

여러 대의 컴퓨터에서 GCP 서버에 동시 접속할 때 발생하는 Antigravity(AI 언어 서버) 충돌 문제를 해결하고 방지하기 위한 가이드입니다. 이 설정은 **TOSNS** 프로젝트의 안정적인 개발 환경을 위해 반드시 권장됩니다.

## 1. 현재 구축된 환경 (PID 충돌 해결 완료)
- **전용 계정**: `greenbee-tosns` (TOSNS 프로젝트 파일 격리 완료)
- **격리 경로**: `/home/greenbee-tosns/workspace/tosns`
- **장점**: 타 계정이나 프로젝트와 Antigravity 세션이 겹치지 않아 "Could not find Antigravity process" 오류가 발생하지 않습니다.

## 2. 각 로컬 PC별 설정 방법 (필수)
새로운 프로젝트용 계정으로 접속하기 위해, 사용하는 **모든 컴퓨터**의 로컬 SSH 설정을 다음과 같이 통일해 주세요.

### SSH Config 설정
로컬 PC의 `~/.ssh/config` (또는 `C:\Users\[유저명]\.ssh\config`) 파일을 열고 아래 블록을 추가합니다:

```text
# TOSNS 프로젝트 전용 계정 접속 설정
Host gcp-tosns
    HostName 34.64.105.244
    User greenbee-tosns
    IdentityFile /home/greenbee/.ssh/google_compute_engine  # 각 PC의 키 경로에 맞게 수정 가능
    UserKnownHostsFile=/home/greenbee/.ssh/google_compute_known_hosts
    HostKeyAlias=compute.424651872134527877
    IdentitiesOnly=yes
    CheckHostIP=no
```

## 3. VS Code 접속 방법
1. VS Code에서 `F1` 키를 누르고 `Remote-SSH: Connect to Host...` 검색
2. 위에서 설정한 **`gcp-tosns`** 선택하여 접속
3. **`Open Folder`** 클릭 후 경로 입력: `/home/greenbee-tosns/workspace/tosns`

## 4. 추가로 프로젝트용 계정을 만들고 싶을 때 (명령어)
새로운 프로젝트(예: `other-app`)용 계정이 더 필요하다면 **기존 터미널**에서 아래 명령어를 실행하세요:

```bash
# 1. 새 계정 생성 및 권한 부여
NEW_USER="greenbee-other-app"
sudo useradd -m -s /bin/bash $NEW_USER
sudo usermod -aG sudo,docker $NEW_USER

# 2. SSH 키 복사
sudo mkdir -p /home/$NEW_USER/.ssh
sudo cp ~/.ssh/authorized_keys /home/$NEW_USER/.ssh/
sudo chown -R $NEW_USER:$NEW_USER /home/$NEW_USER/.ssh
sudo chmod 700 /home/$NEW_USER/.ssh
sudo chmod 600 /home/$NEW_USER/.ssh/authorized_keys
```

---
**작성일**: 2026-03-13
**작성자**: Antigravity Assistant
