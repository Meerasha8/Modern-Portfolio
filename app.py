import os
import json
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from supabase import create_client, Client
from functools import wraps
import requests
from datetime import timedelta
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-prod")
app.permanent_session_lifetime = timedelta(hours=8)

# Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Admin password from env
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

# Groq API
GROQ_API_KEY = os.environ.get("XAI_API_KEY", "")
client = Groq(api_key=GROQ_API_KEY)

# ─── Auth helpers ────────────────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("admin"):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated

# ─── Auth routes ─────────────────────────────────────────────────────────────

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    if data.get("password") == ADMIN_PASSWORD:
        session.permanent = True
        session["admin"] = True
        return jsonify({"success": True})
    return jsonify({"error": "Invalid password"}), 401

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})

@app.route("/api/session")
def check_session():
    return jsonify({"admin": bool(session.get("admin"))})

# ─── Page routes ─────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/about")
def about():
    return render_template("index.html")

@app.route("/skills")
def skills():
    return render_template("index.html")

@app.route("/projects")
def projects():
    return render_template("index.html")

@app.route("/contact")
def contact():
    return render_template("index.html")

@app.route("/chat")
def chat():
    return render_template("index.html")

# ─── Home API ─────────────────────────────────────────────────────────────────

@app.route("/api/home", methods=["GET"])
def get_home():
    res = supabase.table("home").select("*").limit(1).execute()
    data = res.data[0] if res.data else {}
    return jsonify(data)

@app.route("/api/home", methods=["PUT"])
@login_required
def update_home():
    data = request.get_json()
    res = supabase.table("home").select("id").limit(1).execute()
    if res.data:
        supabase.table("home").update(data).eq("id", res.data[0]["id"]).execute()
    else:
        supabase.table("home").insert(data).execute()
    return jsonify({"success": True})

# ─── About API ────────────────────────────────────────────────────────────────

@app.route("/api/about", methods=["GET"])
def get_about():
    res = supabase.table("about").select("*").limit(1).execute()
    data = res.data[0] if res.data else {}
    return jsonify(data)

@app.route("/api/about", methods=["PUT"])
@login_required
def update_about():
    data = request.get_json()
    res = supabase.table("about").select("id").limit(1).execute()
    if res.data:
        supabase.table("about").update(data).eq("id", res.data[0]["id"]).execute()
    else:
        supabase.table("about").insert(data).execute()
    return jsonify({"success": True})

# ─── Skills API ───────────────────────────────────────────────────────────────

@app.route("/api/skills", methods=["GET"])
def get_skills():
    res = supabase.table("skills").select("*").order("created_at").execute()
    return jsonify(res.data)

@app.route("/api/skills", methods=["POST"])
@login_required
def add_skill():
    data = request.get_json()
    res = supabase.table("skills").insert(data).execute()
    return jsonify(res.data[0])

@app.route("/api/skills/<int:skill_id>", methods=["PUT"])
@login_required
def update_skill(skill_id):
    data = request.get_json()
    supabase.table("skills").update(data).eq("id", skill_id).execute()
    return jsonify({"success": True})

@app.route("/api/skills/<int:skill_id>", methods=["DELETE"])
@login_required
def delete_skill(skill_id):
    supabase.table("skills").delete().eq("id", skill_id).execute()
    return jsonify({"success": True})

# ─── Projects API ─────────────────────────────────────────────────────────────

@app.route("/api/projects", methods=["GET"])
def get_projects():
    res = supabase.table("projects").select("*").order("created_at", desc=True).execute()
    return jsonify(res.data)

@app.route("/api/projects", methods=["POST"])
@login_required
def add_project():
    data = request.get_json()
    res = supabase.table("projects").insert(data).execute()
    return jsonify(res.data[0])

@app.route("/api/projects/<int:project_id>", methods=["PUT"])
@login_required
def update_project(project_id):
    data = request.get_json()
    supabase.table("projects").update(data).eq("id", project_id).execute()
    return jsonify({"success": True})

@app.route("/api/projects/<int:project_id>", methods=["DELETE"])
@login_required
def delete_project(project_id):
    supabase.table("projects").delete().eq("id", project_id).execute()
    return jsonify({"success": True})

# ─── Contact API ──────────────────────────────────────────────────────────────

@app.route("/api/contact", methods=["GET"])
def get_contact():
    res = supabase.table("contact").select("*").limit(1).execute()
    data = res.data[0] if res.data else {}
    return jsonify(data)

@app.route("/api/contact", methods=["PUT"])
@login_required
def update_contact():
    data = request.get_json()
    res = supabase.table("contact").select("id").limit(1).execute()
    if res.data:
        supabase.table("contact").update(data).eq("id", res.data[0]["id"]).execute()
    else:
        supabase.table("contact").insert(data).execute()
    return jsonify({"success": True})

# ─── Chatbot API ──────────────────────────────────────────────────────────────

def build_portfolio_context():
    """Fetch all portfolio data and build context string for Grok."""
    ctx = []
    try:
        home = supabase.table("home").select("*").limit(1).execute().data
        if home:
            h = home[0]
            ctx.append(f"Name: {h.get('name','')}\nTitle: {h.get('title','')}\nTagline: {h.get('tagline','')}\nCollaboration text: {h.get('collab_text','')}")

        about = supabase.table("about").select("*").limit(1).execute().data
        if about:
            a = about[0]
            ctx.append(f"About: {a.get('description','')}")

        skills = supabase.table("skills").select("*").execute().data
        if skills:
            skill_lines = ["Skills:"]
            for s in skills:
                skill_lines.append(f"  - {s.get('name','')}: {s.get('description','')}")
                if s.get("certification"):
                    skill_lines.append(f"    Certification: {s.get('certification')}")
            ctx.append("\n".join(skill_lines))

        projects = supabase.table("projects").select("*").execute().data
        if projects:
            proj_lines = ["Projects:"]
            for p in projects:
                proj_lines.append(f"  - {p.get('title','')}: {p.get('description','')}")
                proj_lines.append(f"    Tech stack: {p.get('techstack','')}")
                if p.get("live_link"):
                    proj_lines.append(f"    Live: {p.get('live_link')}")
                if p.get("github_link"):
                    proj_lines.append(f"    GitHub: {p.get('github_link')}")
            ctx.append("\n".join(proj_lines))

        contact = supabase.table("contact").select("*").limit(1).execute().data
        if contact:
            c = contact[0]
            lines = ["Contact info:"]
            for field in ["email", "phone", "location", "linkedin", "github", "twitter", "website"]:
                if c.get(field):
                    lines.append(f"  {field}: {c.get(field)}")
            ctx.append("\n".join(lines))
    except Exception as e:
        ctx.append(f"(Error fetching portfolio data: {e})")
    return "\n\n".join(ctx)

@app.route("/api/chat", methods=["POST"])
def chat_api():
    data = request.get_json()
    user_message = data.get("message", "")
    history = data.get("history", [])

    if not user_message:
        return jsonify({"error": "No message"}), 400

    portfolio_context = build_portfolio_context()
    system_prompt = (
        "You are a professional portfolio assistant.\n"
        "Answer like a human, clean and natural.\n\n"
        "Rules:\n"
        "- Do NOT say 'based on data' or 'portfolio data'\n"
        "- Do NOT dump raw data\n"
        "- Keep answers short and clear\n"
        "- Format nicely using bullet points if needed\n"
        "- If asked about skills, list them cleanly\n"
        "- If asked about projects, summarize top ones\n"
        "- If answer not found, say: 'I don't have that information.'\n\n"
        f"Portfolio Data:\n{portfolio_context}"
    )

    messages = []
    for h in history[-10:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_message})

    if not GROQ_API_KEY:
        return jsonify({"reply": "Chatbot is not configured. Please add XAI_API_KEY to environment variables."}), 200

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "system", "content": system_prompt}] + messages,
            max_completion_tokens=1024
        )
        reply = response.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"reply": f"Sorry, I encountered an error: {str(e)}"}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)
