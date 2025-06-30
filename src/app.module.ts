import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigServerModule } from './modules/config/config.module';
import { HealthModule } from './modules/health/health.module';
import { ExtractionModule } from './modules/extraction/extraction.module';
import { HttpExceptionFilter } from './modules/common/filters/http-exception.filter';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'local'
          ? '.env.local'
          : process.env.NODE_ENV === 'k8s'
            ? '.env.k8s'
            : '',
    }),
    ConfigServerModule,
    HealthModule,
    ExtractionModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
