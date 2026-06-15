import re

SPAM_PATTERNS = [r"https?://", r"viagra", r"casino", r"crypto.*free", r"click here"]
ABUSE_PATTERNS = [r"idiot", r"stupid", r"merde", r"connard"]


class CommentModerationService:
    def moderate(self, content: str) -> str:
        lower = content.lower()
        for p in SPAM_PATTERNS:
            if re.search(p, lower, re.I):
                return "spam"
        link_count = len(re.findall(r"https?://", content))
        if link_count >= 3:
            return "spam"
        for p in ABUSE_PATTERNS:
            if re.search(p, lower, re.I):
                return "spam"
        return "pending"
