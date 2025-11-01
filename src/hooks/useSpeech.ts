import { useState, useEffect, useCallback } from 'react';

interface UseSpeechOptions {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: number; // Index of the voice to use
}

export function useSpeech(options: UseSpeechOptions = {}) {
    const [isSupported, setIsSupported] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | null>(null);

    // Set default options
    const {
        rate = 1,
        pitch = 1,
        volume = 1,
        voice = 0,
    } = options;

    // Initialize and get available voices
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setIsSupported(true);

            // Get voices
            const getVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                setVoices(availableVoices);

                // Set default voice
                if (availableVoices.length > 0) {
                    const voiceIndex = Math.min(voice, availableVoices.length - 1);
                    setCurrentVoice(availableVoices[voiceIndex]);
                }
            };

            // Chrome loads voices asynchronously
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = getVoices;
            }

            getVoices();

            // Clean up
            return () => {
                window.speechSynthesis.cancel();
            };
        }
    }, [voice]);

    // Speaking status updates
    useEffect(() => {
        if (!isSupported) return;

        const handleEnd = () => setIsSpeaking(false);

        window.speechSynthesis.addEventListener('end', handleEnd);

        return () => {
            window.speechSynthesis.removeEventListener('end', handleEnd);
        };
    }, [isSupported]);

    // Speak function
    const speak = useCallback((text: string) => {
        if (!isSupported) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Apply settings
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        if (currentVoice) {
            utterance.voice = currentVoice;
        }

        // Event handlers
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onpause = () => setIsPaused(true);
        utterance.onresume = () => setIsPaused(false);

        // Start speaking
        window.speechSynthesis.speak(utterance);

    }, [isSupported, rate, pitch, volume, currentVoice]);

    // Stop speaking
    const cancel = useCallback(() => {
        if (!isSupported) return;
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, [isSupported]);

    // Pause speaking
    const pause = useCallback(() => {
        if (!isSupported || !isSpeaking) return;
        window.speechSynthesis.pause();
        setIsPaused(true);
    }, [isSupported, isSpeaking]);

    // Resume speaking
    const resume = useCallback(() => {
        if (!isSupported || !isPaused) return;
        window.speechSynthesis.resume();
        setIsPaused(false);
    }, [isSupported, isPaused]);

    // Change voice
    const changeVoice = useCallback((voiceIndex: number) => {
        if (voices.length > 0 && voiceIndex < voices.length) {
            setCurrentVoice(voices[voiceIndex]);
        }
    }, [voices]);

    return {
        isSupported,
        isSpeaking,
        isPaused,
        voices,
        currentVoice,
        speak,
        cancel,
        pause,
        resume,
        changeVoice
    };
}
