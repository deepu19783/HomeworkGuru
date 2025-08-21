        // Configuration
        const API_KEY = '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';
        const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
        
        let currentSubject = 'general';
        let currentImage = null;

        // Subject configurations
        const subjects = {
            general: {
                name: 'General',
                emoji: '🤔',
                context: 'You are a helpful educational assistant. Provide clear, accurate answers across various subjects.'
            },
            math: {
                name: 'Mathematics',
                emoji: '📐',
                context: 'You are an expert mathematics teacher. Explain concepts step-by-step with examples and provide clear solutions.'
            },
            physics: {
                name: 'Physics',
                emoji: '⚛️',
                context: 'You are an expert physics teacher. Explain concepts with real-world examples, formulas, and practical applications.'
            },
            chemistry: {
                name: 'Chemistry',
                emoji: '🧪',
                context: 'You are an expert chemistry teacher. Explain reactions, formulas, and concepts with clear examples.'
            },
            biology: {
                name: 'Biology',
                emoji: '🧬',
                context: 'You are an expert biology teacher. Explain biological processes and life sciences clearly.'
            },
            hindi: {
                name: 'हिंदी',
                emoji: '📚',
                context: 'आप एक विशेषज्ञ हिंदी शिक्षक हैं। हिंदी व्याकरण, साहित्य और भाषा को स्पष्ट रूप से समझाएं।'
            },
            english: {
                name: 'English',
                emoji: '📖',
                context: 'You are an expert English teacher. Help with grammar, literature, and language skills.'
            }
        };

        function selectSubject(subject) {
            currentSubject = subject;
            
            // Update active state
            document.querySelectorAll('.subject-card').forEach(card => {
                card.classList.remove('active');
            });
            document.querySelector(`[data-subject="${subject}"]`).classList.add('active');
            
            const subjectInfo = subjects[subject];
            addMessage('ai', `${subjectInfo.emoji} ${subjectInfo.name} selected! Now ask questions related to this subject.`);
        }

        function handleImageUpload(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    currentImage = e.target.result;
                    const preview = document.getElementById('imagePreview');
                    preview.src = currentImage;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        }

        function setExample(text) {
            document.getElementById('textInput').value = text;
            autoResize(document.getElementById('textInput'));
        }

        function autoResize(textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
        }

        function handleKeyPress(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        }

        async function sendMessage() {
            const textInput = document.getElementById('textInput');
            const message = textInput.value.trim();
            
            if (!message && !currentImage) {
                alert('Please enter a question or upload an image!');
                return;
            }

            // Prepare user message
            let userMessage = message;
            if (currentImage) {
                userMessage += '\n[Image uploaded]';
            }

            // Add user message to chat
            addMessage('user', userMessage, currentImage);
            
            // Clear inputs
            textInput.value = '';
            textInput.style.height = 'auto';
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('imageInput').value = '';
            
            // Show typing indicator
            showTyping();
            
            // Disable send button
            document.getElementById('sendBtn').disabled = true;

            try {
                const response = await callAPI(message, currentImage);
                hideTyping();
                addMessage('ai', response);
            } catch (error) {
                hideTyping();
                addMessage('ai', 'Sorry, there was an error. Please try again. 😔\n\nError: ' + error.message);
            }
            
            // Reset
            currentImage = null;
            document.getElementById('sendBtn').disabled = false;
        }

        async function callAPI(text, image) {
            const subjectContext = subjects[currentSubject].context;
            
            let messages = [{
                role: 'system',
                content: subjectContext + '\n\nAlways respond in the same language as the question (Hindi or English). Provide detailed, educational explanations.'
            }];

            // Prepare user message
            let userContent = [];
            
            if (text) {
                userContent.push({
                    type: 'text',
                    text: text
                });
            }
            
            if (image) {
                userContent.push({
                    type: 'image_url',
                    image_url: {
                        url: image
                    }
                });
            }

            messages.push({
                role: 'user',
                content: userContent
            });

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`,
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Educational AI Assistant'
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-3.2-11b-vision-instruct:free',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            } else {
                throw new Error('Invalid response format');
            }
        }

        function addMessage(sender, message, image = null) {
            const container = document.getElementById('messagesContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}`;
            
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            
            let content = message.replace(/\n/g, '<br>');
            
            if (image && sender === 'user') {
                content = `<img src="${image}" style="max-width: 200px; max-height: 200px; border-radius: 8px; margin-bottom: 8px; display: block;"><br>${content}`;
            }
            
            bubble.innerHTML = content;
            messageDiv.appendChild(bubble);
            container.appendChild(messageDiv);
            
            // Scroll to bottom
            container.scrollTop = container.scrollHeight;
        }

        function showTyping() {
            document.getElementById('typingIndicator').style.display = 'flex';
            document.getElementById('messagesContainer').scrollTop = document.getElementById('messagesContainer').scrollHeight;
        }

        function hideTyping() {
            document.getElementById('typingIndicator').style.display = 'none';
        }

        // Initialize
        window.addEventListener('load', function() {
            selectSubject('general');
        });