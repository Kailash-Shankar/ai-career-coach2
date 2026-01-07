import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "AI Career Coach",
    name:"AI Career Coach",
    credentials: {
        gemini: {
            apiKey: process.env.GEMINI_API_KEY,
        }
    }
}); 