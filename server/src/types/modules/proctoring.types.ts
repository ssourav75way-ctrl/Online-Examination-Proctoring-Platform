export interface UploadSnapshotInput {
  sessionId: string;
  imageUrl: string;
  faceDetected: boolean;
  multipleFaces: boolean;
  candidateAbsent: boolean;
}
