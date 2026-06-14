export type AppLocale = 'rw' | 'en' | 'fr'

export const APP_LOCALES: AppLocale[] = ['rw', 'en', 'fr']

export const LOCALE_SHORT: Record<AppLocale, string> = {
  rw: 'RW',
  en: 'EN',
  fr: 'FR',
}

export const LOCALE_NAMES: Record<AppLocale, string> = {
  rw: 'Ikinyarwanda',
  en: 'English',
  fr: 'Français',
}

type AuthUiStrings = {
  registerTitle: string
  registerSubtitle: string
  signInTitle: string
  signInSubtitle: string
  firstName: string
  lastName: string
  email: string
  phone: string
  nationalId: string
  nationalIdHint: string
  password: string
  confirmPassword: string
  churchConnection: string
  interests: string
  notes: string
  notesPlaceholder: string
  approvalNote: string
  createAccount: string
  creatingAccount: string
  alreadyHaveAccount: string
  signIn: string
  termsLabel: string
  termsRequired: string
  requiredFields: string
  passwordMin: string
  passwordMismatch: string
  phoneRequired: string
  nationalIdRequired: string
}

export const authUi: Record<AppLocale, AuthUiStrings> = {
  en: {
    registerTitle: 'Create your account',
    registerSubtitle:
      'Register for church membership. A leader will approve your access to ministries.',
    signInTitle: 'Sign in to your account',
    signInSubtitle: 'Enter your credentials to access the system.',
    firstName: 'First name *',
    lastName: 'Last name *',
    email: 'Email *',
    phone: 'Phone *',
    nationalId: 'National ID *',
    nationalIdHint: '16-digit Rwanda national ID number',
    password: 'Password *',
    confirmPassword: 'Confirm password *',
    churchConnection: 'Your connection to the church',
    interests: 'Ministries you are interested in',
    notes: 'Anything else we should know?',
    notesPlaceholder: 'Optional',
    approvalNote:
      'After you register, church leaders will review your account before full ministry access is granted.',
    createAccount: 'Create account',
    creatingAccount: 'Creating account…',
    alreadyHaveAccount: 'Already have an account?',
    signIn: 'Sign in',
    termsLabel: 'I agree to the terms and conditions',
    termsRequired: 'You must accept the terms and conditions to register.',
    requiredFields: 'Please complete all required fields.',
    passwordMin: 'Password must be at least 6 characters.',
    passwordMismatch: 'Passwords do not match.',
    phoneRequired: 'Phone number is required.',
    nationalIdRequired: 'National ID is required (16 digits).',
  },
  fr: {
    registerTitle: 'Créer votre compte',
    registerSubtitle:
      'Inscrivez-vous pour la membership. Un responsable approuvera votre accès aux ministères.',
    signInTitle: 'Connectez-vous à votre compte',
    signInSubtitle: 'Entrez vos identifiants pour accéder au système.',
    firstName: 'Prénom *',
    lastName: 'Nom *',
    email: 'E-mail *',
    phone: 'Téléphone *',
    nationalId: 'Identité nationale *',
    nationalIdHint: 'Numéro d’identité nationale rwandais (16 chiffres)',
    password: 'Mot de passe *',
    confirmPassword: 'Confirmer le mot de passe *',
    churchConnection: 'Votre lien avec l’église',
    interests: 'Ministères qui vous intéressent',
    notes: 'Autre chose à nous signaler ?',
    notesPlaceholder: 'Facultatif',
    approvalNote:
      'Après inscription, les responsables examineront votre compte avant l’accès complet.',
    createAccount: 'Créer le compte',
    creatingAccount: 'Création du compte…',
    alreadyHaveAccount: 'Vous avez déjà un compte ?',
    signIn: 'Se connecter',
    termsLabel: 'J’accepte les conditions d’utilisation',
    termsRequired: 'Vous devez accepter les conditions pour s’inscrire.',
    requiredFields: 'Veuillez remplir tous les champs obligatoires.',
    passwordMin: 'Le mot de passe doit contenir au moins 6 caractères.',
    passwordMismatch: 'Les mots de passe ne correspondent pas.',
    phoneRequired: 'Le numéro de téléphone est obligatoire.',
    nationalIdRequired: 'L’identité nationale est obligatoire (16 chiffres).',
  },
  rw: {
    registerTitle: 'Fungura konti yawe',
    registerSubtitle:
      'Iyandikishe kuba umuryango w’itorero. Umuyobozi azemeza uburenganzira bwo kwinjira mu ministère.',
    signInTitle: 'Injira kuri konti yawe',
    signInSubtitle: 'Andika email n’ijambo ry’ibanga kugira ngo winjire.',
    firstName: 'Izina ry’ibanze *',
    lastName: 'Izina ry’umuryango *',
    email: 'Email *',
    phone: 'Telefone *',
    nationalId: 'Indangamuntu *',
    nationalIdHint: 'Nomero y’indangamuntu y’u Rwanda (imibare 16)',
    password: 'Ijambo ry’ibanga *',
    confirmPassword: 'Emeza ijambo ry’ibanga *',
    churchConnection: 'Uko uhuza n’itorero',
    interests: 'Ministère ushaka',
    notes: 'Hari ikintu utubwira ?',
    notesPlaceholder: 'Bishobora kuba ubusa',
    approvalNote:
      'Nyuma yo kwiyandikisha, abayobozi bazasuzuma konti yawe mbere yo guha uburenganzira bujyeje.',
    createAccount: 'Fungura konti',
    creatingAccount: 'Gufungura konti…',
    alreadyHaveAccount: 'Usanzwe ufite konti ?',
    signIn: 'Injira',
    termsLabel: 'Nemera amategeko n’amabwiriza',
    termsRequired: 'Ugomba kwemera amategeko kugira ngo wiyandikishe.',
    requiredFields: 'Uzuza ibisabwa byose.',
    passwordMin: 'Ijambo ry’ibanga rigomba nibura inyuguti 6.',
    passwordMismatch: 'Ijambo ry’ibanga ntirihura.',
    phoneRequired: 'Telefone irakenewe.',
    nationalIdRequired: 'Indangamuntu irakenewe (imibare 16).',
  },
}

export function isAppLocale(value: string): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale)
}
