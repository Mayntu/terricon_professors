"""Отсекает NUL-байт во вводе (путь, query, тело) ответом 422 до бизнес-логики.

PostgreSQL не хранит \\x00 в text — без этого запрос падал в 500 (QA-05, docs/FINAL_QA.md).
"""

import json
import re
from typing import Any

from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.errors import AppError

_ENCODED_NUL = re.compile(rb"%00|\\u0000", re.IGNORECASE)


def _has_nul(data: bytes) -> bool:
    return b"\x00" in data or _ENCODED_NUL.search(data) is not None


class NulGuardMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        if _has_nul(scope.get("raw_path") or scope["path"].encode()) or _has_nul(scope.get("query_string", b"")):
            await self._reject(scope, send)
            return
        if scope["method"] not in ("POST", "PUT", "PATCH"):
            await self.app(scope, receive, send)
            return
        chunks: list[bytes] = []
        more = True
        while more:
            message = await receive()
            if message["type"] != "http.request":
                break
            chunks.append(message.get("body", b""))
            more = message.get("more_body", False)
        body = b"".join(chunks)
        if _has_nul(body):
            await self._reject(scope, send)
            return
        sent = False

        async def replay() -> Message:
            nonlocal sent
            if not sent:
                sent = True
                return {"type": "http.request", "body": body, "more_body": False}
            return await receive()

        await self.app(scope, replay, send)

    @staticmethod
    async def _reject(scope: Scope, send: Send) -> None:
        payload: dict[str, Any] = AppError("validation", "VALIDATION", "Недопустимый символ во вводе", {"_": ["NUL"]}).to_body()
        raw = json.dumps(payload, ensure_ascii=False).encode()
        headers = [(b"content-type", b"application/json"), (b"content-length", str(len(raw)).encode())]
        await send({"type": "http.response.start", "status": 422, "headers": headers})
        await send({"type": "http.response.body", "body": raw})
