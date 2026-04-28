from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
from passlib.context import CryptContext
from dotenv import load_dotenv
from datetime import datetime, timezone
import requests
import os

# ─── LOAD ENV ─────────────────────────────────────
load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")
RAPID_KEY = os.getenv("RAPIDAPI_KEY")
GROQ_KEY  = os.getenv("GROQ_API_KEY")

# ─── FASTAPI ──────────────────────────────────────
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ─── DATABASE ─────────────────────────────────────
mongo_client = MongoClient(MONGO_URI)
db    = mongo_client["ecobot"]
users = db["users"]
chats = db["chats"]

# ─── PASSWORD HASH ────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def hash_password(p):      return pwd_context.hash(p[:72])
def verify_password(p, h): return pwd_context.verify(p[:72], h)

# ─── SCHEMAS ──────────────────────────────────────
class Auth(BaseModel):
    email: str
    password: str

class ChatRequest(BaseModel):
    message: str
    userId: str
    sessionId: str | None = None  # New chat session ID

# ─── AUTH ─────────────────────────────────────────
@app.post("/signup")
def signup(data: Auth):
    if users.find_one({"email": data.email}):
        return {"error": "User already exists"}
    users.insert_one({"email": data.email, "password": hash_password(data.password)})
    return {"message": "Signup successful"}

@app.post("/login")
def login(data: Auth):
    user = users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        return {"error": "Invalid credentials"}
    return {"userId": str(user["_id"]), "message": "Login success"}

# ─── GROQ CALL ────────────────────────────────────
def call_groq(messages_list, temperature=0.3):
    url     = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {GROQ_KEY}", "Content-Type": "application/json"}
    payload = {
        "model":       "llama-3.1-8b-instant",
        "messages":    messages_list,
        "temperature": temperature,
    }
    res = requests.post(url, headers=headers, json=payload, timeout=20)
    print("GROQ STATUS:", res.status_code)
    rj = res.json()
    if "choices" not in rj:
        raise Exception(rj)
    return rj["choices"][0]["message"]["content"].strip()

# ─── STEP 1: OFF-TOPIC CHECK ──────────────────────
def is_off_topic(message: str) -> bool:
    """Reject messages that have nothing to do with eco/sustainability/products."""
    result = call_groq([
        {
            "role": "system",
            "content": (
                "You are a flexible product assistant classifier for EcoBot.\n"
                "Your job is to ALLOW most product/item queries since almost everything has an eco-friendly version.\n"
                "Only reject if the message:\n"
                "- Is completely unrelated to shopping/products (e.g., math problems, personal advice, stories)\n"
                "- Asks about abstract concepts with no product angle\n"
                "- Is spam, jokes, or offensive content\n\n"
                "ALLOW these types of queries:\n"
                "- Any physical item or product name (spoon, cup, toothbrush, car, etc.)\n"
                "- Shopping-related questions\n"
                "- Requests for alternatives or recommendations\n"
                "- Environmental or sustainability topics\n"
                "- Anything that COULD have an eco-friendly version\n\n"
                "Reply with exactly one word: YES (should process) or NO (off-topic). Nothing else."
            )
        },
        {"role": "user", "content": message}
    ])
    # Return True only if Groq says NO (off-topic)\n"
    return result.strip().upper().startswith("NO")

# ─── STEP 2: AMAZON SHOPPABILITY CHECK ───────────────
def classify_query(message: str, keyword: str) -> dict:
    """
    Determines:
      - amazon_searchable: Can this realistically be found & bought on Amazon?
      - better_keyword: A refined Amazon search term if needed
    Returns dict: { "amazon_searchable": bool, "better_keyword": str }

    Non-searchable examples: cars, houses, solar panels for homes, electric vehicles,
    large appliances (washing machines), services, real estate, etc.
    Searchable: anything you'd actually add to an Amazon cart.
    """
    result = call_groq([
        {
            "role": "system",
            "content": (
                "You are a product classifier for an Amazon search system.\n\n"
                "Decide if the keyword can realistically be found as a buyable product on Amazon.\n"
                "Amazon CANNOT sell: cars, electric vehicles, motorcycles, scooters (full-size), "
                "solar panel systems for homes, whole house appliances, real estate, services, "
                "live animals, or anything that requires in-person purchase.\n"
                "Amazon CAN sell: anything small enough to ship — clothing, food, tools, gadgets, "
                "personal care, accessories, small electronics, books, bags, bottles, etc.\n\n"
                "Reply in this exact JSON format, no extra text:\n"
                "{\"amazon_searchable\": true, \"better_keyword\": \"keyword here\"}\n"
                "or\n"
                "{\"amazon_searchable\": false, \"better_keyword\": \"\"}\n\n"
                "For the better_keyword: strip eco/green/sustainable words (those are added automatically). "
                "Keep it 1-4 words, focused on the product type."
            )
        },
        {"role": "user", "content": f"Original user message: {message}\nExtracted keyword: {keyword}"}
    ])

    # Parse the JSON response safely
    import json, re
    try:
        # Find JSON in the response
        match = re.search(r'\{.*\}', result, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            return {
                "amazon_searchable": bool(parsed.get("amazon_searchable", False)),
                "better_keyword":    str(parsed.get("better_keyword", keyword))
            }
    except Exception as e:
        print("CLASSIFY PARSE ERROR:", e, "RAW:", result)

    # Fallback: assume searchable with original keyword
    return {"amazon_searchable": True, "better_keyword": keyword}

# ─── STEP 3: FETCH AMAZON PRODUCTS ────────────────
def fetch_products(query: str):
    url     = "https://real-time-amazon-data.p.rapidapi.com/search"
    headers = {
        "X-RapidAPI-Key":  RAPID_KEY,
        "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
    }
    params = {"query": f"eco friendly {query.strip()}", "country": "US", "page": "1"}
    try:
        res  = requests.get(url, headers=headers, params=params, timeout=10)
        data = res.json()
        raw  = (
            data.get("data", {}).get("products", [])
            or data.get("data", [])
            or []
        )
        products = []
        for item in raw[:8]:  # fetch extra, we'll filter below
            title = item.get("product_title") or item.get("title", "")
            if not title:
                continue
            products.append({
                "title":  title,
                "price":  item.get("product_price") or item.get("price") or item.get("product_minimum_offer_price", ""),
                "image":  item.get("product_photo") or item.get("product_main_image_url") or item.get("image", ""),
                "link":   item.get("product_url") or item.get("url") or item.get("detail_url", ""),
                "rating": item.get("product_star_rating") or item.get("product_avg_rating", ""),
            })
        return products
    except Exception as e:
        print("PRODUCT ERROR:", e)
        return []

# ─── STEP 4: VALIDATE PRODUCT RELEVANCE ───────────
def validate_products(user_message: str, keyword: str, products: list) -> list:
    """
    Ask Groq to filter out products that are irrelevant to the user's query.
    Returns only the relevant products (up to 5).
    """
    if not products:
        return []

    import json
    product_list = [{"index": i, "title": p["title"]} for i, p in enumerate(products)]

    result = call_groq([
        {
            "role": "system",
            "content": (
                "You are a product relevance checker.\n"
                "Given a user's query and a list of Amazon search results, "
                "return ONLY the indices of products that are genuinely relevant to what the user asked for.\n"
                "Remove any product that is clearly unrelated — for example if user asks for 'cars' "
                "and results include toothbrushes, those are irrelevant.\n"
                "Reply with ONLY a JSON array of relevant indices, e.g.: [0, 1, 3]\n"
                "If NO products are relevant, return an empty array: []\n"
                "Do not add any explanation."
            )
        },
        {
            "role": "user",
            "content": (
                f"User asked: \"{user_message}\"\n"
                f"Search keyword used: \"{keyword}\"\n\n"
                f"Products:\n{json.dumps(product_list, indent=2)}"
            )
        }
    ])

    import re
    try:
        match = re.search(r'\[.*?\]', result, re.DOTALL)
        if match:
            indices = json.loads(match.group())
            return [products[i] for i in indices if isinstance(i, int) and i < len(products)][:5]
    except Exception as e:
        print("VALIDATE PARSE ERROR:", e, "RAW:", result)

    return []  # If parsing fails, return empty — better no products than wrong ones

# ─── CHAT ENDPOINT ────────────────────────────────
@app.post("/chat")
def chat(req: ChatRequest):
    try:
        msg = req.message.strip()

        # ── Guard 1: Off-topic ────────────────────
        if is_off_topic(msg):
            return {
                "reply": (
                    "🌿 Hi! I'm EcoBot — your eco-friendly shopping assistant.\n\n"
                    "I'm here to help you discover sustainable, green products for everyday life. "
                    "Try asking me:\n"
                    "• \"Suggest eco-friendly shampoos\"\n"
                    "• \"Best reusable water bottles\"\n"
                    "• \"Eco-friendly cars and EVs\"\n"
                    "• \"Zero waste kitchen products\"\n\n"
                    "How can I help you shop greener today? 😊"
                ),
                "products": []
            }

        # ── Step 1: Extract base keyword ─────────
        raw_keyword = call_groq([
            {
                "role": "system",
                "content": (
                    "Extract a short product search keyword (1-4 words) from the user message.\n"
                    "Do NOT include 'eco', 'green', 'sustainable', 'friendly' — these are added automatically.\n"
                    "Reply with ONLY the keyword. No punctuation. No explanation."
                )
            },
            {"role": "user", "content": msg}
        ])
        print("RAW KEYWORD:", raw_keyword)

        # ── Step 2: Classify — Amazon-searchable? ─
        classification = classify_query(msg, raw_keyword)
        amazon_searchable = classification["amazon_searchable"]
        keyword           = classification["better_keyword"] or raw_keyword
        print(f"AMAZON SEARCHABLE: {amazon_searchable} | KEYWORD: {keyword}")

        # ── Step 3: Fetch + validate products ────
        products = []
        if amazon_searchable:
            raw_products = fetch_products(keyword)
            print(f"RAW PRODUCTS: {len(raw_products)}")
            products = validate_products(msg, keyword, raw_products)
            print(f"VALIDATED PRODUCTS: {len(products)}")

        # ── Step 4: Generate reply ────────────────
        if products:
            # We have relevant products — explain them
            names = "\n".join(f"- {p['title']}" for p in products if p.get("title"))
            explain_msgs = [
                {
                    "role": "system",
                    "content": (
                        "You are EcoBot, a warm and knowledgeable eco-friendly shopping assistant.\n"
                        "The user asked about a topic and we found relevant eco-friendly products.\n"
                        "Write 2-3 short paragraphs explaining why these products are sustainable.\n"
                        "Be specific to the products listed. Use simple, warm language.\n"
                        "End with one short actionable green tip.\n"
                        "Max 140 words total."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        f"User asked: \"{msg}\"\n\n"
                        f"Relevant eco-friendly products found:\n{names}\n\n"
                        "Explain why these are good eco-friendly choices for the user."
                    )
                }
            ]
        elif not amazon_searchable:
            # Big-ticket / non-shoppable item — give expert eco advice instead
            explain_msgs = [
                {
                    "role": "system",
                    "content": (
                        "You are EcoBot, a knowledgeable eco-friendly advisor.\n"
                        "The user is asking about something that isn't sold on Amazon "
                        "(like cars, home appliances, or large systems).\n"
                        "Give them genuinely useful, specific eco-friendly advice about their topic:\n"
                        "- Name real eco-friendly brands, models, or options if you know them\n"
                        "- Mention key eco features to look for\n"
                        "- Give practical buying tips\n"
                        "- Keep it focused, warm, and under 160 words\n"
                        "Do NOT say products aren't available. Just give great advice."
                    )
                },
                {
                    "role": "user",
                    "content": f"User asked: \"{msg}\"\n\nGive specific eco-friendly advice and recommendations."
                }
            ]
        else:
            # Amazon-searchable but no relevant results found
            explain_msgs = [
                {
                    "role": "system",
                    "content": (
                        "You are EcoBot, a warm eco-friendly shopping assistant.\n"
                        "We couldn't find specific products right now, but give the user "
                        "helpful eco-friendly tips, what to look for, and sustainable alternatives.\n"
                        "Keep it under 120 words. Be warm and specific to their query."
                    )
                },
                {
                    "role": "user",
                    "content": f"User asked: \"{msg}\"\n\nNo matching products found. Give eco tips for this query."
                }
            ]

        reply = call_groq(explain_msgs, temperature=0.5)

        # ── Step 5: Save to DB ────────────────────
        from bson import ObjectId
        now = datetime.now(timezone.utc)
        
        # If sessionId exists and is valid, update that chat; otherwise create new
        if req.sessionId:
            try:
                existing_chat = chats.find_one({"_id": ObjectId(req.sessionId), "userId": req.userId})
                if existing_chat:
                    # Update existing session: append messages and products
                    chats.update_one(
                        {"_id": ObjectId(req.sessionId)},
                        {
                            "$set": {
                                "lastMessage": msg,
                                "lastResponse": reply,
                                "lastProducts": products,
                                "updatedAt": now,
                            },
                            "$push": {
                                "messages": {"text": msg, "timestamp": now},
                                "responses": {"text": reply, "products": products, "timestamp": now},
                            }
                        }
                    )
                    return {"reply": reply, "products": products, "sessionId": req.sessionId}
            except:
                pass  # If sessionId is invalid, create new chat
        
        # Create new chat session
        new_chat = {
            "userId": req.userId,
            "lastMessage": msg,
            "lastResponse": reply,
            "lastProducts": products,
            "messages": [{"text": msg, "timestamp": now}],
            "responses": [{"text": reply, "products": products, "timestamp": now}],
            "createdAt": now,
            "updatedAt": now,
        }
        result = chats.insert_one(new_chat)
        
        return {"reply": reply, "products": products, "sessionId": str(result.inserted_id)}

    except Exception as e:
        print("CHAT ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))

# ─── HISTORY ──────────────────────────────────────
@app.get("/history/{userId}")
def history(userId: str):
    data = list(chats.find({"userId": userId}).sort("updatedAt", -1))
    for d in data:
        d["_id"] = str(d["_id"])
        if "createdAt" in d and hasattr(d["createdAt"], "isoformat"):
            d["createdAt"] = d["createdAt"].isoformat()
        if "updatedAt" in d and hasattr(d["updatedAt"], "isoformat"):
            d["updatedAt"] = d["updatedAt"].isoformat()
    return data

# ─── DELETE ───────────────────────────────────────
@app.delete("/chat/{chat_id}")
def delete_chat(chat_id: str):
    try:
        result = chats.delete_one({"_id": ObjectId(chat_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Chat not found")
        return {"message": "Deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ─── HEALTH ───────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}
