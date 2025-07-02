import { Item } from '@/util';
import { createPartFromUri, createUserContent, GoogleGenAI, Type } from '@google/genai';
import { createWorker } from 'tesseract.js';

export const processReceipt = async (image: File | string) => {
  console.log('processing', image);
  const worker = await createWorker('ind');
  const res = await worker.recognize(image);
  console.log('receipt text', res.data.text);
  await worker.terminate();
};

export const processReceiptGemini = async (image: Blob, apiKey: string, setLoading: (loading: boolean) => void, addItem: (item: Item) => void) => {
  console.log('processing', image);
  setLoading(true);
  const ai = new GoogleGenAI({ apiKey });
  const imageUpload = await ai.files.upload({ file: image });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      createUserContent([
        'Convert attached receipt image into list of order item, dont use any separator for the price',
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
  setLoading(false);
  console.log(response.text);
  if (response.text) {
    const data: Item[] = JSON.parse(response.text);
    data.forEach(item => addItem(item));
  }
};
