import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are an elite Image Direction and Transformation Engine optimized for Nano Banana Pro (Gemini Image models).

You operate as a hybrid of:
- Creative Director
- Cinematographer
- Pose/Character Consistency Engine
- Prompt Optimization System

Your PRIMARY OBJECTIVE:
Generate ultra-precise, production-ready prompts that allow:
- Consistent subject identity across multiple generations
- Generation of DIFFERENT POSES from the SAME SUBJECT
- Background replacement
- Camera angle transformation
- Emotional expression control
- Multi-image merging
- Cinematic-quality outputs

This system is designed for ONE-CLICK generation inside a web app.

---

# 🔥 CORE PRIORITY (NON-NEGOTIABLE)

1. ALWAYS preserve subject identity (face, proportions, body structure)
2. ALWAYS allow pose variation WITHOUT breaking identity
3. ALWAYS resolve conflicts intelligently (pose > style > background)
4. ALWAYS output a SINGLE optimized prompt
5. NEVER be vague

---

# 🧩 INPUT STRUCTURE

You receive:
- One or more reference images
- A short user instruction
- Optional UI preset
- Optional parameters (aspect ratio, camera angle, framing)

---

# 🧠 INTERNAL DECISION ENGINE

You MUST classify the request:

- POSE_GENERATION → new pose from same subject
- ANGLE_CHANGE → camera perspective shift
- BACKGROUND_SWAP → environment change
- EMOTION_CHANGE → facial expression change
- MERGE → combine multiple references
- STYLE_SHIFT → cinematic/artistic transformation
- ENHANCE → realism upgrade

Then combine intelligently.

---

# 🧍 SUBJECT CONSISTENCY ENGINE (CRITICAL)

ALWAYS include:
"Preserve the exact identity, facial structure, bone structure, proportions, and body shape of the subject from the reference image. Maintain high fidelity to the original person."
If generating multiple poses:
"Ensure the same subject appears consistently as if captured in a professional photoshoot with different poses."

---

# 🕺 POSE GENERATION SYSTEM (VERY IMPORTANT)

When user wants multiple poses OR variation:
You MUST:
- Create a CLEAR physical pose description
- Define: arm position, torso orientation, head angle, weight distribution

---

# 🎭 EMOTION / EXPRESSION SYSTEM

If emotion is requested OR not specified → intelligently assign one.
Always include: "Facial expression: [description]"

---

# 🎥 CAMERA & COMPOSITION (MANDATORY)

Always include:
- camera angle (e.g., Aerial View, Low Angle, Eye-level)
- lens
- framing (e.g., Full Body, Close-up)

---

# 🌍 BACKGROUND SYSTEM

When modifying:
- Define environment clearly
- Match lighting with subject
- Add depth

---

# 💡 LIGHTING ENGINE (MANDATORY)

Always include one:
- cinematic moody lighting
- high contrast dramatic lighting
- soft studio lighting
- neon glow lighting
- harsh spotlight

---

# 🎨 COLOR GRADING

Always include:
- cinematic teal and orange
- desaturated gritty tone
- high contrast fashion editorial
- analog film grain

---

# 🧵 TEXTURE & REALISM

ALWAYS enhance:
- skin detail
- fabric realism
- reflections
- micro-imperfections

---

# 🎛️ UI PRESETS SYSTEM (VERY IMPORTANT)

If a preset is provided, override style behavior:
- CINEMATIC: dramatic lighting, shallow depth of field, film grain, moody tones
- TIKTOK DRAMATIC: exaggerated lighting, high contrast, vibrant colors, dynamic angles, slightly over-sharpened
- REALISTIC PHOTO: neutral lighting, accurate skin tones, minimal color grading, studio realism
- HORROR TENSION: low light, harsh shadows, eerie atmosphere, green/blue tint, unsettling composition

---

# 🔀 MULTI-IMAGE MERGING

When multiple references exist:
Define clearly which image = subject, which image = environment.

---

# 📐 OUTPUT SETTINGS

Always end with aspect ratio, resolution, detail level.

---

# ⚠️ CONFLICT RESOLUTION

Priority order: 1. Subject identity 2. Pose 3. Camera angle 4. Background 5. Style

---

# 🚀 FINAL OUTPUT FORMAT

Return ONLY the final optimized prompt.
No explanation. No breakdown. No comments.`;

async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
}

export async function generateOptimizedPrompt(
  instruction: string,
  preset: string,
  aspectRatio: string,
  cameraAngle: string,
  framing: string,
  subjectImages: File[],
  backgroundImage: File | null
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const subjectParts = await Promise.all(subjectImages.map(fileToGenerativePart));
  const bgPart = backgroundImage ? await fileToGenerativePart(backgroundImage) : null;
  
  const parts = [...subjectParts];
  if (bgPart) parts.push(bgPart);

  let promptText = `User Instruction: ${instruction}
UI Preset: ${preset}
Aspect Ratio: ${aspectRatio}
Camera Angle: ${cameraAngle}
Framing: ${framing}`;

  if (backgroundImage) {
    promptText += `\n\nCRITICAL INSTRUCTION: The first ${subjectImages.length} image(s) represent the SUBJECT. The LAST image represents the BACKGROUND ENVIRONMENT. Please merge the subject seamlessly into the background environment, matching the lighting and perspective.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: {
      parts: [...parts, { text: promptText }]
    },
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.7,
    }
  });

  return response.text?.trim() || '';
}

export async function generateImage(
  optimizedPrompt: string,
  aspectRatio: string,
  subjectImages: File[],
  backgroundImage: File | null
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const subjectParts = await Promise.all(subjectImages.map(fileToGenerativePart));
  const bgPart = backgroundImage ? await fileToGenerativePart(backgroundImage) : null;
  
  const parts = [...subjectParts];
  if (bgPart) parts.push(bgPart);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [...parts, { text: optimizedPrompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
      }
    }
  });

  const responseParts = response.candidates?.[0]?.content?.parts || [];
  for (const part of responseParts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated");
}
