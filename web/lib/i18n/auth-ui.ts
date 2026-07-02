export type AppLocale = 'en' | 'fr'

export const APP_LOCALES: AppLocale[] = ['en', 'fr']

export const LOCALE_SHORT: Record<AppLocale, string> = {
  en: 'EN',
  fr: 'FR',
}

export const LOCALE_NAMES: Record<AppLocale, string> = {
  en: 'English',
  fr: 'Français',
}

/** Map legacy `rw` and unknown values to a supported locale. */
export function normalizeAppLocale(value?: string | null): AppLocale {
  return value === 'fr' ? 'fr' : 'en'
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
  loginEmailLabel: string
  loginPasswordLabel: string
  rememberMe: string
  forgotPassword: string
  signingIn: string
  noAccountPrompt: string
  createAccountLink: string
  showPassword: string
  hidePassword: string
  loginFieldsError: string
  invalidCredentials: string
  serverUnreachable: string
  serverUnavailable: string
  connectionError: string
  emailPlaceholder: string
  contactAdmin: string
  forgotPasswordTitle: string
  forgotPasswordSubtitle: string
  sendResetLink: string
  sendingResetLink: string
  forgotPasswordSuccess: string
  forgotPasswordDevHint: string
  backToSignIn: string
  resetPasswordTitle: string
  resetPasswordSubtitle: string
  newPassword: string
  resetPasswordAction: string
  resettingPassword: string
  resetPasswordSuccess: string
  resetPasswordInvalid: string
  resetPasswordMissingToken: string
  acceptInviteTitle: string
  acceptInviteSubtitle: string
  acceptInviteAction: string
  acceptingInvite: string
  acceptInviteSuccess: string
  acceptInviteInvalid: string
  acceptInviteMissingToken: string
  inviteWelcome: string
  registerInviteOnlyTitle: string
  registerInviteOnlyBody: string
}

export const authUi: Record<AppLocale, AuthUiStrings> = {
  en: {
    registerTitle: 'Create your account',
    registerSubtitle:
      'Create your church account. You can explore the portal right away; choir and protocol access require separate approval.',
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
      'Choir and protocol membership are approved separately after you submit a join request or invitation.',
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
    loginEmailLabel: 'Email address',
    loginPasswordLabel: 'Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    signingIn: 'Signing in…',
    noAccountPrompt: "Don't have an account?",
    createAccountLink: 'Create an account',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    loginFieldsError: 'Please enter your email and password.',
    invalidCredentials: 'Invalid email or password. Please try again.',
    serverUnreachable:
      'Unable to reach the server. Make sure the backend is running on http://localhost:3000.',
    serverUnavailable:
      'The server is temporarily unavailable. If you are on a shared demo link, ask the presenter to screen-share http://localhost:3001 instead.',
    connectionError: 'Unable to reach the server. Please check your connection.',
    emailPlaceholder: 'you@church.local',
    contactAdmin: "Don't have an account? Contact your church administrator.",
    forgotPasswordTitle: 'Reset your password',
    forgotPasswordSubtitle:
      'Enter your email and we will send instructions to reset your password.',
    sendResetLink: 'Send reset link',
    sendingResetLink: 'Sending…',
    forgotPasswordSuccess:
      'If an account exists for that email, reset instructions have been sent. Check your inbox.',
    forgotPasswordDevHint: 'Development reset link:',
    backToSignIn: 'Back to sign in',
    resetPasswordTitle: 'Choose a new password',
    resetPasswordSubtitle: 'Enter a new password for your account.',
    newPassword: 'New password',
    resetPasswordAction: 'Update password',
    resettingPassword: 'Updating…',
    resetPasswordSuccess: 'Your password has been updated. You can sign in now.',
    resetPasswordInvalid: 'This reset link is invalid or has expired.',
    resetPasswordMissingToken: 'No reset token was provided. Request a new link.',
    acceptInviteTitle: 'Set up your account',
    acceptInviteSubtitle: 'Create a password to accept your invitation.',
    acceptInviteAction: 'Accept invite',
    acceptingInvite: 'Setting up…',
    acceptInviteSuccess: 'Your account is ready. Redirecting…',
    acceptInviteInvalid: 'This invite link is invalid or has expired.',
    acceptInviteMissingToken: 'No invite token was provided.',
    inviteWelcome: 'Welcome',
    registerInviteOnlyTitle: 'Accounts are invite-only',
    registerInviteOnlyBody:
      'New members join through a one-time invite link from a church administrator. Check your email or WhatsApp for the link, or ask your choir or protocol leader to send one.',
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
    loginEmailLabel: 'Adresse e-mail',
    loginPasswordLabel: 'Mot de passe',
    rememberMe: 'Se souvenir de moi',
    forgotPassword: 'Mot de passe oublié ?',
    signingIn: 'Connexion…',
    noAccountPrompt: 'Pas encore de compte ?',
    createAccountLink: 'Créer un compte',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    loginFieldsError: 'Veuillez saisir votre e-mail et mot de passe.',
    invalidCredentials: 'E-mail ou mot de passe incorrect.',
    serverUnreachable:
      'Impossible de joindre le serveur. Vérifiez que le backend fonctionne.',
    serverUnavailable: 'Le serveur est temporairement indisponible.',
    connectionError: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
    emailPlaceholder: 'vous@eglise.local',
    contactAdmin: 'Pas de compte ? Contactez l’administrateur de votre église.',
    forgotPasswordTitle: 'Réinitialiser le mot de passe',
    forgotPasswordSubtitle:
      'Entrez votre e-mail et nous vous enverrons les instructions.',
    sendResetLink: 'Envoyer le lien',
    sendingResetLink: 'Envoi…',
    forgotPasswordSuccess:
      'Si un compte existe pour cet e-mail, les instructions ont été envoyées.',
    forgotPasswordDevHint: 'Lien de développement :',
    backToSignIn: 'Retour à la connexion',
    resetPasswordTitle: 'Nouveau mot de passe',
    resetPasswordSubtitle: 'Choisissez un nouveau mot de passe.',
    newPassword: 'Nouveau mot de passe',
    resetPasswordAction: 'Mettre à jour',
    resettingPassword: 'Mise à jour…',
    resetPasswordSuccess: 'Mot de passe mis à jour. Vous pouvez vous connecter.',
    resetPasswordInvalid: 'Ce lien est invalide ou expiré.',
    resetPasswordMissingToken: 'Aucun jeton de réinitialisation. Demandez un nouveau lien.',
    acceptInviteTitle: 'Configurer votre compte',
    acceptInviteSubtitle: 'Créez un mot de passe pour accepter l’invitation.',
    acceptInviteAction: 'Accepter l’invitation',
    acceptingInvite: 'Configuration…',
    acceptInviteSuccess: 'Votre compte est prêt. Redirection…',
    acceptInviteInvalid: 'Ce lien d’invitation est invalide ou expiré.',
    acceptInviteMissingToken: 'Aucun jeton d’invitation fourni.',
    inviteWelcome: 'Bienvenue',
    registerInviteOnlyTitle: 'Comptes sur invitation uniquement',
    registerInviteOnlyBody:
      'Les nouveaux membres rejoignent via un lien d’invitation envoyé par un administrateur. Vérifiez votre e-mail ou WhatsApp, ou demandez un lien à votre responsable.',
  },
}

export function isAppLocale(value: string): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale)
}

export type LoginQuote = { text: string; ref: string }

export const loginQuotes: Record<AppLocale, LoginQuote[]> = {
  en: [
    { text: 'Let everything be done decently and in order.', ref: '1 Cor 14:40' },
    { text: 'Serve one another humbly in love.', ref: 'Gal 5:13' },
    { text: 'Where two or three gather in my name, there am I.', ref: 'Matt 18:20' },
    {
      text: 'Each of you should use whatever gift you have received to serve others.',
      ref: '1 Pet 4:10',
    },
  ],
  fr: [
    { text: 'Que tout se fasse avec bienséance et avec ordre.', ref: '1 Co 14:40' },
    { text: 'Servez-vous les uns les autres dans la charité.', ref: 'Gal 5:13' },
    { text: 'Là où deux ou trois sont assemblés en mon nom, je suis au milieu d’eux.', ref: 'Mt 18:20' },
    {
      text: 'Comme de bons dispensateurs des graces variées de Dieu, que chacun de vous serve les autres.',
      ref: '1 Pi 4:10',
    },
  ],
}

export function localeToBcp47(locale: AppLocale): string {
  if (locale === 'fr') return 'fr-FR'
  return 'en-GB'
}
