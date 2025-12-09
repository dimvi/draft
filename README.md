# Draft Generator

AICP 프롬프트 엔지니어링을 위한 `*.draft` 파일 생성 웹 애플리케이션입니다.

## 개요

Draft Generator는 프로메테우스 프레임워크의 AICP(AI Code Prompt) 워크플로우에서 사용되는 `*.draft` 파일을 쉽게 작성할 수 있도록 돕는 대화형 웹 애플리케이션입니다.
iMessage 스타일의 직관적인 대화형 인터페이스를 통해 한글로 초안을 작성하면, 자동으로 영어로 번역하여 `*.aispec` 파일 생성을 위한 구조화된 YAML 파일을 출력합니다.

## 주요 기능

### 🎯 대화형 워크플로우
- **iMessage 스타일 UI**: 친숙한 대화형 인터페이스로 자연스러운 작성 경험
- **단계별 안내**: 각 워크플로우 단계마다 명확한 가이드 제공
- **유연한 입력**: 빈 칸 입력 시 자동으로 다음 단계로 진행

### 📁 파일 참조 시스템
- **폴더 지정**: 버튼 클릭으로 프로젝트 폴더 선택 및 로컬스토리지 저장
- **@ 자동완성**: `@` 입력 시 지정된 폴더의 모든 파일 목록 표시
- **인텔리전트 필터링**: `@a` 입력 시 'a'가 포함된 파일만 하이라이트
- **빠른 참조**: Claude Code와 동일한 방식으로 파일 경로 자동 삽입

### ⚙️ 커스터마이징 가능한 워크플로우
- **기본 프리셋**: goal → context → steps → constraints (4단계)
- **워크플로우 관리**: 로컬스토리지를 통한 단계 추가/삭제/편집
- **프리셋 저장**: 자주 사용하는 워크플로우 저장 및 재사용

### 🌐 AI 기반 번역
- **경량 번역 모델**: HuggingFace 기반 한영 번역 (브라우저 내 실행)
- **자동 번역**: 모든 워크플로우 완료 시 자동으로 영어 번역
- **오프라인 지원**: 모델 캐싱을 통한 오프라인 번역 가능

### 📝 Draft 파일 생성
- **YAML 출력**: 표준화된 `*.draft` 형식 자동 생성
- **즉시 다운로드**: 작성 완료 즉시 파일 다운로드
- **PrompterAgent 연계**: 생성된 파일을 @PrompterAgent에 전달하여 `*.aispec` 파일로 변환

## 기술 스택

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS (iMessage 스타일 UI)
- **Translation**: HuggingFace Transformers.js (경량 한영 번역)
- **Storage**: LocalStorage (워크플로우 프리셋, 폴더 경로, 파일 캐시)
- **File System**: File System Access API (브라우저 기반 폴더 접근)
- **Build**: Vite (빠른 개발 서버 및 최적화된 프로덕션 빌드)

## 설치 및 실행

### 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173` 접속

### 프로덕션 빌드
```bash
npm run build
```

## 사용 방법

### 1. 프로젝트 폴더 설정
- 상단의 **폴더 선택** 버튼 클릭
- 파일 시스템 다이얼로그에서 프로젝트 폴더 선택
- 선택된 폴더 경로가 로컬스토리지에 저장됩니다

### 2. 워크플로우 시작
- 애플리케이션 실행 시 기본 4단계 워크플로우가 로드됩니다
- 첫 번째 단계 안내 메시지가 표시됩니다 (예: "목표를 입력해주세요")

### 3. 대화형 입력 및 파일 참조
- 각 단계별로 내용을 입력하면 **나의 메시지**로 표시됩니다
- 계속해서 입력하면 같은 단계의 내용이 누적됩니다
- **파일 참조**: `@` 입력 시 자동완성 패널이 나타나며 폴더 내 파일 목록 표시
  - `@a` 입력: 'a'가 포함된 파일만 필터링 및 하이라이트
  - 방향키로 파일 선택 후 Enter 또는 클릭으로 경로 삽입
- **빈 칸 입력** 시 다음 워크플로우 단계로 자동 이동

### 4. Draft 파일 생성
- 마지막 워크플로우 단계 완료 후 자동으로 번역 시작
- 번역 완료 시 `*.draft` 파일이 자동 생성 및 다운로드됩니다

### 5. 워크플로우 커스터마이징
- 설정 메뉴에서 워크플로우 단계 추가/삭제/편집 가능
- 변경된 워크플로우는 로컬스토리지에 자동 저장됩니다

## 출력 형식

표준 `*.draft` 파일 구조:
```yaml
goal: "Create player profile popup"

context:
  - "Must inherit from base popup class"
  - "Use PlayerAPI for player data"

steps:
  - "Create ViewModel first"
  - "Then create View"
  - "Bind ViewModel and View components"

constraints:
  - "Never use LINQ"
  - "Properly unsubscribe events to prevent memory leaks"
```

## 로컬스토리지 구조

```typescript
{
  // 워크플로우 설정
  "workflows": [
    {
      "name": "default",
      "steps": ["goal", "context", "steps", "constraints"]
    },
    // 커스텀 워크플로우...
  ],
  "currentWorkflow": "default",

  // 프로젝트 폴더 경로
  "projectFolder": "/Users/username/my-project",

  // 파일 캐시 (성능 최적화)
  "fileCache": {
    "lastScanned": "2024-12-09T08:00:00Z",
    "files": [
      "src/index.ts",
      "src/components/App.tsx",
      // ...
    ]
  }
}
```

## 라이선스

MIT License
