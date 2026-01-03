
import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        // There isn't a direct listModels on the SDK root in some versions, 
        // but let's try to infer or just use a known good one if this fails.
        // Actually, checking documentation, it's usually via a ModelManager or sometimes just not exposed in the high level SDK helper.
        // But let's try a simple generation with "gemini-pro" to see if basic auth works.
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("gemini-pro works:", result.response.text());
    } catch (e) {
        console.error("Error testing gemini-pro:", e.message);
    }
}

listModels();
