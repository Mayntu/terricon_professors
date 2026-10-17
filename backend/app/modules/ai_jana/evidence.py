"""Model output can select evidence, never introduce HR facts or execute document instructions."""
import json
import re

# Defence in depth: suspicious passages never enter the prompt or the extractive fallback.
# The actual trust boundary is stricter: only server-owned source text can be returned.
INSTRUCTIONS = re.compile(
    r"ignore\s+(all\s+)?(previous|prior|above|system)|disregard.*instructions|"
    r"игнориру\w*.*(инструкц|правил|систем|предыдущ)|забудь.*инструкц|"
    r"system\s*(prompt|message)|системн\w*\s+(промпт|сообщени)|"
    r"you\s+are\s+(now|an?\s+assistant)|ты\s+теперь|<\|?(system|assistant)|"
    r"(reveal|print|send|выведи|отправь).*(secret|api.?key|токен|парол)|"
    r"(assistant|модель|ассистент)[,:].*(must|должен|ответь)",
    re.I | re.S,
)


def safe_passage(text: str) -> bool:
    return not INSTRUCTIONS.search(text)


def selected_sources(raw: str, allowed: dict) -> list | None:
    """None = invalid model response; [] = explicit abstention; otherwise validated source IDs."""
    if raw.strip() == "NO_ANSWER":
        return []
    try:
        data = json.loads(raw)
    except (ValueError, TypeError):
        return None
    if not isinstance(data, dict) or set(data) != {"sourceIds"}:
        return None
    ids = data["sourceIds"]
    if not isinstance(ids, list) or len(ids) > 3 or any(not isinstance(i, str) or i not in allowed for i in ids):
        return None
    return [allowed[i] for i in dict.fromkeys(ids)]
