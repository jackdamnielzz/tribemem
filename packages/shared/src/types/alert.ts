export type AlertType =
  | 'contradiction'
  | 'process_drift'
  | 'knowledge_gap'
  | 'stale_knowledge'
  | 'connector_error'
  | 'usage_limit';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';

export interface Alert {
  id: string;
  org_id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  /** IDs of related knowledge units, connectors, etc. */
  related_entity_ids: string[];
  /** Alert-type-specific details */
  details: Record<string, unknown>;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertRule {
  id: string;
  org_id: string;
  type: AlertType;
  enabled: boolean;
  severity_override: AlertSeverity | null;
  /** Notification channels (e.g., email, slack) */
  notify_channels: string[];
  /** Minimum interval between alerts of this type in minutes */
  cooldown_minutes: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
