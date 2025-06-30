import { Module, Global } from '@nestjs/common';
import { ConfigServerService } from './config.service';

@Global()
@Module({
  providers: [ConfigServerService],
  exports: [ConfigServerService],
})
export class ConfigServerModule {}
