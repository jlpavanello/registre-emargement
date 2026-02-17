export function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function nowTime() {
  const d = new Date();
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}
