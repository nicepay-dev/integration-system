import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MerchantsModule } from './merchants/merchants.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { CasesModule } from './cases/cases.module';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), ScheduleModule.forRoot(), TypeOrmModule.forRootAsync({ inject: [ConfigService], useFactory: (c: ConfigService) => ({ type: 'postgres', url: c.getOrThrow('DATABASE_URL'), autoLoadEntities: true, synchronize: c.get('DB_SYNCHRONIZE') === 'true' || c.get('NODE_ENV') !== 'production' }) }), AuthModule, UsersModule, MerchantsModule, CasesModule, NotificationsModule] })
export class AppModule {}
