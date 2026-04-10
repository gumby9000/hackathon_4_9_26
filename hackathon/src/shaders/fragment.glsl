 precision highp float;
varying vec2 v_pos;
uniform sampler2D u_wind;

void main() {

    //1. sample the texture
    vec4 windData = texture2D(u_wind, v_pos);
    
    //2. unpack U and V (mapping 0..1 to -1..1)
    float u = windData.r * 2.0 - 1.0;
    float v = windData.g * 2.0 - 1.0;
    
    //3. calaculate speed
    // float speed = length(vec2(u,v));
    float speed = windData.r;
    
    
    //4. color ramp
    // vec3 baseColor = vec3(0.05, 0.15, 0.25);
    // vec3 accentColor = vec3(0.0, 0.8, 0.7);
    // vec3 finalColor = mix(baseColor, accentColor, speed);

    // gl_FragColor = vec4(finalColor, 0.5);
    gl_FragColor = vec4(0.0, speed, speed, 0.4);
}