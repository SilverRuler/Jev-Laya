from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field

StateValue = str | dict | list
InstructionValue = str | dict | list

# ---------------------------------------------------------------------------
# Question types (요청)
# ---------------------------------------------------------------------------


class NoulQuestion(BaseModel):
    """Yes/No 질문. 답변은 0~1 사이의 '예'일 확률로 돌아온다."""

    type: Literal["noul"] = "noul"
    instructions: InstructionValue
    criteria: dict[Literal["true", "false"], InstructionValue] | None = None


class ChoiceQuestion(BaseModel):
    """여러 옵션 중 하나를 고르는 질문. 옵션별 확률 분포를 함께 반환."""

    type: Literal["choice"] = "choice"
    instructions: InstructionValue
    criteria: dict[str, InstructionValue | None] = Field(..., max_length=255)


class ScoreQuestion(BaseModel):
    """정해진 등급(레벨) 위에서 점수를 매기는 질문. 레벨 순서가 중요하다."""

    type: Literal["score"] = "score"
    instructions: InstructionValue
    criteria: list[InstructionValue] = Field(..., min_length=2, max_length=10)


Question = Annotated[
    NoulQuestion | ChoiceQuestion | ScoreQuestion,
    Field(discriminator="type"),
]


class SystemOneRequest(BaseModel):
    """POST /v1/systemone 요청 바디."""

    state: StateValue
    model: str = "jev-latest"
    questions: dict[str, Question] = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Answer types (응답)
# ---------------------------------------------------------------------------


class NoulAnswer(BaseModel):
    type: Literal["noul"]
    noul: float


class ChoiceAnswer(BaseModel):
    type: Literal["choice"]
    choice: str
    probabilities: dict[str, float]
    confidence: float


class ScoreAnswer(BaseModel):
    type: Literal["score"]
    score: float
    legend: dict[str, str]
    probabilities: dict[str, float]
    confidence: float


Answer = Annotated[
    NoulAnswer | ChoiceAnswer | ScoreAnswer,
    Field(discriminator="type"),
]


class Usage(BaseModel):
    input_tokens: int
    output_tokens: int


class SystemOneResponse(BaseModel):
    """TypeSafe가 그대로 돌려주는 응답 형태."""

    model: str
    answers: dict[str, Answer]
    usage: Usage


class ErrorBody(BaseModel):
    """TypeSafe 에러 응답을 그대로 통과시킬 때 쓰는 최소 형태."""

    detail: str | dict | list
