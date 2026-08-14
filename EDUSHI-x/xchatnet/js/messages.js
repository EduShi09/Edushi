
        const appContainer = document.getElementById('appContainer');
        const chatInput = document.getElementById('chatInput');
        const msgContainer = document.getElementById('msgContainer');

        // Function to open chat on mobile view
        function openChat(name, status) {
            document.getElementById('activeUserName').innerText = name;
            document.getElementById('activeUserStatus').innerText = status;
            
            // Get initials
            const initials = name.split(' ').map(n => n[0]).join('');
            document.getElementById('activeAvatar').innerText = initials;

            appContainer.classList.add('show-chat');
        }

        // Back button function for mobile view
        function closeChat() {
            appContainer.classList.remove('show-chat');
        }

        // Send Message Handler
        function sendMessage() {
            const text = chatInput.value.trim();
            if (text === '') return;

            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const msgHTML = `
                <div class="msg-group outgoing">
                    <div class="bubble">
                        ${escapeHTML(text)}
                        <div class="msg-time">${time}</div>
                    </div>
                </div>
            `;

            msgContainer.insertAdjacentHTML('beforeend', msgHTML);
            chatInput.value = '';
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }

        // Send message on Enter key
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        // Helper to prevent HTML injection
        function escapeHTML(str) {
            return str.replace(/[&<>'"]/g, 
                tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
            );
        }
    