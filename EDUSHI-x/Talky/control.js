// =========================================================
// TALKY ZONE - CORE CONTROL SCRIPT (LOCAL VERSION)
// =========================================================

window.SUPABASE_URL = "https://sxrdpcfyvmicjqzzwjqv.supabase.co";
window.SUPABASE_KEY = "sb_publishable_NapVtLJzaIpxmvrcY4TT7A_D1ll1tfp";

var currentUser = null;
var selectedReply = null;

function getSupabase() {
    if (!window.supabaseClient && typeof supabase !== 'undefined') {
        window.supabaseClient = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
    }
    return window.supabaseClient;
}

// Enter Key to Send Listener
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target && e.target.id === 'message-input') {
        e.preventDefault();
        sendGroupMessage();
    }
});

async function authenticateUser() {
    const client = getSupabase();
    if (!client) return alert("Supabase loading... Please try again in 2 seconds.");

    const key = document.getElementById("user-key-input").value.trim();
    if (key.length !== 6) return alert("Enter valid 6-digit key!");

    const { data, error } = await client
        .from('group_users')
        .select('*')
        .eq('user_key', key)
        .single();

    if (error || !data) {
        alert("Invalid Access Key!");
        return;
    }

    currentUser = data;
    toggleModal('auth-modal', false);

    if (currentUser.role === 'owner') {
        const adminBtn = document.getElementById('admin-btn');
        if (adminBtn) adminBtn.classList.remove('hidden');
    }

    document.getElementById('welcome-msg').innerText = `Welcome ${currentUser.name} to Talky Zone!`;
    toggleModal('welcome-modal', true);

    loadGroupMessages();
    listenRealtimeMessages();
}

function closeWelcomeModal() {
    toggleModal('welcome-modal', false);
}

// Fast Loading with Limit 50 Messages
async function loadGroupMessages() {
    const chatBox = document.getElementById('chat-box');
    if (chatBox) chatBox.innerHTML = '<div style="text-align:center; color:#94a3b8; padding:20px;">Loading messages...</div>';

    const client = getSupabase();
    const { data: messages, error } = await client
        .from('group_messages')
        .select('*')
        .order('id', { ascending: false })
        .limit(50);

    if (error) return console.error(error);

    if (chatBox) chatBox.innerHTML = '';

    const reversedMsgs = messages.reverse();

    const partnerMsg = reversedMsgs.find(m => m.sender_key !== currentUser.user_key);
    if (partnerMsg) {
        updatePartnerHeader(partnerMsg.sender_name, partnerMsg.sender_pfp, partnerMsg.sender_role);
    }

    let allHTML = '';
    reversedMsgs.forEach(msg => {
        allHTML += getMessageHTMLString(msg);
    });

    chatBox.innerHTML = allHTML;
    scrollToBottom();
}

function updatePartnerHeader(name, pfp, role) {
    const partnerNameEl = document.getElementById('partner-name');
    const partnerPfpEl = document.getElementById('partner-pfp');
    const partnerBadgeEl = document.getElementById('partner-role-badge');

    if (partnerNameEl) partnerNameEl.innerText = name || 'User';
    if (partnerPfpEl && pfp) partnerPfpEl.src = pfp;
    if (partnerBadgeEl) {
        partnerBadgeEl.innerText = role || 'user';
        partnerBadgeEl.className = `role-badge badge-${role || 'normal'}`;
    }
}

function listenRealtimeMessages() {
    const client = getSupabase();
    client
        .channel('group-chat')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, payload => {
            const newMsg = payload.new;
            if (newMsg.sender_key !== currentUser.user_key) {
                updatePartnerHeader(newMsg.sender_name, newMsg.sender_pfp, newMsg.sender_role);
            }
            renderSingleMessageUI(newMsg);
            scrollToBottom();
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'group_messages' }, payload => {
            const elem = document.getElementById(`msg-${payload.old.id}`);
            if (elem) elem.remove();
        })
        .subscribe();
}

// Convert links inside text to clickable <a> tags
function formatMessageContent(text) {
    if (!text) return '';
    if (text.includes('<img') || text.includes('<video') || text.includes('<audio') || text.includes('<a ')) {
        return text;
    }
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
}

function getMessageHTMLString(msg) {
    const isMe = msg.sender_key === currentUser.user_key;
    let replyHTML = msg.reply_to ? `<div class="reply-preview-box"><b>${msg.reply_to.sender}:</b> ${msg.reply_to.text}</div>` : '';
    let timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const safeSender = (msg.sender_name || 'User').replace(/'/g, "");
    const safeText = (msg.message || '').replace(/'/g, "").replace(/"/g, '');
    const formattedContent = formatMessageContent(msg.message);

    return `
        <div class="msg-row ${isMe ? 'sent' : 'received'}" id="msg-${msg.id}">
            <div class="msg-bubble" ondblclick="triggerReply('${safeSender}', '${safeText}')">
                <div class="msg-sender-header">
                    <span>${msg.sender_name} <span class="role-badge badge-${msg.sender_role}">${msg.sender_role}</span></span>
                    ${isMe ? `<i class="fa-solid fa-trash-can delete-btn" onclick="deleteMessage(${msg.id})"></i>` : ''}
                </div>
                ${replyHTML}
                <div class="msg-content">${formattedContent}</div>
                <div class="msg-time">${timeStr}</div>
            </div>
        </div>
    `;
}

function renderSingleMessageUI(msg) {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    chatBox.insertAdjacentHTML('beforeend', getMessageHTMLString(msg));
}

async function sendGroupMessage() {
    const input = document.getElementById('message-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const payload = {
        sender_name: currentUser.name,
        sender_key: currentUser.user_key,
        sender_role: currentUser.role,
        sender_pfp: currentUser.pfp_url,
        message: text,
        reply_to: selectedReply
    };

    input.value = '';
    cancelReply();

    const client = getSupabase();
    await client.from('group_messages').insert([payload]);
}

function triggerReply(sender, text) {
    selectedReply = { sender, text };
    document.getElementById('reply-text-preview').innerText = `Replying to ${sender}: "${text}"`;
    document.getElementById('reply-bar').classList.remove('hidden');
}

function cancelReply() {
    selectedReply = null;
    document.getElementById('reply-bar').classList.add('hidden');
}

async function deleteMessage(id) {
    if (confirm("Delete this message?")) {
        const client = getSupabase();
        await client.from('group_messages').delete().eq('id', id);
    }
}

async function addNewUser() {
    const name = document.getElementById('new-user-name').value.trim();
    const key = document.getElementById('new-user-key').value.trim();
    const role = document.getElementById('new-user-role').value;

    if (!name || key.length !== 6) return alert("Fill out all fields correctly!");

    const client = getSupabase();
    const { error } = await client.from('group_users').insert([{ name, user_key: key, role }]);
    if (error) alert("Error adding user: " + error.message);
    else {
        alert("User added!");
        toggleModal('admin-modal', false);
    }
}

// Media Lightbox
function openMediaModal(url, type) {
    const container = document.getElementById('media-container');
    if (!container) return;

    if (type === 'image') {
        container.innerHTML = `<img src="${url}" />`;
    } else if (type === 'video') {
        container.innerHTML = `<video src="${url}" controls autoplay></video>`;
    }

    toggleModal('media-modal', true);
}

function closeMediaModal(e) {
    if (e.target.id === 'media-modal' || e.target.classList.contains('lightbox-close')) {
        const container = document.getElementById('media-container');
        if (container) container.innerHTML = '';
        toggleModal('media-modal', false);
    }
}

// Upload Files
async function uploadAndSendFile(input) {
    const file = input.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `files/${fileName}`;

    const client = getSupabase();
    const { error } = await client.storage
        .from('chat-attachments')
        .upload(filePath, file);

    if (error) return alert("File upload failed: " + error.message);

    const { data: publicUrlData } = client.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

    const fileUrl = publicUrlData.publicUrl;
    let fileHTML = "";

    if (file.type.startsWith('image/')) {
        fileHTML = `<img src="${fileUrl}" class="chat-media-preview" onclick="openMediaModal('${fileUrl}', 'image')">`;
    } else if (file.type.startsWith('video/')) {
        fileHTML = `<video src="${fileUrl}" class="chat-media-preview" onclick="openMediaModal('${fileUrl}', 'video')"></video>`;
    } else {
        fileHTML = `<a href="${fileUrl}" target="_blank" style="color:#38bdf8;"><i class="fa-solid fa-file"></i> ${file.name}</a>`;
    }

    await client.from('group_messages').insert([{
        sender_name: currentUser.name,
        sender_key: currentUser.user_key,
        sender_role: currentUser.role,
        sender_pfp: currentUser.pfp_url,
        message: fileHTML,
        reply_to: selectedReply
    }]);

    input.value = '';
}

// Voice Note Recording
var mediaRecorder = null;
var audioChunks = [];
var isRecording = false;

async function toggleVoiceRecording() {
    const micBtn = document.getElementById('mic-btn');

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = event => audioChunks.push(event.data);

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await uploadAudioAndSend(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;
            if (micBtn) micBtn.style.background = "#ef4444";
        } catch (e) {
            alert("Microphone permission required!");
        }
    } else {
        mediaRecorder.stop();
        isRecording = false;
        if (micBtn) micBtn.style.background = "#1e293b";
    }
}

async function uploadAudioAndSend(blob) {
    const fileName = `voice_${Date.now()}.webm`;
    const filePath = `audio/${fileName}`;

    const client = getSupabase();
    const { error } = await client.storage
        .from('chat-attachments')
        .upload(filePath, blob, { contentType: 'audio/webm' });

    if (error) return alert("Audio upload failed: " + error.message);

    const { data: publicUrlData } = client.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

    const audioUrl = publicUrlData.publicUrl;
    const audioHTML = `
        <div class="voice-note-card">
            <i class="fa-solid fa-microphone-lines" style="color:#38bdf8;"></i>
            <audio controls src="${audioUrl}"></audio>
        </div>
    `;

    await client.from('group_messages').insert([{
        sender_name: currentUser.name,
        sender_key: currentUser.user_key,
        sender_role: currentUser.role,
        sender_pfp: currentUser.pfp_url,
        message: audioHTML,
        reply_to: selectedReply
    }]);
}

// EMG Button
function triggerEMG() {
    const emgOverlay = document.getElementById('emg-overlay');
    if (emgOverlay) {
        emgOverlay.classList.remove('hidden');
    }
    setTimeout(() => {
        window.location.href = "https://www.google.com";
    }, 400);
}

function toggleModal(id, show) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !show);
}

function scrollToBottom() {
    const box = document.getElementById('chat-box');
    if (box) box.scrollTop = box.scrollHeight;
}
