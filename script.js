// script.js
const GEMINI_API_KEY = 'AIzaSyDp6CioNpkxPVU9ZLTuJDEQ5nquRV3Z3Eo';
console.log('Gemini key loaded:', GEMINI_API_KEY.slice(0,5) + '…');

// 0. Define bot name
const BOT_NAME = 'HAI';

// 1. Personality system prompt with name
const SYSTEM_PROMPT = `You are ${BOT_NAME}, a kind, professional AI assistant. Always respond with empathy, clarity, and respect.`;

const inputEl = document.getElementById('chat-input');
const chatLog = document.getElementById('chat-log');

// 2. Memory store
const chatMemory = [];

// 3. Listen for Enter key
inputEl.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter' || !e.target.value.trim()) return;
  const userMsg = e.target.value.trim();
  appendMessage('You', userMsg);
  chatMemory.push({ author: 'You', text: userMsg });
  e.target.value = '';
  try {
    const aiReply = await getGeminiResponse(userMsg);
    appendMessage(BOT_NAME, aiReply);
    chatMemory.push({ author: BOT_NAME, text: aiReply });
  } catch (err) {
    appendMessage('System', `⚠️ Error: ${err.message}`);
  }
});

// 4. Format and append messages
function appendMessage(sender, text) {
  const entry = document.createElement('div');
  entry.innerHTML = `<strong>${sender}:</strong> ${formatMessage(text)}`;
  chatLog.appendChild(entry);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// 5. Markdown → HTML
function formatMessage(text) {
  let html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  const lines = html.split('\n');
  let result = '', inList = false;
  lines.forEach(line => {
    if (line.startsWith('- ')) {
      if (!inList) { result += '<ul>'; inList = true; }
      result += `<li>${line.slice(2)}</li>`;
    } else {
      if (inList) { result += '</ul>'; inList = false; }
      if (line.trim()) result += `<p>${line}</p>`;
    }
  });
  if (inList) result += '</ul>';
  return result;
}

// 6. Send API request including personality & last 6 messages as context
async function getGeminiResponse(message) {
  const recent = chatMemory.slice(-6)
    .map(m => `${m.author}: ${m.text}`)
    .join('\n');
  const promptText = `${SYSTEM_PROMPT}\n\n${recent}\nYou: ${message}\n${BOT_NAME}:`;
  const payload = { contents: [{ parts: [{ text: promptText }] }] };
  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify(payload)
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || res.statusText);
  return data.candidates?.[0]?.content?.parts?.[0]?.text.trim() || 'No response';
}