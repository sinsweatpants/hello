
import { GoogleGenAI, Type } from "@google/genai";
import type { ScreenplayElement } from '../types';
import { ElementType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: Object.values(ElementType),
        description: "نوع عنصر السيناريو."
      },
      text: {
        type: Type.STRING,
        description: "المحتوى النصي للعنصر. قد يكون فارغًا لرأس المشهد."
      },
      scene_number: {
        type: Type.STRING,
        description: "فقط لرأس المشهد: رقم المشهد (مثال: 'مشهد 1')."
      },
      scene_time: {
        type: Type.STRING,
        description: "فقط لرأس المشهد: وقت اليوم ونوع الموقع (مثال: 'ليل - داخلي')."
      },
      scene_location: {
        type: Type.STRING,
        description: "فقط لرأس المشهد: الموقع المحدد (مثال: 'مستشفى – غرفة')."
      }
    },
    required: ['type']
  }
};

export const parseScriptWithGemini = async (rawText: string): Promise<ScreenplayElement[]> => {
    const prompt = `
    أنت خبير في تنسيق السيناريوهات العربية. مهمتك هي تحليل النص الخام التالي وتحويله إلى مصفوفة JSON منظمة. يجب أن يمثل كل عنصر في المصفوفة جزءًا مميزًا من السيناريو. التزم بصرامة بأنواع العناصر وهياكلها التالية:

    1.  **${ElementType.BASMALA}**: لعبارة "بسم الله الرحمن الرحيم".
    2.  **${ElementType.SCENE_HEADING}**: لترويسة المشهد.
        *   **التحليل**: ترويسة المشهد تصف مكان وزمان المشهد. قد تأتي على سطر واحد أو سطرين.
        *   **مثال تحليل**: "مشهد 1 ليل-داخلي المستشفى – غرفة" يجب أن يحلل إلى:
            *   \`scene_number\`: "مشهد 1"
            *   \`scene_time\`: "ليل-داخلي"
            *   \`scene_location\`: "المستشفى – غرفة"
        *   **المخرجات**: يجب أن يحتوي الكائن على الخصائص 'scene_number', 'scene_time', و 'scene_location'. الخاصية 'text' يجب أن تكون فارغة لهذا النوع.
    3.  **${ElementType.ACTION}**: لخطوط الحركة والأوصاف.
    4.  **${ElementType.CHARACTER}**: لاسم الشخصية التي تتحدث. استخرج الاسم فقط، بدون أي علامات ترقيم مثل النقطتين (:).
    5.  **${ElementType.DIALOGUE}**: للأسطر التي تتحدث بها الشخصية.
    6.  **${ElementType.PARENTHETICAL}**: للتعليمات الأدائية داخل الحوار، وعادة ما تكون بين قوسين.
    7.  **${ElementType.TRANSITION}**: لانتقالات المشاهد مثل "قطع" أو "إلى:".

    حلل النص المقدم بدقة وقم ببنائه وفقًا لهذه القواعد الصارمة.

    النص الخام:
    ---
    ${rawText}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);
        
        if (!Array.isArray(parsedResponse)) {
            throw new Error("AI response is not a valid array.");
        }
        
        return parsedResponse as ScreenplayElement[];
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to parse script using AI. The model might have returned an invalid format.");
    }
};
