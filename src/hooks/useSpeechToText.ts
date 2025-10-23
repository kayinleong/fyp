import { useState, useEffect, useCallback } from 'react';

interface UseSpeechToTextOptions {
    continuous?: boolean;
    interimResults?: boolean;
    lang?: string;
}

// Define the SpeechRecognition types since TypeScript doesn't include them by default
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: {
        [index: number]: {
            [index: number]: {
                transcript: string;
                confidence: number;
            };
            isFinal?: boolean;
        };
        length: number;
    };
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

// Create our own type definitions for SpeechRecognition
interface SpeechRecognitionInstance {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: ((event: Event) => void) | null;
    onend: ((event: Event) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [hasRecognitionSupport, setHasRecognitionSupport] = useState(false);
    const [recognitionInstance, setRecognitionInstance] = useState<SpeechRecognitionInstance | null>(null);

    // Default options
    const {
        continuous = true,
        interimResults = true,
        lang = 'en-US'
    } = options;

    // Initialize speech recognition
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Use window.SpeechRecognition or the webkit prefixed version
        const SpeechRecognitionAPI = (window.SpeechRecognition ||
            window.webkitSpeechRecognition) as SpeechRecognitionConstructor | undefined;

        if (SpeechRecognitionAPI) {
            setHasRecognitionSupport(true);

            try {
                const recognition = new SpeechRecognitionAPI();
                recognition.continuous = continuous;
                recognition.interimResults = interimResults;
                recognition.lang = lang;

                recognition.onstart = () => {
                    setIsListening(true);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    setIsListening(false);
                };

                // Add a ref to store the latest interim result to avoid duplication
                let interimResult = '';

                recognition.onresult = (event) => {
                    let currentTranscript = '';
                    let hasInterim = false;

                    // Get the current transcript from all results
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcriptPart = event.results[i][0].transcript;
                        // Fix: Access isFinal property on the correct level of the object
                        if (event.results[i] && 'isFinal' in event.results[i] && event.results[i].isFinal) {
                            // For final results, add to currentTranscript
                            currentTranscript += transcriptPart;
                            // Reset the interim result when we get a final result
                            interimResult = '';
                        } else {
                            // For interim results, set the interim tracker
                            interimResult = transcriptPart;
                            hasInterim = true;
                        }
                    }

                    // If we have interim results, display them temporarily
                    if (hasInterim) {
                        setTranscript(prev => {
                            // We're using the interim result without appending multiple times
                            return prev + interimResult;
                        });
                        return; // Exit early for interim updates
                    }

                    // Only append final transcript if we have one
                    if (currentTranscript) {
                        setTranscript(prev => prev + currentTranscript);
                    }
                };

                setRecognitionInstance(recognition);
            } catch (error) {
                console.error('Error initializing speech recognition:', error);
                setHasRecognitionSupport(false);
            }
        }

        return () => {
            if (recognitionInstance) {
                try {
                    recognitionInstance.onresult = null;
                    recognitionInstance.onend = null;
                    recognitionInstance.onstart = null;
                    recognitionInstance.onerror = null;
                    recognitionInstance.abort();
                } catch (error) {
                    console.error('Error cleaning up speech recognition:', error);
                }
            }
        };
    }, [continuous, interimResults, lang]);

    // Start listening
    const startListening = useCallback(() => {
        setTranscript('');
        if (recognitionInstance) {
            try {
                recognitionInstance.start();
            } catch (error) {
                console.error('Error starting speech recognition:', error);
                // If already started, try stopping first then starting again
                try {
                    recognitionInstance.stop();
                    setTimeout(() => {
                        recognitionInstance.start();
                    }, 100);
                } catch (retryError) {
                    console.error('Error restarting speech recognition:', retryError);
                }
            }
        }
    }, [recognitionInstance]);

    // Stop listening
    const stopListening = useCallback(() => {
        if (recognitionInstance) {
            try {
                recognitionInstance.stop();
            } catch (error) {
                console.error('Error stopping speech recognition:', error);
            }
        }
    }, [recognitionInstance]);

    // Reset transcript
    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return {
        transcript,
        isListening,
        hasRecognitionSupport,
        startListening,
        stopListening,
        resetTranscript
    };
}

// Add type definitions for browsers that don't have them by default
declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}
