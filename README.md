# 사내 업무 요청 자동 정리 시스템 백엔드 (FastAPI + Google Gemini API)

이 프로젝트는 Slack, 이메일 등에서 발생하는 비정형 업무 요청 메시지를 분석하여 담당자, 마감일, 수행 업무, 중요도를 자동으로 추출하고 DB에 정형 데이터로 저장/관리할 수 있는 백엔드 API 시스템입니다.

## 기술 스택
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL (SQLAlchemy ORM) / 로컬 테스트용 SQLite 지원
- **LLM API**: Google GenAI SDK (`google-genai` 라이브러리 및 `gemini-2.5-flash` 모델)
- **Deployment**: Google Cloud Run (Docker 기반)

---

## 프로젝트 디렉터리 구조

```text
aigent-sync/
├── README.md                  # 프로젝트 설명서 (본 파일)
└── backend/
    ├── .env                   # 로컬 환경 변수 설정 파일
    ├── .env.example           # 환경 변수 템플릿 파일
    ├── Dockerfile             # Google Cloud Run 배포용 도커 파일
    ├── database.py            # SQLAlchemy DB 연결 및 세션 설정
    ├── main.py                # FastAPI 앱 및 API 엔드포인트 구현 (Gemini 연동)
    ├── models.py              # SQLAlchemy DB 테이블 모델 선언
    ├── schemas.py             # Pydantic 입출력 데이터 검증 스키마
    └── requirements.txt       # 의존성 패키지 목록
```

---

## 환경 변수 (.env) 설정

`backend/` 폴더 내에 `.env` 파일을 만들고 아래 변수들을 설정합니다.

```ini
# Google Gemini API 키 (필수)
GEMINI_API_KEY=your_gemini_api_key_here

# PostgreSQL 연결 URI (개발환경에서 빈칸으로 두면 SQLite 'tasks.db'가 자동 사용됨)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

---

## 로컬 개발 환경 설치 및 실행

### 1. 가상환경 생성 및 의존성 설치
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 서버 실행
```bash
uvicorn main:app --reload --port 8000
```
- 서버가 실행되면 기본적으로 `http://127.0.0.1:8000`에서 호스팅됩니다.
- API 문서(Swagger UI)는 `http://127.0.0.1:8000/docs`에서 확인할 수 있습니다.

---

## 핵심 API 기능 및 테스트 방법

### 1. LLM 분석 API (`POST /api/analyze`)
비정형 텍스트를 받아 `gemini-2.5-flash` 모델을 사용해 분석된 구조화된 업무 정보와 신뢰도(Confidence Score)를 JSON 형태로 반환합니다.

- **Request Body:**
  ```json
  {
    "text": "홍길동님, 오늘 오후까지 이번 분기 기획서 작성 마무리해서 공유해주세요. 중요합니다!"
  }
  ```

- **Response Body (예시):**
  ```json
  {
    "assignee": "홍길동",
    "deadline": "2026-05-23",
    "description": "이번 분기 기획서 작성 마무리 및 공유",
    "priority": "High",
    "confidence_score": 0.95
  }
  ```

### 2. 업무 관리 CRUD API (`/api/tasks`)
- `POST /api/tasks`: 태스크 추가 (분석된 정보를 가공하여 저장할 수 있습니다)
- `GET /api/tasks`: 태스크 목록 조회 (상태별 `status_filter`, 담당자별 `assignee_filter` 필터링 지원)
- `GET /api/tasks/{task_id}`: 특정 태스크 상세 조회
- `PUT /api/tasks/{task_id}`: 태스크 정보/상태 수정 (To-do, In Progress, Done 등)
- `DELETE /api/tasks/{task_id}`: 태스크 삭제

---

## Google Cloud Run 배포 가이드

Google Cloud Run에 컨테이너를 직접 빌드하여 배포하려면 Google Cloud SDK(gcloud CLI)가 설치되어 있고 로그인되어 있어야 합니다.

### 1. 로컬 도커 빌드 테스트 (선택 사항)
```bash
docker build -t task-backend ./backend
docker run -p 8080:8080 -e GEMINI_API_KEY="본인의_API_KEY" task-backend
```

### 2. Google Artifact Registry에 빌드 및 배포
Google Cloud 프로젝트 ID가 `my-project-id`이고 서비스명이 `task-backend`일 때, 아래 명령어를 실행하여 배포합니다.

```bash
# Artifact Registry 리포지토리 생성 (이미 구성되어 있다면 생략 가능)
gcloud artifacts repositories create cloud-run-source-deploy \
    --repository-format=docker \
    --location=asia-northeast3  # 서울 리전

# Cloud Run 배포 진행 (소스 코드 디렉터리 기준 빌드)
gcloud run deploy task-backend \
    --source=./backend \
    --region=asia-northeast3 \
    --allow-unauthenticated \
    --set-env-vars="GEMINI_API_KEY=YOUR_GEMINI_API_KEY"
```

배포 완료 후 터미널에 생성된 **Service URL**로 접속하여 API를 이용하실 수 있습니다.