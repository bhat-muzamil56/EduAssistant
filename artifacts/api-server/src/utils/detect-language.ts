import { franc } from "franc-min";

export interface DetectedLanguage {
  code: string;
  name: string;
  flag: string;
  isEnglish: boolean;
}

// Unicode script ranges → broad script identification
function detectScript(text: string): string | null {
  const counts: Record<string, number> = {};
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    if (cp >= 0x0900 && cp <= 0x097f) counts.devanagari = (counts.devanagari ?? 0) + 1;
    else if (cp >= 0x0980 && cp <= 0x09ff) counts.bengali = (counts.bengali ?? 0) + 1;
    else if (cp >= 0x0a00 && cp <= 0x0a7f) counts.gurmukhi = (counts.gurmukhi ?? 0) + 1;
    else if (cp >= 0x0a80 && cp <= 0x0aff) counts.gujarati = (counts.gujarati ?? 0) + 1;
    else if (cp >= 0x0b00 && cp <= 0x0b7f) counts.odia = (counts.odia ?? 0) + 1;
    else if (cp >= 0x0b80 && cp <= 0x0bff) counts.tamil = (counts.tamil ?? 0) + 1;
    else if (cp >= 0x0c00 && cp <= 0x0c7f) counts.telugu = (counts.telugu ?? 0) + 1;
    else if (cp >= 0x0c80 && cp <= 0x0cff) counts.kannada = (counts.kannada ?? 0) + 1;
    else if (cp >= 0x0d00 && cp <= 0x0d7f) counts.malayalam = (counts.malayalam ?? 0) + 1;
    else if (cp >= 0x0600 && cp <= 0x06ff) counts.arabic = (counts.arabic ?? 0) + 1;
    else if (cp >= 0x0e00 && cp <= 0x0e7f) counts.thai = (counts.thai ?? 0) + 1;
    else if (cp >= 0x0e80 && cp <= 0x0eff) counts.lao = (counts.lao ?? 0) + 1;
    else if (cp >= 0x1000 && cp <= 0x109f) counts.myanmar = (counts.myanmar ?? 0) + 1;
    else if (cp >= 0x1780 && cp <= 0x17ff) counts.khmer = (counts.khmer ?? 0) + 1;
    else if (cp >= 0x0400 && cp <= 0x04ff) counts.cyrillic = (counts.cyrillic ?? 0) + 1;
    else if (cp >= 0x0370 && cp <= 0x03ff) counts.greek = (counts.greek ?? 0) + 1;
    else if (cp >= 0x4e00 && cp <= 0x9fff) counts.cjk = (counts.cjk ?? 0) + 1;
    else if (cp >= 0x3040 && cp <= 0x30ff) counts.japanese = (counts.japanese ?? 0) + 1;
    else if (cp >= 0xac00 && cp <= 0xd7af) counts.korean = (counts.korean ?? 0) + 1;
    else if (cp >= 0x0590 && cp <= 0x05ff) counts.hebrew = (counts.hebrew ?? 0) + 1;
    else if (cp >= 0x10a0 && cp <= 0x10ff) counts.georgian = (counts.georgian ?? 0) + 1;
    else if (cp >= 0x0530 && cp <= 0x058f) counts.armenian = (counts.armenian ?? 0) + 1;
    else if (cp >= 0x1200 && cp <= 0x137f) counts.ethiopic = (counts.ethiopic ?? 0) + 1;
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total < 2) return null;

  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
}

// Script → language info (for scripts that map 1:1 to a language)
const SCRIPT_MAP: Record<string, DetectedLanguage> = {
  tamil:      { code: "ta-IN", name: "Tamil",     flag: "🇮🇳", isEnglish: false },
  telugu:     { code: "te-IN", name: "Telugu",    flag: "🇮🇳", isEnglish: false },
  kannada:    { code: "kn-IN", name: "Kannada",   flag: "🇮🇳", isEnglish: false },
  malayalam:  { code: "ml-IN", name: "Malayalam", flag: "🇮🇳", isEnglish: false },
  gujarati:   { code: "gu-IN", name: "Gujarati",  flag: "🇮🇳", isEnglish: false },
  gurmukhi:   { code: "pa-IN", name: "Punjabi",   flag: "🇮🇳", isEnglish: false },
  odia:       { code: "or-IN", name: "Odia",      flag: "🇮🇳", isEnglish: false },
  thai:       { code: "th-TH", name: "Thai",      flag: "🇹🇭", isEnglish: false },
  lao:        { code: "lo-LA", name: "Lao",       flag: "🇱🇦", isEnglish: false },
  myanmar:    { code: "my-MM", name: "Burmese",   flag: "🇲🇲", isEnglish: false },
  khmer:      { code: "km-KH", name: "Khmer",     flag: "🇰🇭", isEnglish: false },
  japanese:   { code: "ja-JP", name: "Japanese",  flag: "🇯🇵", isEnglish: false },
  korean:     { code: "ko-KR", name: "Korean",    flag: "🇰🇷", isEnglish: false },
  hebrew:     { code: "he-IL", name: "Hebrew",    flag: "🇮🇱", isEnglish: false },
  georgian:   { code: "ka-GE", name: "Georgian",  flag: "🇬🇪", isEnglish: false },
  armenian:   { code: "hy-AM", name: "Armenian",  flag: "🇦🇲", isEnglish: false },
  ethiopic:   { code: "am-ET", name: "Amharic",   flag: "🇪🇹", isEnglish: false },
};

// franc ISO 639-3 → language info (for ambiguous scripts)
const FRANC_MAP: Record<string, DetectedLanguage> = {
  // Devanagari languages
  hin: { code: "hi-IN", name: "Hindi",     flag: "🇮🇳", isEnglish: false },
  mar: { code: "mr-IN", name: "Marathi",   flag: "🇮🇳", isEnglish: false },
  nep: { code: "ne-IN", name: "Nepali",    flag: "🇮🇳", isEnglish: false },
  san: { code: "sa-IN", name: "Sanskrit",  flag: "🇮🇳", isEnglish: false },
  mai: { code: "mai-IN", name: "Maithili", flag: "🇮🇳", isEnglish: false },
  bho: { code: "bho-IN", name: "Bhojpuri", flag: "🇮🇳", isEnglish: false },

  // Bengali script
  ben: { code: "bn-IN", name: "Bengali",  flag: "🇮🇳", isEnglish: false },
  asm: { code: "as-IN", name: "Assamese", flag: "🇮🇳", isEnglish: false },

  // Arabic script
  ara: { code: "ar-SA", name: "Arabic",  flag: "🇸🇦", isEnglish: false },
  urd: { code: "ur-PK", name: "Urdu",    flag: "🇵🇰", isEnglish: false },
  fas: { code: "fa-IR", name: "Persian", flag: "🇮🇷", isEnglish: false },
  pus: { code: "ps-AF", name: "Pashto",  flag: "🇦🇫", isEnglish: false },
  ksh: { code: "ks-IN", name: "Kashmiri", flag: "🇮🇳", isEnglish: false },
  snd: { code: "sd-IN", name: "Sindhi",  flag: "🇮🇳", isEnglish: false },

  // Cyrillic languages
  rus: { code: "ru-RU", name: "Russian",    flag: "🇷🇺", isEnglish: false },
  ukr: { code: "uk-UA", name: "Ukrainian",  flag: "🇺🇦", isEnglish: false },
  bul: { code: "bg-BG", name: "Bulgarian",  flag: "🇧🇬", isEnglish: false },
  srp: { code: "sr-RS", name: "Serbian",    flag: "🇷🇸", isEnglish: false },
  mkd: { code: "mk-MK", name: "Macedonian", flag: "🇲🇰", isEnglish: false },
  bel: { code: "be-BY", name: "Belarusian", flag: "🇧🇾", isEnglish: false },
  kaz: { code: "kk-KZ", name: "Kazakh",     flag: "🇰🇿", isEnglish: false },
  uzb: { code: "uz-UZ", name: "Uzbek",      flag: "🇺🇿", isEnglish: false },
  kir: { code: "ky-KG", name: "Kyrgyz",     flag: "🇰🇬", isEnglish: false },
  tgk: { code: "tg-TJ", name: "Tajik",      flag: "🇹🇯", isEnglish: false },

  // CJK
  cmn: { code: "zh-CN", name: "Chinese (Mandarin)", flag: "🇨🇳", isEnglish: false },
  yue: { code: "zh-HK", name: "Cantonese",          flag: "🇭🇰", isEnglish: false },
  jpn: { code: "ja-JP", name: "Japanese",            flag: "🇯🇵", isEnglish: false },
  kor: { code: "ko-KR", name: "Korean",              flag: "🇰🇷", isEnglish: false },

  // Greek
  ell: { code: "el-GR", name: "Greek", flag: "🇬🇷", isEnglish: false },

  // Latin-script European
  spa: { code: "es-ES", name: "Spanish",    flag: "🇪🇸", isEnglish: false },
  fra: { code: "fr-FR", name: "French",     flag: "🇫🇷", isEnglish: false },
  deu: { code: "de-DE", name: "German",     flag: "🇩🇪", isEnglish: false },
  por: { code: "pt-BR", name: "Portuguese", flag: "🇧🇷", isEnglish: false },
  ita: { code: "it-IT", name: "Italian",    flag: "🇮🇹", isEnglish: false },
  nld: { code: "nl-NL", name: "Dutch",      flag: "🇳🇱", isEnglish: false },
  pol: { code: "pl-PL", name: "Polish",     flag: "🇵🇱", isEnglish: false },
  ron: { code: "ro-RO", name: "Romanian",   flag: "🇷🇴", isEnglish: false },
  swe: { code: "sv-SE", name: "Swedish",    flag: "🇸🇪", isEnglish: false },
  dan: { code: "da-DK", name: "Danish",     flag: "🇩🇰", isEnglish: false },
  nor: { code: "nb-NO", name: "Norwegian",  flag: "🇳🇴", isEnglish: false },
  fin: { code: "fi-FI", name: "Finnish",    flag: "🇫🇮", isEnglish: false },
  tur: { code: "tr-TR", name: "Turkish",    flag: "🇹🇷", isEnglish: false },
  hun: { code: "hu-HU", name: "Hungarian",  flag: "🇭🇺", isEnglish: false },
  ces: { code: "cs-CZ", name: "Czech",      flag: "🇨🇿", isEnglish: false },
  slk: { code: "sk-SK", name: "Slovak",     flag: "🇸🇰", isEnglish: false },
  hrv: { code: "hr-HR", name: "Croatian",   flag: "🇭🇷", isEnglish: false },
  ind: { code: "id-ID", name: "Indonesian", flag: "🇮🇩", isEnglish: false },
  msa: { code: "ms-MY", name: "Malay",      flag: "🇲🇾", isEnglish: false },
  vie: { code: "vi-VN", name: "Vietnamese", flag: "🇻🇳", isEnglish: false },
  afr: { code: "af-ZA", name: "Afrikaans",  flag: "🇿🇦", isEnglish: false },
  swa: { code: "sw-KE", name: "Swahili",    flag: "🇰🇪", isEnglish: false },
  yor: { code: "yo-NG", name: "Yoruba",     flag: "🇳🇬", isEnglish: false },
  hau: { code: "ha-NG", name: "Hausa",      flag: "🇳🇬", isEnglish: false },
  amh: { code: "am-ET", name: "Amharic",    flag: "🇪🇹", isEnglish: false },
  som: { code: "so-SO", name: "Somali",     flag: "🇸🇴", isEnglish: false },

  // English
  eng: { code: "en-US", name: "English", flag: "🇺🇸", isEnglish: true },
};

export function detectLanguage(text: string): DetectedLanguage {
  const english: DetectedLanguage = { code: "en-US", name: "English", flag: "🇺🇸", isEnglish: true };

  if (!text || text.trim().length < 3) return english;

  // Step 1: try Unicode script detection (very reliable for Indian/Asian/Arabic scripts)
  const script = detectScript(text.trim());
  if (script && SCRIPT_MAP[script]) {
    // For ambiguous scripts (Devanagari → could be Hindi/Marathi/Nepali,
    // Bengali → Bengali/Assamese, Arabic → Arabic/Urdu/Persian/Kashmiri)
    // use franc to narrow down
    if (["devanagari", "bengali", "arabic", "cyrillic", "cjk"].includes(script)) {
      const francCode = franc(text);
      if (francCode !== "und" && FRANC_MAP[francCode]) {
        return FRANC_MAP[francCode];
      }
    }
    return SCRIPT_MAP[script];
  }

  // Step 2: franc for Latin-script and other languages
  const francCode = franc(text);
  if (francCode === "und" || francCode === "eng") return english;
  return FRANC_MAP[francCode] ?? english;
}
