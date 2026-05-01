precision highp float;
varying vec2 v_pos;
varying float v_alpha;
uniform sampler2D u_wind;
uniform float u_uMin;
uniform float u_uMax;
uniform float u_vMin;
uniform float u_vMax;
uniform vec2 u_texSize;

vec4 cubic(float v) {
  vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
  vec4 s = n * n * n;
  float x = s.x;
  float y = s.y - 4.0 * s.x;
  float z = s.z - 4.0 * s.y + 6.0 * s.x;
  float w = 6.0 - x - y - z;
  return vec4(x, y, z, w) * (1.0 / 6.0);
}

vec4 textureBicubic(sampler2D sampler, vec2 texCoords) {

  vec2 invTexSize = 1.0 / u_texSize;

  vec2 scaledCoords = texCoords * u_texSize - 0.5;

  vec2 fxy = fract(scaledCoords);
  scaledCoords -= fxy;

  vec4 xcubic = cubic(fxy.x);
  vec4 ycubic = cubic(fxy.y);

  vec4 c = scaledCoords.xxyy + vec2(-0.5, 1.5).xyxy;

  vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
  vec4 offset = c + vec4(xcubic.yw, ycubic.yw) / s;

  offset *= invTexSize.xxyy;

  vec4 sample0 = texture2D(sampler, offset.xz);
  vec4 sample1 = texture2D(sampler, offset.yz);
  vec4 sample2 = texture2D(sampler, offset.xw);
  vec4 sample3 = texture2D(sampler, offset.yw);

  float sx = s.x / (s.x + s.y);
  float sy = s.z / (s.z + s.w);

  return mix(mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);
    // return vec4(0, 0, 0, 1);;

}
void main() {

  float y = v_pos.y;
  float lat = 2.0 * atan(exp(3.14159265 * (1.0 - 2.0 * y))) - 1.57079632679;

  float texY = (lat / 3.14159265 + 0.5);

  vec2 lookupPos = vec2(v_pos.x, texY);
                          // vec4 color = texture2D(u_wind, lookupPos);
  vec4 color = textureBicubic(u_wind, lookupPos);
  if(color.a < 0.01) {
    discard; // This tells the GPU to skip painting this pixel entirely
  }
  float u = color.r * (u_uMax - u_uMin) + u_uMin;
  float v = color.g * (u_vMax - u_vMin) + u_vMin;

  float speed = length(vec2(u, v));
  float n = color.r;

  vec3 lowColor = vec3(0.05, 0.05, 0.2);
  vec3 highColor = vec3(0.9, 0.3, 0.0);

                          // vec3 c0 = vec3(0.015, 0.023, 0.231);  // #04063b (0ft)
                          // vec3 c1 = vec3(0.051, 0.439, 0.933);  // #0d70ee (2ft)
                          // vec3 c2 = vec3(0.094, 0.898, 0.663);  // #18e5a9 (4ft)
                          // vec3 c3 = vec3(0.208, 0.816, 0.169);  // #35d02b (6ft)
                          // vec3 c4 = vec3(0.933, 0.918, 0.055);  // #eeea0e (8ft)
                          // vec3 c5 = vec3(0.992, 0.604, 0.149);  // #fd9a26 (10ft)
                          // vec3 c6 = vec3(0.992, 0.333, 0.129);  // #fd5521 (12ft)
                          // vec3 c7 = vec3(0.722, 0.024, 0.063);  // #b80610 (16ft)
                          // vec3 c8 = vec3(0.635, 0.165, 0.655);  // #a22aa7 (18ft)
                          // vec3 c9 = vec3(0.361, 0.082, 0.400);  // #5c1566 (40ft)

                          // vec3 _color;

                          // // Normalizing stops based on a 40ft max scale
                          // // Stops: 0, 2, 4, 6, 8, 10, 12, 16, 18, 40
                          // // Normalized (val/40): 0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.45, 1.0

                          // if (n == 0.0)      _color = vec3(0.0, 0.0, 0.0);
                          // else if (n < 0.05) _color = mix(c0, c1, (n - 0.0) / 0.05);
                          // else if (n < 0.1)  _color = mix(c1, c2, (n - 0.05) / 0.05);
                          // else if (n < 0.15) _color = mix(c2, c3, (n - 0.1) / 0.05);
                          // else if (n < 0.2)  _color = mix(c3, c4, (n - 0.15) / 0.05);
                          // else if (n < 0.25) _color = mix(c4, c5, (n - 0.2) / 0.05);
                          // else if (n < 0.3)  _color = mix(c5, c6, (n - 0.25) / 0.05);
                          // else if (n < 0.4)  _color = mix(c6, c7, (n - 0.3) / 0.1);
                          // else if (n < 0.45) _color = mix(c7, c8, (n - 0.4) / 0.05);
                          // else               _color = mix(c8, c9, (n - 0.45) / 0.55);

  vec3 c0 = vec3(0.05, 0.05, 0.2);  // Dark Blue (0)
  vec3 c1 = vec3(0.0, 0.4, 0.8);   // Light Blue
  vec3 c2 = vec3(0.0, 0.8, 0.4);   // Green
  vec3 c3 = vec3(0.9, 0.9, 0.2);   // Yellow
  vec3 c4 = vec3(0.9, 0.3, 0.0);   // Orange/Red
  vec3 c5 = vec3(0.6, 0.1, 0.6);   // Purple (Peak)

  vec3 _color;

  if(n < 0.2)
    _color = mix(c0, c1, n * 5.0);
  else if(n < 0.4)
    _color = mix(c1, c2, (n - 0.2) * 5.0);
  else if(n < 0.6)
    _color = mix(c2, c3, (n - 0.4) * 5.0);
  else if(n < 0.8)
    _color = mix(c3, c4, (n - 0.6) * 5.0);
  else
    _color = mix(c4, c5, (n - 0.8) * 5.0);

  gl_FragColor = vec4(_color, 0.89);
}