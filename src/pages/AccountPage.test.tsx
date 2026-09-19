import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AccountPage } from './AccountPage';

const saveProfile = vi.fn().mockResolvedValue(undefined);

vi.mock('../lib/data', () => ({
  useData: () => ({
    profile: null,
    recoverableProfiles: [],
    saveProfile,
    restoreProfile: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  saveProfile.mockClear();
});

describe('アカウント登録', () => {
  it('名前だけを入力して登録する', async () => {
    const { container } = render(
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>,
    );
    expect(container.querySelector('input[type="file"]')).toBeNull();
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'みさき' },
    });
    fireEvent.click(screen.getByRole('button', { name: '登録して注文へ' }));
    await waitFor(() => expect(saveProfile).toHaveBeenCalledWith('みさき'));
  });
});
