"""Knowledge Base RAG Retriever Tool.

Extracts and semantically ranks curated interview guides and stable documentation.
Runs 100% locally with zero cloud API overhead.
"""
import math
import os
import re
from dataclasses import dataclass
from pathlib import Path

from app.models.roadmap import ResourceItem


@dataclass
class KnowledgeChunk:
    """A distinct chunk from a curated knowledge guide."""
    doc_title: str
    section_title: str
    content: str
    file_path: str

    @property
    def full_title(self) -> str:
        return f"{self.doc_title} - {self.section_title}"

    @property
    def token_set(self) -> set[str]:
        return set(re.findall(r"\w+", f"{self.doc_title} {self.section_title} {self.content}".lower()))


def _find_default_kb_dir(kb_dir: str | None = None) -> str:
    """Finds curated KB directory whether running from project root or workspace parent."""
    if kb_dir:
        return kb_dir
    env_dir = os.getenv("KB_DIRECTORY")
    if env_dir:
        return env_dir
    cwd_path = Path("data/curated_kb")
    if cwd_path.exists():
        return str(cwd_path)
    # Check relative to CareerForge-AI root (3 levels up from tools/)
    root_path = Path(__file__).resolve().parents[3] / "data" / "curated_kb"
    if root_path.exists():
        return str(root_path)
    return "data/curated_kb"


class LocalKnowledgeRetriever:
    """In-memory semantic and keyword-weighted retriever for curated guides."""

    def __init__(self, kb_dir: str | None = None):
        self.kb_dir = Path(_find_default_kb_dir(kb_dir))
        self.chunks: list[KnowledgeChunk] = []
        self._load_documents()

    def _load_documents(self) -> None:
        """Parse all markdown files in kb_dir into chunks split by headers."""
        self.chunks.clear()
        if not self.kb_dir.exists():
            return

        for md_file in self.kb_dir.glob("*.md"):
            try:
                content = md_file.read_text(encoding="utf-8")
                self._parse_markdown(md_file, content)
            except (OSError, UnicodeDecodeError):
                pass

    def _parse_markdown(self, file_path: Path, text: str) -> None:
        """Extract title and sections from markdown text."""
        lines = text.split("\n")
        doc_title = file_path.stem.replace("_", " ").title()

        # Check for first H1 header
        for line in lines:
            if line.startswith("# "):
                doc_title = line.replace("# ", "").strip()
                break

        # Split on H2 headers (## )
        sections: list[tuple[str, list[str]]] = []
        current_section = "Overview"
        current_lines: list[str] = []

        for line in lines:
            if line.startswith("## "):
                if current_lines:
                    sections.append((current_section, current_lines))
                current_section = line.replace("## ", "").strip()
                current_lines = []
            elif not line.startswith("# "):
                current_lines.append(line)

        if current_lines:
            sections.append((current_section, current_lines))

        for sec_title, sec_lines in sections:
            body = "\n".join(sec_lines).strip()
            if body:
                self.chunks.append(
                    KnowledgeChunk(
                        doc_title=doc_title,
                        section_title=sec_title,
                        content=body,
                        file_path=str(file_path).replace("\\", "/")
                    )
                )

    def search(self, query: str, top_k: int = 3) -> list[ResourceItem]:
        """Search curated knowledge base for the most relevant sections.

        Uses term frequency-inverse document frequency (TF-IDF) heuristic
        with heavy boost for matches in section and document titles.
        Ignores stopwords and requires relevant title or content match.
        """
        if not self.chunks:
            self._load_documents()

        stopwords = {
            "or", "and", "the", "in", "to", "for", "with", "of", "on", "at",
            "by", "a", "an", "is", "it", "as", "be", "from", "that", "this", "are",
            "developer", "engineer", "engineering", "development", "specialist",
            "architect", "role", "job", "career", "prep", "architecture", "basics",
            "principles", "services", "concepts", "patterns", "internals",
            "computer", "software", "system", "systems", "program", "programming"
        }
        query_tokens = [
            t for t in re.findall(r"\w+", query.lower())
            if len(t) > 1 and t not in stopwords
        ]
        if not query_tokens or not self.chunks:
            return []

        scored_chunks: list[tuple[float, KnowledgeChunk]] = []
        total_chunks = len(self.chunks)

        for chunk in self.chunks:
            score = 0.0
            chunk_tokens = chunk.token_set
            title_lower = f"{chunk.doc_title} {chunk.section_title}".lower()

            has_title_match = False
            for token in query_tokens:
                if token in chunk_tokens:
                    doc_freq = sum(1 for c in self.chunks if token in c.token_set)
                    idf = math.log((1.0 + total_chunks) / (1.0 + doc_freq)) + 1.0
                    score += 1.0 * idf

                    if token in title_lower:
                        score += 3.5 * idf
                        has_title_match = True

            # Only consider chunk if it has a direct title match ensuring strict semantic relevance
            if has_title_match and score >= 3.0:
                scored_chunks.append((score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        results: list[ResourceItem] = []
        for _, chunk in scored_chunks[:top_k]:
            clean_sec = re.sub(r"[^\w\- ]", "", chunk.section_title).strip().lower().replace(" ", "-")
            path_str = chunk.file_path.replace("\\", "/")
            if "data/curated_kb/" in path_str:
                clean_path = "data/curated_kb/" + path_str.split("data/curated_kb/")[1]
            else:
                clean_path = path_str
            ref_link = f"{clean_path}#{clean_sec}"
            results.append(
                ResourceItem(
                    title=chunk.full_title,
                    url_or_ref=ref_link,
                    resource_type="kb_guide"
                )
            )

        return results


# Global singleton instance
_default_retriever: LocalKnowledgeRetriever | None = None


def retrieve_knowledge_base(query: str, top_k: int = 3, kb_dir: str | None = None) -> list[ResourceItem]:
    """Agent Tool 2: Retrieves relevant curated preparation guides for a query."""
    global _default_retriever
    target_dir = _find_default_kb_dir(kb_dir)
    if _default_retriever is None or str(_default_retriever.kb_dir) != target_dir:
        _default_retriever = LocalKnowledgeRetriever(target_dir)

    return _default_retriever.search(query, top_k=top_k)
