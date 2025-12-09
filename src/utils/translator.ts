import { pipeline, env } from '@xenova/transformers';

// Disable local model loading
env.allowLocalModels = false;

let translationPipeline: any = null;

export async function initializeTranslator() {
  if (!translationPipeline) {
    try {
      // Use a lightweight Korean-English translation model
      // nllb-200-distilled-600M is a good balance between size and quality
      translationPipeline = await pipeline(
        'translation',
        'Xenova/nllb-200-distilled-600M'
      );
      console.log('Translation model loaded successfully');
    } catch (error) {
      console.error('Failed to load translation model:', error);
      throw error;
    }
  }
  return translationPipeline;
}

export async function translateText(text: string, from = 'kor_Hang', to = 'eng_Latn'): Promise<string> {
  try {
    const translator = await initializeTranslator();

    const result = await translator(text, {
      src_lang: from,
      tgt_lang: to,
    });

    return result[0]?.translation_text || text;
  } catch (error) {
    console.error('Translation failed:', error);
    // Return original text if translation fails
    return text;
  }
}

export async function translateWorkflowData(data: Record<string, string[]>): Promise<Record<string, string | string[]>> {
  const translated: Record<string, string | string[]> = {};

  for (const [key, values] of Object.entries(data)) {
    if (values.length === 0) continue;

    if (key === 'goal' && values.length === 1) {
      // Goal is a single string
      translated[key] = await translateText(values[0]);
    } else {
      // Other fields are arrays
      translated[key] = await Promise.all(
        values.map((value) => translateText(value))
      );
    }
  }

  return translated;
}
