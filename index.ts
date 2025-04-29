import ProcessorWrapper, { ProcessorWrapperOptions } from './ProcessorWrapper';
import BackgroundTransformer, {
  BackgroundOptions,
  FrameProcessingStats,
  SegmenterOptions,
} from './transformers/BackgroundTransformer';

export * from './transformers/types';
export { default as VideoTransformer } from './transformers/VideoTransformer';
export {
  ProcessorWrapper,
  type BackgroundOptions,
  type SegmenterOptions,
  BackgroundTransformer,
  type ProcessorWrapperOptions,
};

/**
 * Determines if the current browser supports background processors
 */
export const supportsBackgroundProcessors = () =>
  BackgroundTransformer.isSupported && ProcessorWrapper.isSupported;

/**
 * Determines if the current browser supports modern background processors, which yield better performance
 */
export const supportsModernBackgroundProcessors = () =>
  BackgroundTransformer.isSupported && ProcessorWrapper.hasModernApiSupport;

export interface BackgroundProcessorOptions extends ProcessorWrapperOptions {
  blurRadius?: number;
  imagePath?: string;
  backgroundVideoSelector?: string;
  segmenterOptions?: SegmenterOptions;
  assetPaths?: { tasksVisionFileSet?: string; modelAssetPath?: string };
  onFrameProcessed?: (stats: FrameProcessingStats) => void;
}

export const BackgroundBlur = (
  blurRadius: number = 10,
  segmenterOptions?: SegmenterOptions,
  onFrameProcessed?: (stats: FrameProcessingStats) => void,
  processorOptions?: ProcessorWrapperOptions,
) => {
  return BackgroundProcessor(
    {
      blurRadius,
      segmenterOptions,
      onFrameProcessed,
      ...processorOptions,
    },
    'background-blur',
  );
};

export const VirtualBackground = (
  imagePath: string,
  segmenterOptions?: SegmenterOptions,
  onFrameProcessed?: (stats: FrameProcessingStats) => void,
  processorOptions?: ProcessorWrapperOptions,
) => {
  return BackgroundProcessor(
    {
      imagePath,
      segmenterOptions,
      onFrameProcessed,
      ...processorOptions,
    },
    'virtual-background',
  );
};

export const LiveBackground = (
  backgroundVideoSelector: string,
  segmenterOptions?: SegmenterOptions,
  onFrameProcessed?: (stats: FrameProcessingStats) => void,
  processorOptions?: ProcessorWrapperOptions,
) => {
  return BackgroundProcessor(
    {
      backgroundVideoSelector,
      segmenterOptions,
      onFrameProcessed,
      ...processorOptions,
    },
    'virtual-background',
  );
};

export const BackgroundProcessor = (
  options: BackgroundProcessorOptions,
  name = 'background-processor',
) => {
  const isTransformerSupported = BackgroundTransformer.isSupported;
  const isProcessorSupported = ProcessorWrapper.isSupported;

  if (!isTransformerSupported) {
    throw new Error('Background transformer is not supported in this browser');
  }

  if (!isProcessorSupported) {
    throw new Error(
      'Neither MediaStreamTrackProcessor nor canvas.captureStream() fallback is supported in this browser',
    );
  }

  // Extract transformer-specific options and processor options
  const {
    blurRadius,
    imagePath,
    backgroundVideoSelector,
    segmenterOptions,
    assetPaths,
    onFrameProcessed,
    ...processorOpts
  } = options;

  const transformer = new BackgroundTransformer({
    blurRadius,
    imagePath,
    backgroundVideoSelector,
    segmenterOptions,
    assetPaths,
    onFrameProcessed,
  });

  const processor = new ProcessorWrapper(transformer, name, processorOpts);

  return processor;
};
