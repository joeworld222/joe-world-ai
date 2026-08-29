import os
import json
from flask import Flask, request, jsonify, send_from_directory

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

import requests


# ==========================================
# JOE WORLD AI SERVER
# ==========================================

app = Flask(__name__, static_folder="app/www")


# ==========================================
# CONFIG
# ==========================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

MODEL = "gemini-3.6-flash"

MEMORY_FILE = "memory.json"


# ==========================================
# MEMORY
# ==========================================

def load_memory():

    try:

        if not os.path.exists(MEMORY_FILE):
            return []

        with open(
            MEMORY_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)

        if isinstance(data, list):
            return data

        if isinstance(data, dict):

            if isinstance(data.get("memories"), list):
                return data["memories"]

            return []

        return []

    except Exception as error:

        print("Memory load error:", error)

        return []


def save_memory(memories):

    with open(
        MEMORY_FILE,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            memories,
            file,
            indent=2,
            ensure_ascii=False
        )


# ==========================================
# CREATOR IDENTITY
# ==========================================

CREATOR_CONTEXT = """
You are Joe World AI.

You were created, designed, developed and published by Joe World.

Your creator is Joe World.

When users ask who made you, who your creator is,
who developed you, who designed you, who owns you,
who published you, or similar questions, clearly identify
Joe World as your creator/developer/designer/publisher.

Do not invent another creator.

Be friendly, natural, intelligent and conversational.

Do not repeatedly mention Joe World unless the conversation
actually calls for it.
"""


# ==========================================
# BUILD MEMORY CONTEXT
# ==========================================

def build_memory_context():

    memories = load_memory()

    if not memories:
        return ""

    lines = []

    for memory in memories:

        if isinstance(memory, str):

            lines.append("- " + memory)

        elif isinstance(memory, dict):

            text = memory.get("text")

            if text:
                lines.append("- " + str(text))


    if not lines:
        return ""


    return """
Important information remembered about the user:

""" + "\n".join(lines)


# ==========================================
# GEMINI
# ==========================================

def ask_gemini(message, history):

    if not GEMINI_API_KEY:

        raise Exception(
            "GEMINI_API_KEY is missing."
        )


    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        "models/"
        + MODEL +
        ":generateContent"
    )


    system_context = (
        CREATOR_CONTEXT +
        "\n" +
        build_memory_context()
    )


    contents = []


    # System-like context
    contents.append({
        "role": "user",
        "parts": [
            {
                "text":
                    "SYSTEM CONTEXT:\n" +
                    system_context
            }
        ]
    })


    contents.append({
        "role": "model",
        "parts": [
            {
                "text":
                    "Understood."
            }
        ]
    })


    # Previous conversation
    for item in history:

        role = item.get("role")

        text = item.get("text", "")


        if role == "user":

            contents.append({
                "role": "user",
                "parts": [
                    {
                        "text": text
                    }
                ]
            })


        elif role == "assistant":

            contents.append({
                "role": "model",
                "parts": [
                    {
                        "text": text
                    }
                ]
            })


    # Current message
    contents.append({
        "role": "user",
        "parts": [
            {
                "text": message
            }
        ]
    })


    payload = {
        "contents": contents,

        "generationConfig": {
            "temperature": 0.8,
            "maxOutputTokens": 2048
        }
    }


    response = requests.post(
        url,
        headers={
            "x-goog-api-key": GEMINI_API_KEY,
            "Content-Type": "application/json"
        },
        json=payload,
        timeout=90
    )


    if response.status_code != 200:

        print(
            "Gemini error:",
            response.status_code,
            response.text
        )

        try:
            error_data = response.json()

            message_text = (
                error_data
                .get("error", {})
                .get("message", response.text)
            )

        except Exception:
            message_text = response.text


        raise Exception(message_text)


    data = response.json()


    try:

        return (
            data["candidates"][0]
            ["content"]["parts"][0]
            ["text"]
        )

    except Exception:

        raise Exception(
            "Gemini returned an unexpected response."
        )


# ==========================================
# CHAT API
# ==========================================

@app.post("/api/chat")
def chat_api():

    try:

        data = request.get_json(force=True)

        message = data.get(
            "message",
            ""
        ).strip()

        history = data.get(
            "history",
            []
        )


        if not message:

            return jsonify({
                "error": "Message is empty."
            }), 400


        reply = ask_gemini(
            message,
            history
        )


        return jsonify({
            "reply": reply
        })


    except Exception as error:

        print(
            "CHAT ERROR:",
            repr(error)
        )

        return jsonify({
            "error": str(error)
        }), 500


# ==========================================
# MEMORY API
# ==========================================

@app.get("/api/memory")
def get_memory():

    return jsonify({
        "memories": load_memory()
    })


@app.post("/api/memory")
def add_memory():

    try:

        data = request.get_json(force=True)

        text = data.get(
            "text",
            ""
        ).strip()


        if not text:

            return jsonify({
                "error": "Memory cannot be empty."
            }), 400


        memories = load_memory()


        memory = {
            "text": text
        }


        memories.append(memory)

        save_memory(memories)


        return jsonify({
            "success": True,
            "memory": memory,
            "memories": memories
        })


    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 500


@app.delete("/api/memory/<int:index>")
def delete_memory(index):

    try:

        memories = load_memory()


        if index < 0 or index >= len(memories):

            return jsonify({
                "error": "Memory not found."
            }), 404


        memories.pop(index)

        save_memory(memories)


        return jsonify({
            "success": True,
            "memories": memories
        })


    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 500


@app.delete("/api/memory")
def clear_memory():

    try:

        save_memory([])

        return jsonify({
            "success": True,
            "memories": []
        })

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 500


# ==========================================
# WEBSITE
# ==========================================

@app.route("/")
def home():

    return send_from_directory(
        "app/www",
        "index.html"
    )


@app.route("/<path:path>")
def static_files(path):

    return send_from_directory(
        "app/www",
        path
    )


# ==========================================
# START
# ==========================================

if __name__ == "__main__":

    print()
    print("====================================")
    print("       JOE WORLD AI 🌍")
    print("====================================")
    print("Server: ONLINE ✅")
    print("Open: http://127.0.0.1:5000")
    print()

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )

