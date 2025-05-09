// File: src/webgl/faceLandmarkRenderer.ts
import { FaceLandmarker } from "@mediapipe/tasks-vision";

interface ConnectorEBO {
  ebo: WebGLBuffer;
  count: number;
  color: [number, number, number, number];
}

export interface FaceLandmarkGL {
  renderVideoFrame: (frame: VideoFrame) => void;
  renderLandmarks: (landmarkSets: Array<Array<{ x: number; y: number }>>) => void;
  cleanup: () => void;
}

export function setupFaceLandmarkRenderer(canvas: OffscreenCanvas): FaceLandmarkGL | undefined {
  const gl = canvas.getContext("webgl2")!;
  if (!gl) {
    console.error("WebGL2 not supported");
    return undefined;
  }

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.lineWidth(1.0);

  // ---- Compile Shaders ----
  const vertexVideoSrc = `#version 300 es
  in vec2 a_position;
  in vec2 a_texCoord;
  out vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = vec2(a_texCoord.x, 1.0 - a_texCoord.y); // <-- FLIP Y axis
  }`;

  const fragmentVideoSrc = `#version 300 es
  precision mediump float;
  in vec2 v_texCoord;
  uniform sampler2D u_sampler;
  out vec4 outColor;
  void main() {
    outColor = texture(u_sampler, v_texCoord);
  }`;

  const vertexLandmarkSrc = `#version 300 es
  in vec2 a_uv;
  void main() {
    vec2 pos = a_uv * 2.0 - 1.0;
    pos.y = -pos.y;
    gl_Position = vec4(pos, 0, 1);
  }`;

  const fragmentLandmarkSrc = `#version 300 es
  precision mediump float;
  uniform vec4 u_color;
  out vec4 outColor;
  void main() {
    outColor = u_color;
  }`;

  function compileShader(type: number, src: string): WebGLShader {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error("Shader compile error: " + gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  function createProgram(vsSrc: string, fsSrc: string): WebGLProgram {
    const vs = compileShader(gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSrc);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error("Program link error: " + gl.getProgramInfoLog(program));
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return program;
  }

  const videoProgram = createProgram(vertexVideoSrc, fragmentVideoSrc);
  const landmarkProgram = createProgram(vertexLandmarkSrc, fragmentLandmarkSrc);

  // ---- Setup Buffers ----
  const quadVertices = new Float32Array([
    -1, -1, 0, 0,
    -1,  1, 0, 1,
     1, -1, 1, 0,
     1,  1, 1, 1,
  ]);
  const quadBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

  const vidPosLoc = gl.getAttribLocation(videoProgram, "a_position");
  const vidTexLoc = gl.getAttribLocation(videoProgram, "a_texCoord");
  const vidSamplerLoc = gl.getUniformLocation(videoProgram, "u_sampler")!;

  const landmarkVBO = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, landmarkVBO);
  gl.bufferData(gl.ARRAY_BUFFER, 468 * 2 * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);

  const uvLoc = gl.getAttribLocation(landmarkProgram, "a_uv");
  const colorLoc = gl.getUniformLocation(landmarkProgram, "u_color")!;

  const connectorInfo: ConnectorEBO[] = [];
  const sets: { indices: any; color: [number, number, number, number] }[] = [
    { indices: FaceLandmarker.FACE_LANDMARKS_TESSELATION, color: [0.75, 0.75, 0.75, 0.44] },
    { indices: FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, color: [1, 0.188, 0.188, 1] },
    { indices: FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, color: [1, 0.188, 0.188, 1] },
    { indices: FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, color: [0.188, 1, 0.188, 1] },
    { indices: FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, color: [0.188, 1, 0.188, 1] },
    { indices: FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, color: [0.878, 0.878, 0.878, 1] },
    { indices: FaceLandmarker.FACE_LANDMARKS_LIPS, color: [0.878, 0.878, 0.878, 1] },
  ];

  sets.forEach(({ indices, color }) => {
    const ebo = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
  
    const flatIndices: number[] = [];
    (indices as { start: number; end: number }[]).forEach(({ start, end }) => {
      flatIndices.push(start, end);
    });
  
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatIndices), gl.STATIC_DRAW);
    connectorInfo.push({ ebo, count: flatIndices.length, color });
  });

  const videoTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, videoTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  function renderVideoFrame(frame: VideoFrame) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(videoProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.enableVertexAttribArray(vidPosLoc);
    gl.vertexAttribPointer(vidPosLoc, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(vidTexLoc);
    gl.vertexAttribPointer(vidTexLoc, 2, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);
    gl.uniform1i(vidSamplerLoc, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function renderLandmarks(landmarkSets: Array<Array<{ x: number; y: number }>>) {
    if (landmarkSets.length === 0) return;
  
    gl.useProgram(landmarkProgram);
    gl.bindTexture(gl.TEXTURE_2D, null);
  
    for (const landmarks of landmarkSets) {
      const data = new Float32Array(landmarks.length * 2);
      landmarks.forEach((pt, i) => {
        data[i * 2 + 0] = pt.x;
        data[i * 2 + 1] = pt.y;
      });
  
      gl.bindBuffer(gl.ARRAY_BUFFER, landmarkVBO);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(uvLoc);
      gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
  
      // Draw connectors
      connectorInfo.forEach(({ ebo, count, color }) => {
        gl.uniform4fv(colorLoc, color);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.drawElements(gl.LINES, count, gl.UNSIGNED_SHORT, 0);
      });
  
      // Draw points
      gl.uniform4fv(colorLoc, [1, 1, 1, 1]);
      gl.drawArrays(gl.POINTS, 0, landmarks.length);
    }
  }
  
  function cleanup() {
    gl.deleteProgram(videoProgram);
    gl.deleteProgram(landmarkProgram);
    gl.deleteBuffer(quadBuffer);
    gl.deleteBuffer(landmarkVBO);
    gl.deleteTexture(videoTexture);
    connectorInfo.forEach(({ ebo }) => gl.deleteBuffer(ebo));
  }

  return { renderVideoFrame, renderLandmarks, cleanup };
}