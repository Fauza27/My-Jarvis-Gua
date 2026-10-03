from typing import Annotated
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from pydantic import AfterValidator


def validate_timezone(value: str) -> str:
    try:
        ZoneInfo(value)
    except (ZoneInfoNotFoundError, ValueError):
        raise ValueError("Invalid IANA timezone")
    return value


TimeZone = Annotated[str, AfterValidator(validate_timezone)]
