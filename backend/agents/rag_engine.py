import os
import re
from typing import List
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from langchain_core.callbacks import CallbackManagerForRetrieverRun

class LocalWeaponRetriever(BaseRetriever):
    """
    A custom LangChain retriever that loads local weapon manuals,
    chunks them by Markdown headers, and performs offline keyword retrieval.
    """
    manuals_dir: str
    chunks: List[Document] = []

    def __init__(self, manuals_dir: str, **kwargs):
        super().__init__(manuals_dir=manuals_dir, **kwargs)
        self.chunks = self._load_and_chunk_manuals()

    def _load_and_chunk_manuals(self) -> List[Document]:
        loaded_chunks = []
        if not os.path.exists(self.manuals_dir):
            return loaded_chunks

        for filename in os.listdir(self.manuals_dir):
            if not filename.endswith(".txt"):
                continue

            file_path = os.path.join(self.manuals_dir, filename)
            gun_type = filename.replace(".txt", "")

            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Split document by markdown headers (## or ###)
            # We want to capture the header name and the content under it
            sections = re.split(r'\n(##+\s+)', content)
            
            # The first section is the header/intro before any ##
            if sections:
                intro = sections[0].strip()
                if intro:
                    loaded_chunks.append(Document(
                        page_content=intro,
                        metadata={"gun_type": gun_type, "section": "Overview", "source": filename}
                    ))

            # Parse remaining sections
            for i in range(1, len(sections), 2):
                header_marker = sections[i]
                section_data = sections[i+1] if i+1 < len(sections) else ""
                
                # Extract section title from the first line
                lines = section_data.split("\n")
                title = lines[0].strip()
                body = "\n".join(lines[1:]).strip()

                if body:
                    full_content = f"{title}\n{body}"
                    loaded_chunks.append(Document(
                        page_content=full_content,
                        metadata={
                            "gun_type": gun_type,
                            "section": title,
                            "source": filename
                        }
                    ))

        return loaded_chunks

    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun = None
    ) -> List[Document]:
        # Simple local search scoring
        query_lower = query.lower()

        # Try to infer gun type filter from query
        gun_type_filter = None
        for gtype in ["rifle", "sniper", "shotgun", "machine_gun", "gatling_gun"]:
            # Normalize query matches
            normalized_gtype = gtype.replace("_", " ")
            if normalized_gtype in query_lower or gtype in query_lower:
                gun_type_filter = gtype
                break

        scored_docs = []
        for doc in self.chunks:
            # If we identified a specific gun type filter, restrict search to it
            if gun_type_filter and doc.metadata.get("gun_type") != gun_type_filter:
                continue

            # Calculate keyword overlap score
            score = 0
            doc_content_lower = doc.page_content.lower()
            
            # Check for direct phrase matches
            words = re.findall(r'\w+', query_lower)
            for word in words:
                if len(word) > 2: # Skip small stop words
                    # Standard term match
                    occurrences = doc_content_lower.count(word)
                    score += occurrences

            # Boost if the section title is directly mentioned in the query
            section_title = doc.metadata.get("section", "").lower()
            for word in words:
                if len(word) > 2 and word in section_title:
                    score += 5

            if score > 0:
                scored_docs.append((doc, score))

        # Sort by score descending
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        
        # Return top documents
        return [doc for doc, score in scored_docs[:5]]

# Helper for testing the retriever
if __name__ == "__main__":
    retriever = LocalWeaponRetriever(manuals_dir="../database/manuals")
    print(f"Loaded {len(retriever.chunks)} document chunks.")
    results = retriever.invoke("What are the barrel options for a sniper?")
    for i, r in enumerate(results):
        print(f"\nResult {i+1} (Source: {r.metadata['source']}, Section: {r.metadata['section']}):")
        print(r.page_content[:200] + "...")
