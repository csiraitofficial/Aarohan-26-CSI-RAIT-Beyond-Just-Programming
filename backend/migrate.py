"""Database migration: Add enhanced symptom fields and conversation tracking."""
import sqlite3

def migrate():
    conn = sqlite3.connect("swasthya_saathi.db")
    c = conn.cursor()

    # Get existing columns
    c.execute("PRAGMA table_info(symptom_logs)")
    sl_cols = [row[1] for row in c.fetchall()]

    c.execute("PRAGMA table_info(consultation_sessions)")
    cs_cols = [row[1] for row in c.fetchall()]

    # Add new columns to symptom_logs
    new_sl_cols = [
        ("symptom_category", "VARCHAR(50)"),
        ("quality", "VARCHAR(100)"),
        ("onset_type", "VARCHAR(50)"),
        ("timing_pattern", "VARCHAR(100)"),
        ("aggravating_factors", "TEXT"),
        ("relieving_factors", "TEXT"),
        ("radiation", "VARCHAR(200)"),
        ("associated_symptoms", "TEXT"),
        ("previous_occurrences", "VARCHAR(200)"),
        ("functional_impact", "VARCHAR(200)"),
        ("triggers", "TEXT"),
    ]
    for col_name, col_type in new_sl_cols:
        if col_name not in sl_cols:
            c.execute(f"ALTER TABLE symptom_logs ADD COLUMN {col_name} {col_type}")
            print(f"  Added symptom_logs.{col_name}")

    # Add new columns to consultation_sessions
    new_cs_cols = [
        ("conversation_state", "VARCHAR(30)"),
        ("conversation_context", "TEXT"),
    ]
    for col_name, col_type in new_cs_cols:
        if col_name not in cs_cols:
            c.execute(f"ALTER TABLE consultation_sessions ADD COLUMN {col_name} {col_type}")
            print(f"  Added consultation_sessions.{col_name}")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
