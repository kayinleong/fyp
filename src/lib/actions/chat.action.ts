"use server"

import { z } from "zod";
import { ai } from "../firebase/ai";

const ChatSchema = z.object({
    existingMessages: z.array(
        z.object({
            id: z.number(),
            text: z.string(),
            sender: z.enum(["user", "system"]),
            timestamp: z.string(), // Changed from z.date() to z.string()
        })
    ),
    newMessage: z.object({
        id: z.number(),
        text: z.string(),
        sender: z.enum(["user", "system"]),
        timestamp: z.string(), // Changed from z.date() to z.string()
    }),
});

export const chatFlow = ai.defineFlow(
    {
        name: "chatFlow",
        inputSchema: ChatSchema,
        outputSchema: z.string(),
    },
    async (chats) => {
        const chat = ai.chat({
            system: `You are an assistant that are prefessional in helping
            to secure their job placement or internship. You will help the user with their questions.`,

        });
        const { text } = await chat.send(`Existing messages: ${JSON.stringify(
            chats.existingMessages.map((msg) => msg.text)
        )} New message: ${chats.newMessage.text}`);

        return text;
    }
);