document.addEventListener('DOMContentLoaded', () => {
    const chatbox = document.getElementById('chatbox');
    const languageSelector = document.getElementById('languageSelector');
    let currentLanguage = 'en'; // Default language

    const uiStrings = {
        'en': {
            'sendButtonText': 'Send',
            'recordButtonText': '🎤',
            'userInputPlaceholder': 'Type your symptoms...',
            'recordingStatusDefault': 'Click 🎤 to record',
            'recordingStatusStart': 'Recording... Speak now.',
            'recordingStatusFinished': 'Recording finished.',
            'recordingStatusError': 'Error: ',
            'recordingErrorNoSpeech': 'No speech detected.',
            'recordingErrorAudioCapture': 'Mic capture failed.',
            'recordingErrorNotAllowed': 'Mic permission denied.',
            'chatAiName': 'AI Assistant',
            'testTTSButton': 'Test TTS',
            'languageSelectorLabel': 'Language: ',
            'staticDisclaimer': "This is an AI assistant and not a substitute for professional medical advice. Always consult a doctor for health concerns."
        },
        'fr': {
            'sendButtonText': 'Envoyer',
            'recordButtonText': '🎤',
            'userInputPlaceholder': 'Décrivez vos symptômes...',
            'recordingStatusDefault': 'Cliquez 🎤 pour enregistrer',
            'recordingStatusStart': 'Enregistrement...',
            'recordingStatusFinished': 'Enregistrement terminé.',
            'recordingStatusError': 'Erreur: ',
            'recordingErrorNoSpeech': 'Aucune parole détectée.',
            'recordingErrorAudioCapture': 'Échec capture micro.',
            'recordingErrorNotAllowed': 'Permission micro refusée.',
            'chatAiName': 'Assistant IA',
            'testTTSButton': 'Tester TTS',
            'languageSelectorLabel': 'Langue: ',
            'staticDisclaimer': "Ceci est un assistant IA et ne remplace pas un avis médical professionnel. Consultez toujours un médecin pour vos problèmes de santé."
        },
        'wo': {
            'sendButtonText': 'Yónne',
            'recordButtonText': '🎤',
            'userInputPlaceholder': 'Xamal say feeñtéef...',
            'recordingStatusDefault': 'Cuqal 🎤 ngir baat bi biyye',
            'recordingStatusStart': 'Baat bi mingi biyye...',
            'recordingStatusFinished': 'Biyye gi jeexna.',
            'recordingStatusError': 'Njuumte: ',
            'recordingErrorNoSpeech': 'Amul baat buñu dégg.',
            'recordingErrorAudioCapture': 'Jappu micro bi antuwul.',
            'recordingErrorNotAllowed': 'Sañ-sañu micro bi dañu ko dakkal.',
            'chatAiName': 'Ndimalu IA',
            'testTTSButton': 'Geesatu TTS',
            'languageSelectorLabel': 'Kàllaama: ',
            'staticDisclaimer': "Ndimalu IA la, te mënutu wuutu ndigëlu fajkat bu wor. Fóleel saasune doktoor ngir say jafe-jafey wergi-yaram."
        }
    };

    function updateUI(lang) {
        currentLanguage = lang;
        const strings = uiStrings[lang];

        // Update button texts
        document.getElementById('sendButton').textContent = strings.sendButtonText;
        // recordButton might just be an icon, but if it had text:
        // document.getElementById('recordButton').textContent = strings.recordButtonText; 

        // Update input placeholder
        document.getElementById('userInput').placeholder = strings.userInputPlaceholder;
        
        // Update chat AI name (if displayed dynamically, for now it's part of system prompt)
        // This could be used if we prepend "AI:" to messages, for example.

        // Update static text if any (e.g. title, labels)
        // Example: document.querySelector('label[for="languageSelector"]').textContent = strings.languageSelectorLabel;
        // The actual label is outside the script's direct control here, but good practice for other elements.
        
        // Update recording status default text (if we reset to a default)
        // recordingStatus.textContent = strings.recordingStatusDefault; // Or handle this in STT logic

        // Update TTS test button text
        const testTTSButton = document.querySelector('button[onclick^="speakText"]');
        if (testTTSButton) {
            // A bit hacky to find it, better to give it an ID if it's permanent
            testTTSButton.textContent = strings.testTTSButton;
        }

        // Update STT language
        if (recognition) {
            if (lang === 'wo') {
                recognition.lang = 'wo-SN'; // Specifically use wo-SN for Wolof
            } else {
                recognition.lang = lang + (lang === 'en' ? '-US' : '-' + lang.toUpperCase());
            }
            console.log("STT language set to: " + recognition.lang);
        }
        
        // Update static disclaimer text
        const staticDisclaimerDiv = document.getElementById('static-disclaimer');
        if (staticDisclaimerDiv) {
            staticDisclaimerDiv.textContent = strings.staticDisclaimer;
        }
    }

    // Initial UI setup
    updateUI(languageSelector.value || 'en');

    // Event listener for language selector
    languageSelector.addEventListener('change', (event) => {
        updateUI(event.target.value);
    });

    // Ensure chatbox and other elements are defined before being used in existing functions
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');

    // Function to append a message to the chatbox
    function appendMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'ai-message');
        // For AI messages, prepend the AI name from uiStrings
        if (sender === 'ai' || sender === 'ai-error') {
            const aiName = uiStrings[currentLanguage] ? uiStrings[currentLanguage].chatAiName : uiStrings['en'].chatAiName;
            const messagePrefix = document.createElement('strong');
            messagePrefix.textContent = aiName + ": ";
            messageDiv.appendChild(messagePrefix);
        }
        messageDiv.append(message); // Appends text content correctly after potential prefix
        chatbox.appendChild(messageDiv);
        chatbox.scrollTop = chatbox.scrollHeight; // Scroll to the bottom
    }

    // --- Text-to-Speech (TTS) Functionality ---
    // Note: The first definition of sendMessage and its event listeners were removed 
    // as they were superseded by the more complete one below, which includes language features.

    // Check for browser support for Web Speech API
    if (!('speechSynthesis' in window)) {
        console.warn("Browser does not support Web Speech API (speechSynthesis). TTS will not be available.");
        // Optionally, disable any TTS-related UI elements here if they were to be added.
    }

    // Function to speak text using Web Speech API
    function speakText(text) { // Removed lang parameter, will use global currentLanguage
        if (!('speechSynthesis'in window)) {
            console.warn("Speech synthesis not supported. Cannot speak text.");
            return;
        }

        // Optional: Log available voices for debugging
        // console.log(speechSynthesis.getVoices());

        const utterance = new SpeechSynthesisUtterance(text);
        // Determine TTS language code (e.g., 'en-US', 'fr-FR', 'wo-SN')
        let ttsLang = currentLanguage;
        if (currentLanguage === 'en') ttsLang = 'en-US';
        else if (currentLanguage === 'fr') ttsLang = 'fr-FR';
        else if (currentLanguage === 'wo') ttsLang = 'wo-SN'; // Wolof might need a specific regional variant if available
        // Add more language-to-locale mappings if necessary

        utterance.lang = ttsLang;
        console.log("TTS language set to: " + utterance.lang);
        
        // Optional: Select a specific voice if needed, after voices are loaded
        // speechSynthesis.getVoices().forEach(voice => console.log(voice.name, voice.lang)); // Log voices
        // utterance.onstart = () => { // Ensure voices are loaded
        //     const voices = speechSynthesis.getVoices();
        //     const targetVoice = voices.find(voice => voice.lang === ttsLang);
        //     if (targetVoice) {
        //         utterance.voice = targetVoice;
        //         console.log("Using voice: " + targetVoice.name);
        //     } else {
        //         console.warn("No specific voice found for " + ttsLang + ". Using default.");
        //     }
        // };
        
        speechSynthesis.speak(utterance);
    }

    // Function to speak text using Web Speech API (already updated for currentLanguage)
    // function speakText(text) { ... } // This is correctly defined later

    // --- Main sendMessage function (modified for language and TTS) ---
    async function sendMessage() { // This is the correct sendMessage function
        const messageText = userInput.value.trim();
        if (messageText === '') {
            return;
        }

        appendMessage(messageText, 'user');
        userInput.value = '';

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: messageText, language: currentLanguage }), // Send current language
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMessage = `${uiStrings[currentLanguage].recordingStatusError} ${response.status}`;
                if (errorData && errorData.error) {
                    errorMessage += ` - ${errorData.error}`;
                }
                appendMessage(errorMessage, 'ai-error');
                speakText(errorMessage); // Speak the error message in selected language
                console.error('Error sending message:', errorData);
                return;
            }

            const data = await response.json();
            if (data.response) {
                appendMessage(data.response, 'ai');
                speakText(data.response); // Speak the AI's response in selected language
            } else if (data.error) {
                const aiErrorMsg = `${uiStrings[currentLanguage].chatAiName} ${uiStrings[currentLanguage].recordingStatusError} ${data.error}`;
                appendMessage(aiErrorMsg, 'ai-error');
                speakText(aiErrorMsg); // Speak the AI error in selected language
                console.error('AI Error:', data.error);
            }

        } catch (error) {
            const networkErrorMsg = uiStrings[currentLanguage].recordingStatusError + 'Network issue or server unreachable.';
            appendMessage(networkErrorMsg, 'ai-error');
            speakText(networkErrorMsg); // Speak the network error in selected language
            console.error('Fetch error:', error);
        }
    }

    // Event listeners for the main sendMessage function
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // --- Speech-to-Text (STT) Functionality ---
    const recordButton = document.getElementById('recordButton');
    const recordingStatus = document.getElementById('recording-status');
    // Ensure recordingStatus is initialized with translated string via updateUI or here
    if (recordingStatus && uiStrings[currentLanguage]) {
         // updateUI already called, this is a fallback if STT section runs before updateUI completes for this element
        // recordingStatus.textContent = uiStrings[currentLanguage].recordingStatusDefault || '';
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false; // Process after a single utterance
        recognition.interimResults = true; // Get interim results
        recognition.lang = 'en-US'; // Set language to English

        // Event handler when recognition starts
        recognition.onstart = () => {
            recordingStatus.textContent = uiStrings[currentLanguage].recordingStatusStart;
            recordButton.textContent = '🛑';
            recordButton.disabled = true; // Disable button while recording to prevent re-clicks before it auto-stops
        };

        // Event handler for results
        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            userInput.value = finalTranscript + interimTranscript; // Show interim results, will be finalized

            if (finalTranscript) {
                userInput.value = finalTranscript.trim();
                // Optional: Automatically send the message, or let user press send.
                // For now, just populating the field.
                // sendMessage(); // Uncomment to auto-send
            }
        };

        // Event handler for errors
        recognition.onerror = (event) => {
            let errorMessage = uiStrings[currentLanguage].recordingStatusError;
            if (event.error === 'no-speech') {
                errorMessage += uiStrings[currentLanguage].recordingErrorNoSpeech;
            } else if (event.error === 'audio-capture') {
                errorMessage += uiStrings[currentLanguage].recordingErrorAudioCapture;
            } else if (event.error === 'not-allowed') {
                errorMessage += uiStrings[currentLanguage].recordingErrorNotAllowed;
            } else {
                errorMessage += event.error;
            }
            recordingStatus.textContent = errorMessage;
            console.error('Speech recognition error:', event.error, errorMessage);
        };

        // Event handler when recognition ends
        recognition.onend = () => {
            // Check if the status was 'Recording...' to avoid overwriting an error message
            if (recordingStatus.textContent === uiStrings[currentLanguage].recordingStatusStart) {
                 recordingStatus.textContent = uiStrings[currentLanguage].recordingStatusFinished;
            }
            recordButton.textContent = uiStrings[currentLanguage].recordButtonText; // Reset button icon/text
            recordButton.disabled = false; // Re-enable button
            
            // Automatically clear status after a few seconds, only if it's a "finished" or "error" message
            const currentStatus = recordingStatus.textContent;
            const finishedMsg = uiStrings[currentLanguage].recordingStatusFinished;
            const errorPrefix = uiStrings[currentLanguage].recordingStatusError;

            setTimeout(() => {
                if (recordingStatus.textContent === currentStatus && (currentStatus === finishedMsg || currentStatus.startsWith(errorPrefix))) {
                    recordingStatus.textContent = uiStrings[currentLanguage].recordingStatusDefault || ''; // Reset to default or empty
                }
            }, 3000);
        };

        // Event listener for the record button
        recordButton.addEventListener('click', () => {
            if (recognition && !recordButton.disabled) { // Check if not already processing
                try {
                    recognition.start();
                } catch (e) {
                    // This can happen if recognition is already started and not yet ended.
                    console.warn("Recognition already active or could not start: ", e);
                    // Use a generic message or a translated one if available for this specific case
                    recordingStatus.textContent = "Processing previous audio, please wait."; 
                     setTimeout(() => { 
                        if (recordingStatus.textContent === "Processing previous audio, please wait.") {
                            recordingStatus.textContent = uiStrings[currentLanguage].recordingStatusDefault || '';
                        }
                    }, 2000);
                }
            }
        });

    } else {
        console.error("Browser does not support Web Speech API (SpeechRecognition). STT will not be available.");
        recordingStatus.textContent = "Speech recognition not supported by your browser."; // This string could be translated too.
        if(recordButton) {
            recordButton.disabled = true;
            // recordButton.title = "Speech input not supported"; // And its title
        }
    }
    // Initialize default recording status text
    if (SpeechRecognition && recordingStatus) {
        recordingStatus.textContent = uiStrings[currentLanguage].recordingStatusDefault || '';
    }
});

// Add a specific style for ai-error messages if not already in style.css
// This is just a reminder; actual CSS should be in style.css
/*
.ai-error {
    background-color: #ffdddd;
    color: #d8000c;
    align-self: flex-start;
    margin-right: auto;
}
*/
