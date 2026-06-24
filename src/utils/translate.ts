/**
 * Unofficial Google Translate API endpoint wrapper.
 * Translates text from English to Hebrew on-demand.
 * To optimize network requests, we batch translate the name and instructions in a single call.
 */
export async function translateExercise(
  name: string,
  instructions: string[]
): Promise<{ name: string; instructions: string[] }> {
  try {
    const delimiter = " ||| ";
    // Stitch all text together to perform translation in a single network request
    const textToTranslate = [name, ...instructions].join(delimiter);
    
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=he&dt=t&q=${encodeURIComponent(textToTranslate)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Translation failed');
    }
    
    const data = await response.json();
    
    // Stitch together translated parts
    // Google Translate returns an array of segment translations in data[0]
    if (!data || !data[0]) {
      throw new Error('Invalid translation response');
    }
    
    const translatedText = data[0]
      .map((x: any) => x[0])
      .join('');
    
    // Split back by delimiter (flexible regex to handle spacing modifications introduced by translation engine)
    const parts = translatedText.split(/\s*\|\|\|\s*/).map((p: string) => p.trim());
    
    if (parts.length < 1) {
      throw new Error('Empty translation output');
    }
    
    // Extract translated name and instructions
    const translatedName = parts[0] || name;
    let translatedInstructions = parts.slice(1);
    
    // If splitting failed or length mismatched, fallback to original instructions
    if (translatedInstructions.length !== instructions.length) {
      translatedInstructions = instructions;
    }
    
    return {
      name: translatedName,
      instructions: translatedInstructions
    };
  } catch (error) {
    console.error('Translation error:', error);
    // Graceful fallback to original English text
    return { name, instructions };
  }
}

// Translate short terms like muscles or equipment
export async function translateTerm(term: string): Promise<string> {
  if (!term) return '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=he&dt=t&q=${encodeURIComponent(term)}`;
    const response = await fetch(url);
    if (!response.ok) return term;
    const data = await response.json();
    return data[0][0][0] || term;
  } catch {
    return term;
  }
}
