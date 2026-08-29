import os
import json
import requests
from dotenv import load_dotenv

# ==========================================
# JOE WORLD AI 🌍
# Core AI + Memory + Identity System
# ==========================================

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

MODEL = "gemini-3.6-flash"

URL = (
    "https://generativelanguage.googleapis.com/"
    f"v1beta/models/{MODEL}:generateContent"
)

MEMORY_FILE = "memory.json"


# ==========================================
# DEFAULT USER PROFILE
# ==========================================

default_profile = {
    "name": None,
    "personality": "friendly, natural, intelligent and slightly playful",
    "preferences": []
}


# ==========================================
# LOAD MEMORY
# ==========================================

def load_memory():

    if not os.path.exists(MEMORY_FILE):
        return {
            "profile": default_profile.copy(),
            "memories": [],
            "conversation": []
        }

    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as file:
            return json.load(file)

    except Exception:
        return {
            "profile": default_profile.copy(),
            "memories": [],
            "conversation": []
        }


memory = load_memory()


# ==========================================
# SAVE MEMORY
# ==========================================

def save_memory():

    with open(MEMORY_FILE, "w", encoding="utf-8") as file:
        json.dump(memory, file, indent=2, ensure_ascii=False)


# ==========================================
# JOE WORLD AI IDENTITY
# ==========================================

SYSTEM_CONTEXT = """

You are Joe World AI, an AI assistant application.

IDENTITY OF THE APPLICATION:

Creator: Joe World
Developer: Joe World
Designer: Joe World
Publisher: Joe World
Owner of the application: Joe World

Joe World created, designed, developed and publishes the
Joe World AI application.

IMPORTANT:

Joe World AI is the application.

The underlying artificial intelligence model is provided by
the external AI provider used by the application.

Never falsely claim that Joe World created the underlying
Gemini model.

When someone asks:

"Who created you?"
"Who made you?"
"Who developed you?"
"Who is your developer?"
"Who designed you?"
"Who owns you?"
"Who published you?"
"Who is behind you?"

clearly explain that Joe World is the creator, developer,
designer and publisher of the Joe World AI application.

USER PERSONALIZATION:

Never assume that every person using the application is Joe World.

Only call someone Joe if their profile or conversation establishes
that their name is Joe.

Adapt your personality to the current user's profile.

Be helpful, intelligent, natural, friendly, confident and slightly playful.

Do not unnecessarily mention Joe World unless the question is related
to the creator, developer, designer, publisher or owner.

"""


# ==========================================
# BUILD AI PROMPT
# ==========================================

def build_prompt(user_message):

    profile = memory["profile"]

    user_name = profile.get("name")

    personality = profile.get(
        "personality",
        "friendly, natural and intelligent"
    )

    memories = memory.get("memories", [])

    conversation = memory.get("conversation", [])

    memory_text = "\n".join(
        f"- {item}" for item in memories
    )

    conversation_text = "\n".join(
        conversation[-20:]
    )

    prompt = f"""

{SYSTEM_CONTEXT}

CURRENT USER PROFILE:

Name: {user_name if user_name else "Unknown"}

Preferred personality/tone:
{personality}

IMPORTANT USER MEMORIES:

{memory_text if memory_text else "No saved memories yet."}

RECENT CONVERSATION:

{conversation_text if conversation_text else "No previous conversation."}

CURRENT USER MESSAGE:

{user_message}

Respond naturally as Joe World AI.

"""

    return prompt


# ==========================================
# ASK GEMINI
# ==========================================

def ask_ai(message):

    memory["conversation"].append(
        f"User: {message}"
    )

    prompt = build_prompt(message)

    try:

        response = requests.post(
            URL,
            headers={
                "x-goog-api-key": API_KEY,
                "Content-Type": "application/json"
            },
            json={
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ]
            },
            timeout=60
        )

        if response.ok:

            data = response.json()

            answer = (
                data["candidates"][0]
                ["content"]["parts"][0]["text"]
            )

            memory["conversation"].append(
                f"Joe World AI: {answer}"
            )

            save_memory()

            return answer

        else:

            return (
                f"API Error {response.status_code}\n"
                f"{response.text}"
            )

    except requests.exceptions.RequestException as error:

        return f"Connection error: {error}"


# ==========================================
# COMMANDS
# ==========================================

def show_profile():

    profile = memory["profile"]

    print()
    print("👤 USER PROFILE")
    print("-------------------------")
    print(
        "Name:",
        profile.get("name") or "Not set"
    )
    print(
        "Personality:",
        profile.get("personality")
    )

    print()
    print("Saved preferences:")

    if profile.get("preferences"):

        for item in profile["preferences"]:
            print("-", item)

    else:
        print("None")

    print()


def show_memories():

    print()
    print("🧠 SAVED MEMORIES")
    print("-------------------------")

    if not memory["memories"]:
        print("No memories saved yet.")

    else:

        for number, item in enumerate(
            memory["memories"],
            start=1
        ):
            print(f"{number}. {item}")

    print()


def clear_conversation():

    memory["conversation"] = []

    save_memory()

    print(
        "🧹 Conversation history cleared."
    )


def remember(text):

    if text.strip():

        memory["memories"].append(
            text.strip()
        )

        save_memory()

        print(
            "🧠 Joe World AI: I'll remember that."
        )


# ==========================================
# STARTUP
# ==========================================

print()
print("========================================")
print("          JOE WORLD AI 🌍")
print("========================================")
print("Status: ONLINE ✅")
print("AI Engine:", MODEL)
print("Creator: Joe World 👑")
print()
print("Commands:")
print("/profile    → View user profile")
print("/memory     → View saved memories")
print("/remember   → Save something to memory")
print("/clear      → Clear conversation")
print("/exit       → Exit")
print()
print("Joe World AI is ready. 🤖")
print()


# ==========================================
# MAIN LOOP
# ==========================================

while True:

    try:

        user = input("You: ").strip()

    except (KeyboardInterrupt, EOFError):

        user = "/exit"


    if not user:
        continue


    # --------------------------------------
    # EXIT
    # --------------------------------------

    if user.lower() in ["/exit", "exit", "quit"]:

        goodbye_prompt = """
The user is ending the conversation.

Give a short, warm and natural goodbye.

Do not assume the user's name.

If their name is known, you may naturally use it.
"""

        goodbye = ask_ai(goodbye_prompt)

        print()
        print("Joe World AI:", goodbye)
        print()

        break


    # --------------------------------------
    # PROFILE
    # --------------------------------------

    elif user.lower() == "/profile":

        show_profile()


    # --------------------------------------
    # MEMORY
    # --------------------------------------

    elif user.lower() == "/memory":

        show_memories()


    # --------------------------------------
    # CLEAR
    # --------------------------------------

    elif user.lower() == "/clear":

        clear_conversation()


    # --------------------------------------
    # REMEMBER
    # --------------------------------------

    elif user.lower().startswith("/remember"):

        text = user[len("/remember"):].strip()

        if text:

            remember(text)

        else:

            print(
                "Usage: /remember something you want me to remember"
            )


    # --------------------------------------
    # NORMAL AI CHAT
    # --------------------------------------

    else:

        answer = ask_ai(user)

        print()
        print("Joe World AI:", answer)
        print()
