let chatHistory = [];
const database = window.database || (typeof firebase !== 'undefined' ? firebase.database() : null);

async function sendMessage() {
    const input = document.getElementById('user-input');
    const container = document.getElementById('chat-container');
    const apiKey = localStorage.getItem("gemini_api_key");

    if (!apiKey) {
        showCustomAlert("Input API Key dulu di Profil, baru bisa ngobrol! 🗿");
        return;
    }

    if (input.value.trim() !== "") {
        const userMsg = input.value;
        appendMessage(userMsg, 'user-bubble');
        input.value = "";

        const typingId = 'typing-indicator';
        appendMessage("Sahabat AI sedang berpikir...", 'ai-bubble', typingId);
        
        chatHistory.push({ role: "user", parts: [{ text: userMsg }] });
        localStorage.setItem("chat_history_data", JSON.stringify(chatHistory));

        if (database) {
            try { database.ref('chats').push({ role: "user", text: userMsg, timestamp: firebase.database.ServerValue.TIMESTAMP }); } catch (e) {}
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: "Jawablah selalu dengan bahasa Indonesia yang santai dan akrab. Jangan gunakan bahasa lain selain Indonesia." }] },
                        ...chatHistory,
                        { role: "user", parts: [{ text: userMsg }] }
                    ]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf Direktur, otak AI lagi loading. 🗿";
            chatHistory.push({ role: "model", parts: [{ text: aiReply }] });
            localStorage.setItem("chat_history_data", JSON.stringify(chatHistory));

            if (database) {
                try { database.ref('chats').push({ role: "model", text: aiReply, timestamp: firebase.database.ServerValue.TIMESTAMP }); } catch (e) {}
            }

            document.getElementById(typingId).remove();
            appendMessage(aiReply, 'ai-bubble');
        } catch (error) {
            document.getElementById(typingId).remove();
            appendMessage("Error: " + error.message, 'ai-bubble');
        }
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
}

function appendMessage(text, className, id = "") {
    const container = document.getElementById('chat-container');
    if (!container) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${className}`;
    if (id) bubble.id = id;
    bubble.innerHTML = text.replace(/\n/g, '<br>'); 
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
}

function startVoice() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    const input = document.getElementById('user-input');
    const micBtn = document.querySelector('.action-btn[onclick="startVoice()"]');
    recognition.lang = 'id-ID';
    micBtn.style.color = "#ff0000"; 
    input.placeholder = "Lagi dengerin, Direktur...";
    recognition.start();
    recognition.onresult = (e) => { input.value = e.results[0][0].transcript; sendMessage(); };
    recognition.onend = () => { micBtn.style.color = "#00f2ff"; input.placeholder = "Tanya Sahabat AI..."; };
}

function saveApiKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (key.startsWith("AIza")) { localStorage.setItem("gemini_api_key", key); showCustomAlert("API Key disimpan! 🔥"); closeModal(); }
    else { showCustomAlert("API Key nggak valid! ❌"); }
}

function clearApiKey() {
    localStorage.removeItem("gemini_api_key");
    showCustomAlert("API Key berhasil dihapus dari browser lo! 🔒");
    document.getElementById('api-key-input').value = ""; 
    closeModal();
}

function showCustomAlert(msg) { document.getElementById('alert-message').textContent = msg; document.getElementById('custom-alert').style.display = 'block'; }
function closeAlert() { document.getElementById('custom-alert').style.display = 'none'; }
function closeModal() { document.getElementById('profile-modal').style.display = 'none'; }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function newChat() { document.getElementById('chat-container').innerHTML = ""; chatHistory = []; localStorage.removeItem("chat_history_data"); toggleSidebar(); }
function removeImage() { document.getElementById('image-preview-container').style.display = 'none'; }
function openProfile() { document.getElementById('profile-modal').style.display = 'block'; document.getElementById('api-key-input').value = localStorage.getItem("gemini_api_key") || ""; }
function showMaintenanceAlert() { showCustomAlert("Fitur gambar lagi diperbaiki! 🗿"); }

window.addEventListener('DOMContentLoaded', () => {
    const savedChat = localStorage.getItem("chat_history_data");
    if (savedChat) {
        try {
            const parsedData = JSON.parse(savedChat);
            if (Array.isArray(parsedData)) {
                chatHistory = parsedData;
                chatHistory.forEach(item => {
                    if (item && item.parts && item.parts[0]) appendMessage(item.parts[0].text, item.role === "user" ? "user-bubble" : "ai-bubble");
                });
            }
        } catch (e) { localStorage.removeItem("chat_history_data"); }
    }
});
