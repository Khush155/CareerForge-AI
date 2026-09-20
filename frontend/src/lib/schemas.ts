import { z } from 'zod';

export const SkillSchema = z.object({
  name: z.string(),
  proficiency: z.number().min(0).max(5),
});
export type Skill = z.infer<typeof SkillSchema>;

export const StudentProfileSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  degree: z.string(),
  branch: z.string(),
  year: z.number().int().min(1).max(5),
  target_role: z.string(),
  skills: z.array(SkillSchema).default([]),
  available_hours_per_week: z.number().int().min(1).max(80),
  current_prep_level: z.string().default('beginner'),
  avatar: z.string().nullable().optional(),
});
export type StudentProfile = z.infer<typeof StudentProfileSchema>;

export const PriorityLevelSchema = z.enum(['High', 'Medium', 'Low', 'Mastered']);
export type PriorityLevel = z.infer<typeof PriorityLevelSchema>;

export const MarketRequirementSchema = z.object({
  skill: z.string(),
  required_level: z.number(),
  demand_level: z.string().default('moderate'),
  source_url: z.string().nullable().optional(),
  rationale: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type MarketRequirement = z.infer<typeof MarketRequirementSchema>;

export const SkillGapSchema = z.object({
  skill: z.string(),
  current_level: z.number(),
  required_level: z.number(),
  gap: z.number(),
  priority: PriorityLevelSchema,
  demand_level: z.string().default('moderate'),
  source_url: z.string().nullable().optional(),
  reasoning: z.string().nullable().optional(),
});
export type SkillGap = z.infer<typeof SkillGapSchema>;

export const ResourceItemSchema = z.object({
  title: z.string(),
  url_or_ref: z.string(),
  resource_type: z.string().default('guide'),
});
export type ResourceItem = z.infer<typeof ResourceItemSchema>;

export const PhaseStatusSchema = z.enum(['not_started', 'in_progress', 'completed']);
export type PhaseStatus = z.infer<typeof PhaseStatusSchema>;

export const RoadmapPhaseSchema = z.object({
  phase_number: z.number().int().min(1),
  title: z.string(),
  skills_covered: z.array(z.string()),
  estimated_hours: z.number().int().min(1),
  learning_objectives: z.array(z.string()).default([]),
  resources: z.array(ResourceItemSchema).default([]),
  status: PhaseStatusSchema.default('not_started'),
});
export type RoadmapPhase = z.infer<typeof RoadmapPhaseSchema>;

export const RoadmapSchema = z.object({
  profile_id: z.string().nullable().optional(),
  target_role: z.string(),
  total_estimated_hours: z.number().int().min(1),
  available_hours_per_week: z.number().int().min(1),
  estimated_weeks: z.number().int().min(1),
  phases: z.array(RoadmapPhaseSchema),
  version: z.number().int().default(1),
});
export type Roadmap = z.infer<typeof RoadmapSchema>;

export const AssessmentInputSchema = z.object({
  profile_id: z.string(),
  skill: z.string(),
  score_percentage: z.number().min(0).max(100),
  notes: z.string().nullable().optional(),
});
export type AssessmentInput = z.infer<typeof AssessmentInputSchema>;

export const AssessmentResultSchema = z.object({
  profile_id: z.string(),
  skill: z.string(),
  score_percentage: z.number(),
  previous_level: z.number(),
  updated_level: z.number(),
  level_delta: z.number(),
  timestamp: z.string(),
});
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

export const ProfileResponseSchema = z.object({
  profile: StudentProfileSchema,
  market_requirements: z.array(MarketRequirementSchema),
  gaps: z.array(SkillGapSchema),
  roadmap: RoadmapSchema,
});
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const AssessmentResponseSchema = z.object({
  result: AssessmentResultSchema,
  updated_profile: StudentProfileSchema.nullable().optional(),
  gaps: z.array(SkillGapSchema),
  roadmap: RoadmapSchema,
  summary: z.string(),
});
export type AssessmentResponse = z.infer<typeof AssessmentResponseSchema>;
