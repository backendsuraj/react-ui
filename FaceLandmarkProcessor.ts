import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import VideoTransformer from './VideoTransformer';
import {
  setupFaceLandmarkRenderer,
  FaceLandmarkGL,
} from '../webgl/faceLandmarkRenderer';

export default class FaceLandmarkProcessor extends VideoTransformer<{}> {
  private faceLandmarker?: FaceLandmarker;
  private glRenderer?: FaceLandmarkGL;

  async init({ outputCanvas, inputElement }: any) {
    await super.init({ outputCanvas, inputElement });
    if (!this.canvas) throw new Error('Canvas not initialized');
    // Replace GL pipeline
    if (this.gl) this.gl.cleanup();
    const renderer = setupFaceLandmarkRenderer(this.canvas);
    if (!renderer) throw new Error('Failed to setup FaceLandmarkRenderer');
    // @ts-ignore
    this.gl = renderer;
    this.glRenderer = renderer;

    const fileSet = await FilesetResolver.forVisionTasks(
      `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm`
    );
    this.faceLandmarker = await FaceLandmarker.createFromOptions(fileSet, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 3,
    });
  }

  async destroy() {
    await super.destroy();
    this.faceLandmarker?.close();
  }

  transform(
    frame: VideoFrame,
    controller: TransformStreamDefaultController<VideoFrame>
  ) {
    if (!this.glRenderer || !this.faceLandmarker) {
      controller.enqueue(frame);
      frame.close();
      return;
    }
    // Draw video quad
    this.glRenderer.renderVideoFrame(frame);

    // Detect landmarks
    const now = performance.now();
    const result = this.faceLandmarker.detectForVideo(frame, now);

    const facesDetected = result.faceLandmarks?.length || 0;
    if (facesDetected > 1) {
      console.log('Multiple faces detected:', facesDetected);
    }

    if (result.faceLandmarks && result.faceLandmarks.length > 0) {
      this.glRenderer.renderLandmarks(result.faceLandmarks);
    }

    // Enqueue new frame
    const output = new VideoFrame(this.canvas!, {
      timestamp: frame.timestamp,
    });
    controller.enqueue(output);
    frame.close();
  }

  update() {
    // no dynamic options
  }
}