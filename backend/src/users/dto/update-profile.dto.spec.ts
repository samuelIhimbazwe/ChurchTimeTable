import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateProfileDto } from './update-profile.dto';

describe('UpdateProfileDto', () => {
  it('accepts valid Rwanda phone formats', async () => {
    for (const phone of ['0781234567', '250781234567', '+250781234567']) {
      const dto = plainToInstance(UpdateProfileDto, { phone });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('rejects invalid phone formats', async () => {
    const dto = plainToInstance(UpdateProfileDto, { phone: '12345' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'phone')).toBe(true);
  });

  it('rejects short names', async () => {
    const dto = plainToInstance(UpdateProfileDto, { firstName: 'A' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'firstName')).toBe(true);
  });
});
