import { GoogleGenAI } from '@google/genai';
import { v2 as cloudinary } from 'cloudinary';
import { Config } from '@prisma/client';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface GenerateImageParams {
  prompt: string;
  config: Config;
  useFace: boolean;
  useBody: boolean;
  usePhone: boolean;
}

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

async function uploadBase64ToCloudinary(base64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'ari-studio/generated', resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );
    const buffer = Buffer.from(base64, 'base64');
    stream.end(buffer);
  });
}

export async function generateImage({
  prompt,
  config,
  useFace,
  useBody,
  usePhone,
}: GenerateImageParams): Promise<string> {
  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: prompt },
  ];

  if (useFace) {
    const faceB64 = await urlToBase64(config.faceUrl);
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: faceB64 } });
  }

  if (useBody) {
    const bodyB64 = await urlToBase64(config.bodyUrl);
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: bodyB64 } });
  }

  if (usePhone && config.phoneUrl) {
    const phoneB64 = await urlToBase64(config.phoneUrl);
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: phoneB64 } });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ role: 'user', parts }],
    config: { responseModalities: ['IMAGE'] },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { data?: string } }) => p.inlineData?.data
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error('Gemini no devolvió imagen');
  }

  const imageUrl = await uploadBase64ToCloudinary(imagePart.inlineData.data);
  return imageUrl;
}
