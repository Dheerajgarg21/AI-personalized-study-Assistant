import re
from typing import List, Dict, Any
from pathlib import Path
from pypdf import PdfReader
from docx import Document as DocxDocument
from app.config import settings

class DocumentProcessor:
    @staticmethod
    def extract_text(file_path: str, file_type: str) -> List[Dict[str, Any]]:
        """
        Extract text from PDF, DOCX, or TXT.
        Returns a list of dicts: [{'page_number': int, 'text': str}]
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        extracted_pages: List[Dict[str, Any]] = []
        normalized_ext = file_type.lower().replace(".", "")

        if normalized_ext == "pdf":
            reader = PdfReader(str(path))
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                page_text = DocumentProcessor._clean_text(page_text)
                if page_text:
                    extracted_pages.append({
                        "page_number": idx + 1,
                        "text": page_text
                    })
        elif normalized_ext in ["docx", "doc"]:
            doc = DocxDocument(str(path))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            full_text = "\n\n".join(paragraphs)
            full_text = DocumentProcessor._clean_text(full_text)
            if full_text:
                # Divide long docx into virtual pages of ~2000 characters
                chunks = DocumentProcessor._split_into_virtual_pages(full_text, chars_per_page=2000)
                for idx, chunk in enumerate(chunks):
                    extracted_pages.append({
                        "page_number": idx + 1,
                        "text": chunk
                    })
        elif normalized_ext in ["txt", "md"]:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                full_text = f.read()
            full_text = DocumentProcessor._clean_text(full_text)
            if full_text:
                chunks = DocumentProcessor._split_into_virtual_pages(full_text, chars_per_page=2000)
                for idx, chunk in enumerate(chunks):
                    extracted_pages.append({
                        "page_number": idx + 1,
                        "text": chunk
                    })
        else:
            raise ValueError(f"Unsupported document format: {file_type}. Supported: PDF, TXT, DOCX")

        return extracted_pages

    @staticmethod
    def _clean_text(text: str) -> str:
        text = re.sub(r"\r\n", "\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @staticmethod
    def _split_into_virtual_pages(text: str, chars_per_page: int = 2000) -> List[str]:
        words = text.split(" ")
        pages = []
        current_page = []
        current_len = 0

        for word in words:
            current_page.append(word)
            current_len += len(word) + 1
            if current_len >= chars_per_page:
                pages.append(" ".join(current_page))
                current_page = []
                current_len = 0

        if current_page:
            pages.append(" ".join(current_page))
        return pages

    @staticmethod
    def create_chunks(
        extracted_pages: List[Dict[str, Any]],
        chunk_size: int = settings.CHUNK_SIZE,
        chunk_overlap: int = settings.CHUNK_OVERLAP
    ) -> List[Dict[str, Any]]:
        """
        Splits extracted pages into overlapping chunks while preserving page numbers.
        Returns: [{'chunk_index': int, 'page_number': int, 'content': str}]
        """
        all_chunks: List[Dict[str, Any]] = []
        chunk_index = 0

        for page_data in extracted_pages:
            page_num = page_data["page_number"]
            text = page_data["text"]

            if len(text) <= chunk_size:
                if len(text.strip()) > 30:
                    all_chunks.append({
                        "chunk_index": chunk_index,
                        "page_number": page_num,
                        "content": text.strip()
                    })
                    chunk_index += 1
                continue

            start = 0
            while start < len(text):
                end = min(start + chunk_size, len(text))
                
                # If we're not at the very end, try breaking at a sentence or word boundary
                if end < len(text):
                    last_period = text.rfind(". ", start, end)
                    last_newline = text.rfind("\n", start, end)
                    break_point = max(last_period, last_newline)
                    if break_point > start + (chunk_size // 2):
                        end = break_point + 1

                chunk_text = text[start:end].strip()
                if len(chunk_text) > 30:
                    all_chunks.append({
                        "chunk_index": chunk_index,
                        "page_number": page_num,
                        "content": chunk_text
                    })
                    chunk_index += 1

                if end >= len(text):
                    break
                start = max(end - chunk_overlap, start + 1)

        return all_chunks
