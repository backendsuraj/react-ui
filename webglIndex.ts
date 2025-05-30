/**
 * WebGL setup for the mask processor
 * potential improvements:
 * - downsample the video texture in background blur scenario before applying the (gaussian) blur for better performance
 *
 */
import { applyBlur, createBlurProgram } from './shader-programs/blurShader';
import { createBoxBlurProgram } from './shader-programs/boxBlurShader';
import { createCompositeProgram } from './shader-programs/compositeShader';
import { applyDownsampling, createDownSampler } from './shader-programs/downSampler';
import {
  createFramebuffer,
  createVertexBuffer,
  emptyImageData,
  initTexture,
  resizeImageToCover,
} from './utils';

export const setupWebGL = (canvas: OffscreenCanvas) => {
  const gl = canvas.getContext('webgl2', {
    antialias: true,
    premultipliedAlpha: true,
  }) as WebGL2RenderingContext;

  let blurRadius: number | null = null;
  let maskBlurRadius: number | null = 8;
  const downsampleFactor = 4;

  if (!gl) {
    console.error('Failed to create WebGL context');
    return undefined;
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Create the composite program
  const composite = createCompositeProgram(gl);
  const compositeProgram = composite.program;
  const positionLocation = composite.attribLocations.position;
  const {
    mask: maskTextureLocation,
    frame: frameTextureLocation,
    background: bgTextureLocation,
  } = composite.uniformLocations;

  // Create the blur program using the same vertex shader source
  const blur = createBlurProgram(gl);
  const blurProgram = blur.program;
  const blurUniforms = blur.uniforms;

  // Create the box blur program
  const boxBlur = createBoxBlurProgram(gl);
  const boxBlurProgram = boxBlur.program;
  const boxBlurUniforms = boxBlur.uniforms;

  const bgTexture = initTexture(gl, 0);
  const frameTexture = initTexture(gl, 1);
  const vertexBuffer = createVertexBuffer(gl);

  if (!vertexBuffer) {
    throw new Error('Failed to create vertex buffer');
  }

  // Create additional textures and framebuffers for processing
  let bgBlurTextures: WebGLTexture[] = [];
  let bgBlurFrameBuffers: WebGLFramebuffer[] = [];
  let blurredMaskTexture: WebGLTexture | null = null;

  // For double buffering the final mask
  let finalMaskTextures: WebGLTexture[] = [];
  let readMaskIndex = 0; // Index for renderFrame to read from
  let writeMaskIndex = 1; // Index for updateMask to write to

  // Create textures for background processing (blur)
  bgBlurTextures.push(initTexture(gl, 3)); // For blur pass 1
  bgBlurTextures.push(initTexture(gl, 4)); // For blur pass 2

  const bgBlurTextureWidth = Math.floor(canvas.width / downsampleFactor);
  const bgBlurTextureHeight = Math.floor(canvas.height / downsampleFactor);

  const downSampler = createDownSampler(gl, bgBlurTextureWidth, bgBlurTextureHeight);

  // Create framebuffers for background processing
  bgBlurFrameBuffers.push(
    createFramebuffer(gl, bgBlurTextures[0], bgBlurTextureWidth, bgBlurTextureHeight),
  );
  bgBlurFrameBuffers.push(
    createFramebuffer(gl, bgBlurTextures[1], bgBlurTextureWidth, bgBlurTextureHeight),
  );

  // Initialize texture for the first mask blur pass
  const tempMaskTexture = initTexture(gl, 5);
  const tempMaskFrameBuffer = createFramebuffer(gl, tempMaskTexture, canvas.width, canvas.height);

  // Initialize two textures for double-buffering the final mask
  finalMaskTextures.push(initTexture(gl, 6)); // For reading in renderFrame
  finalMaskTextures.push(initTexture(gl, 7)); // For writing in updateMask

  // Create framebuffers for the final mask textures
  const finalMaskFrameBuffers = [
    createFramebuffer(gl, finalMaskTextures[0], canvas.width, canvas.height),
    createFramebuffer(gl, finalMaskTextures[1], canvas.width, canvas.height),
  ];

  // Set up uniforms for the composite shader
  gl.useProgram(compositeProgram);
  gl.uniform1i(bgTextureLocation, 0);
  gl.uniform1i(frameTextureLocation, 1);
  gl.uniform1i(maskTextureLocation, 2);

  // Store custom background image
  let customBackgroundImage: ImageBitmap | ImageData = emptyImageData;
  let backgroundVideo: HTMLVideoElement | null = null;

  function renderFrame(frame: VideoFrame) {
    if (frame.codedWidth === 0 || finalMaskTextures.length === 0) {
      return;
    }

    const width = frame.displayWidth;
    const height = frame.displayHeight;

    // Prepare frame texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, frameTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);

    // Apply blur if enabled (and no custom background is set)
    let backgroundTexture = bgTexture;

    if (blurRadius) {
      const downSampledFrameTexture = applyDownsampling(
        gl,
        frameTexture,
        downSampler,
        vertexBuffer!,
        bgBlurTextureWidth,
        bgBlurTextureHeight,
      );
      backgroundTexture = applyBlur(
        gl,
        downSampledFrameTexture,
        bgBlurTextureWidth,
        bgBlurTextureHeight,
        blurRadius,
        blurProgram,
        blurUniforms,
        vertexBuffer!,
        bgBlurFrameBuffers,
        bgBlurTextures,
      );
    } else {
      // if a background video is set, draw that; otherwise draw the image
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bgTexture);
      if (backgroundVideo && backgroundVideo.readyState >= 2) {
        // upload current video frame
        gl.texImage2D(
          gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
          gl.UNSIGNED_BYTE, backgroundVideo
        );
      } else {
        // fallback to your existing image or blank
        gl.texImage2D(
          gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
          gl.UNSIGNED_BYTE, customBackgroundImage
        );
      }
      backgroundTexture = bgTexture;
    }

    // Render the final composite
    gl.viewport(0, 0, width, height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(compositeProgram);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    // Set background texture (either original, blurred or custom)
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, backgroundTexture);
    gl.uniform1i(bgTextureLocation, 0);

    // Set frame texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, frameTexture);
    gl.uniform1i(frameTextureLocation, 1);

    // Set mask texture - always read from the current read index
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, finalMaskTextures[readMaskIndex]);
    gl.uniform1i(maskTextureLocation, 2);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /**
   * Set or update the background image
   * @param image The background image to use, or null to clear
   */
  async function setBackgroundImage(image: ImageBitmap | null) {
    // Clear existing background
    customBackgroundImage = emptyImageData;

    if (image) {
      try {
        // Resize and crop the image to cover the canvas
        const croppedImage = await resizeImageToCover(image, canvas.width, canvas.height);

        // Store the cropped and resized image
        customBackgroundImage = croppedImage;
      } catch (error) {
        console.error(
          'Error processing background image, falling back to black background:',
          error,
        );
      }
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bgTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, customBackgroundImage);
  }

  /**
   * Use a video element as the background.
   * @param videoEl The HTMLVideoElement you want to play behind the person
   */
  function setBackgroundVideo(videoEl: HTMLVideoElement) {
    console.log("Helloooo")
    backgroundVideo = videoEl;
    // make sure the video is ready to draw
    videoEl.crossOrigin = 'anonymous';
    videoEl.play().catch(() => {});
  }

  function setBlurRadius(radius: number | null) {
    blurRadius = radius ? Math.max(1, Math.floor(radius / downsampleFactor)) : null; // we are downsampling the blur texture, so decrease the radius here for better performance with a similar visual result
    setBackgroundImage(null);
  }

  function updateMask(mask: WebGLTexture) {
    // Use the existing applyBlur function to apply the first blur pass
    // The second blur pass will be written to finalMaskTextures[writeMaskIndex]

    // Create temporary arrays for the single blur operation
    const tempFramebuffers = [tempMaskFrameBuffer, finalMaskFrameBuffers[writeMaskIndex]];

    const tempTextures = [tempMaskTexture, finalMaskTextures[writeMaskIndex]];

    // Apply the blur using the existing function
    applyBlur(
      gl,
      mask,
      canvas.width,
      canvas.height,
      maskBlurRadius || 1.0,
      boxBlurProgram,
      boxBlurUniforms,
      vertexBuffer!,
      tempFramebuffers,
      tempTextures,
    );

    // Swap indices for the next frame
    readMaskIndex = writeMaskIndex;
    writeMaskIndex = 1 - writeMaskIndex;
  }

  function cleanup() {
    gl.deleteProgram(compositeProgram);
    gl.deleteProgram(blurProgram);
    gl.deleteProgram(boxBlurProgram);
    gl.deleteTexture(bgTexture);
    gl.deleteTexture(frameTexture);
    gl.deleteTexture(tempMaskTexture);
    gl.deleteFramebuffer(tempMaskFrameBuffer);

    for (const texture of bgBlurTextures) {
      gl.deleteTexture(texture);
    }
    for (const framebuffer of bgBlurFrameBuffers) {
      gl.deleteFramebuffer(framebuffer);
    }
    for (const texture of finalMaskTextures) {
      gl.deleteTexture(texture);
    }
    for (const framebuffer of finalMaskFrameBuffers) {
      gl.deleteFramebuffer(framebuffer);
    }
    gl.deleteBuffer(vertexBuffer);

    if (blurredMaskTexture) {
      gl.deleteTexture(blurredMaskTexture);
    }

    if (downSampler) {
      gl.deleteTexture(downSampler.texture);
      gl.deleteFramebuffer(downSampler.framebuffer);
      gl.deleteProgram(downSampler.program);
    }

    // Release any ImageBitmap resources
    if (customBackgroundImage) {
      if (customBackgroundImage instanceof ImageBitmap) {
        customBackgroundImage.close();
      }
      customBackgroundImage = emptyImageData;
    }
    bgBlurTextures = [];
    bgBlurFrameBuffers = [];
    finalMaskTextures = [];
  }

  return { renderFrame, updateMask, setBackgroundImage, setBackgroundVideo, setBlurRadius, cleanup };
};
