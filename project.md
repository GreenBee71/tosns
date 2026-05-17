# TOSNS 프로젝트 진행 상황 (Project Status)

## 1. 개요
* **프로젝트명:** TOSNS (TikTok/SNS 통합 관리 플랫폼)
* **목표:** SNS 계정 연결 및 통합 업로드/관리 자동화 서비스
* **현재 버전:** v1.6 (도메인 마이그레이션 및 리브랜딩 완료)

## 2. 기술 스택 및 아키텍처
* **Backend:** Python (FastAPI/Uvicorn), PostgreSQL (AsyncPG)
* **Frontend:** Flutter (Web/Native), Feature-Driven 기반 아토믹 디자인
* **Infrastructure:** Docker-Compose, Nginx Proxy Manager, Google Cloud Platform (GCP)
* **Domain:** `https://tosns.greenbee.cloud` (메인 도메인 브랜딩 완료)

## 3. 주요 구성 요소
| 컴포넌트 | 이미지명 | 포트 | 역할 |
| :--- | :--- | :--- | :--- |
| **API** | `tosns-api` | 8000 | 백엔드 비즈니스 로직 및 OAuth 처리 |
| **Web App** | `tosns-app` | 80 | Flutter Web 기반 사용자 인터페이스 |
| **DB** | `postgres:15` | 5432 | 영속성 데이터 저장 (PostgreSQL) |
| **Proxy** | `gb-npm` | 80/443 | SSL 인증서 관리 및 도메인 포워딩 |

## 4. 최근 작업 현황 (Last Updates)
* **[완료] 도메인 마이그레이션:** `admin.tosns`에서 `tosns.greenbee.cloud`로 전체 환경 이관 및 SSL 최적화.
* **[완료] 환경 변수 갱신:** TikTok, YouTube, Instagram OAuth 콜백 URI를 신규 도메인으로 업데이트.
* **[완료] 프론트엔드 리팩토링:** Feature-Driven 구조로 전환 및 API 클라이언트 경로 오류 해결.
* **[완료] TikTok 도메인 인증:** 소유권 인증 파일(Signature file) 및 Meta Tag 배포 완료.
* **[완료] 법적 문서 구축:** 영문 Privacy Policy 및 Terms of Service 페이지 실시간 서빙 완료.
* **[완료] 프로젝트 클린업 및 최신화:** 빌드 환경에서 안 쓰이는 잔여 FFmpeg/ImageMagick 바이너리 찌꺼기 완벽 제거 및 프론트엔드 최신 버전 변경(v1.6).
* **[완료] 미디어 라이브러리 구축:** v1.6 Premium 디자인 표준을 적용한 신규 개발 및 백엔드 CRUD API 연동 완료.

## 5. 향후 계획 (Next Steps)
1. **TikTok API 승인 모니터링:** 제출 완료(Case: de0f9ac2478564cf) 후 승인 결과 대기 (1~3일).
2. **신규 플랫폼 연동:** X(Twitter) 등 추가 SNS 커넥터 구현 대기.
3. **UI/UX 고도화:** '페이퍼로지' 폰트 및 프리미엄 딥 네이비 테마의 전면 적용 검토.

---
*마지막 업데이트: 2026-04-16 (by #일벌이1호 Architect)*
