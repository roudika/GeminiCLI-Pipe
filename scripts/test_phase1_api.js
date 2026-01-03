
import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY not found in .env file");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use the model requested by the user
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Using 2.0 Flash as 2.5 might not be available yet or might be typod. Let's try 2.0 Flash first which is stable, or use the exact string if user insists. 
// User asked for "gemini-2.5-flash-lite". I will use exactly that if it works, but usually it's "gemini-2.0-flash" or similar. 
// Wait, the user specifically asked for "gemini-2.5-flash-lite" in the prompt. I should try to honor that or fallback to a known working one.
// Actually, let's use the exact string the user provided in the sample to test it.
const MODEL_NAME = "gemini-2.0-flash-exp"; // "gemini-2.5-flash-lite" is likely not a valid model ID yet. I will use a known one or stick to what they gave if checking fails.
// Let's stick to the user's sample code model name "gemini-2.5-flash-lite" to test if it exists, if not we can change it. 
// Actually, looking at recent updates, standard models are gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash-exp. 
// "gemini-2.5-flash-lite" sounds like a future or hallucinated version. 
// I will use "gemini-2.0-flash-lite-preview-02-05" which is a real thing if it exists, or just "gemini-2.0-flash". 
// Let's safe bet with "gemini-2.0-flash" as it supports video.
// But the user specifically asked for "gemini-2.5-flash-lite". Let's try to use that string in the script variable but default to something else if it fails?
// No, let's just use "gemini-2.0-flash" as the default stable one for testing video, or "gemini-1.5-flash". 
// The user's sample code had "gemini-2.5-flash-lite". I will use that in the code but comment it out or put a variable.

const MODEL_ID = "gemini-2.5-flash-lite"; // Using user specified model 

async function analyzeYouTubeVideo(url) {
    console.log(`Testing Gemini API with URL: ${url}`);
    console.log(`Using model: ${MODEL_ID}`);

    try {
        const generativeModel = genAI.getGenerativeModel({ model: MODEL_ID });

        const prompt = "Please provide a verbatim transcript of this video. Output ONLY the transcript.";

        // Note: Passing a YouTube URL directly in fileUri usually requires the file to be uploaded to Gemini File API 
        // OR using the specific tools. 
        // However, the user provided a sample with fileUri: url. 
        // We will test this exact method.
        const result = await generativeModel.generateContent([
            {
                fileData: {
                    mimeType: "video/mp4",
                    fileUri: url
                }
            },
            { text: prompt },
        ]);

        console.log("--- API Response ---");
        console.log(result.response.text());
        console.log("--------------------");
        return true;

    } catch (error) {
        console.error("API Error:", error.message);
        if (error.message.includes("400")) {
            console.error("Note: This often means the direct YouTube URL method is not supported for fileUri. " +
                "Usually videos must be downloaded and uploaded to the File API first.");
        }
        return false;
    }
}

// Test with the user's video
const videoUrl = "https://www.youtube.com/watch?v=61Z2jLH4yGU";
analyzeYouTubeVideo(videoUrl);
