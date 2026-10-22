# AI Chat Feature Documentation

## Overview
The Carbon Calculator now includes an intelligent floating chat widget that provides personalized carbon reduction tips, explanations, and encouragement. The chat is accessible from every page.

## Features

### Frontend Widget (`frontend/js/chat.js`)
- **Floating Chat Panel**: Bottom-right corner, collapsible
- **Smooth Scrolling**: Automatic scroll-to-latest message
- **Typing Indicator**: Visual feedback while awaiting response
- **Timestamps**: Each message displays when it was sent/received
- **Message Persistence**: Chat history saved to browser `localStorage` (last 20 messages)
- **Emoji Support**: Rich, friendly responses with icons
- **Responsive Design**: Adapts to mobile and desktop screens
- **Accessibility**: ARIA labels and proper semantic markup
- **Input Validation**: Max 500 characters per message

### Backend Endpoint (`backend/app.py` - `/api/chat`)
- **Intent Detection**: Recognizes user intent (greeting, tips, explanations, etc.)
- **Smart Responses**:
  - Greeting intent → Friendly welcome
  - Tips/Reduce intent → Personalized action items
  - Travel/Energy/Food intent → Category-specific education
  - Calculation intent → Help with measurement
  - Goal/Challenge intent → Motivational encouragement
- **Fallback Handling**: Graceful response for unrecognized queries
- **Error Handling**: Returns friendly error messages (no crashes)
- **Rate-Safe**: Stateless design (no session/DB overhead)

## How to Use

### User Perspective
1. Open any page (index, dashboard, profile, etc.)
2. Look for the **🤖 Carbon Assistant** widget in bottom-right corner
3. Click the header to expand/collapse the chat
4. Type a message and press **Enter** or click the **►** button
5. View your chat history and scroll up/down as needed

### Example Queries
- "Hello" → Friendly greeting
- "How to reduce my footprint?" → Action tips
- "Explain travel emissions" → Category breakdown
- "What can I do today?" → Challenge/goal suggestions
- "Calculate my carbon?" → Measurement help

## API Endpoint

### `POST /api/chat`
**Request:**
```json
{
  "message": "How can I reduce my travel emissions?"
}
```

**Response (Success):**
```json
{
  "success": true,
  "reply": "✈️ **Travel Footprint** includes emissions from...",
  "timestamp": "2025-11-11T10:30:45.123456"
}
```

**Response (Error):**
```json
{
  "success": false,
  "reply": "Please type a message to get started!"
}
```

## Enabling Real AI Integration

### Option 1: OpenAI Integration (GPT)
1. Install OpenAI library:
   ```bash
   pip install openai
   ```

2. Add to `backend/requirements.txt`:
   ```
   openai>=1.0.0
   ```

3. Update `generate_reply()` in `backend/app.py`:
   ```python
   def generate_reply(message: str) -> str:
       import os
       from openai import OpenAI
       
       api_key = os.environ.get('OPENAI_API_KEY')
       if not api_key:
           # Fallback to rule-based (existing logic)
           return generate_reply_fallback(message)
       
       client = OpenAI(api_key=api_key)
       try:
           response = client.chat.completions.create(
               model="gpt-3.5-turbo",
               messages=[{
                   "role": "system",
                   "content": "You are a helpful carbon footprint reduction assistant...",
                   "role": "user",
                   "content": message
               }],
               temperature=0.7,
               max_tokens=200
           )
           return response.choices[0].message.content
       except Exception as e:
           # Fallback on error
           return generate_reply_fallback(message)
   ```

4. Set env var before running:
   ```bash
   $env:OPENAI_API_KEY = "sk-..."
   python app.py
   ```

### Option 2: Google's Gemini API
1. Install Google library:
   ```bash
   pip install google-generativeai
   ```

2. Similar integration pattern as OpenAI.

### Option 3: No External API
The widget works perfectly with the current rule-based system. All intents are properly handled without any external dependencies.

## Browser Storage
Chat history is stored in `localStorage` under key `cc_chat_history`. To clear:
```javascript
localStorage.removeItem('cc_chat_history');
```

## Troubleshooting

### Chat widget not appearing?
- Ensure `frontend/js/chat.js` is included in your HTML page before `</body>`
- Check browser console for errors
- Verify Flask backend is running on `http://localhost:5000`

### Messages not being sent?
- Check Network tab in DevTools for `/api/chat` requests
- Verify Flask server is running
- Ensure CORS is enabled (check `backend/app.py`)

### Styling issues?
- Clear browser cache and reload
- Chat widget uses inline styles (no external CSS needed)
- Responsive breakpoint: 480px (mobile optimized)

## Performance
- Chat widget is lightweight (~8KB minified)
- No external dependencies required
- Lazy-loads on first user interaction
- History limited to 20 messages to prevent bloat

## Future Enhancements
- [ ] Conversation context awareness (multi-turn memory)
- [ ] User preference learning (favorite tips)
- [ ] Integration with ML recommendations for personalized suggestions
- [ ] Voice input (speech-to-text)
- [ ] Export chat as PDF
- [ ] Sentiment analysis (detect frustration, celebrate wins)

## Security Notes
- No user data is stored server-side for chat
- Messages are NOT logged or analyzed
- All API calls over HTTPS in production
- XSS protection via `.textContent` (no HTML injection)
- CSRF tokens not needed (POST is stateless)

---

**Last Updated:** November 11, 2025  
**Status:** Production Ready ✅
