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

        Uses gpt-4o-mini if available; otherwise returns crisp deterministic milestones.
        """
        if self.is_configured:
            system_prompt = (
                "You are an expert technical career coach. Generate 3 to 4 concise, practical, "
                "action-oriented learning milestones for a college student preparing for placements. "
                "Output ONLY a JSON array of strings (e.g. [\"Milestone 1\", \"Milestone 2\"])."
            )
            user_prompt = (
                f"Target Role: {target_role}\n"
                f"Student Level: {student_level}\n"
                f"Phase: {phase_title}\n"
                f"Skills: {', '.join(skills)}\n"
                f"Allocated Hours: {allocated_hours}\n"
                "Provide 3-4 specific milestones (hands-on coding, concepts to master, interview topics)."
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

        # Deterministic fallback
        return [
            f"Master core fundamentals and syntax of {', '.join(skills)}.",
            f"Implement 3 hands-on practical exercises or mini-problems aligned with {target_role}.",
            f"Review college placement interview questions and edge cases for {skills[0]}.",
            f"Complete a timed self-assessment covering {', '.join(skills)}."
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
