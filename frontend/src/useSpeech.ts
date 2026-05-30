import { useCallback, useMemo, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";
import type { SpeechRecognitionEventLike, SpeechRecognitionLike } from "./types";

export function useSpeech(onFinalTranscript: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [isAlwaysListening, setIsAlwaysListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [speechError, setSpeechError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const keepListeningRef = useRef(false);
  const nativeTranscriptRef = useRef("");
  const isNative = Capacitor.isNativePlatform();

  const Recognition = useMemo(
    () => window.SpeechRecognition ?? window.webkitSpeechRecognition,
    [],
  );

  const isSupported = isNative || Boolean(Recognition);

  const ensureNativePermission = useCallback(async () => {
    const availability = await SpeechRecognition.available();
    if (!availability.available) {
      setSpeechError("Speech recognition is not available on this device.");
      return false;
    }

    const permission = await SpeechRecognition.checkPermissions();
    if (permission.speechRecognition === "granted") {
      return true;
    }

    const requested = await SpeechRecognition.requestPermissions();
    const granted = requested.speechRecognition === "granted";
    if (!granted) {
      setSpeechError("Microphone permission was blocked.");
    }

    return granted;
  }, []);

  const stopNativeRecognition = useCallback(async () => {
    await SpeechRecognition.stop().catch(() => undefined);
    await SpeechRecognition.removeAllListeners().catch(() => undefined);
    setIsListening(false);
  }, []);

  const submitNativeTranscript = useCallback(() => {
    const transcript = nativeTranscriptRef.current.trim();
    nativeTranscriptRef.current = "";
    setInterimText("");

    if (transcript) {
      onFinalTranscript(transcript);
    }
  }, [onFinalTranscript]);

  const startNativePushToTalk = useCallback(() => {
    void (async () => {
      keepListeningRef.current = false;
      setIsAlwaysListening(false);
      setSpeechError("");
      nativeTranscriptRef.current = "";

      if (!(await ensureNativePermission())) return;

      await SpeechRecognition.removeAllListeners().catch(() => undefined);
      await SpeechRecognition.addListener("partialResults", (data) => {
        const transcript = data.matches?.[0] ?? "";
        nativeTranscriptRef.current = transcript;
        setInterimText(transcript);
      });

      await SpeechRecognition.start({
        language: "en-US",
        maxResults: 1,
        partialResults: true,
        popup: false,
      });
      setIsListening(true);
    })().catch(() => {
      setIsListening(false);
      setSpeechError("Microphone permission was blocked or speech recognition failed.");
    });
  }, [ensureNativePermission]);

  const stopNativePushToTalk = useCallback(() => {
    void (async () => {
      keepListeningRef.current = false;
      await stopNativeRecognition();
      submitNativeTranscript();
    })();
  }, [stopNativeRecognition, submitNativeTranscript]);

  const startNativeAlwaysListening = useCallback(() => {
    void (async () => {
      keepListeningRef.current = true;
      setIsAlwaysListening(true);
      setSpeechError("");

      if (!(await ensureNativePermission())) {
        keepListeningRef.current = false;
        setIsAlwaysListening(false);
        return;
      }

      const listenForOnePhrase = async () => {
        if (!keepListeningRef.current) return;

        setIsListening(true);
        const result = await SpeechRecognition.start({
          language: "en-US",
          maxResults: 1,
          partialResults: false,
          popup: false,
        });

        setIsListening(false);
        const transcript = result.matches?.[0]?.trim();
        if (transcript) {
          onFinalTranscript(transcript);
        }

        if (keepListeningRef.current) {
          window.setTimeout(() => void listenForOnePhrase(), 350);
        }
      };

      await listenForOnePhrase();
    })().catch(() => {
      keepListeningRef.current = false;
      setIsAlwaysListening(false);
      setIsListening(false);
      setSpeechError("Always listening stopped because speech recognition failed.");
    });
  }, [ensureNativePermission, onFinalTranscript]);

  const stopNativeAlwaysListening = useCallback(() => {
    keepListeningRef.current = false;
    setIsAlwaysListening(false);
    void stopNativeRecognition();
  }, [stopNativeRecognition]);

  const stopCurrentRecognition = useCallback((finalize: boolean) => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (finalize) {
      recognition.stop();
    } else {
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.abort();
    }

    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const startRecognition = useCallback(
    (continuous: boolean) => {
      if (!Recognition) {
        setSpeechError("Speech recognition is not supported in this browser.");
        return;
      }

      stopCurrentRecognition(false);
      setSpeechError("");

      const recognition = new Recognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let index = 0; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result[0].transcript;

          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setInterimText(interimTranscript);
        if (finalTranscript.trim()) {
          setInterimText("");
          onFinalTranscript(finalTranscript.trim());
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setInterimText("");
        setSpeechError("Microphone permission was blocked or speech recognition failed.");
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setIsListening(false);
        setInterimText("");

        if (keepListeningRef.current && Recognition) {
          window.setTimeout(() => startRecognition(true), 250);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    },
    [Recognition, onFinalTranscript, stopCurrentRecognition],
  );

  const startPushToTalk = useCallback(() => {
    if (isNative) {
      startNativePushToTalk();
      return;
    }

    keepListeningRef.current = false;
    setIsAlwaysListening(false);
    startRecognition(false);
  }, [isNative, startNativePushToTalk, startRecognition]);

  const stopPushToTalk = useCallback(() => {
    if (isNative) {
      stopNativePushToTalk();
      return;
    }

    keepListeningRef.current = false;
    stopCurrentRecognition(true);
  }, [isNative, stopNativePushToTalk, stopCurrentRecognition]);

  const startAlwaysListening = useCallback(() => {
    if (isNative) {
      startNativeAlwaysListening();
      return;
    }

    keepListeningRef.current = true;
    setIsAlwaysListening(true);
    startRecognition(true);
  }, [isNative, startNativeAlwaysListening, startRecognition]);

  const stopAlwaysListening = useCallback(() => {
    if (isNative) {
      stopNativeAlwaysListening();
      return;
    }

    keepListeningRef.current = false;
    setIsAlwaysListening(false);
    stopCurrentRecognition(false);
  }, [isNative, stopNativeAlwaysListening, stopCurrentRecognition]);

  const toggleAlwaysListening = useCallback(() => {
    if (keepListeningRef.current) {
      stopAlwaysListening();
    } else {
      startAlwaysListening();
    }
  }, [startAlwaysListening, stopAlwaysListening]);

  return {
    interimText,
    isAlwaysListening,
    isListening,
    isSupported,
    speechError,
    startAlwaysListening,
    startPushToTalk,
    stopAlwaysListening,
    stopPushToTalk,
    toggleAlwaysListening,
  };
}
