import { GoogleGenAI } from '@google/genai';
import { v2 as cloudinary } from 'cloudinary';
import { Config } from '@prisma/client';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type ShotType = 'selfie' | 'mirror_selfie' | 'fixed';
type Framing = 'close' | 'bust' | 'full';
type Tilt = 'left' | 'front' | 'right';

const shotDescriptions: Record<Framing, string> = {
  close: 'extreme close-up on face',
  bust: 'bust shot from shoulders up',
  full: 'full body shot',
};

const tiltDescriptions: Record<Tilt, string> = {
  left: 'slightly angled to the left',
  front: 'straight front facing',
  right: 'slightly angled to the right',
};

const expressionMap: Record<string, string> = {
  smile: 'warm smile',
  serious: 'serious expression',
  tender: 'tender gentle look',
  cute_angry: 'cute mock-angry expression',
  pout: 'soft pout',
  surprised: 'surprised expression',
  wink: 'playful wink',
  mischievous: 'mischievous smirk',
};

export interface GenerateImageParams {
  userInstructions: string;
  shotType: ShotType;
  config: Config;
  useFace: boolean;
  useBody: boolean;
  usePhone: boolean;
  framing?: Framing;
  tilt?: Tilt;
}

export interface GenerateVariationParams {
  config: Config;
  useFace: boolean;
  useBody: boolean;
  usePhone: boolean;
  expression?: string;
  framing?: Framing;
  angle?: Tilt;
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

async function buildParts(config: Config, useFace: boolean, useBody: boolean, usePhone: boolean) {
  const fetches: Promise<{ inlineData: { mimeType: string; data: string } }>[] = [];

  if (useFace) {
    fetches.push(
      urlToBase64(config.faceUrl).then(data => ({ inlineData: { mimeType: 'image/jpeg', data } }))
    );
  }
  if (useBody) {
    fetches.push(
      urlToBase64(config.bodyUrl).then(data => ({ inlineData: { mimeType: 'image/jpeg', data } }))
    );
  }
  if (usePhone && config.phoneUrl) {
    fetches.push(
      urlToBase64(config.phoneUrl).then(data => ({ inlineData: { mimeType: 'image/jpeg', data } }))
    );
  }

  return Promise.all(fetches);
}

async function callGemini(textPrompt: string, imageParts: { inlineData: { mimeType: string; data: string } }[]): Promise<string> {
  const parts = [{ text: textPrompt }, ...imageParts];

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

  return uploadBase64ToCloudinary(imagePart.inlineData.data);
}

export async function generateImage({
  userInstructions,
  shotType,
  config,
  useFace,
  useBody,
  usePhone,
  framing,
  tilt,
}: GenerateImageParams): Promise<string> {
  const shotStyleText =
    shotType === 'selfie'
      ? 'authentic smartphone front camera selfie, mobile sensor look, slight distortion'
      : shotType === 'mirror_selfie'
      ? 'phone mirror selfie, rear camera quality, hand holding phone visible in mirror'
      : 'authentic smartphone photo, natural amateur photography, mobile sensor look';

  const prompt = [
    'Photo of one person.',
    'Wearing the persistent clothing from the reference.',
    userInstructions,
    shotStyleText,
    framing ? shotDescriptions[framing] : undefined,
    tilt ? tiltDescriptions[tilt] : undefined,
    'natural ambient lighting, highly realistic photography, consistent character look',
  ]
    .filter(Boolean)
    .join(', ');

  const imageParts = await buildParts(config, useFace, useBody, usePhone);
  return callGemini(prompt, imageParts);
}

export async function generateVariationImage({
  config,
  useFace,
  useBody,
  usePhone,
  expression,
  framing,
  angle,
}: GenerateVariationParams): Promise<string> {
  const prompt = [
    'Variation of the person from the source image.',
    'Maintain character consistency.',
    'Keep persistent clothing from the original image.',
    expression && expressionMap[expression] ? `Scene variation: ${expressionMap[expression]},` : undefined,
    framing ? shotDescriptions[framing] : undefined,
    angle ? tiltDescriptions[angle] : undefined,
    'realistic photo, same environment.',
  ]
    .filter(Boolean)
    .join(' ');

  const imageParts = await buildParts(config, useFace, useBody, usePhone);
  return callGemini(prompt, imageParts);
}
