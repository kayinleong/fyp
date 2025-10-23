export type Message = {
    id: number;
    text: string;
    sender: "user" | "system";
    timestamp: Date;
};

export type SerializedMessage = {
    id: number;
    text: string;
    sender: "user" | "system";
    timestamp: string;
};