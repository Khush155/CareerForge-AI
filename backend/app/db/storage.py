"""SQLite repository for profiles, roadmaps, and assessment records.

Provides clean CRUD operations without heavyweight ORMs.
"""
import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path

from app.models.assessment import AssessmentResult
from app.models.profile import Skill, StudentProfile
from app.models.roadmap import Roadmap


class DatabaseManager:
    """Manages SQLite connection and data persistence."""

    def __init__(self, db_path: str = "data/careerforge.db"):
        self.db_path = db_path
        # Ensure parent directory exists
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    @contextmanager
    def _get_connection(self):
        """Context manager that yields a connection and guarantees it is closed on exit."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def _init_db(self) -> None:
        """Initialize database tables if they do not exist."""
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # Profiles table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS profiles (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    degree TEXT,
                    branch TEXT,
                    year INTEGER,
                    target_role TEXT,
                    available_hours_per_week INTEGER,
                    current_prep_level TEXT,
                    skills_json TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Roadmaps table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS roadmaps (
                    profile_id TEXT PRIMARY KEY,
                    target_role TEXT,
                    total_hours INTEGER,
                    available_hours_per_week INTEGER,
                    estimated_weeks INTEGER,
                    phases_json TEXT,
                    version INTEGER DEFAULT 1,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (profile_id) REFERENCES profiles(id)
                )
            """)

            # Assessments table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS assessments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id TEXT,
                    skill TEXT,
                    score_percentage REAL,
                    previous_level REAL,
                    updated_level REAL,
                    level_delta REAL,
                    timestamp TEXT,
                    FOREIGN KEY (profile_id) REFERENCES profiles(id)
                )
            """)
            conn.commit()

    # --- Profile Operations ---
    def save_profile(self, profile: StudentProfile) -> StudentProfile:
        """Insert or update a student profile."""
        if not profile.id:
            profile.id = f"std_{uuid.uuid4().hex[:8]}"

        skills_data = [s.model_dump() for s in profile.skills]

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO profiles (
                    id, name, degree, branch, year, target_role,
                    available_hours_per_week, current_prep_level, skills_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name=excluded.name,
                    degree=excluded.degree,
                    branch=excluded.branch,
                    year=excluded.year,
                    target_role=excluded.target_role,
                    available_hours_per_week=excluded.available_hours_per_week,
                    current_prep_level=excluded.current_prep_level,
                    skills_json=excluded.skills_json
            """, (
                profile.id,
                profile.name,
                profile.degree,
                profile.branch,
                profile.year,
                profile.target_role,
                profile.available_hours_per_week,
                profile.current_prep_level,
                json.dumps(skills_data)
            ))
            conn.commit()
        return profile

    def get_profile(self, profile_id: str) -> StudentProfile | None:
        """Fetch a student profile by ID."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM profiles WHERE id = ?", (profile_id,))
            row = cursor.fetchone()
            if not row:
                return None

            skills_raw = json.loads(row["skills_json"])
            skills = [Skill(**s) for s in skills_raw]

            return StudentProfile(
                id=row["id"],
                name=row["name"],
                degree=row["degree"],
                branch=row["branch"],
                year=row["year"],
                target_role=row["target_role"],
                skills=skills,
                available_hours_per_week=row["available_hours_per_week"],
                current_prep_level=row["current_prep_level"]
            )

    def update_skill_in_profile(self, profile_id: str, skill_name: str, new_level: float) -> StudentProfile | None:
        """Update or insert a skill proficiency level in a profile."""
        profile = self.get_profile(profile_id)
        if not profile:
            return None

        # Update existing skill or append
        updated = False
        target_name_lower = skill_name.strip().lower()
        for s in profile.skills:
            if s.name.strip().lower() == target_name_lower:
                s.proficiency = new_level
                updated = True
                break

        if not updated:
            profile.skills.append(Skill(name=skill_name.strip(), proficiency=new_level))

        return self.save_profile(profile)

    # --- Roadmap Operations ---
    def save_roadmap(self, roadmap: Roadmap) -> Roadmap:
        """Save or replace a roadmap for a profile."""
        phases_data = [p.model_dump() for p in roadmap.phases]

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO roadmaps (
                    profile_id, target_role, total_hours,
                    available_hours_per_week, estimated_weeks,
                    phases_json, version, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(profile_id) DO UPDATE SET
                    target_role=excluded.target_role,
                    total_hours=excluded.total_hours,
                    available_hours_per_week=excluded.available_hours_per_week,
                    estimated_weeks=excluded.estimated_weeks,
                    phases_json=excluded.phases_json,
                    version=roadmaps.version + 1,
                    updated_at=CURRENT_TIMESTAMP
            """, (
                roadmap.profile_id,
                roadmap.target_role,
                roadmap.total_estimated_hours,
                roadmap.available_hours_per_week,
                roadmap.estimated_weeks,
                json.dumps(phases_data),
                roadmap.version
            ))
            conn.commit()
        return roadmap

    def get_roadmap(self, profile_id: str) -> Roadmap | None:
        """Fetch the roadmap for a profile."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM roadmaps WHERE profile_id = ?", (profile_id,))
            row = cursor.fetchone()
            if not row:
                return None

            phases_raw = json.loads(row["phases_json"])
            return Roadmap(
                profile_id=row["profile_id"],
                target_role=row["target_role"],
                total_estimated_hours=row["total_hours"],
                available_hours_per_week=row["available_hours_per_week"],
                estimated_weeks=row["estimated_weeks"],
                phases=phases_raw,
                version=row["version"]
            )

    # --- Assessment History ---
    def save_assessment(self, result: AssessmentResult) -> None:
        """Log an assessment event into history."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO assessments (
                    profile_id, skill, score_percentage,
                    previous_level, updated_level, level_delta, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                result.profile_id,
                result.skill,
                result.score_percentage,
                result.previous_level,
                result.updated_level,
                result.level_delta,
                result.timestamp
            ))
            conn.commit()

    def get_assessments(self, profile_id: str) -> list[AssessmentResult]:
        """Retrieve all assessments taken by a student."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT profile_id, skill, score_percentage,
                       previous_level, updated_level, level_delta, timestamp
                FROM assessments
                WHERE profile_id = ?
                ORDER BY timestamp DESC
            """, (profile_id,))
            rows = cursor.fetchall()
            return [
                AssessmentResult(
                    profile_id=r["profile_id"],
                    skill=r["skill"],
                    score_percentage=r["score_percentage"],
                    previous_level=r["previous_level"],
                    updated_level=r["updated_level"],
                    level_delta=r["level_delta"],
                    timestamp=r["timestamp"]
                )
                for r in rows
            ]


# Singleton helper
_default_db: DatabaseManager | None = None


def get_db(db_path: str | None = None) -> DatabaseManager:
    """Provides a singleton DatabaseManager instance."""
    global _default_db
    target_path = db_path or os.getenv("DATABASE_PATH", "data/careerforge.db")
    if _default_db is None or _default_db.db_path != target_path:
        _default_db = DatabaseManager(target_path)
    return _default_db
