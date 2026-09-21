"""Azure OpenAI Client for CareerForge AI.

Manages interactions with Azure OpenAI (gpt-4o-mini) deployed in Azure AI Foundry.
Adheres strictly to the architectural constraint:
- LLM is used ONLY for qualitative explanations, customized learning milestones, and study tips.
- All numbers, gaps, and hours are calculated deterministically beforehand.
- Includes automatic fallback to mock/deterministic mode if Azure is unreachable or credentials are unset.
"""
import json
import logging
import os
import re

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("careerforge.agent.azure_client")


class AzureOpenAIClient:
    """Client for Azure OpenAI gpt-4o-mini deployment with offline mock fallback."""

    def __init__(
        self,
        endpoint: str | None = None,
        api_key: str | None = None,
        deployment: str | None = None,
        api_version: str | None = None,
        mode: str | None = None,
        timeout: float = 12.0
    ):
        self.mode = (mode or os.getenv("MODE", "mock")).strip().lower()
        self.endpoint = (endpoint or os.getenv("AZURE_OPENAI_ENDPOINT", "")).rstrip("/")
        self.api_key = api_key or os.getenv("AZURE_OPENAI_API_KEY", "")
        self.deployment = deployment or os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o-mini")
        self.api_version = api_version or os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        """Check if live Azure credentials are provided."""
        return (
            self.mode == "azure"
            and bool(self.endpoint)
            and bool(self.api_key)
            and not self.endpoint.startswith("https://your-resource")
            and not self.api_key.startswith("your-")
        )

    def _call_azure_openai(self, messages: list[dict[str, str]], temperature: float = 0.3) -> str | None:
        """Execute a chat completion request to Azure OpenAI."""
        if not self.is_configured:
            return None

        url = f"{self.endpoint}/openai/deployments/{self.deployment}/chat/completions?api-version={self.api_version}"
        headers = {
            "Content-Type": "application/json",
            "api-key": self.api_key
        }
        payload = {
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 1000
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(url, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"].strip()
                logger.warning("Azure OpenAI returned status %s: %s", response.status_code, response.text)
        except (httpx.HTTPError, httpx.RequestError, OSError, json.JSONDecodeError, KeyError) as exc:
            logger.warning("Azure OpenAI call failed (%s). Using deterministic fallback.", exc)

        return None

    def enrich_phase_objectives(
        self,
        phase_title: str,
        skills: list[str],
        allocated_hours: int,
        target_role: str,
        student_level: str
    ) -> list[str]:
        """Generate pedagogical, practical learning milestones for a roadmap phase.

        Uses gpt-4o-mini / Azure OpenAI if available; otherwise returns crisp deterministic milestones.
        """
        if self.is_configured:
            system_prompt = (
                "You are an expert career coach and workforce mentor across tech, healthcare, engineering, finance, and law. "
                "Generate 3 to 4 concise, practical, action-oriented learning milestones for a student preparing for placements. "
                "Ensure milestones are specific to the profession (e.g. clinical/patient scenarios for medical, modeling/valuation for finance, coding/system design for tech). "
                "Output ONLY a JSON array of strings (e.g. [\"Milestone 1\", \"Milestone 2\"])."
            )
            user_prompt = (
                f"Target Role: {target_role}\n"
                f"Student Level: {student_level}\n"
                f"Phase: {phase_title}\n"
                f"Skills: {', '.join(skills)}\n"
                f"Allocated Hours: {allocated_hours}\n"
                "Provide 3-4 specific milestones (practical applications, concepts to master, real-world case scenarios, and interview evaluation topics)."
            )
            response = self._call_azure_openai([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ])
            if response:
                try:
                    clean = response.strip()
                    # Extract JSON array from markdown code block or raw brackets
                    match = re.search(r"```(?:json)?\s*(\[[\s\S]*?\])\s*```", clean)
                    if match:
                        clean = match.group(1).strip()
                    else:
                        bracket_match = re.search(r"(\[[\s\S]*\])", clean)
                        if bracket_match:
                            clean = bracket_match.group(1).strip()

                    parsed = json.loads(clean)
                    if isinstance(parsed, list) and all(isinstance(item, str) for item in parsed):
                        return parsed
                except (json.JSONDecodeError, AttributeError):
                    pass

        # Deterministic domain-appropriate fallback
        lead_skill = skills[0] if skills else target_role
        return [
            f"Master core principles and foundational knowledge of {', '.join(skills)}.",
            f"Complete hands-on practical exercises, case studies, or application scenarios aligned with {target_role}.",
            f"Review top placement interview questions and critical real-world edge cases for {lead_skill}.",
            f"Conduct a timed self-assessment and practical evaluation covering {', '.join(skills)}."
        ]


    def generate_adaptation_summary(
        self,
        skill: str,
        previous_level: float,
        updated_level: float,
        score_percentage: float,
        hours_saved_or_shifted: int,
        deprioritized: bool
    ) -> str:
        """Produce an explainable coaching message when a student completes an assessment."""
        if self.is_configured:
            system_prompt = (
                "You are CareerForge AI, an encouraging and clear career preparation assistant. "
                "Explain how the student's recent assessment updated their roadmap in 2 concise sentences."
            )
            user_prompt = (
                f"Skill: {skill}\n"
                f"Assessment Score: {score_percentage}%\n"
                f"Previous Level: {previous_level} / 5.0 -> New Level: {updated_level} / 5.0\n"
                f"Deprioritized/Mastered: {deprioritized}\n"
                f"Hours Reallocated: {hours_saved_or_shifted} hours.\n"
                "Summarize what changed in their roadmap dynamically."
            )
            response = self._call_azure_openai([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ])
            if response:
                return response

        # Deterministic explainable fallback
        if deprioritized:
            return (
                f"Outstanding performance on {skill} ({score_percentage}%)! Your proficiency increased from "
                f"{previous_level} to {updated_level}. This skill has now been marked Mastered, freeing up "
                f"{hours_saved_or_shifted} hours to accelerate your remaining high-priority gaps."
            )
        return (
            f"Assessment recorded for {skill} with score {score_percentage}%. Your proficiency updated from "
            f"{previous_level} to {updated_level} (+{round(updated_level - previous_level, 1)}). "
            f"Your remaining phases have been adjusted to optimize your remaining preparation timeline."
        )

    def synthesize_role_benchmark(self, query: str) -> dict | None:
        """Dynamically generate a comprehensive career benchmark for any profession using live Azure OpenAI."""
        if not self.is_configured:
            return None

        system_prompt = (
            "You are an expert global career, placement, and workforce intelligence system. "
            "Given any career or dream job (e.g. Cardiologist, Investment Banker, Civil Engineer, Aerospace Engineer, etc.), "
            "return a complete, professional, and authentic curriculum benchmark in JSON. "
            "Output ONLY valid JSON matching this schema with NO extra commentary:\n"
            "{\n"
            '  "matched_role": "Canonical Job Title",\n'
            '  "category": "Domain Category (e.g. Medicine & Healthcare, Finance & Banking, Core Engineering, Law & Legal)",\n'
            '  "tagline": "Concise 1-sentence description of the career path.",\n'
            '  "tier_label": "Label for target organizations (e.g. Target Hospital Tier, Target Financial Firm Tier, Target Engineering Firm Tier)",\n'
            '  "target_tiers": ["Top Tier 1 (e.g. AIIMS / Mayo Clinic)", "Tier 2", "Tier 3", "Tier 4", "Tier 5"],\n'
            '  "degree_label": "Degree label (e.g. Medical Qualification, Engineering Degree, Finance Degree)",\n'
            '  "branch_label": "Specialization label (e.g. Medical Specialty, Department, Concentration)",\n'
            '  "suggested_degrees": ["Degree 1", "Degree 2", "Degree 3"],\n'
            '  "suggested_branches": ["Spec 1", "Spec 2", "Spec 3"],\n'
            '  "skills": [\n'
            '    {"name": "Skill Name", "required_level": 4.5, "demand_level": "critical", "est_hours": 40, "category": "core"}\n'
            "  ]\n"
            "}\n"
            "Rules:\n"
            "- If the profession is NOT in Tech, do NOT mention FAANG or software engineering terms in target_tiers.\n"
            "- Include 4 to 6 critical competencies relevant specifically to this profession.\n"
            "- 'est_hours' should be reasonable preparation hours between 15 and 50 hours per competency.\n"
            "- 'demand_level' must be one of: 'critical', 'high-priority', 'frequently mentioned', 'moderate'."
        )

        user_prompt = f"Analyze the career and return the benchmark standard: '{query}'."

        response = self._call_azure_openai([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ], temperature=0.2)

        if response:
            try:
                clean = response.strip()
                match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", clean)
                if match:
                    clean = match.group(1).strip()
                else:
                    brace_match = re.search(r"(\{[\s\S]*\})", clean)
                    if brace_match:
                        clean = brace_match.group(1).strip()

                data = json.loads(clean)
                if isinstance(data, dict) and "matched_role" in data and "skills" in data:
                    # Sanitize skills
                    sanitized_skills = []
                    for s in data.get("skills", []):
                        if isinstance(s, dict) and s.get("name"):
                            req_lvl = float(s.get("required_level", 4.0))
                            req_lvl = min(5.0, max(1.0, round(req_lvl, 1)))

                            # Cap est_hours to reasonable learning units (10 - 60)
                            raw_hours = s.get("est_hours", 30)
                            try:
                                h = int(raw_hours)
                                if h > 80:  # If model returned career lifetime hours (e.g. 3000)
                                    h = min(50, max(20, round(h / 100)))
                            except (ValueError, TypeError):
                                h = 30

                            demand = str(s.get("demand_level", "critical")).lower()
                            if demand not in ["critical", "high-priority", "frequently mentioned", "moderate"]:
                                demand = "critical" if req_lvl >= 4.0 else "high-priority"

                            sanitized_skills.append({
                                "name": str(s["name"]).strip(),
                                "required_level": req_lvl,
                                "demand_level": demand,
                                "est_hours": h,
                                "category": str(s.get("category", "core"))
                            })

                    if sanitized_skills:
                        data["skills"] = sanitized_skills
                        return data
            except Exception as exc:
                logger.warning("Failed to parse custom role synthesized by Azure OpenAI: %s", exc)

        return None

