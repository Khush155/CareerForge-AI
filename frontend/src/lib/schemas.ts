import { z } from 'zod';

export const SkillSchema = z.object({
  name: z.string(),
  proficiency: z.coerce.number().min(0).max(5),
});
export type Skill = z.infer<typeof SkillSchema>;

export const StudentProfileSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  degree: z.string().default('B.Tech'),
  branch: z.string().default('Computer Science'),
  year: z.coerce.number().int().min(1).max(5).default(1),
  target_role: z.string(),
  skills: z.array(SkillSchema).default([]),
  available_hours_per_week: z.coerce.number().int().min(1).max(80).default(15),
  current_prep_level: z.string().default('beginner'),
  avatar: z.string().nullable().optional(),
});
export type StudentProfile = z.infer<typeof StudentProfileSchema>;

export const PriorityLevelSchema = z.union([
  z.enum(['High', 'Medium', 'Low', 'Mastered']),
  z.string().transform((val) => {
    const s = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    if (['High', 'Medium', 'Low', 'Mastered'].includes(s)) return s as any;
    return 'Medium';
  }),
]).default('Medium');
export type PriorityLevel = z.infer<typeof PriorityLevelSchema>;

export const MarketRequirementSchema = z.object({
  skill: z.string(),
  required_level: z.coerce.number().default(3.5),
  demand_level: z.string().default('moderate'),
  source_url: z.string().nullable().optional(),
  rationale: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type MarketRequirement = z.infer<typeof MarketRequirementSchema>;

export const SkillGapSchema = z.object({
  skill: z.string(),
  current_level: z.coerce.number().default(0),
  required_level: z.coerce.number().default(3.5),
  gap: z.coerce.number().default(0),
  priority: PriorityLevelSchema,
  demand_level: z.string().default('moderate'),
  source_url: z.string().nullable().optional(),
  reasoning: z.string().nullable().optional(),
});
export type SkillGap = z.infer<typeof SkillGapSchema>;

export const ResourceItemSchema = z.object({
  title: z.string(),
  url_or_ref: z.union([z.string(), z.null(), z.undefined()]).transform((v) => v || '').default(''),
  resource_type: z.string().default('guide'),
});
export type ResourceItem = z.infer<typeof ResourceItemSchema>;

export const PhaseStatusSchema = z.union([
  z.enum(['not_started', 'in_progress', 'completed']),
  z.string().transform((val) => {
    const s = val.toLowerCase().replace(/\s+/g, '_');
    if (['not_started', 'in_progress', 'completed'].includes(s)) return s as any;
    return 'not_started';
  }),
]).default('not_started');
export type PhaseStatus = z.infer<typeof PhaseStatusSchema>;

export const RoadmapPhaseSchema = z.object({
  phase_number: z.coerce.number().min(1).default(1),
  title: z.string(),
  skills_covered: z.array(z.string()).default([]),
  estimated_hours: z.coerce.number().min(1).default(20),
  learning_objectives: z.array(z.string()).default([]),
  resources: z.array(ResourceItemSchema).default([]),
  status: PhaseStatusSchema,
});
export type RoadmapPhase = z.infer<typeof RoadmapPhaseSchema>;

export const RoadmapSchema = z.object({
  profile_id: z.string().nullable().optional(),
  target_role: z.string(),
  total_estimated_hours: z.coerce.number().default(40),
  available_hours_per_week: z.coerce.number().default(15),
  estimated_weeks: z.coerce.number().default(4),
  phases: z.array(RoadmapPhaseSchema).default([]),
  version: z.coerce.number().default(1),
});
export type Roadmap = z.infer<typeof RoadmapSchema>;

export const AssessmentInputSchema = z.object({
  profile_id: z.string(),
  skill: z.string(),
  score_percentage: z.coerce.number().min(0).max(100),
  notes: z.string().nullable().optional(),
});
export type AssessmentInput = z.infer<typeof AssessmentInputSchema>;

export const AssessmentResultSchema = z.object({
  profile_id: z.string(),
  skill: z.string(),
  score_percentage: z.coerce.number(),
  previous_level: z.coerce.number(),
  updated_level: z.coerce.number(),
  level_delta: z.coerce.number(),
  timestamp: z.string().default(() => new Date().toISOString()),
});
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;

export const ProfileResponseSchema = z.object({
  profile: StudentProfileSchema,
  market_requirements: z.array(MarketRequirementSchema).default([]),
  gaps: z.array(SkillGapSchema).default([]),
  roadmap: RoadmapSchema,
});
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const AssessmentResponseSchema = z.object({
  result: AssessmentResultSchema,
  updated_profile: StudentProfileSchema.nullable().optional(),
  gaps: z.array(SkillGapSchema).default([]),
  roadmap: RoadmapSchema,
  summary: z.string().default('Roadmap adapted successfully.'),
});
export type AssessmentResponse = z.infer<typeof AssessmentResponseSchema>;

