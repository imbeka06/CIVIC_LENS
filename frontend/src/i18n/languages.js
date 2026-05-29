export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'luo', label: 'Dholuo (Luo)' },
  { code: 'kikuyu', label: 'Gikuyu (Kikuyu)' },
  { code: 'kamba', label: 'Kikamba (Kamba)' },
  { code: 'giriama', label: 'Kigiriama (Giriama)' },
  { code: 'kalenjin', label: 'Kalenjin' }
];

export const DEFAULT_LANGUAGE = 'en';

export const isSupportedLanguage = (code) =>
  SUPPORTED_LANGUAGES.some((lang) => lang.code === code);