import os
from openai import OpenAI
from sklearn.cluster import KMeans
import numpy as np
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path


# 1. Setup & Environment
# This code calculates the exact path to the .env file in the current folder
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Verification prints
print(f"DEBUG: Looking for .env at: {env_path}")
print(f"DEBUG: SUPABASE_URL found: {os.getenv('SUPABASE_URL')}")

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def get_embeddings(text_list):
    response = client.embeddings.create(
        input=text_list,
        model="text-embedding-3-small"
    )
    return [data.embedding for data in response.data]


# --- THE LOGIC ---
# We define these globally so Script B can import them
messages = supabase.table("clean_message").select("id, cleanedText").execute()
texts = [msg['cleanedText'] for msg in messages.data]

# 2. Clustering Logic
# We convert text to math, then group into 15 "topic buckets"
vectors = np.array(get_embeddings(texts))
kmeans = KMeans(n_clusters=15, random_state=42).fit(vectors)

# --- THE SAFETY GATE ---
if __name__ == "__main__":
    # This part ONLY runs if you play THIS script directly.
    # It won't run when you import 'texts' or 'kmeans' into Script B.
    print(f"Successfully clustered {len(texts)} messages into 15 groups.")
    for i, label in enumerate(kmeans.labels_[:5]):
        print(f"Message: {texts[i][:30]}... -> Cluster: {label}")

