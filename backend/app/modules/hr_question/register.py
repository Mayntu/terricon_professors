from fastapi import APIRouter, Depends
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_user
from app.core.db import DbSession
from app.core.errors import conflict, validation
from app.core.modules import ModuleContext
from app.core.org.models import Employee
from app.core.requests import RequestType
from app.core.requests import service as requests
from app.core.requests.schemas import RequestOut, present
from app.core.requests.models import OPEN_STATUSES
from app.core.schemas import ApiModel

TYPE = "hr_question"

RU = {
    "request.type.hr_question": "Вопрос к HR",
    "notif.hr_question.answered.title": "HR ответил на ваш вопрос",
    "notif.hr_question.answered.body": "{number}: {comment}",
    "notif.hr_question.closed.title": "Вопрос закрыт",
    "notif.hr_question.closed.body": "{number}: {comment}",
}
KK = {
    "request.type.hr_question": "HR-ға сұрақ",
    "notif.hr_question.answered.title": "HR сұрағыңызға жауап берді",
    "notif.hr_question.answered.body": "{number}: {comment}",
    "notif.hr_question.closed.title": "Сұрақ жабылды",
    "notif.hr_question.closed.body": "{number}: {comment}",
}

router = APIRouter(prefix="/api/hr-questions", tags=["hr_question"])


class HrQuestionIn(ApiModel):
    question: str = Field(min_length=3, max_length=2000)
    # Что ответил AI (если вопрос пришёл из AI Jana) — HR видит контекст
    ai_context: str | None = Field(default=None, max_length=4000)
    submission_key: str | None = Field(default=None, min_length=8, max_length=100)


@router.post("", response_model=RequestOut, response_model_by_alias=True, status_code=201)
async def ask_hr(body: HrQuestionIn, user: Employee = Depends(current_user), session: AsyncSession = DbSession):
    question = " ".join(body.question.split())
    if len(question) < 3:
        raise validation("QUESTION_REQUIRED", "Напишите вопрос для HR", "question")
    await requests.lock_employee(session, user.id)
    if body.submission_key:
        existing = await requests.find_by_submission_key(session, user, body.submission_key)
        if existing:
            if existing.type != TYPE or existing.payload.get("question", "").casefold() != question.casefold():
                raise conflict("SUBMISSION_KEY_REUSED", "Ключ отправки уже использован для другого обращения")
            return await present(session, existing, user)
    for existing in await requests.list_mine(session, user, TYPE):
        if existing.status in OPEN_STATUSES and " ".join(existing.payload.get("question", "").split()).casefold() == question.casefold():
            return await present(session, existing, user)
    payload = {"question": question, "aiContext": body.ai_context}
    req = await requests.create(session, user, TYPE, payload, body.submission_key)
    return await present(session, req, user)


def register(ctx: ModuleContext) -> None:
    ctx.i18n(RU, KK)
    ctx.request_types.register(
        RequestType(
            code=TYPE,
            number_prefix="HQ",
            title_key="request.type.hr_question",
            approver="hr",
            # Вопрос к HR — не жалоба на руководителя, но руководителю он ни к чему
            visible_to_manager=False,
            comment_required_on_approve=True,
            decided_keys={
                "Approved": ("notif.hr_question.answered.title", "notif.hr_question.answered.body"),
                "Rejected": ("notif.hr_question.closed.title", "notif.hr_question.closed.body"),
            },
        )
    )
    ctx.include_router(router)
