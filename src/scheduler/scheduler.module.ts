import { Module } from '@nestjs/common';
import { AlertasScheduler } from './alertas.scheduler';
import { AlertasModule } from '../alertas/alertas.module';

@Module({
  imports: [AlertasModule],
  providers: [AlertasScheduler],
})
export class SchedulerModule {}
