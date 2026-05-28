import { Module } from '@nestjs/common';
import { ChoirRotationService } from './choir-rotation.service';
import { ChoirController } from './choir.controller';
import { AssignmentsModule } from '../assignments/assignments.module';

@Module({
  imports: [AssignmentsModule],
  controllers: [ChoirController],
  providers: [ChoirRotationService],
  exports: [ChoirRotationService],
})
export class ChoirModule {}
