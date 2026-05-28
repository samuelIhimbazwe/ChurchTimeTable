import { SetMetadata } from '@nestjs/common';
import { SUPER_ADMIN_ONLY_KEY } from '../guards/super-admin.guard';

export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_ONLY_KEY, true);
