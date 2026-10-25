import logging
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.config import settings

logger = logging.getLogger(__name__)

class VectorStore:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorStore, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.chunks_metadata: List[Dict[str, Any]] = []
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words="english",
            max_features=15000,
            sublinear_tf=True
        )
        self.tfidf_matrix = None
        self.is_indexed = False

    def reset(self):
        self._initialize()

    def add_chunks(self, chunks: List[Dict[str, Any]]):
        """
        chunks: list of dicts with:
        ['id', 'document_id', 'document_name', 'page_number', 'chunk_index', 'content']
        """
        self.chunks_metadata.extend(chunks)
        self._rebuild_index()

    def set_all_chunks(self, chunks: List[Dict[str, Any]]):
        self.chunks_metadata = chunks
        self._rebuild_index()

    def _rebuild_index(self):
        if not self.chunks_metadata:
            self.tfidf_matrix = None
            self.is_indexed = False
            return

        corpus = [chunk["content"] for chunk in self.chunks_metadata]
        try:
            self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
            self.is_indexed = True
            logger.info(f"VectorStore indexed {len(corpus)} chunks.")
        except Exception as e:
            logger.error(f"Error rebuilding vector store index: {e}")
            self.is_indexed = False

    def search(
        self,
        query: str,
        top_k: int = settings.RETRIEVAL_TOP_K,
        filter_document_id: Optional[int] = None,
        threshold: float = settings.SIMILARITY_THRESHOLD
    ) -> List[Dict[str, Any]]:
        """
        Searches chunks using cosine similarity against the TF-IDF representation of query.
        Returns sorted list of matching chunk metadata with 'similarity_score'.
        """
        if not self.is_indexed or self.tfidf_matrix is None or not self.chunks_metadata:
            return []

        try:
            query_vec = self.vectorizer.transform([query])
            scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []

        ranked_indices = np.argsort(scores)[::-1]
        results = []

        for idx in ranked_indices:
            score = float(scores[idx])
            chunk = self.chunks_metadata[idx]

            if filter_document_id and chunk.get("document_id") != filter_document_id:
                continue

            if score < threshold and len(results) >= 1:
                # If we already have top candidate(s) and subsequent fall below threshold, break
                break

            result_item = dict(chunk)
            result_item["similarity_score"] = round(score, 4)
            results.append(result_item)

            if len(results) >= top_k:
                break

        return results

vector_store = VectorStore()
