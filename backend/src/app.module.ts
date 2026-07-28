import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MerchantsModule } from './merchants/merchants.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { CasesModule } from './cases/cases.module';
import { HealthController } from './health.controller';
import { RequestLoggerMiddleware } from './request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => {
        const url = c.get<string>('DATABASE_URL');
        return {
          type: 'postgres' as const,
          ...(url ? { url } : {
            host: c.get<string>('DB_HOST', 'database'),
            port: Number(c.get<string>('DB_PORT', '5432')),
            username: c.get<string>('DB_USERNAME', 'postgres'),
            password: c.get<string>('DB_PASSWORD', '12345678'),
            database: c.get<string>('DB_DATABASE', 'merchant_pulse'),
          }),
          autoLoadEntities: true,
          synchronize: c.get('DB_SYNCHRONIZE') === 'true' || c.get('NODE_ENV') !== 'production',
          retryAttempts: 20,
          retryDelay: 3000,
        };
      },
    }),
    AuthModule,
    UsersModule,
    MerchantsModule,
    CasesModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
