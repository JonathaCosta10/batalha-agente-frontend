// Nothing invented on screen: a name is shown only when the backend sends one that came from the base.
// Generated aliases ("Pessoa 1 da base", "Cliente") and empty/null values become a neutral greeting.
// Gender is never rendered; NAO_INFORMADO is an internal value, not data (cobranca 2026-09-27).
const GENERATED = /da base|^cliente$/i;

export const cleanName = (name?: string | null) => {
  const n = (name ?? '').trim();
  return n && !GENERATED.test(n) ? n : '';
};

export const greeting = (name?: string | null) => {
  const n = cleanName(name);
  return n ? `Olá, ${n}` : 'Olá';
};
