export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
