export type DeploymentReadinessLevel =
  | 'NOT_READY'
  | 'PARTIAL'
  | 'READY'
  | 'PILOT_READY'
  | 'LIVE_READY';

export type DeploymentReadinessIndicator = {
  key: string;
  label: string;
  ready: boolean;
  count: number;
  target?: number;
};
