/**
 * WorkLearningFeedback Types - Generated from Data Model Layer: work_learning_feedback
 */

export interface WorkLearningFeedbackRecord {
  id: string;
  layer: string;
  partition_key: string;
  [key: string]: any;
}

export interface CreateWorkLearningFeedbackInput {
  id: string;
  [key: string]: any;
}

export interface UpdateWorkLearningFeedbackInput extends Partial<CreateWorkLearningFeedbackInput> {
  id: string;
}
