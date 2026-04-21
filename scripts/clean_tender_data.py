import pandas as pd
import os

def clean_tender_data():
    # Define paths based on your current project structure
    input_path = os.path.join('backend', 'knowledge_base', 'Tender data.xlsm')
    output_path = os.path.join('backend', 'knowledge_base', 'Cleaned_Tender_Data.xlsx')
    
    # Check if file exists
    if not os.path.exists(input_path):
        print(f"Error: Could not find file at {input_path}")
        return

    # Load the data
    print("Loading data... this may take a moment.")
    df = pd.read_excel(input_path, engine='openpyxl')
    
    # Safely standardize ALL existing column names to snake_case dynamically
    df.columns = (df.columns
                  .str.strip()
                  .str.lower()
                  .str.replace(' ', '_', regex=False)
                  .str.replace('.', '', regex=False)
                  .str.replace('\n', '', regex=False))
    
    # Verify the necessary columns exist after renaming
    if 'received_date' not in df.columns or 'tender_no' not in df.columns:
        print("Error: Could not find 'received_date' or 'tender_no'.")
        print("Available columns are:", df.columns.tolist())
        return

    # 1. Normalize dates (The .dt.date removes the time completely)
    df['received_date'] = pd.to_datetime(df['received_date'], errors='coerce')
    
    # Sort by date BEFORE stripping the time (if any existed) to ensure perfect sorting
    df = df.sort_values(by='received_date', ascending=True)
    
    # Now strip the time, leaving ONLY the date
    df['received_date'] = df['received_date'].dt.date
    
    # Do the same for due_date if it exists
    if 'due_date' in df.columns:
        df['due_date'] = pd.to_datetime(df['due_date'], errors='coerce').dt.date
    
    # 2. Normalize Tender No (Strip whitespace and convert to Uppercase)
    df['tender_no'] = df['tender_no'].astype(str).str.strip().str.upper()
    
    # 3. Deduplicate (Keep the latest entry for each tender_no)
    initial_count = len(df)
    df = df.drop_duplicates(subset=['tender_no'], keep='last')
    final_count = len(df)
    
    # 4. Save cleaned file
    df.to_excel(output_path, index=False)
    
    print(f"\n--- Cleanup Complete ---")
    print(f"Processed file from: {input_path}")
    print(f"Time removed from dates successfully.")
    print(f"Rows removed (duplicates): {initial_count - final_count}")
    print(f"Unique tenders remaining: {final_count}")
    print(f"Cleaned data saved to: {output_path}")

if __name__ == "__main__":
    clean_tender_data()