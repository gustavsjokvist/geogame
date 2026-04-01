import pandas as pd
import requests
from bs4 import BeautifulSoup
import json
import re
from time import sleep

def sanitize_category_name(name):
    return (
        name.lower()
        .replace("list of countries by", "")
        .replace("list of", "")
        .replace(" per capita", "")
        .replace(" ", "_")
        .replace("(", "")
        .replace(")", "")
        .replace("/", "_")
        .replace("–", "-")
        .replace("__", "_")
        .strip("_")
    )

def clean_country_name(name):
    return re.sub(r"\[.*?\]", "", name).strip()

def extract_best_table(tables):
    for df in tables:
        if df.shape[1] < 2 or df.shape[0] < 10:
            continue  # too small or irrelevant

        df = df.iloc[:, :2]  # use first 2 columns
        df.columns = ["Country", "Value"]

        df["Country"] = df["Country"].astype(str).apply(clean_country_name)
        df["Value"] = (
            df["Value"]
            .astype(str)
            .str.replace(",", "")
            .str.extract(r"([\d\.]+)", expand=False)
        )

        df = df.dropna()
        try:
            df["Value"] = df["Value"].astype(float)
            return df
        except ValueError:
            continue
    return None

# Load links
with open("ranking_links.txt", "r", encoding="utf-8") as f:
    lines = [line.strip().split("\t") for line in f if "\t" in line]

rankings_data = {}
failures = []

for i, (title, url) in enumerate(lines):
    print(f"[{i+1}/{len(lines)}] Scraping: {title}")
    try:
        response = requests.get(url, timeout=15)
        soup = BeautifulSoup(response.text, "html.parser")
        tables = pd.read_html(str(soup))

        best_table = extract_best_table(tables)
        if best_table is None:
            print(f"❌ No suitable table found in: {title}")
            failures.append((title, url))
            continue

        category = sanitize_category_name(title)
        rankings_data[category] = dict(zip(best_table["Country"], best_table["Value"]))
        print(f"✅ {category} — {len(best_table)} entries")

        sleep(0.5)  # polite scraping
    except Exception as e:
        print(f"❌ Error scraping {title}: {e}")
        failures.append((title, url))

# Save result
with open("all_rankings.json", "w", encoding="utf-8") as f:
    json.dump(rankings_data, f, indent=2, ensure_ascii=False)

# Optional: save failed links
with open("failed_rankings.txt", "w", encoding="utf-8") as f:
    for title, url in failures:
        f.write(f"{title}\t{url}\n")

print(f"\n✅ Done. Saved {len(rankings_data)} categories.")
if failures:
    print(f"⚠️ {len(failures)} pages failed — see failed_rankings.txt")
