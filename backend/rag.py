import os

import chromadb
from dotenv import load_dotenv
from openai import OpenAI
from sentence_transformers import SentenceTransformer

load_dotenv()

# =====================================================
# OPENROUTER
# =====================================================

client = OpenAI(
    base_url="https://openrouter.ai/api/v1", api_key=os.getenv("OPENROUTER_API_KEY")
)

# =====================================================
# EMBEDDING MODEL
# =====================================================

encoder = SentenceTransformer("BAAI/bge-small-en-v1.5")

# =====================================================
# CHROMADB
# =====================================================

chroma_client = chromadb.PersistentClient(path="./rap_chroma_db")

collection = chroma_client.get_collection("eminem_lyrics")

# =====================================================
# RETRIEVAL
# =====================================================


def retrieve_similar_lyrics(query, top_k=3):

    query_embedding = encoder.encode(query).tolist()

    results = collection.query(query_embeddings=[query_embedding], n_results=top_k)

    docs = results["documents"][0]

    return "\n\n".join(docs)


# =====================================================
# REWRITE
# =====================================================


def rewrite_lyrics(user_lyrics: str):

    context = retrieve_similar_lyrics(user_lyrics)

    context = context[:3000]

    prompt = f"""
You are an elite hip-hop ghostwriter.

STYLE:
- multisyllabic rhymes
- internal rhyme chains
- aggressive cadence
- layered wordplay
- emotional intensity
- technical lyrical complexity

REFERENCE LYRICS:
{context}

USER LYRICS:
{user_lyrics}

TASK:
Rewrite the lyrics into a more advanced rap verse.

Keep:
- same meaning
- same emotional tone

Improve:
- flow
- rhyme density
- cadence
- lyrical complexity

DO NOT copy reference lyrics directly.

OUTPUT ONLY THE REWRITTEN LYRICS.
"""

    completion = client.chat.completions.create(
        model="deepseek/deepseek-chat-v3-0324",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.95,
        max_tokens=300,
    )

    return completion.choices[0].message.content
