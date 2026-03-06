export type LanguageCode = 'en' | 'hi';

type TranslationMap = Record<LanguageCode, Record<string, string>>;

export const translations: TranslationMap = {
  en: {
    tagline: 'Affordable. Accessible. AI-Powered Healthcare.',
    continue: 'Continue',
    login: 'Login',
    register: 'Register',
    name: 'Full Name',
    phone: 'Phone Number',
    email: 'Email',
    password: 'Password',
    chooseRole: 'Choose your role',
    patient: 'Patient',
    doctor: 'Doctor',
    chw: 'CHW',
    admin: 'Admin'
  },
  hi: {
    tagline: 'सस्ती। सुलभ। एआई-संचालित स्वास्थ्य सेवा।',
    continue: 'जारी रखें',
    login: 'लॉगिन',
    register: 'रजिस्टर',
    name: 'पूरा नाम',
    phone: 'फ़ोन नंबर',
    email: 'ईमेल',
    password: 'पासवर्ड',
    chooseRole: 'अपनी भूमिका चुनें',
    patient: 'मरीज',
    doctor: 'डॉक्टर',
    chw: 'सीएचडब्ल्यू',
    admin: 'एडमिन'
  }
};