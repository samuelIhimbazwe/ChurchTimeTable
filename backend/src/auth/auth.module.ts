import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PermissionsResolver } from './permissions.resolver';
import { MemberNumberModule } from '../members/member-number.module';
import { MemberPhoneEnforcementModule } from '../common/member/member-phone-enforcement.module';
import { ContributionCapabilityModule } from '../common/choir/contribution-capability.module';
import { WelfareCapabilityModule } from '../common/choir/welfare-capability.module';

@Module({
  imports: [
    MemberNumberModule,
    MemberPhoneEnforcementModule,
    forwardRef(() => ContributionCapabilityModule),
    forwardRef(() => WelfareCapabilityModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PermissionsResolver],
  exports: [AuthService, JwtModule, PermissionsResolver, ContributionCapabilityModule, WelfareCapabilityModule],
})
export class AuthModule {}
