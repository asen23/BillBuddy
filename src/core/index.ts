import type { ItemDraft } from "@/lib/types";
import {
  createPartFromUri,
  createUserContent,
  GoogleGenAI,
  Type,
} from "@google/genai";

/** Shape the extraction schema below returns (price = unit price). */
type ExtractedItem = { name: string; count: number; price: number };

export const processReceiptGemini = async (
  image: Blob,
  apiKey: string,
  setLoading: (loading: boolean) => void,
  addItem: (item: ItemDraft) => void,
) => {
  setLoading(true);
  const ai = new GoogleGenAI({ apiKey });
  const imageUpload = await ai.files.upload({ file: image });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      createUserContent([
        "Convert attached receipt image into list of order item, dont use any separator for the price",
        createPartFromUri(imageUpload.uri ?? "", imageUpload.mimeType ?? ""),
      ]),
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
            },
            count: {
              type: Type.NUMBER,
            },
            price: {
              type: Type.NUMBER,
            },
          },
          propertyOrdering: ["count", "name", "price"],
        },
      },
    },
  });
  if (imageUpload.name) {
    await ai.files.delete({ name: imageUpload.name });
  }
  setLoading(false);
  if (response.text) {
    const data: ExtractedItem[] = JSON.parse(response.text);
    data.forEach(({ name, count, price }) =>
      addItem({ name, count, unitPrice: price }),
    );
  }
};
