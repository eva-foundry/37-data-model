/**
 * WorkReusablePatterns Types - Generated from Data Model Layer: work_reusable_patterns
 */

export interface WorkReusablePatternsRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkReusablePatternsInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkReusablePatternsInput extends Partial<CreateWorkReusablePatternsInput> {
  id: string;
}
