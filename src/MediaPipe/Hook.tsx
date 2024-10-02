import { useEffect, useRef, useState } from 'react';

// Import the Web Worker as a module
const useMediaPipeWorker = (videoRef, canvasRef) => {
  const [currentModel, setCurrentModel] = useState('face-detection');
  const workerRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('./mediapipeWorker.js', import.meta.url)); // Reference to the worker
    }

    const loadVisionResolver = async () => {
      const visionResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_wasm'
      );

      workerRef.current.postMessage({
        type: 'LOAD_MODEL',
        modelName: currentModel,
        visionResolver,
      });
    };

    loadVisionResolver();

    workerRef.current.onmessage = (event) => {
      const { type, results } = event.data;

      if (type === 'MODEL_LOADED') {
        setIsModelLoaded(true);
      } else if (type === 'DETECTION_RESULT' || type === 'SEGMENTATION_RESULT') {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        if (type === 'DETECTION_RESULT') {
          results.forEach((detection) => {
            const [x, y, width, height] = detection.boundingBox;
            context.strokeStyle = 'red';
            context.lineWidth = 2;
            context.strokeRect(x, y, width, height);
            context.fillStyle = 'red';
            context.font = '16px Arial';
            context.fillText(detection.categories[0].categoryName, x, y - 5);
          });
        } else if (type === 'SEGMENTATION_RESULT') {
          const mask = results.segmentationMask;
          const imageData = new ImageData(new Uint8ClampedArray(mask.data), mask.width, mask.height);
          context.putImageData(imageData, 0, 0);
        }
      }
    };

    return () => {
      workerRef.current.terminate();
      workerRef.current = null;
    };
  }, [currentModel]);

  const runMediaPipe = (now, metadata) => {
    if (videoRef.current && isModelLoaded) {
      const videoData = videoRef.current;
      const timestamp = metadata.mediaTime;

      workerRef.current.postMessage({
        type: 'RUN_MODEL',
        modelName: currentModel,
        videoData,
        timestamp,
      });

      // Request the next video frame
      videoData.requestVideoFrameCallback(runMediaPipe);
    }
  };

  useEffect(() => {
    if (isModelLoaded && videoRef.current) {
      // Start processing video frames with requestVideoFrameCallback
      videoRef.current.requestVideoFrameCallback(runMediaPipe);
    }
  }, [isModelLoaded]);

  const switchModel = (modelName) => {
    if (modelName !== currentModel) {
      setIsModelLoaded(false);
      setCurrentModel(modelName);
    }
  };

  return { switchModel };
};

export default useMediaPipeWorker;
