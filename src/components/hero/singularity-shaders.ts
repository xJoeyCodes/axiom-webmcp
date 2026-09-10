export const diskVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute vec4 aOrbit;
  varying float vBrightness;
  void main() {
    float radius = aOrbit.x;
    float seed = aOrbit.w;
    // Differential angular velocity gives the disk shear without a short loop.
    float angle = aOrbit.y + uTime * 0.075 / pow(radius, 1.35);
    float ripple = sin(angle * 3.0 + radius * 2.5 + seed * 6.28);
    float r = radius + ripple * 0.025 * radius;
    vec3 p = vec3(cos(angle) * r, aOrbit.z, sin(angle) * r * 0.94);
    p.y += sin(angle * 2.0 + uTime * 0.06 + radius) * 0.025 * radius;
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    float outerFade = 1.0 - smoothstep(3.2, 5.22, radius);
    float innerLight = 0.38 + 0.62 * exp(-(radius - 1.02) * 0.7);
    float filaments = 0.6 + 0.4 * pow(0.5 + 0.5 * sin(radius * 19.0 - angle * 2.0), 2.0);
    vBrightness = outerFade * innerLight * filaments * (0.35 + seed * 0.65);
    gl_PointSize = clamp((1.25 + seed * 3.0) * uPixelRatio * 8.0 / -viewPosition.z, 1.0, 6.0);
  }
`;

export const diskFragmentShader = /* glsl */ `
  varying float vBrightness;
  void main() {
    float distanceToCenter = length(gl_PointCoord - 0.5) * 2.0;
    if (distanceToCenter > 1.0) discard;
    float core = exp(-distanceToCenter * distanceToCenter * 9.0);
    float halo = exp(-distanceToCenter * distanceToCenter * 3.0) * 0.12;
    gl_FragColor = vec4(vec3(0.94), (core + halo) * vBrightness * 1.15);
  }
`;

export const hazeVertexShader = /* glsl */ `
  varying vec2 vPosition;
  void main() {
    vPosition = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const hazeFragmentShader = /* glsl */ `
  varying vec2 vPosition;
  void main() {
    float radius = length(vPosition);
    float angle = atan(vPosition.y, vPosition.x);
    float inner = smoothstep(0.96, 1.1, radius);
    float outer = 1.0 - smoothstep(1.3, 5.2, radius);
    float bands = 0.65 + 0.35 * sin(radius * 17.0 + sin(angle * 3.0) * 0.7);
    float light = exp(-(radius - 1.0) * 1.65) * 0.28;
    gl_FragColor = vec4(vec3(0.88), inner * outer * light * bands);
  }
`;

export const rimVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

export const rimFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    // A thin Fresnel edge suggests lensing; the sphere's face stays black.
    float edge = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 8.0);
    gl_FragColor = vec4(vec3(edge * 0.48), 1.0);
  }
`;
