export type Preset = 'None' | 'Cinematic' | 'TikTok Dramatic' | 'Realistic Photo' | 'Horror Tension';
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type CameraAngle = 'Auto' | 'Eye-level' | 'Low Angle' | 'High Angle' | 'Aerial View' | 'Dutch Tilt';
export type Framing = 'Auto' | 'Close-up' | 'Medium Shot' | 'Full Body' | 'Wide Shot';

export interface AppState {
  subjectImages: File[];
  backgroundImage: File | null;
  instruction: string;
  preset: Preset;
  aspectRatio: AspectRatio;
  cameraAngle: CameraAngle;
  framing: Framing;
  isGeneratingPrompt: boolean;
  isGeneratingImage: boolean;
  generatedPrompt: string | null;
  generatedImageUrl: string | null;
  error: string | null;
}
