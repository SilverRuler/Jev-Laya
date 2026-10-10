from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

from config import get_settings
from laya_engine import LayaEngine
from schemas import SystemOneRequest, SystemOneResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    # 무거운 모델 로딩은 기동 시 한 번만: 체크포인트를 상주시켜 요청마다 재로딩되지 않게 한다.
    app.state.laya_engine = await run_in_threadpool(
        LayaEngine, device=settings.laya_device, preload=settings.laya_preload
    )
    yield


app = FastAPI(title="Jev-compatible Gateway (powered by laya)", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용 (운영 환경에서는 특정 출처만 명시하는 것을 권장)
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드(GET, POST 등) 허용
    allow_headers=["*"],  # 모든 HTTP 헤더 허용
)

def get_engine(request: Request) -> LayaEngine:
    return request.app.state.laya_engine


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/systemone", response_model=SystemOneResponse)
async def systemone(request: Request, body: SystemOneRequest) -> SystemOneResponse:
    """TypeSafe Jev의 /v1/systemone과 동일한 계약. 실제 추론은 로컬 laya 모델이 수행한다.

    state + typed questions(noul/choice/score)를 받아 laya로 평가하고,
    TypeSafe와 같은 형태의 typed answers를 돌려준다.
    """
    engine = get_engine(request)
    # torch 순전파는 블로킹 연산이므로 이벤트 루프를 막지 않도록 스레드풀에서 실행한다.
    return await run_in_threadpool(engine.evaluate, body)
