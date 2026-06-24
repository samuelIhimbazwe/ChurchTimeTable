import { MusicHttpAccessService } from './music-http-access.service';
import type { ResolvedAuth } from './capability.types';

function mockMusicAccess(musicAuth: ResolvedAuth) {
  const service = Object.create(MusicHttpAccessService.prototype) as MusicHttpAccessService;
  const musicResolver = {
    resolveGrantsToCapabilities: jest.fn().mockResolvedValue(musicAuth),
    can: jest.fn((auth: ResolvedAuth, cap: string) =>
      auth.capabilities.some((c) => c.id === cap),
    ),
  };
  const permissions = {
    resolveForUser: jest.fn().mockResolvedValue({ permissions: [] }),
  };
  Object.assign(service, { musicResolver, permissions });
  return service;
}

describe('music HTTP access', () => {
  const choirId = '00000000-0000-0000-0000-000000000001';

  it('library hub via scoped capability', async () => {
    const musicAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [{ id: 'choir.music.view@choir' }],
    };
    const service = mockMusicAccess(musicAuth);
    await expect(
      service.canMusicUi('u1', 'music-library-hub', [], choirId),
    ).resolves.toBe(true);
  });

  it('manage via legacy permission', async () => {
    const musicAuth: ResolvedAuth = {
      userId: 'u1',
      choirId,
      capabilities: [],
    };
    const service = mockMusicAccess(musicAuth);
    await expect(
      service.canMusicUi('u1', 'music-library-manage', ['choir.music.manage'], choirId),
    ).resolves.toBe(true);
  });
});
