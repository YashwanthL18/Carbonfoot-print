from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from models import db, FootprintRecord, User   # add User here
from calculator import calculate_total_footprint
from ml.recommend import get_personalized_recommendations
import json
import os
import pathlib
import re
import random
from flask import session
import datetime

# Load a small local knowledge base (no external API usage)
KB_PATH = os.path.join(os.path.dirname(__file__), 'chat_kb.json')
try:
    with open(KB_PATH, 'r', encoding='utf-8') as _f:
        LOCAL_KB = json.load(_f)
except Exception:
    LOCAL_KB = []

app = Flask(__name__,
            static_folder='../frontend',  # Serve static files from 'frontend'
            template_folder='../frontend') # Serve HTML from 'frontend'

# --- Configuration ---
# Allow requests from our frontend and allow credentials (so session cookie works across origins when needed)
CORS(app, supports_credentials=True)

# Database Configuration (using SQLite for simplicity)
db_path = os.path.join(os.path.dirname(__file__), 'carbon_calculator.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Secret key for session cookies (change in production)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'change-me-to-a-random-string')

# Initialize database
db.init_app(app)

# Create tables before first request
@app.before_request
def create_tables():
    db.create_all()

# --- API Endpoints ---

@app.route('/api/calculate', methods=['POST'])
def handle_calculation():
    """
    Receives form data, calculates footprint, gets recommendations,
    saves to DB, and returns the result.
    """
    data = request.json
    
    # 1. Calculate Footprint
    footprint_breakdown = calculate_total_footprint(data)
    
    # 2. Get AI Recommendations
    recommendations = get_personalized_recommendations(footprint_breakdown)
    
    # 3. Save to Database
    new_record = FootprintRecord(
        travel_footprint=footprint_breakdown["travel"],
        energy_footprint=footprint_breakdown["energy"],
        food_footprint=footprint_breakdown["food"],
        total_footprint=footprint_breakdown["total"],
        recommendations=json.dumps(recommendations)
    )
    # attach user if logged in
    user_id = session.get('user_id')
    if user_id:
        new_record.user_id = user_id

    db.session.add(new_record)
    db.session.commit()
    
    # 4. Return response to frontend
    return jsonify({
        "success": True,
        "footprint": footprint_breakdown,
        "recommendations": recommendations
    })

@app.route('/api/history', methods=['GET'])
def get_history():
    """
    Fetches all historical footprint records for the dashboard chart.
    """
    # Require logged-in user for per-user history
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    records = FootprintRecord.query.filter_by(user_id=user_id).order_by(FootprintRecord.created_at.asc()).all()
    # Convert records to a list of dictionaries
    history_data = [record.to_dict() for record in records]
    return jsonify(history_data)


@app.route('/api/activities', methods=['GET'])
def get_activities():
    """Return a list of recent user activities (derived from footprint records)."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    records = FootprintRecord.query.filter_by(user_id=user_id).order_by(FootprintRecord.created_at.desc()).limit(20).all()
    activities = []
    for r in records:
        activities.append({
            "id": r.id,
            "description": f"Calculated {r.total_footprint:.2f} kg CO2 (travel {r.travel_footprint:.2f} kg)",
            "date": r.created_at.isoformat()
        })
    return jsonify(activities)


@app.route('/api/recommendations', methods=['GET'])
def api_recommendations():
    """Return latest recommendations (from the most recent record), or a default tip."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    latest = FootprintRecord.query.filter_by(user_id=user_id).order_by(FootprintRecord.created_at.desc()).first()
    if latest and latest.recommendations:
        try:
            recs = json.loads(latest.recommendations)
            # Ensure list of strings
            if isinstance(recs, list):
                return jsonify(recs)
        except Exception:
            pass
    # Fallback: use ml module to produce a generic recommendation based on last values
    if latest:
        fb = {
            "travel": latest.travel_footprint,
            "energy": latest.energy_footprint,
            "food": latest.food_footprint
        }
        try:
            recs = get_personalized_recommendations(fb)
            return jsonify(recs)
        except Exception:
            pass

    return jsonify(["No recommendations available yet."])


@app.route('/api/stats', methods=['GET'])
def api_stats():
    """Return summarized stats for the dashboard quick stats."""
    # Per-user stats (require login)
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    records = FootprintRecord.query.filter_by(user_id=user_id).order_by(FootprintRecord.created_at.asc()).all()
    if not records:
        return jsonify({
            "current_score": 0,
            "reduction_rate": 0,
            "trees_saved": 0,
            "total_savings": 0
        })

    first = records[0].total_footprint
    last = records[-1].total_footprint
    current_score = last
    reduction_rate = 0
    if first and first > 0:
        reduction_rate = max(0, (first - last) / first)

    total_savings = max(0, first - last)
    # Improved trees saved estimate: use ~22 kg CO2 sequestered per tree per year
    TREE_CO2_PER_YEAR_KG = 22.0
    trees_saved = round(total_savings / TREE_CO2_PER_YEAR_KG, 1)

    return jsonify({
        "current_score": current_score,
        "reduction_rate": reduction_rate,
        "trees_saved": trees_saved,
        "total_savings": total_savings
    })

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json() or request.form
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not (name and email and password):
        return jsonify({"success": False, "message": "Missing fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "Email already registered"}), 400

    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"success": True, "message": "Registered"}), 201


@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or request.form
    email = data.get('email')
    password = data.get('password')

    if not (email and password):
        return jsonify({"success": False, "message": "Missing fields"}), 400

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        session['user_id'] = user.id
        session['user_email'] = user.email
        return jsonify({"success": True, "message": "Logged in", "user": user.to_dict()})
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401


@app.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out"})


@app.route('/api/auth-status', methods=['GET'])
def api_auth_status():
    """Return authentication status for the current session.

    Response JSON: { authenticated: bool, user: {id,name,email} | null }
    """
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"authenticated": False, "user": None})
    try:
        user = User.query.get(user_id)
        return jsonify({"authenticated": True, "user": user.to_dict() if user else None})
    except Exception:
        return jsonify({"authenticated": True, "user": None})


# --- AI Chat Endpoint (enhanced with better intents and responses) ---
def generate_reply(message: str) -> str:
    """Generate a contextual, safe reply for the chat widget.
    - Adds template variety and politeness
    - Uses session-backed recent-reply history to avoid exact repetitions
    - Cleans and deduplicates sentences
    """
    def clean_reply(text: str) -> str:
        if not text:
            return ''
        t = re.sub(r"\s+", ' ', text.strip())
        parts = re.split(r'(?<=[.!?])\s+', t)
        seen = set()
        deduped = []
        for p in parts:
            p_strip = p.strip()
            if not p_strip:
                continue
            key = re.sub(r"[^a-z0-9 ]", '', p_strip.lower()).strip()
            if key in seen:
                continue
            seen.add(key)
            deduped.append(p_strip)
        result = ' '.join(deduped)
        result = re.sub(r'\s+([.,!?;:])', r'\1', result)
        return result

    def canonical(text: str) -> str:
        if not text:
            return ''
        return re.sub(r"[^a-z0-9 ]", '', clean_reply(text).lower()).strip()

    def pick_unique(candidates):
        try:
            hist = session.get('chat_history', []) or []
        except Exception:
            hist = []
        random.shuffle(candidates)
        for c in candidates:
            k = canonical(c)
            if k and k not in hist:
                hist.append(k)
                hist = hist[-12:]
                try:
                    session['chat_history'] = hist
                except Exception:
                    pass
                return clean_reply(c)
        if candidates:
            k = canonical(candidates[0])
            try:
                hist.append(k)
                session['chat_history'] = hist[-12:]
            except Exception:
                pass
            return clean_reply(candidates[0])
        return ''

    if not message or not message.strip():
        return pick_unique([
            "Hi 👋 Tell me what you'd like help with about reducing your carbon footprint!",
            "Hello 👋 — ask me anything about your carbon footprint or ways to reduce it.",
            "Hey! 🌱 I'm ready to help — ask about tips, categories, or how the calculator works."
        ])

    lower = message.lower().strip()

    # Greeting intent
    if any(w in lower for w in ['hi', 'hello', 'hey', 'howdy', 'greetings']):
        replies = [
            "Hello! 👋 I'm here to help you reduce your carbon footprint. Ask me about tips, explanations, or recommendations.",
            "Hey there! 🌱 What carbon questions can I answer for you today?",
            "Hi! 👋 I can help with footprint tips, category explanations, or suggest actions. What interests you?",
            "Nice to meet you! I can suggest actions, explain categories, or help you use the calculator."
        ]
        return pick_unique(replies)

    # Local KB quick-match
    try:
        if 'carbon footprint' in lower or "what is a carbon footprint" in lower:
            for entry in LOCAL_KB:
                if 'carbon footprint' in entry.get('question','').lower():
                    return pick_unique([entry.get('answer'), entry.get('answer') + ' If you want, I can explain each part.'])

        words = set([w for w in lower.replace("'", '').split() if len(w) > 2])
        best = None
        best_score = 0
        for entry in LOCAL_KB:
            qwords = set([w for w in entry.get('question', '').lower().replace("'", '').split() if len(w) > 2])
            score = len(words & qwords)
            if score > best_score:
                best_score = score
                best = entry
        if best and best_score >= 2:
            ans = best.get('answer')
            variants = [ans, ans + ' If you like, I can go into more detail.']
            return pick_unique(variants)
    except Exception:
        pass

    # Tips/Recommendations intent
    if any(w in lower for w in ['tip', 'recommend', 'reduce', 'lower', 'decrease', 'minimize', 'better', 'improve']):
        candidates = []
        try:
            sample = {"travel": 5.0, "energy": 5.0, "food": 5.0}
            recs = get_personalized_recommendations(sample)
            if isinstance(recs, list) and recs:
                uniq = []
                seen = set()
                for r in recs:
                    k = r.strip().lower()
                    if k and k not in seen:
                        seen.add(k)
                        uniq.append(r.strip())
                    if len(uniq) >= 6:
                        break
                top = uniq[:3]
                if top:
                    candidates.append('Here are some actionable tips: • ' + ' • '.join(top))
                    candidates.append('Try these to start: ' + '; '.join(top))
        except Exception:
            pass
        candidates.extend([
            "Quick wins: Walk or bike for short trips; use energy-efficient appliances; try more plant-based meals.",
            "Start small: replace one car trip with biking, switch to LED bulbs, or have one meat-free day each week.",
            "Small changes add up — try one of these: bike short trips, reduce heating by 1–2°C, or eat more plants."
        ])
        return pick_unique(candidates)

    # Explanation intents
    if 'travel' in lower or 'transport' in lower or 'car' in lower or 'flight' in lower:
        candidates = [
            "Travel footprint includes emissions from car commutes, public transit, and flights. Tip: Carpool, take trains, or work from home when possible.",
            "Travel emissions come mostly from cars and flights. Consider public transit, carpooling, or choosing lower-emission options when you can.",
            "Flights and long car trips tend to increase your footprint. For shorter trips, try biking or transit."
        ]
        return pick_unique(candidates)

    if 'energy' in lower or 'electricity' in lower or 'power' in lower or 'heating' in lower:
        candidates = [
            "Energy footprint covers home electricity use, heating/cooling, and water heating. Tip: Use LED bulbs, insulate your home, and adjust the thermostat by 2°C.",
            "Most home energy emissions come from heating and electricity. Improving insulation and using efficient appliances can significantly reduce them.",
            "Try lowering your thermostat by 1–2°C and replacing old bulbs with LEDs to reduce energy use."
        ]
        return pick_unique(candidates)

    if 'food' in lower or 'diet' in lower or 'eat' in lower or 'vegetarian' in lower:
        candidates = [
            "Food footprint factors in meat production, processed foods, and food miles. Tip: Try 'Meatless Mondays' or reduce beef intake for big impact.",
            "Diet impacts emissions: reducing red meat and choosing seasonal/local produce lowers your food footprint.",
            "Switching a few meals to plant-based options can reduce emissions over time. Start with one meat-free day per week."
        ]
        return pick_unique(candidates)

    # Calculator intent
    if any(w in lower for w in ['calculate', 'measure', 'how much', 'kg', 'carbon', 'footprint', 'emissions']):
        return pick_unique([
            "I can help you understand your carbon footprint. Use our calculator to enter travel, energy, and diet details and I'll show personalized ways to reduce it.",
            "Use the calculator to measure your emissions from travel, energy, and food — then I'll suggest actions to lower them."
        ])

    # Goals/challenge
    if any(w in lower for w in ['goal', 'target', 'save', 'reduce', 'challenge', 'commit']):
        return pick_unique([
            "Great! Here's a challenge: pick one action this week — replace a car trip with biking, switch to LED bulbs, or skip meat one day. Small changes add up!",
            "Challenge accepted! Try one small change this week, like biking short trips or reducing heating by 1–2°C, and track the difference."
        ])

    # Thanks/encouragement
    if any(w in lower for w in ['thank', 'good', 'great', 'awesome', 'cool', 'nice', 'love it']):
        return pick_unique([
            "Thanks for caring about the planet! Every action counts — keep up the great work. Need more tips or have questions?",
            "I appreciate it — happy to help. If you want, I can suggest actionable steps tailored to you."
        ])

    # Short unclear input
    if len(lower) < 5:
        return pick_unique([
            "I didn't quite understand that. Try asking about tips, travel, energy, food, or how to reduce your footprint.",
            "Could you give a little more detail? For example: 'How can I reduce travel emissions?' or 'Any tips for saving energy at home?'"
        ])

    # Fallback
    return pick_unique([
        "Interesting question! I can help with carbon tips & recommendations, explain footprint categories, or show how to use the calculator. Try: 'How can I reduce travel emissions?'",
        "Good question — I can explain your footprint categories, suggest reductions, or walk you through the calculator. Which would you prefer?"
    ])


@app.route('/api/chat', methods=['POST'])
def api_chat():
    """Enhanced chat endpoint for the frontend widget.

    Request JSON: { "message": "..." }
    Response JSON: { "success": true, "reply": "...", "timestamp": "..." }
    
    Features:
    - Intent detection and contextual responses
    - Fallback for unrecognized queries
    - Emoji-enhanced readability
    - Stateless (no conversation history stored)
    """
    data = request.get_json() or {}
    message = data.get('message', '').strip()

    if not message:
        return jsonify({
            "success": False,
            "reply": "Please type a message to get started!"
        }), 400

    try:
        reply = generate_reply(message)
        return jsonify({
            "success": True,
            "reply": reply,
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
    except Exception as e:
        app.logger.error(f"Chat error: {str(e)}")
        return jsonify({
            "success": False,
            "reply": "🔧 Sorry, I encountered an issue. Please try again."
        }), 500


# --- Frontend Serving ---

@app.route('/')
def serve_index():
    """Serve calculator page for authenticated users, otherwise show home page.

    This preserves existing frontend files and only changes which HTML is returned
    at the root URL depending on the session. Frontend behavior and API endpoints
    remain unchanged.
    """
    user_id = session.get('user_id')
    if not user_id:
        # show the premium home page for unauthenticated visitors
        return render_template('home.html')
    # already logged in -> show main calculator
    return render_template('index.html')

@app.route('/dashboard')
def serve_dashboard():
    """Serves the user's dashboard page."""
    return render_template('dashboard.html')


@app.route('/login')
def serve_login():
    """Serve the login page."""
    return render_template('login.html')


@app.route('/register')
def serve_register():
    """Serve the register page."""
    return render_template('register.html')

@app.route('/<path:filename>')
def serve_static_files(filename):
    """Serves static files like CSS and JS."""
    return send_from_directory(app.static_folder, filename)


if __name__ == '__main__':
    app.run(debug=True, port=5000)