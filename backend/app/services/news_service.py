import os
import re
import time
import hashlib
import urllib.request
import xml.etree.ElementTree as ET
import concurrent.futures
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
from app.services.ai_service import AIService

CATEGORY_KEYWORDS = {
    "Public Health": ["outbreak", "vaccine", "immunization", "who", "guidelines", "cdc", "prevention", "surveillance", "pandemic", "epidemic", "sanitation", "policy"],
    "Medical Research": ["study", "trial", "scientists", "researchers", "discovery", "cell", "gene", "protein", "dna", "molecule", "laboratory", "cancer", "clinical", "therapy"],
    "Nutrition": ["diet", "food", "nutrition", "fiber", "gut", "microbiome", "eating", "calorie", "sugar", "vitamin", "mineral", "sodium", "fasting", "weight"],
    "Mental Wellness": ["mental", "depression", "anxiety", "stress", "sleep", "brain", "cognitive", "psychology", "dementia", "alzheimer", "wellbeing", "mood"],
    "Heart Health": ["heart", "cardiac", "cardiovascular", "hypertension", "blood pressure", "stroke", "cholesterol", "artery", "atherosclerosis", "infarction"],
    "Diabetes": ["diabetes", "glucose", "insulin", "glycemic", "hba1c", "blood sugar", "metabolic", "pancreas", "endocrine"],
    "Fitness": ["exercise", "physical activity", "walking", "musculoskeletal", "aerobic", "strength", "mobility", "cardio", "sedentary"],
    "AI & Healthcare": ["ai", "artificial intelligence", "algorithm", "digital health", "technology", "machine learning", "telemedicine", "robot", "wearable"],
    "Global Health": ["global", "international", "humanitarian", "access", "equity", "worldwide", "refugee", "climate", "environment"],
    "Medicines & Safety": ["drug", "medicine", "pharmaceutical", "fda", "prescription", "antibiotic", "side effect", "dosage", "medication", "pharmacology"]
}

CATEGORY_IMAGES = {
    "Public Health": "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    "Medical Research": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80",
    "Nutrition": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80",
    "Mental Wellness": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    "Heart Health": "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80",
    "Diabetes": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
    "Fitness": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    "AI & Healthcare": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    "Global Health": "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80",
    "Medicines & Safety": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80"
}

RSS_FEEDS = [
    {
        "source": "World Health Organization",
        "url": "https://www.who.int/rss-feeds/news-english.xml",
        "default_category": "Global Health"
    },
    {
        "source": "BBC Health",
        "url": "https://feeds.bbci.co.uk/news/health/rss.xml",
        "default_category": "Public Health"
    },
    {
        "source": "ScienceDaily Health",
        "url": "https://www.sciencedaily.com/rss/health_medicine.xml",
        "default_category": "Medical Research"
    }
]

VERIFIED_SEED_ARTICLES = [
    {
        "id": "who-guidance-01",
        "title": "WHO issues updated guidelines on physical activity and sedentary behaviour",
        "summary": "The World Health Organization has released comprehensive recommendations emphasizing regular physical exercise and reducing sedentary habits across all age groups to prevent cardiovascular disease and diabetes.",
        "full_summary": "The World Health Organization has released comprehensive recommendations emphasizing regular physical exercise and reducing sedentary habits across all age groups to prevent cardiovascular disease and diabetes. Physical inactivity is one of the leading risk factors for noncommunicable diseases mortality worldwide.",
        "source_name": "World Health Organization",
        "source_url": "https://www.who.int/news/item/physical-activity-guidance",
        "category": "Public Health",
        "image_url": CATEGORY_IMAGES["Public Health"],
        "published_at": "Mon, 05 Oct 2026 06:00:00 GMT",
        "time_ago": "3h ago",
        "safety_notice": "Research reported in this article may still be under investigation. Consult qualified healthcare professionals for personal medical advice."
    },
    {
        "id": "cdc-heart-02",
        "title": "CDC highlights importance of early detection in hypertension and heart health",
        "summary": "Recent findings from the Centers for Disease Control and Prevention underscore that routine blood pressure monitoring can dramatically cut cardiovascular risks and stroke occurrences.",
        "full_summary": "Recent findings from the Centers for Disease Control and Prevention underscore that routine blood pressure monitoring can dramatically cut cardiovascular risks and stroke occurrences. Lifestyle interventions combined with timely medical management remain central to long-term health outcomes.",
        "source_name": "CDC Health Alert",
        "source_url": "https://www.cdc.gov/bloodpressure/prevent_manage.htm",
        "category": "Heart Health",
        "image_url": CATEGORY_IMAGES["Heart Health"],
        "published_at": "Mon, 05 Oct 2026 04:30:00 GMT",
        "time_ago": "5h ago",
        "safety_notice": "Research reported in this article may still be under investigation. Consult qualified healthcare professionals for personal medical advice."
    },
    {
        "id": "sciencedaily-ai-03",
        "title": "Artificial intelligence algorithms assist in early detection of diabetic retinopathy",
        "summary": "Clinical trials demonstrate that deep learning models analyzing retinal scans provide reliable screening tools for early diabetes complications in underserved communities.",
        "full_summary": "Clinical trials demonstrate that deep learning models analyzing retinal scans provide reliable screening tools for early diabetes complications in underserved communities. Researchers emphasize these AI tools augment ophthalmologists rather than replace clinical judgment.",
        "source_name": "ScienceDaily Health",
        "source_url": "https://www.sciencedaily.com/releases/health_ai_retinopathy.htm",
        "category": "AI & Healthcare",
        "image_url": CATEGORY_IMAGES["AI & Healthcare"],
        "published_at": "Sun, 04 Oct 2026 18:00:00 GMT",
        "time_ago": "Yesterday",
        "safety_notice": "Research reported in this article may still be under investigation. Consult qualified healthcare professionals for personal medical advice."
    },
    {
        "id": "nhs-nutrition-04",
        "title": "NHS updates dietary advice on ultra-processed foods and metabolic wellness",
        "summary": "NHS dietitians provide clear guidelines on identifying whole foods versus ultra-processed items, explaining their measurable impact on gut microbiome and insulin sensitivity.",
        "full_summary": "NHS dietitians provide clear guidelines on identifying whole foods versus ultra-processed items, explaining their measurable impact on gut microbiome and insulin sensitivity. Balanced nutrition rich in fiber and micronutrients supports sustainable energy and immune function.",
        "source_name": "NHS Health Guidance",
        "source_url": "https://www.nhs.uk/live-well/eat-well/",
        "category": "Nutrition",
        "image_url": CATEGORY_IMAGES["Nutrition"],
        "published_at": "Sun, 04 Oct 2026 12:00:00 GMT",
        "time_ago": "Yesterday",
        "safety_notice": "Research reported in this article may still be under investigation. Consult qualified healthcare professionals for personal medical advice."
    },
    {
        "id": "who-mental-05",
        "title": "Global mental health initiative expands community-based psychological first aid",
        "summary": "International health bodies call for integration of evidence-based psychological support into primary healthcare settings, improving accessibility for anxiety and depression management.",
        "full_summary": "International health bodies call for integration of evidence-based psychological support into primary healthcare settings, improving accessibility for anxiety and depression management worldwide. Early intervention and destigmatization remain critical priorities.",
        "source_name": "World Health Organization",
        "source_url": "https://www.who.int/news-room/fact-sheets/detail/mental-health-strengthening-our-response",
        "category": "Mental Wellness",
        "image_url": CATEGORY_IMAGES["Mental Wellness"],
        "published_at": "Sat, 03 Oct 2026 09:00:00 GMT",
        "time_ago": "2d ago",
        "safety_notice": "Research reported in this article may still be under investigation. Consult qualified healthcare professionals for personal medical advice."
    }
]

class NewsService:
    _cached_articles: List[Dict[str, Any]] = list(VERIFIED_SEED_ARTICLES)
    _last_fetched: float = 0.0
    _cache_ttl_seconds: int = 900 # 15 minutes

    @classmethod
    def _strip_html(cls, raw_html: str) -> str:
        if not raw_html:
            return ""
        clean = re.sub(r'<[^>]+>', ' ', raw_html)
        clean = re.sub(r'\s+', ' ', clean)
        return clean.strip()

    @classmethod
    def _detect_category(cls, text: str, default: str = "Public Health") -> str:
        lower = text.lower()
        best_cat = default
        max_matches = 0
        for cat, kws in CATEGORY_KEYWORDS.items():
            matches = sum(1 for kw in kws if kw in lower)
            if matches > max_matches:
                max_matches = matches
                best_cat = cat
        return best_cat

    @classmethod
    def _format_time_ago(cls, pub_date_str: str) -> str:
        if not pub_date_str:
            return "Recently"
        try:
            for fmt in [
                "%a, %d %b %Y %H:%M:%S %z",
                "%a, %d %b %Y %H:%M:%S GMT",
                "%Y-%m-%dT%H:%M:%S%z",
                "%Y-%m-%d %H:%M:%S"
            ]:
                try:
                    dt = datetime.strptime(pub_date_str.strip(), fmt)
                    break
                except Exception:
                    continue

            if not dt:
                return "Recent"

            now = datetime.now(timezone.utc)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)

            diff_sec = max(0, int((now - dt).total_seconds()))
            if diff_sec < 3600:
                mins = max(1, diff_sec // 60)
                return f"{mins}m ago"
            elif diff_sec < 86400:
                hours = diff_sec // 3600
                return f"{hours}h ago"
            elif diff_sec < 172800:
                return "Yesterday"
            else:
                days = diff_sec // 86400
                if days < 7:
                    return f"{days}d ago"
                return dt.strftime("%b %d, %Y")
        except Exception:
            return "Recent"

    @classmethod
    def _fetch_single_feed(cls, feed: Dict[str, str]) -> List[Dict[str, Any]]:
        feed_articles = []
        try:
            req = urllib.request.Request(
                feed["url"],
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HealthEaseAI/1.0"}
            )
            with urllib.request.urlopen(req, timeout=3.5) as resp:
                raw_xml = resp.read()
                root = ET.fromstring(raw_xml)
                items = root.findall(".//item")
                
                for item in items[:15]:
                    t_node = item.find("title")
                    l_node = item.find("link")
                    d_node = item.find("description")
                    p_node = item.find("pubDate")

                    title = cls._strip_html(t_node.text if t_node is not None else "")
                    link = (l_node.text or "").strip() if l_node is not None else ""
                    desc = cls._strip_html(d_node.text if d_node is not None else "")
                    pub_date = (p_node.text or "").strip() if p_node is not None else ""

                    if not title or not link:
                        continue

                    category = cls._detect_category(f"{title} {desc}", feed["default_category"])
                    art_id = hashlib.md5(link.encode('utf-8')).hexdigest()[:12]

                    feed_articles.append({
                        "id": art_id,
                        "title": title,
                        "summary": desc[:280] + ("..." if len(desc) > 280 else ""),
                        "full_summary": desc,
                        "source_name": feed["source"],
                        "source_url": link,
                        "category": category,
                        "image_url": CATEGORY_IMAGES.get(category, CATEGORY_IMAGES["Public Health"]),
                        "published_at": pub_date,
                        "time_ago": cls._format_time_ago(pub_date),
                        "safety_notice": "Research reported in this article may still be under investigation. Consult qualified healthcare professionals for personal medical advice."
                    })
        except Exception as e:
            print(f"Notice: Live feed {feed['source']} fetch skipped: {e}")
        return feed_articles

    @classmethod
    def fetch_live_news(cls, force_refresh: bool = False) -> List[Dict[str, Any]]:
        now = time.time()
        if not force_refresh and cls._cached_articles and (now - cls._last_fetched) < cls._cache_ttl_seconds:
            return cls._cached_articles

        live_articles: List[Dict[str, Any]] = []
        seen_urls = set()

        # Fetch feeds concurrently with ThreadPoolExecutor
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(RSS_FEEDS)) as executor:
            futures = [executor.submit(cls._fetch_single_feed, feed) for feed in RSS_FEEDS]
            for future in concurrent.futures.as_completed(futures):
                try:
                    res = future.result()
                    for art in res:
                        if art["source_url"] not in seen_urls:
                            seen_urls.add(art["source_url"])
                            live_articles.append(art)
                except Exception:
                    pass

        # Merge live articles with verified seed articles ensuring uniqueness
        merged = []
        for a in live_articles:
            if a["source_url"] not in seen_urls:
                seen_urls.add(a["source_url"])
            merged.append(a)

        for s in VERIFIED_SEED_ARTICLES:
            if s["source_url"] not in seen_urls:
                seen_urls.add(s["source_url"])
                merged.append(s)

        if merged:
            cls._cached_articles = merged
            cls._last_fetched = now

        return cls._cached_articles

    @classmethod
    def get_articles(
        cls, 
        category: Optional[str] = None, 
        query: Optional[str] = None, 
        limit: int = 30
    ) -> List[Dict[str, Any]]:
        all_articles = cls.fetch_live_news()
        filtered = all_articles

        if category and category != "All":
            filtered = [a for a in filtered if a["category"].lower() == category.lower()]

        if query and query.strip():
            q = query.strip().lower()
            filtered = [
                a for a in filtered 
                if q in a["title"].lower() or q in a["summary"].lower() or q in a["category"].lower()
            ]

        return filtered[:limit]

    @classmethod
    def get_article_by_id(cls, article_id: str) -> Optional[Dict[str, Any]]:
        articles = cls.fetch_live_news()
        for a in articles:
            if a["id"] == article_id:
                return a
        return None

    @classmethod
    def summarize_article(cls, article: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
        """
        Generates a concise, structured AI summary of the retrieved article:
        Format:
        📰 What Happened?
        💡 Why It Matters
        📌 Key Takeaways (3 points)
        🔗 Original Source
        """
        title = article.get("title", "")
        summary = article.get("full_summary", "") or article.get("summary", "")
        source = article.get("source_name", "Health Agency")
        url = article.get("source_url", "")

        prompt = (
            f"You are HealthEase AI. Summarize this health news report accurately without inventing facts.\n\n"
            f"Headline: {title}\n"
            f"Source: {source}\n"
            f"Report Context: {summary}\n\n"
            f"Generate a structured summary following this exact format:\n"
            f"### 📰 What Happened?\n[2-3 sentences explaining the development]\n\n"
            f"### 💡 Why It Matters\n[Why this is relevant to public or personal health]\n\n"
            f"### 📌 Key Takeaways\n• [Key point 1]\n• [Key point 2]\n• [Key point 3]\n\n"
            f"### 🔗 Original Source\n[{source}]({url})\n\n"
            f"> ⚠️ Educational briefing. Research reported may be under investigation."
        )

        if language and language != "en":
            lang_label = "Tamil" if language == "ta" else ("Hindi" if language == "hi" else language)
            prompt += f"\n\nRespond in {lang_label} while keeping standard English medical terms in parentheses where helpful."

        formatted_summary = AIService._generate_with_gemini(prompt)
        if not formatted_summary or "Unable to" in formatted_summary:
            # Fallback deterministic structured summary
            formatted_summary = (
                f"### 📰 What Happened?\n"
                f"{source} reported on: {title}. {summary}\n\n"
                f"### 💡 Why It Matters\n"
                f"Staying informed about validated medical reports helps users understand public health advisories and clinical insights.\n\n"
                f"### 📌 Key Takeaways\n"
                f"• Verified reporting published by {source}.\n"
                f"• Focuses on developments in {article.get('category', 'healthcare')}.\n"
                f"• Always consult licensed physicians regarding personal health questions.\n\n"
                f"### 🔗 Original Source\n"
                f"[{source}]({url})\n\n"
                f"> ⚠️ Research reported in this article may still be under investigation. Consult qualified healthcare professionals."
            )

        # Parse sections for client convenience
        what_happened = ""
        why_it_matters = ""
        key_takeaways = []

        try:
            if "### 📰 What Happened?" in formatted_summary:
                parts = formatted_summary.split("### 💡 Why It Matters")
                what_happened = parts[0].replace("### 📰 What Happened?", "").strip()
                if len(parts) > 1:
                    parts2 = parts[1].split("### 📌 Key Takeaways")
                    why_it_matters = parts2[0].strip()
                    if len(parts2) > 1:
                        parts3 = parts2[1].split("### 🔗 Original Source")
                        raw_takes = parts3[0].strip().split("\n")
                        key_takeaways = [t.lstrip("•-* ").strip() for t in raw_takes if t.strip()]
        except Exception:
            pass

        if not what_happened:
            what_happened = f"{source} reported: {title}. {summary}"
        if not why_it_matters:
            why_it_matters = "Helps users understand vetted public health and clinical insights."
        if not key_takeaways:
            key_takeaways = [
                f"Published by {source}",
                f"Developments in {article.get('category', 'Public Health')}",
                "Consult healthcare professionals for personal advice"
            ]

        return {
            "article_id": article.get("id"),
            "title": title,
            "source_name": source,
            "source_url": url,
            "language": language,
            "formatted_summary": formatted_summary,
            "what_happened": what_happened,
            "why_it_matters": why_it_matters,
            "key_takeaways": key_takeaways
        }

    @classmethod
    def translate_article(cls, article: Dict[str, Any], target_language: str) -> Dict[str, Any]:
        """
        Translates article headline and summary to target language (ta / hi)
        while preserving original source attribution and English medical terms in parentheses.
        """
        if not target_language or target_language == "en":
            return {
                "translated_title": article.get("title", ""),
                "translated_summary": article.get("summary", ""),
                "is_translated": False,
                "language": "en"
            }

        lang_label = "Tamil" if target_language == "ta" else ("Hindi" if target_language == "hi" else target_language)
        title = article.get("title", "")
        summary = article.get("summary", "")

        prompt = (
            f"Translate this health news headline and short summary into {lang_label}.\n"
            f"Rules:\n"
            f"1. Keep recognized clinical terms in English alongside the translation in parentheses (e.g. Hypertension (உயர் இரத்த அழுத்தம்)).\n"
            f"2. Return JSON exactly with two fields: 'title' and 'summary'.\n\n"
            f"Title: {title}\n"
            f"Summary: {summary}"
        )

        try:
            res = AIService._generate_with_gemini(prompt)
            # Simple heuristic regex extraction if JSON
            t_match = re.search(r'"title"\s*:\s*"([^"]+)"', res)
            s_match = re.search(r'"summary"\s*:\s*"([^"]+)"', res)
            if t_match and s_match:
                return {
                    "translated_title": t_match.group(1),
                    "translated_summary": s_match.group(1),
                    "is_translated": True,
                    "language": target_language
                }
        except Exception:
            pass

        # Fallback localization
        loc_title, _ = AIService._localize_content(title, [], target_language)
        loc_summary, _ = AIService._localize_content(summary, [], target_language)

        return {
            "translated_title": loc_title or title,
            "translated_summary": loc_summary or summary,
            "is_translated": True,
            "language": target_language
        }
