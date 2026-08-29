const chat = document.getElementById("chat");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

const menuButton = document.getElementById("menuButton");
const closeMenu = document.getElementById("closeMenu");
const sideNav = document.getElementById("sideNav");
const overlay = document.getElementById("overlay");

const newChatButton = document.getElementById("newChatButton");
const sideNewChat = document.getElementById("sideNewChat");

const recentChats = document.getElementById("recentChats");

const attachButton = document.getElementById("attachButton");
const uploadButton = document.getElementById("uploadButton");
const imageInput = document.getElementById("imageInput");

const imagePreview = document.getElementById("imagePreview");
const previewImage = document.getElementById("previewImage");
const previewName = document.getElementById("previewName");
const removeImage = document.getElementById("removeImage");

const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");

const STORAGE_KEY = "joe_world_chats";

let history = [];
let currentChatId = Date.now().toString();
let selectedImage = null;


/* ==========================================
   SIDEBAR
========================================== */

function openMenu() {
    sideNav.classList.add("open");
    overlay.classList.add("open");
}

function closeNavigation() {
    sideNav.classList.remove("open");
    overlay.classList.remove("open");
}

menuButton.addEventListener("click", openMenu);
closeMenu.addEventListener("click", closeNavigation);
overlay.addEventListener("click", closeNavigation);


/* ==========================================
   WELCOME
========================================== */

function showWelcome() {

    chat.innerHTML = `
        <section class="welcome" id="welcome">

            <div class="hero-mark">
                <div class="hero-jw">JW</div>
                <div class="hero-ai">AI</div>
            </div>

            <div class="gold-line"></div>

            <h1>Joe World AI</h1>

            <p>Intelligent. Personal. Yours.</p>

            <div class="quick-actions">

                <button data-prompt="Explain something interesting to me.">
                    ✦ Explore
                </button>

                <button data-prompt="Help me write something.">
                    ✎ Write
                </button>

                <button data-prompt="Help me with programming.">
                    &lt;/&gt; Code
                </button>

            </div>

        </section>
    `;

    attachQuickActions();
}


/* ==========================================
   MESSAGE
========================================== */

function addMessage(text, type) {

    const welcome = document.getElementById("welcome");

    if (welcome) {
        welcome.style.display = "none";
    }

    const row = document.createElement("div");

    row.className = "message-row " + type;

    const bubble = document.createElement("div");

    bubble.className = "message " + type;

    bubble.textContent = text;

    row.appendChild(bubble);

    chat.appendChild(row);

    chat.scrollTop = chat.scrollHeight;
}


/* ==========================================
   TYPING
========================================== */

function showTyping() {

    const row = document.createElement("div");

    row.className = "message-row ai";
    row.id = "typing";

    const typing = document.createElement("div");

    typing.className = "typing";

    typing.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;

    row.appendChild(typing);

    chat.appendChild(row);

    chat.scrollTop = chat.scrollHeight;
}


function hideTyping() {

    const typing = document.getElementById("typing");

    if (typing) {
        typing.remove();
    }
}


/* ==========================================
   SEND MESSAGE
========================================== */

async function sendMessage() {

    const text = input.value.trim();

    if (!text && !selectedImage) {
        return;
    }


    if (selectedImage) {

        addMessage(
            "📷 " +
            selectedImage.name +
            "\n\nImage selected. Image understanding will be connected to the AI backend next.",
            "user"
        );

        clearSelectedImage();

        input.value = "";

        return;
    }


    addMessage(text, "user");

    history.push({
        role: "user",
        text: text
    });

    input.value = "";

    sendButton.disabled = true;

    showTyping();


    try {

        const response = await fetch("/api/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: text,
                history: history
            })

        });


        const data = await response.json();

        hideTyping();


        if (!response.ok) {

            addMessage(
                "Something went wrong: " +
                (data.error || "Unknown error."),
                "ai"
            );

            return;
        }


        const reply = data.reply;

        addMessage(reply, "ai");


        history.push({
            role: "assistant",
            text: reply
        });


        saveCurrentChat();

    }

    catch (error) {

        hideTyping();

        addMessage(
            "I couldn't connect to Joe World AI.",
            "ai"
        );

        console.error(error);

    }

    finally {

        sendButton.disabled = false;

        input.focus();
    }
}


sendButton.addEventListener("click", sendMessage);


input.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    }
);


/* ==========================================
   NEW CHAT
========================================== */

function newChat() {

    history = [];

    currentChatId =
        Date.now().toString();

    clearSelectedImage();

    input.value = "";

    showWelcome();

    closeNavigation();

    input.focus();
}


newChatButton.addEventListener("click", newChat);
sideNewChat.addEventListener("click", newChat);


/* ==========================================
   QUICK ACTIONS
========================================== */

function attachQuickActions() {

    document
        .querySelectorAll("[data-prompt]")
        .forEach(button => {

            button.addEventListener(
                "click",
                function() {

                    input.value =
                        this.dataset.prompt;

                    input.focus();

                }
            );

        });
}


attachQuickActions();


/* ==========================================
   CHAT STORAGE
========================================== */

function getChats() {

    try {

        return JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

    } catch {

        return [];

    }
}


function saveChats(chats) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(chats)
    );
}


function saveCurrentChat() {

    if (!history.length) {
        return;
    }


    let chats = getChats();


    const firstUserMessage =
        history.find(
            item => item.role === "user"
        );


    let title =
        firstUserMessage
            ? firstUserMessage.text
            : "New conversation";


    title = title.trim();


    if (title.length > 42) {

        title =
            title.substring(0, 42) +
            "...";

    }


    const chatData = {

        id: currentChatId,

        title: title,

        history: history,

        updated: Date.now()

    };


    const index =
        chats.findIndex(
            item =>
                item.id === currentChatId
        );


    if (index !== -1) {

        chats[index] = chatData;

    } else {

        chats.unshift(chatData);

    }


    chats.sort(
        (a, b) =>
            b.updated - a.updated
    );


    saveChats(
        chats.slice(0, 50)
    );


    renderRecentChats();
}


/* ==========================================
   RECENT CHATS
========================================== */

function renderRecentChats() {

    const chats = getChats();

    recentChats.innerHTML = "";


    if (!chats.length) {

        recentChats.innerHTML = `
            <div class="empty-chats">
                No recent chats yet.
            </div>
        `;

        return;
    }


    chats.forEach(savedChat => {

        const row =
            document.createElement("div");

        row.className =
            "chat-history-row";


        const button =
            document.createElement("button");

        button.className =
            "chat-history-item";

        button.textContent =
            savedChat.title;


        button.addEventListener(
            "click",
            function() {

                loadChat(savedChat);

                closeNavigation();

            }
        );


        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "delete-chat";

        deleteButton.textContent =
            "×";

        deleteButton.title =
            "Delete chat";


        deleteButton.addEventListener(
            "click",
            function(event) {

                event.stopPropagation();

                deleteChat(
                    savedChat.id
                );

            }
        );


        row.appendChild(button);

        row.appendChild(deleteButton);

        recentChats.appendChild(row);

    });
}


function loadChat(savedChat) {

    history =
        savedChat.history || [];

    currentChatId =
        savedChat.id;

    clearSelectedImage();

    chat.innerHTML = "";


    history.forEach(item => {

        if (
            item.role === "user" ||
            item.role === "assistant"
        ) {

            addMessage(
                item.text,
                item.role === "user"
                    ? "user"
                    : "ai"
            );

        }

    });


    input.focus();
}


function deleteChat(id) {

    let chats = getChats();

    chats =
        chats.filter(
            item => item.id !== id
        );

    saveChats(chats);

    renderRecentChats();


    if (currentChatId === id) {
        newChat();
    }
}


/* ==========================================
   IMAGE UPLOAD
========================================== */

function openImagePicker() {
    imageInput.click();
}


attachButton.addEventListener(
    "click",
    openImagePicker
);


uploadButton.addEventListener(
    "click",
    function() {

        closeNavigation();

        openImagePicker();

    }
);


imageInput.addEventListener(
    "change",
    function() {

        const file = this.files[0];

        if (!file) {
            return;
        }


        if (!file.type.startsWith("image/")) {

            alert(
                "Please choose an image file."
            );

            return;
        }


        selectedImage = file;


        const reader =
            new FileReader();


        reader.onload = function(event) {

            previewImage.src =
                event.target.result;

        };


        reader.readAsDataURL(file);


        previewName.textContent =
            file.name;


        imagePreview.classList.add(
            "show"
        );


        input.focus();

    }
);


function clearSelectedImage() {

    selectedImage = null;

    imagePreview.classList.remove(
        "show"
    );

    previewImage.removeAttribute(
        "src"
    );

    imageInput.value = "";
}


removeImage.addEventListener(
    "click",
    clearSelectedImage
);


/* ==========================================
   MODALS
========================================== */

function openModal(
    title,
    subtitle,
    content
) {

    modalTitle.textContent = title;

    modalSubtitle.textContent = subtitle;

    modalContent.innerHTML = content;

    modalOverlay.classList.add("open");
}


function closeModal() {

    modalOverlay.classList.remove("open");
}


modalClose.addEventListener(
    "click",
    closeModal
);


modalOverlay.addEventListener(
    "click",
    function(event) {

        if (event.target === modalOverlay) {
            closeModal();
        }

    }
);


/* ==========================================
   REAL MEMORY SYSTEM
========================================== */

async function loadMemories() {

    try {

        const response =
            await fetch("/api/memory");

        const data =
            await response.json();

        return data.memories || [];

    }

    catch (error) {

        console.error(
            "Memory error:",
            error
        );

        return [];

    }
}


function memoryText(memory) {

    if (typeof memory === "string") {
        return memory;
    }

    if (memory && memory.text) {
        return memory.text;
    }

    return String(memory);
}


async function showMemoryPanel() {

    closeNavigation();


    openModal(
        "Memory",
        "What Joe World AI remembers",
        `
        <div style="text-align:center;padding:15px">
            <div style="font-size:32px">🧠</div>

            <p style="color:#777;margin-top:8px">
                Loading memories...
            </p>
        </div>
        `
    );


    const memories =
        await loadMemories();


    renderMemoryPanel(memories);
}


function renderMemoryPanel(memories) {

    let memoryHTML = "";


    if (!memories.length) {

        memoryHTML = `
            <div
                class="setting-card"
                style="display:block;text-align:center"
            >

                <div style="font-size:28px">
                    🧠
                </div>

                <strong>
                    No memories yet
                </strong>

                <span>
                    Add something Joe World AI should remember.
                </span>

            </div>
        `;

    } else {

        memories.forEach(
            (memory, index) => {

                memoryHTML += `
                    <div
                        class="setting-card"
                        style="align-items:flex-start"
                    >

                        <div style="flex:1">

                            <strong>
                                Memory ${index + 1}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    memoryText(memory)
                                )}
                            </span>

                        </div>

                        <button
                            class="setting-button"
                            data-delete-memory="${index}"
                        >
                            Delete
                        </button>

                    </div>
                `;

            }
        );

    }


    modalContent.innerHTML = `

        ${memoryHTML}

        <button
            class="new-chat-button"
            id="addMemoryButton"
            style="width:100%;justify-content:center;margin-top:12px"
        >
            ＋ Add memory
        </button>

        <button
            class="danger-button"
            id="clearMemoryButton"
        >
            Delete all memories
        </button>

    `;


    document
        .querySelectorAll(
            "[data-delete-memory]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async function() {

                    const index =
                        Number(
                            this.dataset
                                .deleteMemory
                        );


                    const response =
                        await fetch(
                            "/api/memory/" +
                            index,
                            {
                                method:
                                    "DELETE"
                            }
                        );


                    if (response.ok) {

                        showMemoryPanel();

                    } else {

                        alert(
                            "Could not delete memory."
                        );

                    }

                }
            );

        });


    document
        .getElementById("addMemoryButton")
        .addEventListener(
            "click",
            showAddMemory
        );


    document
        .getElementById("clearMemoryButton")
        .addEventListener(
            "click",
            clearAllMemory
        );
}


function showAddMemory() {

    modalTitle.textContent =
        "Add memory";

    modalSubtitle.textContent =
        "Teach Joe World AI something";


    modalContent.innerHTML = `

        <div class="setting-card" style="display:block">

            <strong>
                What should I remember?
            </strong>

            <span>
                Example: "I prefer dark mode."
            </span>

            <textarea
                id="memoryInput"
                style="
                    width:100%;
                    min-height:110px;
                    margin-top:12px;
                    padding:12px;
                    resize:vertical;
                    background:#080808;
                    color:white;
                    border:1px solid rgba(255,255,255,.1);
                    border-radius:13px;
                    outline:none;
                "
                placeholder="Type a memory..."
            ></textarea>

        </div>

        <button
            class="new-chat-button"
            id="saveMemoryButton"
            style="width:100%;justify-content:center"
        >
            Save memory
        </button>

    `;


    const memoryInput =
        document.getElementById(
            "memoryInput"
        );


    memoryInput.focus();


    document
        .getElementById("saveMemoryButton")
        .addEventListener(
            "click",
            saveMemory
        );
}


async function saveMemory() {

    const field =
        document.getElementById(
            "memoryInput"
        );


    const text =
        field.value.trim();


    if (!text) {

        alert(
            "Please type something to remember."
        );

        return;
    }


    const button =
        document.getElementById(
            "saveMemoryButton"
        );


    button.disabled = true;

    button.textContent =
        "Saving...";


    try {

        const response =
            await fetch(
                "/api/memory",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        text: text
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to save memory."
            );

        }


        showMemoryPanel();

    }

    catch (error) {

        alert(
            error.message
        );

        button.disabled = false;

        button.textContent =
            "Save memory";
    }
}


async function clearAllMemory() {

    const confirmed =
        confirm(
            "Delete every saved memory?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                "/api/memory",
                {
                    method: "DELETE"
                }
            );


        if (response.ok) {

            showMemoryPanel();

        } else {

            alert(
                "Could not clear memory."
            );

        }

    }

    catch (error) {

        alert(
            "Connection error."
        );

    }
}


function escapeHTML(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


document
    .getElementById("memoryButton")
    .addEventListener(
        "click",
        showMemoryPanel
    );


/* ==========================================
   SETTINGS
========================================== */

document
    .getElementById("settingsButton")
    .addEventListener(
        "click",
        function() {

            closeNavigation();

            openModal(
                "Settings",
                "Customize Joe World AI",
                `
                <div class="setting-card">

                    <div>
                        <strong>Interface</strong>

                        <span>
                            AMOLED dark interface
                        </span>
                    </div>

                    <button class="setting-button">
                        Dark
                    </button>

                </div>

                <div class="setting-card">

                    <div>
                        <strong>Animations</strong>

                        <span>
                            Smooth interface animations
                        </span>
                    </div>

                    <button
                        class="setting-button"
                        id="animationToggle"
                    >
                        ON
                    </button>

                </div>

                <div class="setting-card">

                    <div>
                        <strong>Chat storage</strong>

                        <span>
                            Conversations stored locally on this device.
                        </span>
                    </div>

                </div>

                <button
                    class="danger-button"
                    id="clearChats"
                >
                    Clear all recent chats
                </button>
                `
            );


            const clearButton =
                document.getElementById(
                    "clearChats"
                );


            clearButton.addEventListener(
                "click",
                function() {

                    const confirmed =
                        confirm(
                            "Delete all saved chats?"
                        );


                    if (confirmed) {

                        localStorage.removeItem(
                            STORAGE_KEY
                        );

                        renderRecentChats();

                        newChat();

                        closeModal();

                    }

                }
            );

        }
    );


/* ==========================================
   ABOUT
========================================== */

document
    .getElementById("aboutButton")
    .addEventListener(
        "click",
        function() {

            closeNavigation();

            openModal(
                "About Joe World AI",
                "The project",
                `
                <div class="about-logo">
                    JW
                    <span style="color:#fffacd;font-size:10px">
                        AI
                    </span>
                </div>

                <div class="about-text">

                    <p>
                        <strong>Joe World AI</strong>
                        is a personal AI platform created,
                        designed and developed by
                        <strong>Joe World</strong>.
                    </p>

                    <br>

                    <p>
                        Built to become a powerful,
                        personal and expandable AI experience
                        with chat, memory, multimodal features,
                        voice and more.
                    </p>

                    <br>

                    <p>
                        Creator & Developer:
                        <strong>Joe World</strong>
                    </p>

                </div>

                <a
                    class="contact-button"
                    href="mailto:joeworld222@gmail.com"
                >
                    ✉ Contact Joe World
                </a>
                `
            );

        }
    );


/* ==========================================
   STARTUP
========================================== */

renderRecentChats();

showWelcome();

input.focus();


/* ==========================================
   JOE WORLD AI — VOICE MODE
========================================== */

const voiceButton =
    document.getElementById("voiceButton");

let recognition = null;
let isListening = false;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    recognition =
        new SpeechRecognition();

    recognition.continuous = false;

    recognition.interimResults = true;

    recognition.lang = "en-US";


    recognition.onstart = function() {

        isListening = true;

        voiceButton.classList.add(
            "listening"
        );

        voiceButton.textContent = "⏹️";

    };


    recognition.onresult =
        function(event) {

            let transcript = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                transcript +=
                    event.results[i][0].transcript;

            }

            input.value = transcript;

        };


    recognition.onend = function() {

        isListening = false;

        voiceButton.classList.remove(
            "listening"
        );

        voiceButton.textContent = "🎙️";

    };


    recognition.onerror =
        function(event) {

            console.log(
                "Voice recognition:",
                event.error
            );

            isListening = false;

            voiceButton.classList.remove(
                "listening"
            );

            voiceButton.textContent = "🎙️";

        };


    voiceButton.addEventListener(
        "click",
        function() {

            if (isListening) {

                recognition.stop();

                return;

            }


            try {

                recognition.start();

            }

            catch (error) {

                console.log(error);

            }

        }
    );

}


/* ==========================================
   TEXT TO SPEECH
========================================== */

function speakAI(text) {

    if (
        !("speechSynthesis" in window)
    ) {
        return;
    }


    window.speechSynthesis.cancel();


    const cleanText =
        text
            .replace(
                /[*_#`]/g,
                ""
            )
            .replace(
                /\[.*?\]\(.*?\)/g,
                ""
            );


    const utterance =
        new SpeechSynthesisUtterance(
            cleanText
        );


    utterance.lang =
        "en-US";

    utterance.rate =
        0.95;

    utterance.pitch =
        1.0;

    utterance.volume =
        1.0;


    window.speechSynthesis.speak(
        utterance
    );
}


/* ==========================================
   REAL VOICE MODE
========================================== */

const voiceMode =
    document.getElementById("voiceMode");

const voiceModeButton =
    document.getElementById("voiceModeButton");

const closeVoiceMode =
    document.getElementById("closeVoiceMode");

const voiceMainButton =
    document.getElementById("voiceMainButton");

const voiceState =
    document.getElementById("voiceState");

const voiceTranscript =
    document.getElementById("voiceTranscript");


function openVoiceMode() {

    voiceMode.classList.add("open");

    voiceState.textContent =
        "Ready";

    voiceTranscript.textContent =
        "Tap the microphone to begin";

}


function closeVoiceScreen() {

    if (
        recognition &&
        isListening
    ) {
        recognition.stop();
    }

    voiceMode.classList.remove("open");

}


voiceModeButton.addEventListener(
    "click",
    function() {

        closeNavigation();

        openVoiceMode();

    }
);


closeVoiceMode.addEventListener(
    "click",
    closeVoiceScreen
);


voiceMainButton.addEventListener(
    "click",
    function() {

        if (!recognition) {

            voiceState.textContent =
                "Voice unavailable";

            voiceTranscript.textContent =
                "Your browser does not support speech recognition.";

            return;

        }


        if (isListening) {

            recognition.stop();

            return;

        }


        voiceState.textContent =
            "Listening…";

        voiceTranscript.textContent =
            "I'm listening";


        try {

            recognition.start();

        }

        catch (error) {

            console.log(error);

        }

    }
);


/* Voice mode recognition feedback */

if (recognition) {

    const oldResult =
        recognition.onresult;


    recognition.onresult =
        function(event) {

            let transcript = "";


            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                transcript +=
                    event.results[i][0]
                    .transcript;

            }


            voiceTranscript.textContent =
                transcript;

            input.value =
                transcript;

        };


    recognition.onstart =
        function() {

            isListening = true;

            voiceMainButton.classList.add(
                "listening"
            );

            voiceMainButton.textContent =
                "⏹️";

            voiceState.textContent =
                "Listening…";

        };


    recognition.onend =
        function() {

            isListening = false;

            voiceMainButton.classList.remove(
                "listening"
            );

            voiceMainButton.textContent =
                "🎙️";

            if (
                voiceTranscript.textContent
                    !== "I'm listening"
            ) {

                voiceState.textContent =
                    "Ready to send";

                voiceTranscript.textContent =
                    voiceTranscript.textContent +
                    "\n\nTap Send in chat to continue.";

            } else {

                voiceState.textContent =
                    "Ready";

            }

        };


    recognition.onerror =
        function(event) {

            isListening = false;

            voiceMainButton.classList.remove(
                "listening"
            );

            voiceMainButton.textContent =
                "🎙️";

            voiceState.textContent =
                "Voice error";

            voiceTranscript.textContent =
                event.error;

        };

}



/* ==========================================
   JOE WORLD AI — REAL VOICE CONVERSATION
========================================== */

const voiceSettings =
    document.getElementById("voiceSettings");

const voiceSettingsPanel =
    document.getElementById("voiceSettingsPanel");

const closeVoiceSettings =
    document.getElementById("closeVoiceSettings");

const voiceSelect =
    document.getElementById("voiceSelect");

const voiceRate =
    document.getElementById("voiceRate");

const voiceRateValue =
    document.getElementById("voiceRateValue");

const testVoiceButton =
    document.getElementById("testVoiceButton");


let availableVoices = [];

let selectedVoice = null;

let selectedRate = 0.95;

let voiceSpeaking = false;


/* ==========================================
   LOAD ANDROID/BROWSER VOICES
========================================== */

function loadVoices() {

    if (!("speechSynthesis" in window)) {
        return;
    }


    availableVoices =
        speechSynthesis.getVoices();


    voiceSelect.innerHTML = "";


    if (!availableVoices.length) {

        const option =
            document.createElement("option");

        option.textContent =
            "No voices available";

        option.value = "";

        voiceSelect.appendChild(
            option
        );

        return;
    }


    availableVoices.forEach(
        function(voice, index) {

            const option =
                document.createElement("option");

            option.value =
                index;

            option.textContent =
                voice.name +
                " — " +
                voice.lang;


            voiceSelect.appendChild(
                option
            );

        }
    );


    const preferred =
        availableVoices.findIndex(
            voice => {

                const name =
                    voice.name.toLowerCase();

                const lang =
                    voice.lang.toLowerCase();


                return (
                    lang.startsWith("en") &&
                    (
                        name.includes("natural") ||
                        name.includes("enhanced") ||
                        name.includes("premium")
                    )
                );

            }
        );


    const index =
        preferred >= 0
            ? preferred
            : 0;


    voiceSelect.value =
        index;

    selectedVoice =
        availableVoices[index];

}


loadVoices();


if ("speechSynthesis" in window) {

    speechSynthesis.onvoiceschanged =
        loadVoices;

}


/* ==========================================
   SETTINGS
========================================== */

voiceSettings.addEventListener(
    "click",
    function() {

        voiceSettingsPanel.classList.add(
            "open"
        );

        loadVoices();

    }
);


closeVoiceSettings.addEventListener(
    "click",
    function() {

        voiceSettingsPanel.classList.remove(
            "open"
        );

    }
);


voiceSettingsPanel.addEventListener(
    "click",
    function(event) {

        if (
            event.target ===
            voiceSettingsPanel
        ) {

            voiceSettingsPanel.classList.remove(
                "open"
            );

        }

    }
);


voiceSelect.addEventListener(
    "change",
    function() {

        const index =
            Number(this.value);

        selectedVoice =
            availableVoices[index];

    }
);


voiceRate.addEventListener(
    "input",
    function() {

        selectedRate =
            Number(this.value);

        voiceRateValue.textContent =
            selectedRate.toFixed(2) +
            "×";

    }
);


/* ==========================================
   SPEAK
========================================== */

function speakVoiceMode(text) {

    return new Promise(
        function(resolve) {

            if (
                !("speechSynthesis" in window)
            ) {

                resolve();

                return;

            }


            speechSynthesis.cancel();


            const clean =
                text
                    .replace(/[*_#`]/g, "")
                    .replace(
                        /\[.*?\]\(.*?\)/g,
                        ""
                    );


            const utterance =
                new SpeechSynthesisUtterance(
                    clean
                );


            if (selectedVoice) {

                utterance.voice =
                    selectedVoice;

            }


            utterance.rate =
                selectedRate;

            utterance.pitch =
                1;

            utterance.volume =
                1;


            utterance.onstart =
                function() {

                    voiceSpeaking =
                        true;

                    voiceState.textContent =
                        "Speaking…";

                    voiceMainButton.textContent =
                        "⏹️";

                    voiceMainButton.classList.add(
                        "listening"
                    );

                };


            utterance.onend =
                function() {

                    voiceSpeaking =
                        false;

                    voiceMainButton.textContent =
                        "🎙️";

                    voiceMainButton.classList.remove(
                        "listening"
                    );

                    voiceState.textContent =
                        "Ready";

                    voiceTranscript.textContent =
                        "Tap the microphone to speak again.";

                    resolve();

                };


            utterance.onerror =
                function() {

                    voiceSpeaking =
                        false;

                    voiceMainButton.textContent =
                        "🎙️";

                    voiceMainButton.classList.remove(
                        "listening"
                    );

                    voiceState.textContent =
                        "Ready";

                    resolve();

                };


            speechSynthesis.speak(
                utterance
            );

        }
    );

}


/* ==========================================
   TEST VOICE
========================================== */

testVoiceButton.addEventListener(
    "click",
    function() {

        speakVoiceMode(
            "Hello Joe World. This is the voice of Joe World AI."
        );

    }
);


/* ==========================================
   SEND VOICE MESSAGE TO GEMINI
========================================== */

async function sendVoiceMessage(text) {

    if (!text.trim()) {
        return;
    }


    voiceState.textContent =
        "Thinking…";


    voiceTranscript.textContent =
        text;


    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: text,
                        history: history
                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            voiceState.textContent =
                "Something went wrong";

            voiceTranscript.textContent =
                data.error ||
                "AI request failed.";

            return;

        }


        const reply =
            data.reply;


        history.push({
            role: "user",
            text: text
        });


        history.push({
            role: "assistant",
            text: reply
        });


        saveCurrentChat();


        voiceTranscript.textContent =
            reply;


        await speakVoiceMode(
            reply
        );

    }

    catch (error) {

        console.error(error);

        voiceState.textContent =
            "Connection error";

        voiceTranscript.textContent =
            "I couldn't reach Joe World AI.";

    }

}


/* ==========================================
   VOICE RECOGNITION → AI
========================================== */

let voiceModeTranscript = "";


if (recognition) {

    recognition.onresult =
        function(event) {

            let transcript = "";


            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                transcript +=
                    event.results[i][0]
                    .transcript;

            }


            voiceModeTranscript =
                transcript;


            voiceTranscript.textContent =
                transcript;

        };


    recognition.onstart =
        function() {

            isListening = true;

            voiceModeTranscript = "";

            voiceMainButton.textContent =
                "⏹️";

            voiceMainButton.classList.add(
                "listening"
            );

            voiceState.textContent =
                "Listening…";

            voiceTranscript.textContent =
                "I'm listening…";

        };


    recognition.onend =
        async function() {

            isListening = false;

            voiceMainButton.classList.remove(
                "listening"
            );


            if (
                !voiceMode.classList.contains(
                    "open"
                )
            ) {
                return;
            }


            const text =
                voiceModeTranscript.trim();


            if (!text) {

                voiceMainButton.textContent =
                    "🎙️";

                voiceState.textContent =
                    "Ready";

                voiceTranscript.textContent =
                    "I didn't catch that.";

                return;

            }


            voiceMainButton.textContent =
                "⏳";


            await sendVoiceMessage(
                text
            );

        };

}



/* ==========================================
   VOICE MODE BUTTON — CONNECTION FIX
========================================== */

(function () {

    const button =
        document.getElementById("voiceModeButton");

    const screen =
        document.getElementById("voiceMode");

    const close =
        document.getElementById("closeVoiceMode");

    const main =
        document.getElementById("voiceMainButton");


    if (!button) {
        console.log("Voice Mode button not found.");
        return;
    }

    if (!screen) {
        console.log("Voice Mode screen not found.");
        return;
    }


    /* OPEN */

    button.addEventListener(
        "click",
        function () {

            if (typeof closeNavigation === "function") {
                closeNavigation();
            }

            screen.classList.add("open");

            const state =
                document.getElementById("voiceState");

            const transcript =
                document.getElementById("voiceTranscript");

            if (state) {
                state.textContent = "Ready";
            }

            if (transcript) {
                transcript.textContent =
                    "Tap the microphone to begin";
            }

        }
    );


    /* CLOSE */

    if (close) {

        close.addEventListener(
            "click",
            function () {

                screen.classList.remove("open");

                if (
                    typeof recognition !== "undefined" &&
                    recognition &&
                    typeof isListening !== "undefined" &&
                    isListening
                ) {

                    try {
                        recognition.stop();
                    } catch (e) {}

                }

            }
        );

    }


    /* MICROPHONE */

    if (main) {

        main.addEventListener(
            "click",
            function () {

                if (
                    typeof recognition === "undefined" ||
                    !recognition
                ) {

                    const state =
                        document.getElementById(
                            "voiceState"
                        );

                    const transcript =
                        document.getElementById(
                            "voiceTranscript"
                        );

                    if (state) {
                        state.textContent =
                            "Voice unavailable";
                    }

                    if (transcript) {
                        transcript.textContent =
                            "Speech recognition isn't available in this browser.";
                    }

                    return;
                }


                if (
                    typeof isListening !== "undefined" &&
                    isListening
                ) {

                    try {
                        recognition.stop();
                    } catch (e) {}

                    return;
                }


                try {

                    recognition.start();

                } catch (error) {

                    console.log(
                        "Voice start error:",
                        error
                    );

                }

            }
        );

    }


    console.log(
        "Joe World AI Voice Mode connected ✅"
    );

})();


/* ==========================================
   JOE WORLD AI — VOICE MODE SAFE CONTROLLER
========================================== */

document.addEventListener("DOMContentLoaded", function () {

    const modeButton =
        document.getElementById("voiceModeButton");

    const modeScreen =
        document.getElementById("voiceMode");

    const closeButton =
        document.getElementById("closeVoiceMode");

    const micButton =
        document.getElementById("voiceMainButton");

    const state =
        document.getElementById("voiceState");

    const transcript =
        document.getElementById("voiceTranscript");


    if (!modeButton || !modeScreen) {
        console.error(
            "Joe World AI: Voice Mode elements missing."
        );
        return;
    }


    /* OPEN VOICE MODE */

    modeButton.onclick = function () {

        modeScreen.classList.add("open");

        if (state) {
            state.textContent = "Ready";
        }

        if (transcript) {
            transcript.textContent =
                "Tap the microphone to begin";
        }

    };


    /* CLOSE VOICE MODE */

    if (closeButton) {

        closeButton.onclick = function () {

            modeScreen.classList.remove("open");

            if (
                window.speechSynthesis
            ) {
                window.speechSynthesis.cancel();
            }

        };

    }


    /* MICROPHONE */

    if (micButton) {

        micButton.onclick = function () {

            if (
                typeof recognition === "undefined" ||
                !recognition
            ) {

                if (state) {
                    state.textContent =
                        "Voice unavailable";
                }

                if (transcript) {
                    transcript.textContent =
                        "Speech recognition is unavailable.";
                }

                return;
            }


            if (
                typeof isListening !== "undefined" &&
                isListening
            ) {

                try {
                    recognition.stop();
                } catch (e) {}

                return;
            }


            try {

                recognition.start();

                if (state) {
                    state.textContent =
                        "Listening…";
                }

            } catch (error) {

                console.log(
                    "Voice error:",
                    error
                );

            }

        };

    }


    console.log(
        "Joe World AI Voice Controller: READY ✅"
    );

});


/* ==========================================
   FINAL VOICE MODE NAVIGATION FIX
========================================== */

(function () {

    function setupVoiceMode() {

        const button =
            document.getElementById("voiceModeButton");

        const screen =
            document.getElementById("voiceMode");

        const close =
            document.getElementById("closeVoiceMode");


        if (!button || !screen) {
            return;
        }


        /* Remove previous click handlers by
           cloning the button */

        const cleanButton =
            button.cloneNode(true);

        button.parentNode.replaceChild(
            cleanButton,
            button
        );


        cleanButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                /* Open Voice Mode */

                screen.classList.add("open");

                screen.style.display = "flex";

                document.body.classList.add(
                    "voice-mode-active"
                );


                const state =
                    document.getElementById(
                        "voiceState"
                    );

                const transcript =
                    document.getElementById(
                        "voiceTranscript"
                    );


                if (state) {
                    state.textContent = "Ready";
                }


                if (transcript) {
                    transcript.textContent =
                        "Tap the microphone to begin";
                }

            },
            true
        );


        if (close) {

            close.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    screen.classList.remove(
                        "open"
                    );

                    screen.style.display =
                        "none";

                    document.body.classList.remove(
                        "voice-mode-active"
                    );

                },
                true
            );

        }


        console.log(
            "FINAL Voice Mode navigation ready ✅"
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            setupVoiceMode
        );

    } else {

        setupVoiceMode();

    }

})();


/* ==========================================
   VOICE MODE — CAPTURE NAVIGATION
========================================== */

document.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                "#voiceModeButton"
            );

        if (!button) {
            return;
        }


        /* STOP the normal sidebar navigation */

        event.preventDefault();

        event.stopPropagation();

        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        }


        const screen =
            document.getElementById(
                "voiceMode"
            );


        if (!screen) {

            console.error(
                "Voice Mode screen missing."
            );

            return;

        }


        /* Close sidebar manually */

        const sideNav =
            document.getElementById(
                "sideNav"
            );

        const overlay =
            document.getElementById(
                "overlay"
            );


        if (sideNav) {
            sideNav.classList.remove("open");
        }

        if (overlay) {
            overlay.classList.remove("open");
        }


        /* Open Voice Mode */

        screen.classList.add("open");

        document.body.classList.add(
            "voice-mode-active"
        );


        const state =
            document.getElementById(
                "voiceState"
            );

        const transcript =
            document.getElementById(
                "voiceTranscript"
            );


        if (state) {
            state.textContent = "Ready";
        }

        if (transcript) {
            transcript.textContent =
                "Tap the microphone to begin";
        }


        console.log(
            "Voice Mode opened successfully ✅"
        );

    },
    true
);

