<div align="center">

# jev-laya

**TypeSafe Jev 호환 `/v1/systemone` API + 플레이그라운드 UI — 실제 추론은 로컬 [`laya`](#laya-모델)가 수행합니다.**

클론 → 설치 → 실행, 3단계로 로컬에서 동작합니다. GPU 불필요(CPU도 동작).

</div>

---

## 이게 뭔가

세 가지가 붙어 있습니다.

```
브라우저  ──fetch──▶  server/ (FastAPI, :8000)  ──▶  laya 모델 (4MB, 로컬)
   web/  (React + Vite, :5173)      /v1/systemone
```

| | 정체 | 역할 |
|---|---|---|
| **Jev** | TypeSafe 사의 SaaS | **이 저장소에는 개입하지 않습니다.** API *계약*만 차용 |
| **server/** | FastAPI 게이트웨이 | `/v1/systemone` 라우트 + 요청/응답 스키마. 추론 없음 |
| **laya** | `convaiinnovations/laya` (Apache-2.0) | **실제 추론.** 비자기회귀 System 1 결정 모델 |
| **web/** | React 19 + Vite | 그 계약을 만져보는 UI. 추론 없음 |

코드 주석이 이미 말하고 있습니다.

```python
# server/pyproject.toml
description = "TypeSafe Jev-compatible /v1/systemone API, served locally by laya instead of the TypeSafe API"

# server/main.py
"""TypeSafe Jev의 /v1/systemone과 동일한 계약. 실제 추론은 로컬 laya 모델이 수행한다."""
```

응답의 `model` 필드는 항상 laya 이름을 담습니다 — 요청은 `jev-latest`로 들어와도
실제로는 자동 라우팅된 체크포인트가 쓰입니다(`server/laya_engine.py`).

```python
result["model"] = f"laya-{used}"
```

### 왜 Jev 이름을 남겼나

**교체 가능성**입니다. 나중에 진짜 TypeSafe Jev SaaS로 갈아탈 때 `web/` 코드를 한 줄도
고치지 않고 요청 URL만 바꾸면 됩니다.

---

## 요구사항

| | 버전 | 비고 |
|---|---|---|
| Node.js | **20.19+ / 22.12+** | 프론트엔드 빌드 |
| Python | **3.12+** | 백엔드 |
| [uv](https://docs.astral.sh/uv/) | 최신 | 없으면 `npm run setup` 이 자동 설치 |
| GPU | 선택 | 없으면 CPU 로 동작 (느림). CUDA 있으면 자동 사용 |

디스크 여유는 **약 6GB** (torch 포함, `.venv` 기준).

---

## 빠른 시작

```bash
git clone <이 저장소>
cd jev-laya
npm run setup     # 1회. npm ci + uv sync + .env 생성 (3~5분)
npm run dev       # 백엔드 + 프론트 동시 기동
```

브라우저에서 **<http://localhost:5173>** 을 엽니다.

`npm run dev` 는 백엔드 헬스체크가 통과할 때까지 기다린 뒤 프론트를 띄웁니다.
종료는 **Ctrl+C 한 번** — 두 프로세스가 함께 정리됩니다.

<details>
<summary>포트 / 환경변수</summary>

| 변수 | 기본값 | 설명 |
|---|---|---|
| `JEV_BACKEND_PORT` | `8000` | API 포트 |
| `JEV_FRONTEND_PORT` | `5173` | Vite 포트 |

UI 의 요청 URL 은 화면에서 직접 바꿀 수 있으므로 백엔드 포트를 바꾸면
`http://localhost:8000/v1/systemone` 을 그 값으로 바꿔 넣으면 됩니다.

</details>

---

## 명령어

| 명령 | 하는 일 |
|---|---|
| `npm run setup` | 최초 1회 설치 (npm ci + uv sync + .env) |
| `npm run dev` | 둘 다 기동 (권장) |
| `npm start` | `npm run dev` 와 동일 |
| `npm run dev:server` | **백엔드만** |
| `npm run dev:web` | **프론트만** (백엔드는 다른 곳에서 돌린다는 뜻) |
| `npm test` | 프론트 테스트 + 백엔드 정적 검사 |
| `npm run test:web` | 프론트 테스트만 (node --test) |
| `npm run test:server` | 백엔드 정적 검사만 (ruff) |
| `npm run build` | 프로덕션 빌드 → `web/dist/` |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run clean` | 생성물 전부 삭제 (`node_modules`, `.venv`, `dist`) |

<details>
<summary>백엔드 단독 조작</summary>

```bash
node scripts/server.mjs sync      # 의존성만 설치
node scripts/server.mjs check     # ruff 정적 검사
node scripts/server.mjs format    # ruff 자동 수정
node scripts/server.mjs reload    # --reload 로 기동
```

</details>

---

## API

`POST /v1/systemone` · `GET /healthz`

요청 바디:

```jsonc
{
  "model": "jev-latest",            // 선택. jev-latest|jev-preview|router|auto → 자동 라우팅
                                   // laya|laya-english|laya-multilingual|laya-typed-decisions → 고정
  "state": {                        // string | object | array 모두 가능
    "message": "어제부터 39도 고열과 기침이 계속됩니다.",
    "days_symptomatic": 3,
    "max_temperature_c": 39.1
  },
  "questions": {                   // 1개 이상
    "is_emergency": {
      "type": "noul",
      "instructions": "지금 당일 진료가 필요한 상황입니까?"
    },
    "handling": {
      "type": "choice",
      "instructions": "어떤 진료 경로가 가장 적절합니까?",
      "criteria": {                                  // 최대 255
        "self_care": "자가 관리",
        "clinic": "내일 진료 예약",
        "urgent_care": "당일 진료",
        "emergency_room": "응급실"
      }
    },
    "assessment": {
      "type": "score",
      "instructions": "지금 이 환자의 진료 시급성을 평가하세요.",
      "criteria": [                                  // 2~10개, **순서가 곧 등급**
        "지연 가능: 내일 진료",
        "당일 진료 필요",
        "응급실 진료 필요",
        "입원 또는 관찰 필요"
      ]
    }
  }
}
```

응답:

```jsonc
{
  "model": "laya-multilingual",
  "answers": {
    "is_emergency": { "type": "noul", "noul": 0.6964 },
    "handling": {
      "type": "choice", "choice": "emergency_room",
      "probabilities": {
        "self_care": 0.0, "clinic": 0.0, "urgent_care": 0.0, "emergency_room": 1.0
      },
      "confidence": 1.0
    },
    "assessment": {
      "type": "score", "score": 2.4144,
      "legend": {
        "0": "지연 가능: 내일 진료", "1": "당일 진료 필요",
        "2": "응급실 진료 필요", "3": "입원 또는 관찰 필요"
      },
      "probabilities": { "0": 0.0063, "1": 0.0335, "2": 0.4998, "3": 0.4604 },
      "confidence": 0.3874
    }
  },
  "usage": { "input_tokens": 426, "output_tokens": 0 }
}
```

> 위 값은 실제 실행 결과입니다. `handling` 은 확률이 1.0 으로 확신하지만 `assessment` 의
> `confidence` 는 0.39 에 그칩니다. **낮은 confidence 자체가 "판단이 애매했다"는 신호**입니다.

<details>
<summary>응답 필드 해설</summary>

| 필드 | 뜻 |
|---|---|
| `model` | 실제로 라우팅되어 실행된 laya 체크포인트 |
| `noul` | 참(true)일 확률, 0~1 |
| `choice` | 가장 높은 확률을 받은 선택지 키 |
| `probabilities` | 선택지별 확률. `score` 는 등급 인덱스 기준 |
| `confidence` | 확률 분포가 얼마나 한쪽으로 쏠렸는지 (0~1). 낮으면 근거 부족 |
| `score` | 등급 인덱스의 기댓값 (예: 2.4144 → 2번과 3번 등급 사이) |
| `legend` | 등급 인덱스 → 원문 criteria |
| `usage.output_tokens` | 항상 0. laya 는 텍스트를 생성하지 않습니다 |

</details>

`curl` 로 확인:

```bash
curl --location 'http://127.0.0.1:8000/v1/systemone' \
--header 'Content-Type: application/json' \
--data '{
  "state": {
    "message": "어제부터 39도 고열과 기침이 계속됩니다. 3일째 체온이 내려가지 않아 오늘 밤 응급실에 가야 할 것 같습니다.",
    "days_symptomatic": 3,
    "max_temperature_c": 39.1,
    "age": 34,
    "high_risk_conditions": false
  },
  "questions": {
    "is_emergency": { "type": "noul", "instructions": "지금 당일 진료가 필요한 상황입니까?" },
    "handling": {
      "type": "choice",
      "instructions": "어떤 진료 경로가 가장 적절합니까?",
      "criteria": {
        "self_care": "자가 관리",
        "clinic": "내일 진료 예약",
        "urgent_care": "당일 진료",
        "emergency_room": "응급실"
      }
    },
    "assessment": {
      "type": "score",
      "instructions": "지금 이 환자의 진료 시급성을 평가하세요.",
      "criteria": ["지연 가능: 내일 진료", "당일 진료 필요", "응급실 진료 필요", "입원 또는 관찰 필요"]
    }
  }
}'
```

<details>
<summary>criteria 문구가 결과를 바꾼다는 주의</summary>

같은 state 에서 질문만 바꿔 보면 확률이 크게 달라집니다.

| criteria | 결과 |
|---|---|
| `{자가 관리, 내일 진료, 당일 진료, 응급실}` (도메인 특화) | `emergency_room` 확률 **1.0** |
| `{자가 해결, 고객지원, 당일 처리, 즉시 호출}` (범용) | 네 옵션에 고르게 분산, conf **0.015** |

범용적인 선택지 이름으로는 모델이 판단 근거를 잡지 못합니다. 실제 도메인의 용어를 그대로 쓰십시오.

</details>

---

## laya 모델

`convaiinnovations/laya` — **4MB**, Apache-2.0, 상업 사용 가능.

- **비자기회귀 System 1 결정 모델.** 텍스트를 *생성하지 않고* 판정만 합니다.
  파싱할 것도 없고 할루시네이션도 없습니다.
- **단일 forward pass ~33ms**, 100+ 언어
- **RLCD** (reinforcement learning against strictly proper scoring rules) 학습 →
  확률이 수학적으로 보정됩니다. 정직한 확률 보고가 보상이라 과장할 유인이 없습니다.
- HuggingFace 파이프라인: `text-classification`

체크포인트 3종 (`english` / `multilingual` / `typed-decisions`)을 `LAYA_PRELOAD=true` 로
전부 상주시킵니다. 언어나 질문 유형이 바뀌어도 재로딩 없이 즉시 응답합니다.
GPU 에서 상주시켜 **약 5GB VRAM** 을 점유하므로, 같은 GPU 에 다른 모델을 올릴 계획이면
`server/.env` 에서 `LAYA_PRELOAD=false` 로 바꾸세요 (언어 바뀔 때 수 초 재로딩).

| `.env` | 기본값 | 설명 |
|---|---|---|
| `LAYA_DEVICE` | *(빈 값)* | 비우면 CUDA 사용 가능 여부 자동 판단. `cpu` / `cuda` 로 강제 |
| `LAYA_PRELOAD` | `true` | 체크포인트 3종 상주 (GPU 필요) |

---

## 구조

```
jev-laya/
├── package.json          npm workspaces 루트 + 오케스트레이션 스크립트
├── scripts/
│   ├── setup.mjs         최초 1회 설치
│   ├── dev.mjs           둘 동시 기동 (헬스체크 대기, Ctrl+C 정리)
│   ├── server.mjs        백엔드 단독 조작 (sync/check/format/run/reload)
│   ├── clean.mjs         생성물 정리
│   └── lib.mjs           공용 헬퍼 (경로, 포트, 색상, 출력 접두)
├── web/                  React 19 + Vite (npm workspace)
│   ├── src/              App.jsx, components/, payload.js, payload.test.js
│   ├── scripts/standalone.mjs   단독 실행 HTML 빌더
│   └── vite.config.js
└── server/               FastAPI (uv)
    ├── main.py           앱 + /healthz + /v1/systemone
    ├── laya_engine.py    laya Router 래핑, model 별칭 매핑
    ├── schemas.py        TypeSafe 계약 그대로의 요청/응답 스키마
    ├── config.py         pydantic-settings (.env)
    ├── pyproject.toml
    └── uv.lock
```

### 빌드 산출물

`npm run build` 는 두 가지를 냅니다.

- `web/dist/` — Vite 일반 빌드
- **`web/dist/jev-lab.html`** — React 코드와 스타일을 **HTML 하나에 인라인**한 단독 파일.
  서버 없이 파일로 열면 UI 만 쓸 수 있습니다.

> `dist/jev-lab.html` 은 HTTPS 페이지(GitHub Pages 등)에서 열면 브라우저 보안 정책상
> `http://localhost:8000` 요청이 차단됩니다. 로컬 파일로 열거나 로컬 dev 서버를 쓰세요.

---

## 알려진 제약

- **WSL2 에서 HMR 이 안 될 수 있습니다.** Windows 드라이브를 9p(drvfs) 로 마운트하면
  inotify 이벤트가 전달되지 않습니다. `web/vite.config.js` 가 이 경로를 감지해
  polling 으로 자동 전환하므로, 그래도 안 되면 dev 서버를 재시작하세요.
- **백엔드에 인증이 없습니다.** 기본값으로 모든 출처를 허용합니다
  (`allow_origins=["*"]`). 로컬 전용으로 쓰세요. LAN 에 노출해야 하면
  `--host 127.0.0.1` 로 바꾸고 리버스 프록시로 인증을 거치세요.
- **`docs/` 배포본**에서 쓸 경우 위의 혼합 콘텐츠(HTTPS→HTTP) 문제를 확인하세요.

---

## 라이선스

이 저장소는 [Apache-2.0](LICENSE) 입니다.

모델 파일(`laya`)은 Apache-2.0 이며 별도 라이선스가 적용됩니다.
Jev / TypeSafe 는 이 저장소의 일부가 아니며, 여기에는 그 API 계약을 재구현한 것만 있습니다.