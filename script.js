document.addEventListener('DOMContentLoaded', function () {
    const chatToggle = document.getElementById('chat-toggle');
    const ctaChat = document.getElementById('cta-chat');
    const ctaChatBottom = document.getElementById('cta-chat-bottom');
    const chatModal = document.getElementById('chat-modal');
    const closeChat = document.getElementById('close-chat');
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    function toggleChatModal() {
        chatModal.classList.toggle('hidden');
        if (!chatModal.classList.contains('hidden')) {
            userInput.focus();
        }
    }

    chatToggle.addEventListener('click', toggleChatModal);
    ctaChat.addEventListener('click', toggleChatModal);
    ctaChatBottom.addEventListener('click', toggleChatModal);
    closeChat.addEventListener('click', toggleChatModal);

    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const icon = question.querySelector('.faq-icon');

            answer.classList.toggle('hidden');
            icon.classList.toggle('rotate-180');
        });
    });

    function formatBotResponse(text) {
        // Convert bold markdown **text**
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Convert * bullets to list items
        const lines = text.split('\n');
        let inList = false;
        let formatted = '';

        lines.forEach(line => {
            if (line.trim().startsWith('* ')) {
                if (!inList) {
                    formatted += '<ul class="list-disc ml-5 mb-2">';
                    inList = true;
                }
                formatted += `<li>${line.trim().substring(2)}</li>`;
            } else {
                if (inList) {
                    formatted += '</ul>';
                    inList = false;
                }
                formatted += `<p class="mb-2">${line.trim()}</p>`;
            }
        });

        if (inList) formatted += '</ul>';

        // Convert bare URLs to links
        formatted = formatted.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" class="text-indigo-400 underline">$1</a>'
        );
        formatted = formatted.replace(
            /\b(iihs\.org|nhtsa\.gov)\b/g,
            '<a href="https://$1" target="_blank" class="text-indigo-400 underline">$1</a>'
        );

        return formatted;
    }

    function addMessageToChat(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'flex items-start my-2';

        if (sender === 'user') {
            messageDiv.className += ' justify-end';
            messageDiv.innerHTML = `
                <div class="ml-3">
                    <div class="bg-indigo-600 rounded-lg p-3 max-w-xs md:max-w-md">
                        <p class="text-sm text-white">${message}</p>
                    </div>
                </div>
                <div class="flex-shrink-0 bg-gray-700 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                    </svg>
                </div>
            `;
        } else {
            const formattedMessage = formatBotResponse(message);
            messageDiv.className += ' justify-start';
            messageDiv.innerHTML = `
                <div class="flex-shrink-0 bg-indigo-600 rounded-full p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <div class="bg-gray-700 rounded-lg p-3 max-w-xs md:max-w-md">
                        <div class="text-sm text-gray-200">${formattedMessage}</div>
                    </div>
                </div>
            `;
        }

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    async function callGeminiAPI(prompt) {
        const apiKey = 'AIzaSyCeawDU1CabnSPh7ygw_QSCm1sAW3NBpGI';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }]
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't understand that.";
            addMessageToChat('bot', reply);
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            addMessageToChat('bot', 'Oops! Something went wrong. Please try again later.');
        }
    }

    function handleUserInput() {
        const message = userInput.value.trim();
        if (message !== '') {
            addMessageToChat('user', message);
            userInput.value = '';
            callGeminiAPI(message);
        }
    }

    sendBtn.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleUserInput();
        }
    });
});
