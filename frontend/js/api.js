/**
 * CareerForge AI — API Client Layer
 * Communicates with FastAPI backend with actionable error messages and fallback handling.
 */

class CareerForgeAPI {
  constructor() {
    const isFastAPIOrigin = window.location.port === '8000' || window.location.pathname.startsWith('/api');
    this.baseUrl = isFastAPIOrigin ? '' : 'http://127.0.0.1:8000';
  }

  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      return await res.json();
    } catch (err) {
      return { status: 'offline', error: err.message };
    }
  }

  async submitProfile(profileData) {
    try {
      const res = await fetch(`${this.baseUrl}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || `Server returned error ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      throw new Error(`Couldn't reach the API on 127.0.0.1:8000. Ensure the server is running and retry. Details: ${err.message}`);
    }
  }

  async submitAssessment(assessmentPayload) {
    try {
      const res = await fetch(`${this.baseUrl}/api/assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentPayload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errorData.detail || `Server returned error ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      throw new Error(`Couldn't record assessment. Details: ${err.message}`);
    }
  }

  async getRoadmap(profileId) {
    try {
      const res = await fetch(`${this.baseUrl}/api/roadmap/${encodeURIComponent(profileId)}`);
      if (!res.ok) throw new Error(`Roadmap for ${profileId} not found`);
      return await res.json();
    } catch (err) {
      throw new Error(`Failed to retrieve roadmap. Details: ${err.message}`);
    }
  }

  async getMarketRequirements(role) {
    try {
      const res = await fetch(`${this.baseUrl}/api/market/${encodeURIComponent(role)}`);
      if (!res.ok) throw new Error(`Market requirements for ${role} not found`);
      return await res.json();
    } catch (err) {
      throw new Error(`Failed to retrieve market requirements. Details: ${err.message}`);
    }
  }
}

window.api = new CareerForgeAPI();
