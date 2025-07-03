export enum AgeRange {
  EARLY_CHILDHOOD = "3 a 5 años",
  MIDDLE_CHILDHOOD = "6 a 8 años",
  LATE_CHILDHOOD = "9 a 11 años",
}

export interface StoryPage {
  id: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  audioUrl?: string;
  pcmData?: string; // Raw base64 encoded PCM audio data
}

export type LoadingState = {
  isLoading: boolean;
  message: string;
};
