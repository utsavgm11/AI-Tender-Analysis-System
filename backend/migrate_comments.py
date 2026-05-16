import json
import asyncio
import psycopg2
from psycopg2.extras import RealDictCursor
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import List, Optional
import time

# --- DATABASE CONNECTION ---
NEON_URL = "postgresql://neondb_owner:npg_djW0Dm5HAPOa@ep-twilight-block-apopzllz-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"

# --- INITIALIZE GEMINI CLIENT ---
client = genai.Client(api_key="AIzaSyBHUWEODtXhvI93hO9HfPyHvkWSxVhigT4")
TARGET_MODEL = "gemini-2.5-flash"

# --- CONCURRENCY SAFETY VALVE ---
# Limits active API connections to exactly 10 at once. This avoids overwhelming
# your network pipe while remaining immensely faster than a single-threaded loop.
CONCURRENCY_SEMAPHORE = asyncio.Semaphore(10)

# --- PYDANTIC SCHEMAS FOR STRUCTURED OUTPUT ---
class CompetitorRow(BaseModel):
    rank: str = Field(description="The rank identifier, strictly matching: L1, L2, L3, L4, or L5")
    company: str = Field(description="The name of the competitor company. Use 'Aarvi Encon' if the text says 'we' or 'us'")
    amount: Optional[float] = Field(default=0.0, description="The bid price amount if mentioned, else 0.0")
    percent_diff: Optional[float] = Field(default=0.0, description="The percentage variance/gap relative to L1 if mentioned or calculated, else 0.0")

class LeaderboardPayload(BaseModel):
    competitors: List[CompetitorRow] = Field(description="The extracted leaderboard array. Capture every single rank mentioned from L1 up to L5.")

def get_db_connection():
    return psycopg2.connect(NEON_URL, cursor_factory=RealDictCursor)

async def parse_comments_async(comment_text: str, quoted_value: float, record_num: int, total: int):
    """
    Executes the Gemini API request inside a non-blocking asynchronous worker thread.
    Includes smart retry backoffs if rate limits ever surface.
    """
    prompt = f"""
    Analyze the following free-form internal notes written about a LOST tender.
    Your mission is to meticulously extract the competitive bidding leaderboard data.
    
    CRITICAL INPUT DATA:
    - Notes Content: "{comment_text}"
    - Aarvi Encon's Internal Quoted Price: {quoted_value or 'Not Specified'}

    EXTRACTION MANDATE:
    1. Look for all mentioned positions from L1, L2, L3, L4, down to L5. You must capture ALL 5 ranks if they are present or can be deduced from the text.
    2. Identify the absolute winner (L1) and their price/value if mentioned.
    3. If the writer uses terms like 'we', 'us', or 'our price', map that data explicitly to 'Aarvi Encon'.
    4. If an overall percentage drop or margin loss is explicitly noted (e.g., 'we lost by 3.8%'), map that to Aarvi Encon's percent_diff entry.
    5. Be thorough. If the text lists a full spectrum of data across all 5 ranks, do not drop or skip any entry. Ensure all of them are parsed cleanly.
    """

    async with CONCURRENCY_SEMAPHORE:
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Dispatches the blocking SDK call to an optimized background worker pool
                loop = asyncio.get_running_loop()
                response = await loop.run_in_executor(
                    None, 
                    lambda: client.models.generate_content(
                        model=TARGET_MODEL,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=LeaderboardPayload,
                            temperature=0.1
                        )
                    )
                )
                data_payload = json.loads(response.text.strip())
                return data_payload.get("competitors", [])
                
            except Exception as e:
                error_msg = str(e)
                if any(x in error_msg for x in ["429", "Quota", "ResourceExhausted"]):
                    wait_time = (attempt + 1) * 7
                    print(f"⚠️ [BATCH ALERT] Row {record_num} hit rate throttling limits. Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    print(f"❌ Row {record_num} parsing dropped due to an unexpected error: {error_msg}")
                    return None
        return None

async def process_single_row(row, current_index, total_records, conn):
    """
    Manages parsing coordination and transactional commits for an isolated row item.
    """
    tender_no = row['tender_no']
    comments = row['comments']
    quoted_val = row['quoted_value']
    client_name = row['name_of_client']
    
    # Run the AI extraction asynchronously
    full_leaderboard = await parse_comments_async(comments, quoted_val, current_index, total_records)
    
    if full_leaderboard:
        try:
            # Create a localized database context to process mutations without locking other threads
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE tenders
                    SET competitor_list = %s::jsonb
                    WHERE tender_no = %s
                """, (json.dumps(full_leaderboard), tender_no))
                conn.commit()
            print(f"✅ [{current_index}/{total_records}] Successfully updated tender: {tender_no} [{client_name}]")
            return True
        except Exception as db_err:
            print(f"❌ Database update failure on tender target {tender_no}: {db_err}")
            conn.rollback()
    return False

async def main():
    start_time = time.time()
    conn = get_db_connection()
    
    try:
        cur = conn.cursor()
        print(f"🔍 Initializing Parallel Scanning Layer using {TARGET_MODEL}...")
        cur.execute("""
            SELECT tender_no, comments, quoted_value, name_of_client
            FROM tenders 
            WHERE tender_status = 'Tender Lost' 
              AND comments IS NOT NULL 
              AND comments != ''
              AND (competitor_list IS NULL OR competitor_list::text = '[]')
        """)
        
        lost_tenders = cur.fetchall()
        total_records = len(lost_tenders)
        cur.close()
        
        print(f"📊 Hyper-Drive Queue Analyzer: Found {total_records} unmapped comments fields remaining.")
        if total_records == 0:
            print("🎉 No remaining records found to process! Migration is already complete.")
            return

        print("⚡ Orchestrating batch array allocations across async workers... Execution live!")
        
        # Assemble concurrent tasks list
        tasks = []
        for index, row in enumerate(lost_tenders):
            tasks.append(process_single_row(row, index + 1, total_records, conn))
            
        # Launch everything concurrently and await total cluster completion
        results = await asyncio.gather(*tasks)
        
        success_count = sum(1 for r in results if r)
        end_time = time.time()
        
        print(f"\n==================================================")
        print(f"🏁 HYPER-BATCH MIGRATION COMPLETED!")
        print(f"📊 Total Records Successfully Processed: {success_count} / {total_records} rows.")
        print(f"⏱️ Total Computational Run Clock: {round(end_time - start_time, 2)} seconds.")
        print(f"==================================================")

    except Exception as err:
        print(f"❌ Main Loop Runtime Interruption: {err}")
    finally:
        if conn: 
            conn.close()

if __name__ == "__main__":
    # Fire the async runtime engine
    asyncio.run(main())