import { AttendanceOperationalStatus } from '@prisma/client';
import { AttendanceScoringService } from './attendance-scoring.service';
import { DEFAULT_ATTENDANCE_WEIGHTS } from './attendance.constants';

describe('AttendanceScoringService', () => {
  const scoring = new AttendanceScoringService({} as never);

  it('scores perfect attendance as excellent', () => {
    const result = scoring.scoreRecords(
      [
        { operationalStatus: AttendanceOperationalStatus.ATTENDED },
        { operationalStatus: AttendanceOperationalStatus.ATTENDED },
      ],
      DEFAULT_ATTENDANCE_WEIGHTS,
    );

    expect(result.percentage).toBe(100);
    expect(result.band).toBe('excellent');
  });

  it('penalizes unexcused absences more than excused absences', () => {
    const excused = scoring.scoreRecords(
      [{ operationalStatus: AttendanceOperationalStatus.EXCUSED_ABSENCE }],
      DEFAULT_ATTENDANCE_WEIGHTS,
    );
    const unexcused = scoring.scoreRecords(
      [{ operationalStatus: AttendanceOperationalStatus.UNEXCUSED_ABSENCE }],
      DEFAULT_ATTENDANCE_WEIGHTS,
    );

    expect(excused.percentage).toBeGreaterThan(unexcused.percentage);
  });
});
