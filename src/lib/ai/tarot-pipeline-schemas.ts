import { z } from "zod";

export const TarotAIJsonSchema = z.object({
  paragraph1: z.string().min(40).max(700),
  paragraph2: z.string().min(40).max(700),
  paragraph3: z.string().min(12).max(280),
});

export const TarotReadingCardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  keywords: z.array(z.string()).default([]),
  position: z.enum(["Sol", "Orta", "Sağ"]).optional(),
});

export const TarotProfileContextSchema = z.object({
  userData: z.string().min(1),
  partnerData: z.string().min(1),
});

export const TarotPipelineInputSchema = z.object({
  question: z.string().trim().min(3).max(500),
  cards: z.array(TarotReadingCardSchema).length(3),
  profile: TarotProfileContextSchema,
});

export type TarotReadingCard = z.infer<typeof TarotReadingCardSchema>;
export type TarotProfileContext = z.infer<typeof TarotProfileContextSchema>;
export type TarotPipelineInput = z.infer<typeof TarotPipelineInputSchema>;
