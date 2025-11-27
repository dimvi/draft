from deep_translator import GoogleTranslator

class Translator:
    def __init__(self):
        self.translator = GoogleTranslator(source='ko', target='en')

    def translate(self, text: str) -> str:
        if not text or not text.strip():
            return ""
        try:
            return self.translator.translate(text)
        except Exception as e:
            print(f"Translation error: {e}")
            return text # Fallback to original text

    def translate_list(self, texts: list[str]) -> list[str]:
        if not texts:
            return []
        # deep-translator handles lists but let's be explicit
        return [self.translate(t) for t in texts]
