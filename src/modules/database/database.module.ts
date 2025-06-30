import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigServerModule } from '../config/config.module';
import { ConfigServerService } from '../config/config.service';
import { DatabaseService } from '../config/database.service';

@Module({
  imports: [
    ConfigServerModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigServerModule],
      inject: [ConfigServerService],
      useFactory: async (configService: ConfigServerService) => ({
        type: 'oracle' as const,
        host: configService.get('config.database.host', 'localhost'),
        port: parseInt(configService.get('config.database.port', '1521')),
        username: configService.get('config.database.username'),
        password: configService.get('config.database.password'),
        serviceName: configService.get('config.database.service'),
        entities: [],
        synchronize: false,
        logging: configService.get('config.server.node_env') === 'development',
        extra: {
          connectString: `${configService.get('config.database.host')}:${configService.get('config.database.port', '1521')}/${configService.get('config.database.service')}`,
          fetchAsBuffer: [],
        },
      }),
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
