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

encoder = SentenceTransformer("BAAI/bge-large-en-v1.5")

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
You are an expert hip-hop lyricist. Your task is to subtly enhance the flow and rhythm of the user's lyrics while keeping the core content and structure almost identical.

CONSTRAINTS:
1. DO NOT over-change the lyrics. Keep them very close to the original.
2. Only adjust the flow and context matching a very tiny bit.
3. PRESERVE THE EXACT NUMBER OF LINES. If the user input has 4 lines, you MUST output exactly 4 lines.
4. DO NOT include any conversational filler, headers, footers, or markdown. No "Here is the rewritten version" or "Let me know if you need anything else".
5. OUTPUT ONLY THE PLAIN TEXT LYRICS.

REFERENCE CONTEXT (for minor flow inspiration):
{context}

USER LYRICS:
{user_lyrics}

REWRITTEN LYRICS:
"""

    completion = client.chat.completions.create(
        model="deepseek/deepseek-chat-v3-0324",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.95,
        max_tokens=300,
    )

    return completion.choices[0].message.content
