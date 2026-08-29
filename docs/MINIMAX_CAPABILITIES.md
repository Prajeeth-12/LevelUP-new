# MiniMax API Modalities & Architecture Reference Guide

This document outlines the complete input/output modalities, model types, endpoints, and architectural patterns for engineering AI features with the MiniMax API in LevelUP.

---

## 1. Summary of MiniMax Model Matrix

| Model / Service | Input Modalities | Output Modalities | Max Context / Limit | Best Used For in LevelUP |
| :--- | :--- | :--- | :--- | :--- |
| **MiniMax-M3** *(Active in LevelUP)* | **Text, Image, Video** | **Text, JSON, Function Calls** | **1,000,000 Tokens** | AI Career Coach, Skill Gap Analysis, Task Generation, Code Mentorship |
| **MiniMax-H3** | **Text, Image, Video, Audio** | **Video (up to 2K) + 32kHz Stereo Audio** | 4–15 second clips | Video tutorials, visual walkthrough generation |
| **MiniMax Speech 2.8 (TTS / T2A)** | **Text** (+ optional emotion/voice prompt) | **Audio (MP3 / WAV / PCM)** | Up to 10,000 chars per stream | Voice-first AI Tutor speech, audio lesson narration |
| **MiniMax Voice Clone** | **Audio Sample (5–30s audio file)** | **Custom Voice ID** | 1 audio sample | Personalized mentor voices |
| **MiniMax ASR (Speech-to-Text)** | **Audio (WAV, MP3, WebM, OGG)** | **Transcribed Text + Timestamps** | Real-time / Chunked | Voice input in AIChatDrawer / voice commands |
| **MiniMax Music 3.0** | **Text (Lyrics / Style Prompt)** | **Full Stereo Music Track** | Up to 4 minutes | Focus / study background music generation |

---

## 2. Deep Dive: MiniMax-M3 (Current LLM in LevelUP)

### Input Formats
MiniMax-M3 follows the standard **OpenAI-compatible `/v1/chat/completions`** format.

1. **Text**:
   - Multi-turn conversational messages (`system`, `user`, `assistant`, `tool`).
   - Markdown documents, code snippets, raw JSON schemas.
2. **Vision / Images**:
   - Can receive image URLs or inline Base64 data within the `messages` array:
     ```json
     {
       "role": "user",
       "content": [
         {"type": "text", "text": "Analyze this architecture diagram for skill gaps:"},
         {"type": "image_url", "image_url": {"url": "https://example.com/diagram.png"}}
       ]
     }
     ```
3. **Video**:
   - Accepts video URLs for multimodal temporal reasoning and code review demonstrations.

### Output Formats
- **Standard Text / Markdown**: Rich formatting with headings, code blocks, lists.
- **Structured JSON (`response_format: {"type": "json_object"}`)**: Ideal for generating tasks, roadmap phases, quizzes, and state updates.
- **Tool Calling / Function Calling**: Returns structured `tool_calls` for client-side execution.

---

## 3. Engineering Voice & Audio in LevelUP

### A. Voice Input (Speech-to-Text / ASR)
To allow learners to speak into the AI Chat Drawer:
1. **Frontend**: Record microphone audio in browser (`MediaRecorder` -> `audio/webm` or `audio/wav`).
2. **Backend**: Send audio buffer to MiniMax ASR endpoint or transcribe via Whisper/MiniMax.
3. **LLM**: Pass transcribed text into `process_chat_message()`.

### B. Voice Output (Text-to-Speech / Speech 2.8)
To let the AI Assistant speak back with natural human intonation:
- Endpoint: `POST https://api.minimaxi.chat/v1/t2a_v2`
- Payload:
  ```json
  {
    "model": "speech-01-turbo",
    "text": "Great job completing your React milestone! Next, let's explore state management.",
    "voice_setting": {
      "voice_id": "female-qn-qingse",
      "speed": 1.0,
      "vol": 1.0,
      "pitch": 0
    },
    "audio_setting": {
      "sample_rate": 32000,
      "bitrate": 128000,
      "format": "mp3"
    }
  }
  ```

---

## 4. Current LevelUP Configuration

Your current `.env` configuration in `backend/.env`:
- `OPENAI_API_KEY`: Configured with your active MiniMax JWT token.
- `OPENAI_BASE_URL`: `https://api.gmi-serving.com/v1`
- `OPENAI_MODEL`: `MiniMaxAI/MiniMax-M3`
- `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`: Aliased for direct service integrations.
