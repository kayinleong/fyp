import { useState, useEffect, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export const useImprovedSpeechToText = () => {
    const [isListening, setIsListening] = useState(false);

    const {
        transcript,
        resetTranscript,
        browserSupportsSpeechRecognition,
        isMicrophoneAvailable,
        listening,
    } = useSpeechRecognition();

    useEffect(() => {
        // Update local listening state based on library state
        setIsListening(listening);
    }, [listening]);

    const startListening = useCallback(() => {
        resetTranscript();
        SpeechRecognition.startListening({ continuous: true });
        setIsListening(true);
    }, [resetTranscript]);

    const stopListening = useCallback(() => {
        SpeechRecognition.stopListening();
        setIsListening(false);
    }, []);

    return {
        transcript,
        isListening,
        startListening,
        stopListening,
        resetTranscript,
        hasRecognitionSupport: browserSupportsSpeechRecognition,
        isMicrophoneAvailable,
    };
};
