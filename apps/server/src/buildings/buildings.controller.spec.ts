import { Test } from '@nestjs/testing';
import { BuildingsController } from './buildings.controller.js';
import { BuildingsService } from './buildings.service.js';

describe('BuildingsController', () => {
  it('zwraca listę budynków z serwisu', async () => {
    const rows = [{ id: '1', name: 'A', address: 'ul. Testowa 1' }];
    const moduleRef = await Test.createTestingModule({
      controllers: [BuildingsController],
      providers: [
        { provide: BuildingsService, useValue: { findAll: vi.fn().mockResolvedValue(rows) } },
      ],
    }).compile();

    const controller = moduleRef.get(BuildingsController);
    await expect(controller.findAll()).resolves.toEqual(rows);
  });
});
