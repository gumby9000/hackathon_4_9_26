uniform mat4 u_matrix;
uniform float u_world_offset;
attribute vec2 a_pos;
varying vec2 v_pos;

void main() {
  v_pos = a_pos; // save raw 0.0-1.0 pos
  vec4 offset_pos = vec4(a_pos.x + u_world_offset, a_pos.y, 0.0, 1.0);
  gl_Position = u_matrix * offset_pos;
}