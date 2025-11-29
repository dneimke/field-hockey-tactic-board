/* eslint-disable @typescript-eslint/no-var-requires */
const { onCall } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { defineSecret } = require("firebase-functions/params");

const apiKey = defineSecret("GEMINI_API_KEY");

exports.generateContent = onCall({ secrets: [apiKey], cors: true }, async (request) => {
    console.log("generateContent called with data:", JSON.stringify(request.data));
    const { prompt, model: modelName } = request.data;

    if (!prompt) {
        throw new Error("Missing prompt");
    }

    const genAI = new GoogleGenerativeAI(apiKey.value());
    const model = genAI.getGenerativeModel({ model: modelName || "gemini-2.0-flash-exp" });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return { text: response.text() };
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to generate content");
    }
});
