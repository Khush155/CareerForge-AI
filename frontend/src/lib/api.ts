import {
  ProfileResponseSchema,
  AssessmentResponseSchema,
  RoadmapSchema,
  type ProfileResponse,
  type AssessmentResponse,
  type Roadmap,
  type StudentProfile,
  type AssessmentInput,
} from './schemas';

export class AppApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public type: 'network' | 'validation' | 'server' | 'schema' = 'server'
  ) {
    super(message);
    this.name = 'AppApiError';
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err) {
    throw new AppApiError(
      "Couldn't reach the API on 127.0.0.1:8000. Start the server and retry.",
      undefined,
      'network'
    );
  }

  if (!res.ok) {
    let errorDetail = `Server error ${res.status}`;
    try {
      const data = await res.json();
      if (data.detail) errorDetail = data.detail;
    } catch {
      // ignore
    }

    if (res.status >= 400 && res.status < 500) {
      throw new AppApiError(errorDetail, res.status, 'validation');
    }
    throw new AppApiError(errorDetail, res.status, 'server');
  }

  return await res.json();
}

export async function submitProfile(profile: Partial<StudentProfile>): Promise<ProfileResponse> {
  const data = await request<unknown>('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });

  const parsed = ProfileResponseSchema.safeParse(data);
  if (!parsed.success) {
    console.error('Schema validation failure on /api/profile', parsed.error);
    throw new AppApiError(
      'Server returned data that does not match the expected contract.',
      undefined,
      'schema'
    );
  }
  return parsed.data;
}

export async function submitAssessment(input: AssessmentInput): Promise<AssessmentResponse> {
  const data = await request<unknown>('/api/assessment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const parsed = AssessmentResponseSchema.safeParse(data);
  if (!parsed.success) {
    console.error('Schema validation failure on /api/assessment', parsed.error);
    throw new AppApiError(
      'Server returned data that does not match the expected contract.',
      undefined,
      'schema'
    );
  }
  return parsed.data;
}

export async function fetchRoadmap(profileId: string): Promise<Roadmap> {
  const data = await request<unknown>(`/api/roadmap/${encodeURIComponent(profileId)}`);
  const parsed = RoadmapSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppApiError('Failed to parse roadmap contract.', undefined, 'schema');
  }
  return parsed.data;
}

export async function checkSystemHealth(): Promise<{ status: string; service: string }> {
  return await request<{ status: string; service: string }>('/health');
}

export interface RoleSuggestion {
  id: string;
  title: string;
  category: string;
  tagline: string;
  demand_level: string;
}

export interface RoleGroupedItem {
  id: string;
  title: string;
  category: string;
  tagline: string;
  demand_level: string;
  avg_time_to_ready_weeks: number;
  top_skills: string[];
}

export interface RoleSkillItem {
  name: string;
  required_level: number;
  demand_level: string;
  weight: number;
  est_hours: number;
  prerequisites: string[];
  source_url: string;
  source_type: string;
  category: string;
}

export interface RoleResolveResult {
  matched_role: string;
  role_id: string;
  confidence: number;
  tagline: string;
  category: string;
  alternatives: string[];
  benchmark: RoleSkillItem[];
  source_type: string;
  message: string;
  tier_label?: string;
  target_tiers?: string[];
  degree_label?: string;
  branch_label?: string;
  suggested_degrees?: string[];
  suggested_branches?: string[];
}


export async function fetchRolesGrouped(): Promise<Record<string, RoleGroupedItem[]>> {
  return await request<Record<string, RoleGroupedItem[]>>('/api/roles');
}

export async function fetchRoleSuggestions(q: string): Promise<RoleSuggestion[]> {
  return await request<RoleSuggestion[]>(`/api/roles/suggest?q=${encodeURIComponent(q)}`);
}

export async function resolveRoleQuery(query: string): Promise<RoleResolveResult> {
  return await request<RoleResolveResult>('/api/role/resolve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
}

export async function fetchCompletedMilestones(profileId: string): Promise<Record<string, boolean>> {
  return await request<Record<string, boolean>>(`/api/roadmap/${encodeURIComponent(profileId)}/milestones`);
}

export async function updateMilestoneCompletion(
  profileId: string,
  milestoneKey: string,
  completed: boolean
): Promise<Record<string, boolean>> {
  return await request<Record<string, boolean>>(`/api/roadmap/${encodeURIComponent(profileId)}/milestones`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ milestone_key: milestoneKey, completed }),
  });
}

