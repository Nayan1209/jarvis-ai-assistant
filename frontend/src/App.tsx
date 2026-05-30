import { FormEvent, KeyboardEvent, useCallback, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Bot, Loader2, Mic, MicOff, Radio, Send, Square } from "lucide-react";
import { sendMessage } from "./api";
import type { ApiMessage, ChatMessage } from "./types";
import { useSpeech } from "./useSpeech";

const welcomeMessage: ChatMessage = {
  id: crypto.randomUUID(),
  role: "assistant",
  content: "Jarvis online. Ask me anything, or hold the microphone to talk.",
};

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");

  const apiHistory = useMemo<ApiMessage[]>(
    () =>
      messages
        .filter((message) => message.content.trim())
        .map(({ role, content }) => ({ role, content })),
    [messages],
  );

  const speak = useCallback((text: string) => {
    if (Capacitor.isNativePlatform()) {
      void TextToSpeech.speak({
        text,
        lang: "en-US",
        rate: 1,
        pitch: 0.9,
        volume: 1,
      });
      return;
    }

    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 0.9;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  const cancelSpeech = useCallback(() => {
    if (Capacitor.isNativePlatform()) {
      void TextToSpeech.stop();
      return;
    }

    window.speechSynthesis?.cancel();
  }, []);

  const submitMessage = useCallback(
    async (rawMessage: string) => {
      const text = rawMessage.trim();
      if (!text || isThinking) return;

      setError("");
      setInput("");
      setIsThinking(true);

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };

      setMessages((current) => [...current, userMessage]);

      try {
        const response = await sendMessage(text, apiHistory);
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.answer,
        };
        setMessages((current) => [...current, assistantMessage]);
        speak(response.answer);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "The assistant could not answer right now.";
        setError(message);
      } finally {
        setIsThinking(false);
      }
    },
    [apiHistory, isThinking, speak],
  );

  const {
    interimText,
    isAlwaysListening,
    isListening,
    isSupported,
    speechError,
    startPushToTalk,
    stopPushToTalk,
    toggleAlwaysListening,
  } = useSpeech(submitMessage);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(input);
  }

  function handleMicKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    startPushToTalk();
  }

  function handleMicKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    stopPushToTalk();
  }

  return (
    <main className="app-shell">
      <section className="assistant-panel" aria-label="Jarvis assistant">
        <div className="status-bar">
          <div className="identity">
            <span className="identity-icon" aria-hidden="true">
              <Bot size={22} />
            </span>
            <div>
              <h1>Jarvis</h1>
              <p>{isThinking ? "Processing request" : "Voice assistant ready"}</p>
            </div>
          </div>
          <div className="signal" aria-label={isListening ? "Listening" : "Idle"}>
            <span className={isListening ? "pulse active" : "pulse"} />
            {isAlwaysListening ? "Always on" : isListening ? "Listening" : "Idle"}
          </div>
        </div>

        <div className="orb-wrap" aria-hidden="true">
          <div className={isListening ? "voice-orb listening" : "voice-orb"}>
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="controls">
          <button
            className="mic-button"
            disabled={!isSupported || isThinking || isAlwaysListening}
            onKeyDown={handleMicKeyDown}
            onKeyUp={handleMicKeyUp}
            onPointerCancel={stopPushToTalk}
            onPointerDown={startPushToTalk}
            onPointerLeave={stopPushToTalk}
            onPointerUp={stopPushToTalk}
            aria-label="Push to talk"
            aria-pressed={isListening && !isAlwaysListening}
            title={isSupported ? "Hold to talk" : "Speech recognition is not supported"}
            type="button"
          >
            {isListening && !isAlwaysListening ? <MicOff size={30} /> : <Mic size={30} />}
          </button>
          <button
            className="always-button"
            disabled={!isSupported}
            onClick={toggleAlwaysListening}
            aria-pressed={isAlwaysListening}
            title={isSupported ? "Toggle always listening" : "Speech recognition is not supported"}
            type="button"
          >
            <Radio size={20} />
            <span>{isAlwaysListening ? "Always on" : "Always listen"}</span>
          </button>
          <button
            className="icon-button"
            onClick={cancelSpeech}
            title="Stop speaking"
            type="button"
          >
            <Square size={20} />
          </button>
        </div>

        <p className="live-text">
          {interimText ||
            speechError ||
            (isSupported
              ? "Hold the mic for push-to-talk, or turn on always listening."
              : "Use text input in this browser.")}
        </p>

        <div className="conversation" aria-live="polite">
          {messages.map((message) => (
            <article className={`message ${message.role}`} key={message.id}>
              <span>{message.role === "assistant" ? "Jarvis" : "You"}</span>
              <p>{message.content}</p>
            </article>
          ))}
          {isThinking && (
            <article className="message assistant loading">
              <span>Jarvis</span>
              <p>
                <Loader2 size={16} />
                Thinking
              </p>
            </article>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <form className="composer" onSubmit={handleSubmit}>
          <input
            aria-label="Message Jarvis"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a command or question..."
            value={input}
          />
          <button disabled={!input.trim() || isThinking} title="Send message" type="submit">
            <Send size={20} />
          </button>
        </form>
      </section>
    </main>
  );
}

export default App;
