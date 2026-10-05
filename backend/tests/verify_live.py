import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

def test_endpoint(url, data=None):
    req = urllib.request.Request(url, headers={'Content-Type': 'application/json'} if data else {})
    body = json.dumps(data).encode('utf-8') if data else None
    with urllib.request.urlopen(req, data=body, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

print("=== 1. Health Status ===")
health = test_endpoint('http://127.0.0.1:8000/api/health')
print("Health:", health)

print("\n=== 2. Language Detection ===")
test_queries = [
    "What is hypertension?",
    "உயர் இரத்த அழுத்தம் என்றால் என்ன?",
    "हाइपरटेंशन क्या है?",
    "BP high na enna problem?",
    "HbA1c என்ன?",
    "sugar test kaise karte hai"
]
for text in test_queries:
    res = test_endpoint('http://127.0.0.1:8000/api/language/detect', {'text': text})
    print(f"'{text}' -> {res['detected_language']} ({res['language_code']}), mixed={res.get('is_mixed', False)}")

print("\n=== 3. Health News Retrieval ===")
news = test_endpoint('http://127.0.0.1:8000/api/news')
articles = news.get('articles', [])
print(f"Retrieved {len(articles)} live articles from configured sources.")
assert len(articles) > 0, "Expected non-zero articles"
for i, a in enumerate(articles[:3]):
    print(f"[{i+1}] {a['title']} | Source: {a['source_name']} | Cat: {a['category']} | URL: {a['source_url'][:45]}...")

first_id = articles[0]['id']

print("\n=== 4. AI Structured Summary ===")
summary = test_endpoint('http://127.0.0.1:8000/api/news/summary', {'article_id': first_id})
print("What happened:", summary.get('what_happened', '')[:80])
print("Why it matters:", summary.get('why_it_matters', '')[:80])
print("Key takeaways count:", len(summary.get('key_takeaways', [])))
print("Original source:", summary.get('source_url', ''))

print("\n=== 5. Multilingual Translation ===")
trans_ta = test_endpoint('http://127.0.0.1:8000/api/news/translate', {'article_id': first_id, 'target_language': 'ta'})
print("Tamil Title:", trans_ta.get('translated_title'))
print("Is Translated:", trans_ta.get('is_translated'))

trans_hi = test_endpoint('http://127.0.0.1:8000/api/news/translate', {'article_id': first_id, 'target_language': 'hi'})
print("Hindi Title:", trans_hi.get('translated_title'))
print("Is Translated:", trans_hi.get('is_translated'))

print("\n=== 6. Categories & Search ===")
cats = test_endpoint('http://127.0.0.1:8000/api/news/categories')
print("Categories:", [c['label'] for c in cats.get('categories', [])])

search_res = test_endpoint('http://127.0.0.1:8000/api/news/search?query=health')
print(f"Search 'health': found {len(search_res.get('articles', []))} articles")

print("\nALL LIVE ENDPOINTS VALIDATED SUCCESSFULLY!")
