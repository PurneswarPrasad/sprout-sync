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
        const validationPrompt = `You are a strict PLANT IMAGE VALIDATOR.
    Your task is to determine if the image's PRIMARY and CENTRAL subject is a real, natural plant or a cohesive arrangement of real plants (e.g., a bouquet or vase of cut flowers), with minimal ambiguity from non-plant elements.
    Allow incidental human elements like a hand holding or pointing to the plant if the plant remains the unambiguous central focus.

Follow these steps precisely:
1. **Analyze Subject:** In one sentence, describe the main, central subject of the image. Is it a person, animal, building, object, artificial construct, or a plant/plant arrangement? Carefully examine if plant elements appear real (with natural textures like irregular veins, slight imperfections, wilting edges, color gradients, and stem variations) or artificial (uniform glossiness, perfect symmetry, plastic-like sheen, silk/fabric textures, or manufactured uniformity without natural flaws). Also assess if the subject is a single plant, a cohesive arrangement (e.g., bouquet), or if multiple unrelated elements create ambiguity. Note if human elements (e.g., a hand) are present but incidental and not dominating.
2. **Apply Rules:** Based on your analysis, apply the following strict rules:
    * **FAIL** if the main subject is primarily a person, animal, object, building, or any non-plant element (e.g., a full human figure dominating the frame, even with plants nearby).
    * **FAIL** if the image is a landscape, scene, or event where plants are only in the background, secondary, or incidental.
    * **FAIL** if the most prominent plant element is grass, lawn, turf, hedge, or any uniform ground cover—these do not count as a distinct plant subject.
    * **FAIL** if the image depicts a shaped or sculpted plant formation, such as topiary (e.g., hedges trimmed into animal shapes like a peacock), even if made from real plants—these are considered artificial constructs or hedges, not distinct natural plants.
    * **FAIL** if any plant appears artificial, such as plastic, silk, faux, or manufactured replicas—look for cues like overly shiny surfaces, identical leaf shapes without variation, lack of natural droop or blemishes, or fabric-like folds; only genuine, living (or recently living/cut) plants qualify.
    * **FAIL** if there are multiple unrelated plants or elements that create significant ambiguity or compete for focus (e.g., two separate potted plants side-by-side, or a plant next to unrelated objects dominating the frame).
    * **PASS** if the clear, intended focus of the photo is a distinct, real plant or a single cohesive arrangement of real plants (e.g., a bouquet of flowers in a vase, treated as one unit), even with incidental non-plant elements like a hand holding a leaf for inspection or scale, as long as the plant remains the primary subject and the hand does not dominate or shift focus away from the plant. Examples include:
      - A close-up of a single leaf, flower, or plant showing detailed natural features, possibly with a hand gently holding it.
      - A single potted plant where that one plant itself is the sole central subject.
      - A plant in the ground that is isolated and prominent (e.g., one shrub, flower, or tree as the foreground focus), not blending into grass, lawn, turf, or a broader landscape.
      - A bouquet or vase arrangement of cut flowers/foliage, as long as it forms a unified central subject without scattered or competing elements.
    * Distinguish carefully: For arrangements like bouquets, pass if they are the standalone central focus (e.g., multiple blooms/stems in one vase); for images with hands, pass only if the hand is secondary (e.g., supporting or highlighting a plant or a plant issue) and the plant is clearly the focus—fail if the hand or person is the main subject. Reject if plants are part of or around shapes, backgrounds, larger scenes, or if artificial cues are present. Plants in the ground must be standalone without surrounding grass/lawn/turf dominating.
3. **Final Decision:** Based on the rules, decide if "isPlant" is true or false. Set confidence lower (e.g., 0.5-0.8) if real vs. artificial is borderline due to image quality, lighting, or subtle cues, or if incidental elements like hands create minor ambiguity.
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