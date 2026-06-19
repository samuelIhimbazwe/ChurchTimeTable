export type RecognitionCategory = 'attendance' | 'contribution';

export type RecognitionBadgeKind =
  | 'ATTENDANCE_PRESENT_MONTH'
  | 'ATTENDANCE_STEADY_SERVICE'
  | 'ATTENDANCE_FAITHFUL_SERVICE'
  | 'ATTENDANCE_REHEARSAL_FAITHFUL'
  | 'ATTENDANCE_PERFECT_SERVICE_MONTH'
  | 'ATTENDANCE_SERVICE_JOURNEY'
  | 'CONTRIBUTION_FIRST_GIFT'
  | 'CONTRIBUTION_ON_TRACK'
  | 'CONTRIBUTION_GOAL_MET'
  | 'CONTRIBUTION_STEADY_GIVER';

export type RecognitionBadge = {
  kind: RecognitionBadgeKind;
  category: RecognitionCategory;
  label: string;
  detail?: string | null;
};

export type RecognitionMilestone = {
  kind: RecognitionBadgeKind;
  category: RecognitionCategory;
  label: string;
  progressPct: number;
  hint: string;
};

export type MemberRecognitionResponse = {
  choirId: string;
  enabled: boolean;
  earned: RecognitionBadge[];
  nextMilestones: RecognitionMilestone[];
};
