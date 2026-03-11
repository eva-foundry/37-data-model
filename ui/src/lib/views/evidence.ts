// Evidence Views - Context-aware evidence queries

import { apiClient } from '../api/client';
import type { EvidenceRecord, EvidenceFilters } from '@/types/evidence';

/** Get all evidence (fire-hose warning: 120+ objects) */
export async function getAllEvidence(): Promise<EvidenceRecord[]> {
  const response = await apiClient.query<EvidenceRecord>('evidence', { limit: 1000 });
  return response.data;
}

/** Get recent evidence (last N hours) */
export async function getRecentEvidence(hours: number = 24): Promise<EvidenceRecord[]> {
  const all = await getAllEvidence();
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);
  
  return all.filter(e => 
    new Date(e.timestamp) >= cutoff
  ).sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/** Get evidence by operation */
export async function getEvidenceByOperation(operation: string): Promise<EvidenceRecord[]> {
  const all = await getAllEvidence();
  return all.filter(e => 
    e.operation.toLowerCase() === operation.toLowerCase()
  );
}

/** Get evidence by project */
export async function getEvidenceByProject(projectId: string): Promise<EvidenceRecord[]> {
  const all = await getAllEvidence();
  return all.filter(e => e.project_id === projectId);
}

/** Get evidence by outcome */
export async function getEvidenceByOutcome(
  outcome: EvidenceRecord['outcome']
): Promise<EvidenceRecord[]> {
  const all = await getAllEvidence();
  return all.filter(e => e.outcome === outcome);
}

/** Get failed evidence (outcome=failure) */
export async function getFailedEvidence(): Promise<EvidenceRecord[]> {
  return getEvidenceByOutcome('failure');
}

/** Get successful evidence (outcome=success) */
export async function getSuccessfulEvidence(): Promise<EvidenceRecord[]> {
  return getEvidenceByOutcome('success');
}

/** Get evidence by type */
export async function getEvidenceByType(
  type: EvidenceRecord['evidence_type']
): Promise<EvidenceRecord[]> {
  const all = await getAllEvidence();
  return all.filter(e => e.evidence_type === type);
}

/** Get evidence with filters */
export async function getEvidence(filters: EvidenceFilters = {}): Promise<EvidenceRecord[]> {
  let evidence = await getAllEvidence();
  
  if (filters.operation) {
    evidence = evidence.filter(e => 
      e.operation.toLowerCase() === filters.operation!.toLowerCase()
    );
  }
  
  if (filters.project_id) {
    evidence = evidence.filter(e => e.project_id === filters.project_id);
  }
  
  if (filters.outcome) {
    evidence = evidence.filter(e => e.outcome === filters.outcome);
  }
  
  if (filters.evidence_type) {
    evidence = evidence.filter(e => e.evidence_type === filters.evidence_type);
  }
  
  if (filters.recent_hours) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - filters.recent_hours);
    evidence = evidence.filter(e => new Date(e.timestamp) >= cutoff);
  }
  
  // Sort by timestamp descending (most recent first)
  return evidence.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/** Get evidence by ID */
export async function getEvidenceById(id: string): Promise<EvidenceRecord | undefined> {
  try {
    return await apiClient.getById<EvidenceRecord>('evidence', id);
  } catch (error) {
    console.warn(`Evidence ${id} not found:`, error);
    return undefined;
  }
}

/** Get evidence count */
export async function getEvidenceCount(): Promise<number> {
  return apiClient.count('evidence');
}

/** Default view: Recent 24 hours */
export async function getDefaultEvidence(): Promise<EvidenceRecord[]> {
  return getRecentEvidence(24);
}
