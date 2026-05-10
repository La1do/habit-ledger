import "dotenv/config";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  const data = await res.json() as { models: Array<{ name: string; supportedGenerationMethods: string[] }> };
  const flashModels = data.models
    .filter(m => m.name.includes("flash") && m.supportedGenerationMethods.includes("generateContent"))
    .map(m => m.name);
  console.log("Available flash models:", flashModels);
}

main().catch(console.error);
