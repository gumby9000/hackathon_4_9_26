precision highp float;
varying vec2 v_pos;
uniform sampler2D u_wind;
uniform float u_uMin;
uniform float u_uMax;
uniform float u_vMin;
uniform float u_vMax;

void main() {

  float y = v_pos.y;
  float lat = 2.0 * atan(exp(3.14159265 * (1.0 - 2.0 * y))) - 1.57079632679;

  float texY = (lat / 3.14159265 + 0.5);

  vec2 lookupPos = vec2(v_pos.x, texY);
  vec4 color = texture2D(u_wind, lookupPos);

  float u = color.r * (u_uMax - u_uMin) + u_uMin;
  float v = color.g * (u_vMax - u_vMin) + u_vMin;

  float speed = length(vec2(u, v));
  float n = clamp(speed / 30.0, 0.0, 1.0);

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

  gl_FragColor = vec4(_color, 0.4);
}