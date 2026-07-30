import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { Announcement } from '../types';
import { HomePage } from './HomePage';

const mockState = vi.hoisted(() => ({ announcements: [] as Announcement[] }));

vi.mock('../components/CircularGallery', () => ({ CircularGallery: () => <div>gallery</div> }));
vi.mock('../lib/assets', () => ({ assetPath: (path: string) => path }));
vi.mock('../lib/data', () => ({
  useData: () => ({ announcements: mockState.announcements, profile: null, sendAnnouncement: vi.fn() }),
}));

describe('HomePage announcements', () => {
  it('6件を同時表示し、7件目以降を下方向のページに分ける', () => {
    const now = new Date().toISOString();
    mockState.announcements = Array.from({ length: 7 }, (_, index) => ({
      id: `notice-${index + 1}`, kind: 'notice' as const, message: `お知らせ${index + 1}`,
      createdBy: 'staff', creatorName: 'BarMisaki', createdAt: now, updatedAt: now,
    }));
    const { container } = render(<MemoryRouter><HomePage /></MemoryRouter>);
    const pages = container.querySelectorAll('.notice-list');
    expect(pages).toHaveLength(2);
    expect(pages[0].querySelectorAll('.notice-card')).toHaveLength(6);
    expect(pages[1].querySelectorAll('.notice-card')).toHaveLength(1);
    expect(pages[0]).toHaveAttribute('aria-hidden', 'false');
    expect(pages[1]).toHaveAttribute('aria-hidden', 'true');

    fireEvent.click(screen.getByRole('button', { name: '下のお知らせ6件' }));
    expect(pages[0]).toHaveAttribute('aria-hidden', 'true');
    expect(pages[1]).toHaveAttribute('aria-hidden', 'false');
  });

  it('ベルボタンから本日のお知らせ一覧を開く', () => {
    const now = new Date().toISOString();
    mockState.announcements = [{
      id: 'notice-list', kind: 'urgent', message: '一覧から確認できるお知らせ',
      createdBy: 'staff', creatorName: 'BarMisaki', createdAt: now, updatedAt: now,
    }];
    render(<MemoryRouter><HomePage /></MemoryRouter>);

    const openButtons = screen.getAllByRole('button', { name: 'お知らせ一覧を開く' });
    fireEvent.click(openButtons[openButtons.length - 1]);

    expect(screen.getByRole('dialog', { name: '本日のお知らせ一覧' })).toHaveTextContent('一覧から確認できるお知らせ');
  });
});
