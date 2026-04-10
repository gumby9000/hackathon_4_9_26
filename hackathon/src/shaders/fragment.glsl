precision highp float;
varying vec2 v_pos;

void main() {
  // Simulated Wind Speed (0.0 to 1.0)
  // This creates a pattern that looks like weather data
  float speed = 0.5 + 0.5 * sin(v_pos.x * 8.0) * cos(v_pos.y * 4.0);

  // Color Ramp: Dark Blue (Slow) -> Teal (Mid) -> Yellow (Fast)
  vec3 slow = vec3(0.05, 0.1, 0.2);
  vec3 mid = vec3(0.0, 0.5, 0.5);
  vec3 fast = vec3(1.0, 1.0, 0.4);

  vec3 finalColor = speed < 0.5 ? mix(slow, mid, speed * 2.0) : mix(mid, fast, (speed - 0.5) * 2.0);

  gl_FragColor = vec4(finalColor, 0.4);
};