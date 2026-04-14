"""
backend/utils/language.py
==========================
Language detection and translation utilities.
Uses langdetect for detection and deep-translator for translation.
All translations go through English for the RAG/LLM pipeline.
"""

from __future__ import annotations

import logging

from langdetect import detect, LangDetectException
from deep_translator import GoogleTranslator

logger = logging.getLogger(__name__)

# Supported display languages
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
    "ta": "Tamil",
    "mr": "Marathi",
    "kn": "Kannada",
    "gu": "Gujarati",
    "pa": "Punjabi",
}


def detect_language(text: str) -> str:
    """
    Detect the language of a text string.
    Returns a language code (e.g. 'hi', 'en', 'te').
    Falls back to 'en' on failure.
    """
    try:
        lang = detect(text)
        logger.debug(f"Detected language: {lang}")
        return lang
    except LangDetectException:
        logger.debug("Language detection failed, defaulting to 'en'")
        return "en"


def translate_to_english(text: str, source_lang: str = "auto") -> str:
    """
    Translate text to English for RAG retrieval.
    Returns original text if already English or translation fails.
    """
    if source_lang == "en":
        return text
    try:
        translated = GoogleTranslator(source=source_lang, target="en").translate(text)
        logger.debug(f"Translated '{text[:40]}' → '{translated[:40]}'")
        return translated or text
    except Exception as e:
        logger.warning(f"Translation to English failed: {e}")
        return text


def translate_from_english(text: str, target_lang: str) -> str:
    """
    Translate an English LLM response back to the target language.
    Returns original text if target is English or translation fails.
    """
    if target_lang == "en" or target_lang not in SUPPORTED_LANGUAGES:
        return text
    try:
        translated = GoogleTranslator(source="en", target=target_lang).translate(text)
        return translated or text
    except Exception as e:
        logger.warning(f"Translation from English to '{target_lang}' failed: {e}")
        return text
