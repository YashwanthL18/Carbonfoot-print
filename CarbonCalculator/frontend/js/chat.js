// Enhanced floating chat widget for Carbon Calculator
// Features: smooth scrolling, typing indicator, timestamps, persistence, auto-expand, and rich styling
(function(){
    const STYLE_ID = 'cc-chat-styles';
    const WIDGET_ID = 'cc-chat-widget';
    const STORAGE_KEY = 'cc_chat_history';

    function addStyles(){
        if(document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
        #${WIDGET_ID} { 
            position: fixed; right: 20px; bottom: 20px; width: 360px; max-width: calc(100% - 40px); 
            z-index: 2000; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15); border-radius: 12px; overflow: hidden;
        }
        #${WIDGET_ID} .cc-header { 
            background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); 
            color: white; padding: 14px 16px; cursor: pointer; display:flex; align-items:center; 
            justify-content: space-between; gap:12px; font-weight: 600; user-select: none;
            transition: all 0.2s ease;
        }
        #${WIDGET_ID} .cc-header:hover { background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%); }
        #${WIDGET_ID} .cc-header-title { display:flex; align-items:center; gap:8px }
        #${WIDGET_ID} .cc-header-icon { font-size: 1.2em }
        #${WIDGET_ID} .cc-minimize { background: rgba(255,255,255,0.2); border:none; color:white; cursor:pointer; 
            padding:4px 8px; border-radius:4px; font-size:0.9em; transition:all 0.2s }
        #${WIDGET_ID} .cc-minimize:hover { background: rgba(255,255,255,0.3) }
        #${WIDGET_ID} .cc-body { 
            background: linear-gradient(180deg, #fafbfa 0%, #f5faf6 100%); 
            border-radius: 0 0 12px 12px; display:flex; flex-direction:column; 
            height: 420px; max-height: 70vh;
        }
        #${WIDGET_ID} .cc-messages { 
            /* fixed-ish scroll area inside the widget — parent .cc-body still controls overall height */
            height: 400px; /* fallback fixed height for consistent scrolling */
            padding: 10px; 
            overflow-y: auto; 
            flex: 1; 
            display: flex; 
            flex-direction: column; 
            gap: 10px;
            scroll-behavior: smooth; /* enable smooth scrolling where supported */
            border-radius: 10px; /* visually separate the messages area */
            background-color: #f9f9f9; /* subtle neutral background that won't affect message bubbles */
        }
        #${WIDGET_ID} .cc-messages::-webkit-scrollbar { width: 6px }
        #${WIDGET_ID} .cc-messages::-webkit-scrollbar-track { background: #f0f0f0 }
        #${WIDGET_ID} .cc-messages::-webkit-scrollbar-thumb { background: #2ecc71; border-radius: 3px }
        #${WIDGET_ID} .cc-messages::-webkit-scrollbar-thumb:hover { background: #27ae60 }
    #${WIDGET_ID} .cc-new-badge { position: absolute; right: 86px; top: 10px; background: #ff5e5e; color: white; padding: 6px 10px; border-radius: 12px; font-size: 0.8em; box-shadow: 0 4px 10px rgba(0,0,0,0.12); cursor: pointer; display:none; z-index:2100 }
    #${WIDGET_ID} .cc-settings { background: transparent; border: none; color: white; cursor: pointer; font-size: 1.0em; margin-left:8px }
    #${WIDGET_ID} .cc-settings.active { filter: drop-shadow(0 2px 6px rgba(0,0,0,0.12)); }
        #${WIDGET_ID} .cc-input { display:flex; gap:8px; padding:12px; border-top:1px solid #e0e0e0; background: white }
        #${WIDGET_ID} input[type=text] { 
            flex:1; padding:10px 14px; border-radius:20px; border:1px solid #ddd; 
            font-size:0.95em; outline:none; transition: all 0.2s
        }
        #${WIDGET_ID} input[type=text]:focus { border-color: #2ecc71; box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.1) }
        #${WIDGET_ID} button.cc-send { 
            background: #2ecc71; color: white; border:none; padding:10px 16px; 
            border-radius:20px; cursor:pointer; font-weight: 600; transition: all 0.2s;
            display:flex; align-items:center; gap:6px;
        }
        #${WIDGET_ID} button.cc-send:hover { background: #27ae60; transform: scale(1.02) }
        #${WIDGET_ID} button.cc-send:active { transform: scale(0.98) }
        #${WIDGET_ID} button.cc-send:disabled { background: #bdc3c7; cursor: not-allowed; opacity: 0.6 }
        .cc-msg { display:flex; gap:8px; animation: fadeIn 0.3s ease }
        .cc-msg.user { justify-content: flex-end }
        .cc-msg .bubble { 
            max-width:75%; padding:10px 14px; border-radius:14px; word-wrap: break-word;
            font-size: 0.95em; line-height: 1.4;
        }
        .cc-msg.bot .bubble { background: #e8f5e9; color: #1b5e20; border-left: 3px solid #2ecc71 }
        .cc-msg.user .bubble { background: #2ecc71; color: white; border-radius: 14px 4px 14px 14px }
        .cc-msg .timestamp { font-size: 0.75em; opacity: 0.6; margin-top: 2px; padding: 0 4px }
        .cc-msg.user .timestamp { text-align: right }
        .cc-typing { display:flex; align-items:center; gap:4px; padding:8px 12px; background:#e8f5e9; 
            border-radius:14px; border-left: 3px solid #2ecc71 }
        .cc-typing span { width: 8px; height: 8px; background: #27ae60; border-radius: 50%; 
            animation: bounce 1.4s infinite }
        .cc-typing span:nth-child(2) { animation-delay: 0.2s }
        .cc-typing span:nth-child(3) { animation-delay: 0.4s }
        @keyframes bounce { 0%, 60%, 100% { opacity: 0.3; transform: translateY(0) } 30% { opacity: 1; transform: translateY(-8px) } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @media (max-width: 480px) {
            #${WIDGET_ID} { width: calc(100% - 16px); right: 8px; bottom: 8px; height: auto }
            #${WIDGET_ID} .cc-body { height: auto; max-height: calc(100vh - 100px) }
        }
        `;
        document.head.appendChild(style);
    }

    function getTimeString(){
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    function loadChatHistory(){
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    function saveChatHistory(history){
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-20))); // keep last 20 messages
        } catch (e) {
            console.warn('Could not save chat history');
        }
    }

    function createWidget(){
        if(document.getElementById(WIDGET_ID)) return;
        const widget = document.createElement('div');
        widget.id = WIDGET_ID;

        widget.innerHTML = `
        <div class="cc-header">
            <div class="cc-header-title">
                <span class="cc-header-icon">🤖</span>
                <strong>Carbon Assistant</strong>
            </div>
            <div style="display:flex; align-items:center; gap:8px; position:relative">
                <button class="cc-settings" title="Toggle auto-scroll" aria-pressed="false">⚙️</button>
                <div class="cc-new-badge" role="button" tabindex="0" aria-hidden="true">New</div>
                <button class="cc-minimize" title="Minimize/Maximize">−</button>
            </div>
        </div>
        <div class="cc-body" style="display:none">
            <div class="cc-messages" role="log" aria-live="polite" aria-label="Chat messages"></div>
            <div class="cc-input">
                <input type="text" placeholder="Ask about carbon footprint..." aria-label="Type your message" maxlength="500" />
                <button class="cc-send" title="Send message"><span>►</span></button>
            </div>
        </div>
        `;

        document.body.appendChild(widget);

        const header = widget.querySelector('.cc-header');
        const minimizeBtn = widget.querySelector('.cc-minimize');
        const body = widget.querySelector('.cc-body');
        const messages = widget.querySelector('.cc-messages');
        const input = widget.querySelector('input[type=text]');
        const sendBtn = widget.querySelector('.cc-send');

        let chatHistory = loadChatHistory();
        let isLoading = false;
        // Scrolling UX helpers
        let userScrolled = false; // true when user has scrolled up away from bottom
        const SCROLL_THRESHOLD = 80; // px tolerance to consider "at bottom"

        function isAtBottom(){
            return (messages.scrollHeight - messages.scrollTop - messages.clientHeight) <= SCROLL_THRESHOLD;
        }

        function scrollToBottom(smooth = true){
            try {
                if (smooth) {
                    // First, use direct scrollTop assignment to ensure immediate effect
                    messages.scrollTop = messages.scrollHeight;
                    // Then try smooth scroll if available
                    if (typeof messages.scrollTo === 'function') {
                        messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
                    }
                } else {
                    messages.scrollTop = messages.scrollHeight;
                }
            } catch (e) {
                // Absolute fallback
                try {
                    messages.scrollTop = messages.scrollHeight;
                } catch (err) {
                    console.error('Scroll failed:', err);
                }
            }
        }

        // Track user scroll interactions: if user scrolls up, avoid forcing scroll to bottom
        messages.addEventListener('scroll', () => {
            userScrolled = !isAtBottom();
            // hide new-message badge when user returns to bottom
            if(isAtBottom() && newBadge){
                newBadge.style.display = 'none';
                newBadge.setAttribute('aria-hidden','true');
            }
        });

        // Settings button and new-message badge
        const settingsBtn = widget.querySelector('.cc-settings');
        const newBadge = widget.querySelector('.cc-new-badge');
        let alwaysAutoScroll = localStorage.getItem('cc_always_autoscroll') === '1';

        function updateSettingsUI(){
            if(!settingsBtn) return;
            settingsBtn.classList.toggle('active', alwaysAutoScroll);
            settingsBtn.setAttribute('aria-pressed', alwaysAutoScroll ? 'true' : 'false');
            // update badge placement (in case of style changes)
            if(newBadge) newBadge.style.display = 'none';
        }

        updateSettingsUI();

        if(settingsBtn){
            settingsBtn.addEventListener('click', (e)=>{
                e.stopPropagation();
                alwaysAutoScroll = !alwaysAutoScroll;
                try{ localStorage.setItem('cc_always_autoscroll', alwaysAutoScroll ? '1' : '0'); }catch(e){}
                updateSettingsUI();
                if(alwaysAutoScroll){ userScrolled = false; scrollToBottom(true); if(newBadge) newBadge.style.display='none'; }
            });
        }

        if(newBadge){
            newBadge.addEventListener('click', (e)=>{
                e.stopPropagation();
                scrollToBottom(true);
                userScrolled = false;
                newBadge.style.display = 'none';
                newBadge.setAttribute('aria-hidden','true');
            });
            // keyboard support
            newBadge.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); newBadge.click(); } });
        }

        function appendMessage(text, who='bot', timestamp=null){
            const m = document.createElement('div');
            m.className = 'cc-msg ' + (who==='user' ? 'user' : 'bot');
            
            const b = document.createElement('div');
            b.className = 'bubble';
            b.textContent = text;
            m.appendChild(b);

            if(timestamp){
                const t = document.createElement('div');
                t.className = 'timestamp';
                t.textContent = timestamp;
                m.appendChild(t);
            }

            // Determine whether we should auto-scroll (user was at/near bottom)
            const shouldAutoScroll = isAtBottom();
            messages.appendChild(m);
            
            // Always scroll to bottom if auto-scroll is enabled OR user is at bottom
            if(shouldAutoScroll || alwaysAutoScroll){
                // Immediate scroll, then smooth scroll
                scrollToBottom(true);
                // Backup: scroll again in next frame
                requestAnimationFrame(() => scrollToBottom(false));
            } else {
                // Only show badge if user scrolled away AND it's a real message (not typing)
                if(newBadge && who !== 'typing'){
                    newBadge.style.display = 'block';
                    newBadge.setAttribute('aria-hidden','false');
                }
            }

            if(who !== 'typing'){
                chatHistory.push({ who, text, time: timestamp || getTimeString() });
                saveChatHistory(chatHistory);
            }
        }

        function appendTypingIndicator(){
            const m = document.createElement('div');
            m.className = 'cc-msg bot cc-typing-container';
            m.innerHTML = '<div class="cc-typing"><span></span><span></span><span></span></div>';
            m.id = 'cc-typing-indicator';
            messages.appendChild(m);
            
            // Always scroll if user at bottom or auto-scroll enabled
            if(isAtBottom() || alwaysAutoScroll){
                scrollToBottom(true);
                // Backup scroll
                requestAnimationFrame(() => scrollToBottom(false));
            } else {
                // Show new badge if user scrolled away
                if(newBadge){ 
                    newBadge.style.display = 'block'; 
                    newBadge.setAttribute('aria-hidden','false'); 
                }
            }
        }

        function removeTypingIndicator(){
            const typing = document.getElementById('cc-typing-indicator');
            if(typing) typing.remove();
        }

        // Toggle open/close
        function toggleChat(e){
            if(e.target.closest('.cc-minimize')) return;
            const isOpen = body.style.display === 'block';
            body.style.display = isOpen ? 'none' : 'block';
            minimizeBtn.textContent = isOpen ? '+' : '−';
            if(!isOpen){ 
                input.focus();
                // Opened chat -> bring user to latest messages unless they intentionally scrolled away
                if(!userScrolled) scrollToBottom(true);
            }
        }

        header.addEventListener('click', toggleChat);

        async function sendMessage(){
            const text = input.value.trim();
            if(!text || isLoading) return;

            appendMessage(text, 'user', getTimeString());
            input.value = '';
            input.focus();
            isLoading = true;
            sendBtn.disabled = true;

            appendTypingIndicator();

            try{
                const res = await fetch('/api/chat', {
                    method: 'POST', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message: text}),
                    timeout: 8000
                });
                const data = await res.json();
                removeTypingIndicator();

                if(data && data.success){
                    appendMessage(data.reply || 'Sorry, no reply.', 'bot', getTimeString());
                } else {
                    appendMessage(data.reply || 'Sorry, something went wrong.', 'bot', getTimeString());
                }
            }catch(err){
                removeTypingIndicator();
                appendMessage('⚠️ Network error. Please try again.', 'bot', getTimeString());
                console.error('Chat error:', err);
            }finally{
                isLoading = false;
                sendBtn.disabled = false;
            }
        }

        // Minimize toggle
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = body.style.display === 'block';
            body.style.display = isOpen ? 'none' : 'block';
            minimizeBtn.textContent = isOpen ? '+' : '−';
        });

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keydown', (e)=>{ 
            if(e.key === 'Enter' && !isLoading) sendMessage(); 
        });

        // Load chat history on open
        header.addEventListener('click', () => {
            if(body.style.display === 'block' && messages.children.length === 0){
                chatHistory.forEach(msg => {
                    appendMessage(msg.text, msg.who, msg.time);
                });
                if(chatHistory.length === 0){
                    setTimeout(()=> appendMessage('Hi 👋 I can help with carbon-saving tips and explain your results. What would you like to know?', 'bot', getTimeString()), 300);
                }
            }
        });

        // Initial welcome message (lazy-loaded)
        if(chatHistory.length === 0){
            setTimeout(()=> appendMessage('Hi 👋 I can help with carbon-saving tips and explain your results. What would you like to know?', 'bot', getTimeString()), 800);
        }
    }

    document.addEventListener('DOMContentLoaded', ()=>{
        try{ addStyles(); createWidget(); }catch(e){ console.error('Chat widget load failed', e); }
    });
})();
