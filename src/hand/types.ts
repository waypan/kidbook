export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResult {
  landmarks: HandLandmark[];
}