import { createProgram, createShader, glsl } from '../utils';
import { vertexShaderSource } from './vertexShader';

// Fragment shader: hard-coded green tint at 50% strength
export const compositeFragmentShader = glsl`#version 300 es
  precision mediump float;

  in vec2 texCoords;
  uniform sampler2D background;
  uniform sampler2D frame;
  uniform sampler2D mask;
  out vec4 fragColor;

  void main() {
    vec4 frameTex = texture(frame, texCoords);
    vec4 bgTex    = texture(background, texCoords);
    float m       = texture(mask, texCoords).r;

    // edge softness
    float grad = length(vec2(dFdx(m), dFdy(m)));
    float edgeSoftness = 2.0;
    float smoothAlpha = smoothstep(0.5 - grad * edgeSoftness,
                                   0.5 + grad * edgeSoftness,
                                   m);

    // hard-coded green tint @ 50%
    vec3 greenColor     = vec3(0.0, 1.0, 0.0);
    float tintStrength  = 0.5;
    vec3 tintedRGB      = mix(frameTex.rgb, greenColor, tintStrength);
    vec4 tinted         = vec4(tintedRGB, 1.0);

    // composite: background where mask=0, tinted frame where mask=1
    fragColor = mix(bgTex, tinted, 1.0 - smoothAlpha);
  }
`;

export function createCompositeProgram(gl: WebGL2RenderingContext) {
  const vs      = createShader(gl, gl.VERTEX_SHADER,   vertexShaderSource());
  const fs      = createShader(gl, gl.FRAGMENT_SHADER, compositeFragmentShader);
  const program = createProgram(gl, vs, fs);

  return {
    program,
    attribLocations: {
      position: gl.getAttribLocation(program, 'position'),
    },
    uniformLocations: {
      background: gl.getUniformLocation(program, 'background')!,
      frame:      gl.getUniformLocation(program, 'frame')!,
      mask:       gl.getUniformLocation(program, 'mask')!,
    },
  };
}
