/**
 * Módulo de Validação e Constraints de Formulários
 * Conformidade com SSD (Secure Software Development), OWASP e Padrão da República de Angola
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string | number;
}

// Expressão regular oficial do Bilhete de Identidade (BI) de Angola:
// Ex: 000123456LA042 (9 dígitos + 2 letras maiúsculas de código provincial + 3 dígitos)
export const ANGOLA_BI_REGEX = /^\d{9}[A-Z]{2}\d{3}$/;

// Telefone Móvel de Angola: Rede Unitel, Movicel, Africell (+244 9XX XXX XXX)
export const ANGOLA_PHONE_REGEX = /^(?:\+244\s?|244\s?)?9\d{2}[\s.-]?\d{3}[\s.-]?\d{3}$/;

// Validador de E-mail RFC 5322
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Sanitiza texto contra XSS, injeção de HTML e carateres de controle
 */
export function sanitizeInput(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove URIs de script
    .replace(/on\w+=/gi, '') // Remove inline event handlers (onerror, onclick, etc.)
    .trim();
}

/**
 * Validação de Bilhete de Identidade de Angola (BI)
 */
export function validateAngolaBI(biNumber: string): ValidationResult {
  if (!biNumber) {
    return { isValid: false, error: 'O número do BI é obrigatório.' };
  }
  const clean = biNumber.trim().toUpperCase().replace(/\s+/g, '');
  if (clean.length !== 14) {
    return { 
      isValid: false, 
      error: 'O BI deve conter exatamente 14 caracteres (ex: 008942125ME041).' 
    };
  }
  if (!ANGOLA_BI_REGEX.test(clean)) {
    return { 
      isValid: false, 
      error: 'Formato de BI inválido. Formato esperado: 9 dígitos + 2 letras + 3 dígitos.' 
    };
  }
  return { isValid: true, sanitizedValue: clean };
}

/**
 * Validação de Telefone de Angola
 */
export function validateAngolaPhone(phone: string, isRequired = true): ValidationResult {
  if (!phone || !phone.trim()) {
    if (!isRequired) return { isValid: true, sanitizedValue: '' };
    return { isValid: false, error: 'O número de telefone é obrigatório.' };
  }
  const clean = phone.trim();
  if (!ANGOLA_PHONE_REGEX.test(clean)) {
    return { 
      isValid: false, 
      error: 'Número de telefone de Angola inválido. Formato: +244 9XX XXX XXX ou 9XXXXXXXX.' 
    };
  }
  return { isValid: true, sanitizedValue: clean };
}

/**
 * Validação de Email
 */
export function validateEmail(email: string, isRequired = true): ValidationResult {
  if (!email || !email.trim()) {
    if (!isRequired) return { isValid: true, sanitizedValue: '' };
    return { isValid: false, error: 'O endereço de e-mail é obrigatório.' };
  }
  const clean = email.trim().toLowerCase();
  if (clean.length > 120) {
    return { isValid: false, error: 'O e-mail não pode ter mais de 120 caracteres.' };
  }
  if (!EMAIL_REGEX.test(clean)) {
    return { isValid: false, error: 'Endereço de e-mail com formato inválido.' };
  }
  return { isValid: true, sanitizedValue: clean };
}

/**
 * Validação de Notas Escolares no Sistema Educativo de Angola (0 a 20 valores)
 */
export function validateGrade(value: number | string): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: 'A nota é obrigatória.' };
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (isNaN(num)) {
    return { isValid: false, error: 'A nota deve ser um valor numérico válido.' };
  }
  if (num < 0 || num > 20) {
    return { isValid: false, error: 'A nota deve estar compreendida estritamente entre 0.00 e 20.00 valores.' };
  }
  // Arredonda para no máximo 2 casas decimais
  const rounded = Math.round(num * 100) / 100;
  return { isValid: true, sanitizedValue: rounded };
}

/**
 * Validação de Nome Completo
 */
export function validateFullName(name: string, minLength = 3, maxLength = 100): ValidationResult {
  const sanitized = sanitizeInput(name);
  if (!sanitized) {
    return { isValid: false, error: 'O nome completo é obrigatório.' };
  }
  if (sanitized.length < minLength) {
    return { isValid: false, error: `O nome deve ter pelo menos ${minLength} caracteres.` };
  }
  if (sanitized.length > maxLength) {
    return { isValid: false, error: `O nome não pode exceder ${maxLength} caracteres.` };
  }
  // Deve conter pelo menos dois termos (Nome e Apelido)
  const parts = sanitized.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return { isValid: false, error: 'Por favor, indique o nome e o sobrenome completos.' };
  }
  return { isValid: true, sanitizedValue: sanitized };
}

/**
 * Validação de Data de Nascimento e Idade (Anos)
 */
export function validateBirthDate(dateStr: string, minAge = 3, maxAge = 85): ValidationResult {
  if (!dateStr) {
    return { isValid: false, error: 'A data de nascimento é obrigatória.' };
  }
  const birthDate = new Date(dateStr);
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, error: 'Data de nascimento inválida.' };
  }
  const now = new Date();
  if (birthDate > now) {
    return { isValid: false, error: 'A data de nascimento não pode ser no futuro.' };
  }
  
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < minAge) {
    return { isValid: false, error: `Idade calculada (${age} anos) abaixo da idade mínima permitida (${minAge} anos).` };
  }
  if (age > maxAge) {
    return { isValid: false, error: `Idade calculada (${age} anos) acima do limite plausível (${maxAge} anos).` };
  }

  return { isValid: true, sanitizedValue: dateStr };
}

/**
 * Validação de Trimestre Escolar (1, 2 ou 3)
 */
export function validateTrimestre(trimestre: number | string): ValidationResult {
  const num = typeof trimestre === 'number' ? trimestre : parseInt(String(trimestre), 10);
  if (![1, 2, 3].includes(num)) {
    return { isValid: false, error: 'Trimestre escolar inválido. Valores aceites: 1, 2 ou 3.' };
  }
  return { isValid: true, sanitizedValue: num };
}
