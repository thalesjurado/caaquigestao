// lib/validation.ts

export function validateTitle(title: string): string | null {
  const trimmed = title.trim();
  if (!trimmed) {
    return 'Título é obrigatório';
  }
  if (trimmed.length < 3) {
    return 'Título deve ter pelo menos 3 caracteres';
  }
  if (trimmed.length > 100) {
    return 'Título deve ter no máximo 100 caracteres';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return null; // Email é opcional
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Email inválido';
  }
  return null;
}

export function validatePoints(points: number | string): string | null {
  if (points === '' || points === undefined || points === null) return null; // Pontos são opcionais
  
  const num = typeof points === 'string' ? parseFloat(points) : points;
  if (isNaN(num)) {
    return 'Pontos devem ser um número';
  }
  if (num < 0) {
    return 'Pontos não podem ser negativos';
  }
  if (num > 100) {
    return 'Pontos não podem exceder 100';
  }
  return null;
}

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Nome é obrigatório';
  }
  if (trimmed.length < 2) {
    return 'Nome deve ter pelo menos 2 caracteres';
  }
  if (trimmed.length > 50) {
    return 'Nome deve ter no máximo 50 caracteres';
  }
  return null;
}
