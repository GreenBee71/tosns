# 새로운 프로젝트(BSW 등) 전용 환경 구축 가이드

여러 대의 컴퓨터에서 GCP 서버에 접속할 때 AI(Antigravity) 충돌을 방지하고, 프로젝트 간 간섭을 분리하기 위한 단계별 가이드입니다.

## 1단계: 서버에 프로젝트 전용 계정 생성
GCP 서버 내에서 각 프로젝트를 전담할 새로운 사용자를 생성하여 세션을 격리합니다.

```bash
# 1. 새 계정 생성 (예: greenbee-bsw)
sudo useradd -m -s /bin/bash greenbee-bsw

# 2. 필수 권한(sudo, docker) 부여
sudo usermod -aG sudo,docker greenbee-bsw

# 3. SSH 접속을 위한 키 복사 (현재 계정의 키를 새 계정에 복사)
sudo mkdir -p /home/greenbee-bsw/.ssh
sudo cp ~/.ssh/authorized_keys /home/greenbee-bsw/.ssh/
sudo chown -R greenbee-bsw:greenbee-bsw /home/greenbee-bsw/.ssh
sudo chmod 700 /home/greenbee-bsw/.ssh
sudo chmod 600 /home/greenbee-bsw/.ssh/authorized_keys
```

## 2단계: 프로젝트 폴더 배치 및 권한 설정
프로젝트 파일을 새 계정의 홈 디렉토리로 이동시키고 소유권을 설정합니다.

```bash
# 워크스페이스 생성 및 폴더 이동
sudo mkdir -p /home/greenbee-bsw/workspace
# (기존 bsw 폴더가 있다면 해당 경로로 이동시킨 후 아래 명령 실행)
sudo chown -R greenbee-bsw:greenbee-bsw /home/greenbee-bsw/workspace
```

## 3단계: 로컬 PC(작업용 컴퓨터) SSH 설정
해당 프로젝트를 작업할 컴퓨터의 `~/.ssh/config` 파일에 접속 설정을 추가합니다.

```text
# BSW 프로젝트 접속 설정
Host gcp-bsw
    HostName 34.64.105.244  # GCP 서버 IP
    User greenbee-bsw       # 새로 만든 계정명
    IdentityFile [로컬_SSH_키_경로]
    IdentitiesOnly=yes
```

## 4단계: VS Code 접속 및 `.cursorrules` 적용
1. VS Code에서 `Remote-SSH`를 사용하여 `gcp-bsw`에 접속합니다.
2. 폴더 열기: `/home/greenbee-bsw/workspace/bsw`
3. 해당 폴더에 `.cursorrules` 파일을 생성하여 AI 지침을 정의합니다. (TOSNS 프로젝트의 `.cursorrules`를 참고하되 경로는 bsw에 맞게 수정)

---
**작성일**: 2026-03-14
**작성자**: Antigravity Assistant
