import re


def filter_special_chars(text: str) -> str:
    return re.sub(r'[^0-9a-zA-ZäÄöÖåÅа-яА-Я \-]', '', text)


def filter_social_security_numbers(text: str, placeholder: str = "") -> str:
    return re.sub(r'\d{6}[Aa\-+]\d{3}[^\s]', placeholder, text)
