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


class LocalKnowledgeRetriever:
    """In-memory semantic and keyword-weighted retriever for curated guides."""

    def __init__(self, kb_dir: str = "data/curated_kb"):
        self.kb_dir = Path(kb_dir)
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
        """
        if not self.chunks:
            self._load_documents()

        query_tokens = [t for t in re.findall(r"\w+", query.lower()) if len(t) > 1]
        if not query_tokens or not self.chunks:
            return []

        scored_chunks: list[tuple[float, KnowledgeChunk]] = []
        total_chunks = len(self.chunks)

        for chunk in self.chunks:
            score = 0.0
            chunk_tokens = chunk.token_set
            title_lower = f"{chunk.doc_title} {chunk.section_title}".lower()

            for token in query_tokens:
                # Token present in chunk
                if token in chunk_tokens:
                    # Document frequency calculation
                    doc_freq = sum(1 for c in self.chunks if token in c.token_set)
                    idf = math.log((1.0 + total_chunks) / (1.0 + doc_freq)) + 1.0

                    # Base content match
                    score += 1.0 * idf

                    # Strong title boost
                    if token in title_lower:
                        score += 3.0 * idf

            if score > 0.0:
                scored_chunks.append((score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        results: list[ResourceItem] = []
        for _, chunk in scored_chunks[:top_k]:
            clean_sec = re.sub(r"[^\w\- ]", "", chunk.section_title).strip().lower().replace(" ", "-")
            ref_link = f"{chunk.file_path}#{clean_sec}"
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
    target_dir = kb_dir or os.getenv("KB_DIRECTORY", "data/curated_kb")
    if _default_retriever is None or str(_default_retriever.kb_dir) != target_dir:
        _default_retriever = LocalKnowledgeRetriever(target_dir)

    return _default_retriever.search(query, top_k=top_k)
