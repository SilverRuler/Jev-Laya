from __future__ import annotations

from laya import Router

from schemas import SystemOneRequest, SystemOneResponse

_KNOWN_CHECKPOINTS = {"english", "multilingual", "typed-decisions"}

# TypeSafe가 쓰는 model id/alias -> laya 체크포인트. None이면 Router가 자동으로 고른다.
_MODEL_ALIASES: dict[str, str | None] = {
    "jev-latest": None,
    "jev-preview": None,
    "router": None,
    "auto": None,
    "laya": "english",
    "laya-english": "english",
    "laya-multilingual": "multilingual",
    "laya-typed-decisions": "typed-decisions",
}


def resolve_checkpoint(model: str) -> str | None:
    """요청의 model 필드를 laya 체크포인트 이름으로 매핑한다. 모르는 값은 자동 라우팅으로 넘긴다."""
    if model in _KNOWN_CHECKPOINTS:
        return model
    return _MODEL_ALIASES.get(model)


class LayaEngine:
    """`/v1/systemone` 계약은 TypeSafe(Jev) 그대로, 실제 추론은 로컬 laya 모델이 수행한다."""

    def __init__(self, device: str | None = None, preload: bool = True):
        # preload=True: 세 체크포인트를 전부 상주시켜 언어가 섞여도 재로딩 없이 응답한다.
        self._router = Router(preload=preload, device=device)

    def evaluate(self, request: SystemOneRequest) -> SystemOneResponse:
        checkpoint = resolve_checkpoint(request.model)
        questions = {qid: q.model_dump(exclude_none=True) for qid, q in request.questions.items()}

        result = self._router.predict(request.state, questions, model=checkpoint)

        routing = result.get("routing") or {}
        used = routing.get("model", checkpoint or "english")
        result["model"] = f"laya-{used}"

        return SystemOneResponse.model_validate(result)
