# backend/vector_service.py

import os
import json
import chromadb
from sentence_transformers import SentenceTransformer

# -----------------------------
# 1. SET BASE PATH (SAFE)
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "chroma")

# Ensure directory exists
os.makedirs(DB_PATH, exist_ok=True)

# -----------------------------
# 2. INIT DB + MODEL
# -----------------------------
client = chromadb.PersistentClient(path=DB_PATH)
collection = client.get_or_create_collection(name="aarvi_knowledge_base")

model = SentenceTransformer("all-MiniLM-L6-v2")


# -----------------------------
# 3. INDEX FUNCTION
# -----------------------------
def index_knowledge_base(folder_path=None):
    """Reads JSON files and stores embeddings in ChromaDB."""

    if folder_path is None:
        folder_path = os.path.join(BASE_DIR, "knowledge_base")

    if not os.path.exists(folder_path):
        return f"Folder not found: {folder_path}"

    count = 0

    for filename in os.listdir(folder_path):
        if filename.endswith(".json"):
            file_path = os.path.join(folder_path, filename)

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                # Better text extraction
                text = data.get("description") or data.get("content") or json.dumps(data)

                # Create embedding
                embedding = model.encode(text).tolist()

                # Unique ID (avoid duplicates)
                doc_id = filename.replace(".json", "")

                # Upsert instead of add (safe)
                collection.upsert(
                    ids=[doc_id],
                    embeddings=[embedding],
                    documents=[text],
                    metadatas=[{"source": filename}]
                )

                count += 1

            except Exception as e:
                print(f"Error indexing {filename}: {e}")

    return f"Indexed {count} documents."


# -----------------------------
# 4. SEARCH FUNCTION
# -----------------------------
def search_brain(query, n_results=3):
    """Search relevant past experience."""

    try:
        query_embedding = model.encode(query).tolist()

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results
        )

        documents = results.get("documents", [])

        if documents and len(documents[0]) > 0:
            return documents[0]

        return ["No relevant past experience found."]

    except Exception as e:
        print("Search error:", e)
        return ["Error retrieving data."]