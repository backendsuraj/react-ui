import ProcessorWrapper, {
    ProcessorWrapperOptions,
  } from './ProcessorWrapper';
  import FaceLandmarkProcessor from './transformers/FaceLandmarkProcessor';
  
  export const FaceLandmarkOverlay = (
    options: ProcessorWrapperOptions = {}
  ) =>
    new ProcessorWrapper(new FaceLandmarkProcessor(), 'face-landmark-overlay', options);