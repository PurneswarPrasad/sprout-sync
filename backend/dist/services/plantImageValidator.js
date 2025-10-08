"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePlantImage = validatePlantImage;
const generative_ai_1 = require("@google/generative-ai");
const plantValidationSchema = {
    type: generative_ai_1.SchemaType.OBJECT,
    properties: {
        isPlant: {
            type: generative_ai_1.SchemaType.BOOLEAN,
            description: "Whether the image's primary subject is a real, natural plant",
        },
        confidence: {
            type: generative_ai_1.SchemaType.NUMBER,
            description: "Confidence score between 0.0 and 1.0",
        },
        reason: {
            type: generative_ai_1.SchemaType.STRING,
            description: "Brief explanation for the decision",
        },
    },
    required: ["isPlant", "confidence", "reason"],
};
async function validatePlantImage(model, imagePart) {
    try {
        const validationPrompt = `You are a strict PLANT IMAGE VALIDATOR. Your task is to determine if the image's PRIMARY and CENTRAL subject is a single, real, natural plant, with no ambiguity from multiple elements.

Follow these steps precisely:
1. **Analyze Subject:** In one sentence, describe the main, central subject of the image. Is it a person, animal, building, object, artificial construct, or a plant? Carefully examine if any plant elements appear real (with natural textures, variations in leaf shapes, stems, and colors) or artificial (uniform, plastic-like, silk, or faux materials). Also assess if there is only one clear subject or if multiple elements (e.g., multiple plants) create ambiguity or share focus.
2. **Apply Rules:** Based on your analysis, apply the following strict rules:
    * **FAIL** if the main subject is a person, animal, object, building, or any non-plant element (e.g., a human in the foreground with grass in the background).
    * **FAIL** if the image is a landscape, scene, or event where plants are only in the background, secondary, or incidental.
    * **FAIL** if the most prominent plant element is grass, lawn, turf, hedge, or any uniform ground cover—these do not count as a distinct plant subject.
    * **FAIL** if the image depicts a shaped or sculpted plant formation, such as topiary (e.g., hedges trimmed into animal shapes like a peacock), even if made from real plants—these are considered artificial constructs or hedges, not distinct natural plants.
    * **FAIL** if any plant appears artificial, such as plastic, silk, faux, or manufactured replicas—only genuine, living (or recently living) plants qualify.
    * **FAIL** if there are multiple plants, elements, or subjects in the image that create ambiguity, share focus, or prevent a single plant from being the unambiguous central subject (e.g., a bonsai tree alongside a blade of grass).
    * **PASS** only if the clear, intended focus of the photo is exactly one distinct, real plant, with no other prominent elements or plants competing for attention, such as:
      - A close-up of a single leaf or single plant showing detailed natural features.
      - A single potted plant where that one plant itself is the sole central subject.
      - A single plant in the ground that is isolated and prominent (e.g., one shrub, flower, or tree as the foreground focus), not blending into grass, lawn, turf, or a broader landscape, and without any other plants or objects sharing the frame.
    * Distinguish carefully: Plants in the ground must be the standalone central subject without surrounding grass/lawn/turf dominating; reject if plants are part of or around shapes, backgrounds, larger scenes, or if multiple plant-like elements are present causing any ambiguity.
3. **Final Decision:** Based on the rules, decide if "isPlant" is true or false.
4. **Output JSON:** Return ONLY a valid JSON object with your final decision. Do not include your step-by-step analysis in the final JSON output.
`;
        console.log('Validating if image contains a plant...');
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: validationPrompt }, imagePart] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: plantValidationSchema,
            },
        });
        const response = await result.response;
        const text = response.text();
        console.log('Plant validation response:', text);
        const validationResult = JSON.parse(text);
        console.log(`Validation result: isPlant=${validationResult.isPlant}, confidence=${validationResult.confidence}, reason="${validationResult.reason}"`);
        return validationResult.isPlant && validationResult.confidence >= 0.8;
    }
    catch (error) {
        console.error('Error during plant validation:', error);
        return false;
    }
}
//# sourceMappingURL=plantImageValidator.js.map