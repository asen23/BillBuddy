import { createPartFromUri, createUserContent, GoogleGenAI, Type } from '@google/genai';
import { createWorker } from 'tesseract.js';

export const processReceipt = async (image: File | string) => {
  console.log('processing', image);
  const worker = await createWorker('ind');
  const res = await worker.recognize(image);
  console.log('receipt text', res.data.text);
  await worker.terminate();
};

export const processReceiptGemini = async (image: Blob, apiKey: string) => {
  console.log('processing', image);
  const ai = new GoogleGenAI({ apiKey });
  const imageUpload = await ai.files.upload({ file: image });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      createUserContent([
        'Convert attached receipt image into list of order item, additionally fix any typo and try to guess the correct word if there are any inaccuracies',
        createPartFromUri(imageUpload.uri ?? '', imageUpload.mimeType ?? ''),
      ]),
    ],
    config: {
      responseMimeType: 'application/json',
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
          propertyOrdering: ['count', 'name', 'price'],
        },
      },
    },
  });
  if (imageUpload.name) {
    await ai.files.delete({ name: imageUpload.name });
  }
  console.log(response.text);
};
