#!/bin/bash

# 프로젝트 루트 경로 설정 (절대 경로)
PROJECT_ROOT="/home/greenbee-tosns/workspace/tosns"
LOG_FILE="${PROJECT_ROOT}/build_log_$(date +'%Y%m%d_%H%M%S').txt"

echo "==========================================" | tee -a "$LOG_FILE"
echo " 빌드 프로세스 시작: $(date)" | tee -a "$LOG_FILE"
echo "==========================================" | tee -a "$LOG_FILE"

# 1. 빌드 준비 및 정리
echo "[1/2] 빌드 준비 중..." | tee -a "$LOG_FILE"
# 호스트 환경에 Flutter가 없는 경우를 대비하여 Docker 빌드 프로세스에 위임합니다.
# Dockerfile 내에서 flutter pub get 및 build가 수행됩니다.
echo " -> 빌드 프로세스를 Docker 엔진으로 위임합니다." | tee -a "$LOG_FILE"

# 2. Docker Compose 빌드 (이미지 생성)
echo "[2/2] Docker Compose 빌드 중 (tosns-api, tosns-admin)..." | tee -a "$LOG_FILE"
cd "${PROJECT_ROOT}" && \
docker compose build --no-cache >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo " -> Docker 이미지 빌드 성공." | tee -a "$LOG_FILE"
else
    echo " -> [ERROR] Docker 이미지 빌드 실패! 로그를 확인하세요." | tee -a "$LOG_FILE"
    exit 1
fi

# 3. 빌드 결과 요약
echo "[3/3] 빌드 프로세스 종료: $(date)" | tee -a "$LOG_FILE"
echo "최종 빌드 로그: $LOG_FILE" | tee -a "$LOG_FILE"
echo "==========================================" | tee -a "$LOG_FILE"
