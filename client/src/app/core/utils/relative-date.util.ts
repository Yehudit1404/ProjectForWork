// Simple Hebrew relative-time formatter ("לפני יומיים") used on ad cards
// and detail pages - avoids pulling in a full i18n library for one string.
export function formatRelativeDateHe(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'ממש עכשיו';
  if (minutes < 60) return `לפני ${minutes} דקות`;
  if (hours === 1) return 'לפני שעה';
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days === 1) return 'אתמול';
  if (days === 2) return 'לפני יומיים';
  if (days < 30) return `לפני ${days} ימים`;

  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
}
