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
import { DisciplineCapabilityModule } from '../common/choir/discipline-capability.module';
import { OpsCapabilityModule } from '../common/choir/ops-capability.module';
import { JoinCapabilityModule } from '../common/choir/join-capability.module';
import { SponsorCapabilityModule } from '../common/choir/sponsor-capability.module';
import { MusicCapabilityModule } from '../common/choir/music-capability.module';
import { RosterCapabilityModule } from '../common/choir/roster-capability.module';

@Module({
  imports: [
    MemberNumberModule,
    MemberPhoneEnforcementModule,
    forwardRef(() => ContributionCapabilityModule),
    forwardRef(() => WelfareCapabilityModule),
    forwardRef(() => DisciplineCapabilityModule),
    forwardRef(() => OpsCapabilityModule),
    forwardRef(() => JoinCapabilityModule),
    forwardRef(() => SponsorCapabilityModule),
    forwardRef(() => MusicCapabilityModule),
    forwardRef(() => RosterCapabilityModule),
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
  exports: [AuthService, JwtModule, PermissionsResolver, ContributionCapabilityModule, WelfareCapabilityModule, DisciplineCapabilityModule, OpsCapabilityModule, JoinCapabilityModule, SponsorCapabilityModule, MusicCapabilityModule, RosterCapabilityModule],
})
export class AuthModule {}
