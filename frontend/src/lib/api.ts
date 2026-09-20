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
