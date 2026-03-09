import os
from openai import OpenAI  # Updated import for v1.x
from dotenv import load_dotenv
# Import the objects from your first script
from aggregation import supabase, texts, kmeans, client

# Load your API Key safely
load_dotenv()


def generate_summary_and_write():
    for cluster_num in range(15):
        # 1. Filter messages belonging to this cluster
        # Using numpy logic since kmeans.labels_ is an array
        cluster_samples = [texts[i] for i, label in enumerate(kmeans.labels_) if label == cluster_num]
        sample_size = len(cluster_samples)

        if sample_size == 0:
            continue

        # 2. Ask AI to name this group (Updated for OpenAI v1.x)
        prompt = f"Identify the common theme in these pilot reports in 3-5 words: {cluster_samples[:5]}"

        response = client.chat.completions.create(
            model="gpt-4o-mini",  # or "gpt-3.5-turbo"
            messages=[{"role": "user", "content": prompt}]
        )
        topic_name = response.choices[0].message.content.strip()

        # 3. Write to query_analysis table
        data = {
            "cluster_id": cluster_num,
            "topic_label": topic_name,
            "summary_text": f"Cluster contains {sample_size} reports regarding {topic_name}",
            "total_count": sample_size
        }

        supabase.table("query_analysis").insert(data).execute()
        print(f"✅ Saved Cluster {cluster_num}: {topic_name}")


if __name__ == "__main__":
    generate_summary_and_write()

