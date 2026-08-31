import re
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# List of keywords that indicate the user is asking for medical advice, diagnoses, or prescriptions
MEDICAL_ADVICE_KEYWORDS = [
    r"\bdiagnose\b", r"\bsymptom\b", r"\btreatment\b", r"\bmedicine for\b",
    r"\bcure\b", r"\bpill\b", r"\bheadache\b", r"\bcough\b", r"\bfever\b",
    r"\bshould i take\b", r"\bdoes this mean i have\b", r"\bsick\b", r"\bpain\b", r"\bitchy\b"
]

# List of keywords that indicate an adversarial or prompt-injection attack
ADVERSARIAL_KEYWORDS = [
    r"\bignore previous\b", r"\bdisregard previous\b", r"\byou are now\b",
    r"\bsystem prompt\b", r"\bbypass\b", r"\bjailbreak\b", r"\bforget everything\b"
]

def check_guardrails(message: str) -> tuple[bool, str]:
    """
    Checks the user message against security and medical guardrails.
    Returns (True, "") if safe.
    Returns (False, fallback_message) if it violates a guardrail.
    """
    message_lower = message.lower()

    # 1. Check for prompt injections / adversarial attacks
    for pattern in ADVERSARIAL_KEYWORDS:
        if re.search(pattern, message_lower):
            logger.warning(f"Guardrail triggered: Adversarial input detected.")
            return False, "I cannot fulfill that request. Please let me know if you would like to book a healthcare service."

    # 2. Check for medical advice requests
    for pattern in MEDICAL_ADVICE_KEYWORDS:
        if re.search(pattern, message_lower):
            # Exception: Allow the word 'medicine' if they are asking for 'medicine delivery'
            if "medicine delivery" in message_lower and pattern in [r"\bmedicine for\b", r"\bpill\b"]:
                continue
                
            logger.warning(f"Guardrail triggered: Medical advice requested.")
            return False, "I am a booking assistant and cannot provide medical advice or diagnoses. Please consult a doctor, or let me know if you'd like to book a consultation."

    return True, ""
