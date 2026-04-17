import { ItemCategory } from '@/types';

export const categoryConfig: Record<ItemCategory, { label: string; emoji: string }> = {
  book: { label: 'Book', emoji: '📚' },
  tool: { label: 'Tool', emoji: '🔧' },
  game: { label: 'Game', emoji: '🎲' },
  gear: { label: 'Gear', emoji: '🎒' },
  other: { label: 'Other', emoji: '📦' },
};

export const categoryList: ItemCategory[] = ['book', 'tool', 'game', 'gear', 'other'];

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
