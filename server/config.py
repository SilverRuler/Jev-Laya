from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """laya 로컬 추론 엔진 설정. 환경변수 또는 .env 파일에서 읽어온다."""

    # None이면 laya가 cuda 사용 가능 여부를 자체 판단한다. "cpu" / "cuda"로 강제 가능.
    laya_device: str | None = None
    # 서버 기동 시 세 체크포인트(english/multilingual/typed-decisions)를 모두 상주시킬지 여부.
    # False면 max_loaded=1로 lazy-load하며, 언어가 바뀔 때마다 수 초의 재로딩이 발생한다.
    laya_preload: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("laya_device", mode="before")
    @classmethod
    def _blank_means_auto(cls, v: object) -> object:
        # .env에 LAYA_DEVICE= 처럼 값 없이 두면 ""로 읽히는데, torch.device("")는 예외를 던진다.
        # 빈 문자열/공백은 "자동 판단"(None)으로 취급한다.
        if isinstance(v, str) and v.strip() == "":
            return None
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()