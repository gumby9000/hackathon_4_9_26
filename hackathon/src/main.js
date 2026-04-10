import './style.css'
import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";
import vertexSource from './shaders/vertex.glsl?raw';
import fragmentSource from './shaders/fragment.glsl?raw';

  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  const map = new mapboxgl.Map({
      container: 'map', // container ID
      projection: 'mercator',
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0,0],
      zoom: 2
  });

  function createWindTexture(gl) {
    const size = 256;
    const data = new Uint8Array(size * size * 4);
    
for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const lat = (y / size) * 180 - 90; // -90 to 90

        // Simulate Trade Winds (Easterlies) near equator, Westerlies elsewhere
        let u = Math.abs(lat) < 30 ? -15.0 : 15.0; 
        let v = Math.sin(x / 10) * 5.0; // Some wavy North/South movement

        // Pack into 0-255 (assuming max wind is 30m/s)
        // Range: -30 to +30 maps to 0 to 255
        data[i * 4]     = (u + 30) * (255 / 60); 
        data[i * 4 + 1] = (v + 30) * (255 / 60); 
        data[i * 4 + 2] = 0;
        data[i * 4 + 3] = 255;
    }
}
    
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Prevent the texture from "bleeding" or wrapping weirdly at the edges
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
  }
  const genLayer = {
        id: 'highlight',
        type: 'custom',

        onAdd: function (map, gl) {
          this.map = map;
          const vertexSource = `
                      uniform mat4 u_matrix;
                      uniform float u_world_offset;
                      attribute vec2 a_pos;
                      varying vec2 v_pos;
                      
                      void main() {
                          v_pos = a_pos; // save raw 0.0-1.0 pos
                          vec4 offset_pos = vec4(a_pos.x + u_world_offset, a_pos.y, 0.0, 1.0);
                          gl_Position = u_matrix * offset_pos;
                      }`;

          const fragmentSource = `
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
                          vec3 baseColor = vec3(0.05, 0.15, 0.25);
                          vec3 accentColor = vec3(0.0, 0.8, 0.7);
                          vec3 finalColor = mix(baseColor, accentColor, speed);

                          gl_FragColor = vec4(finalColor, 0.3);
                          // gl_FragColor = vec4(0.0, speed, speed, 0.4);
                      }`;

          const vertexShader = gl.createShader(gl.VERTEX_SHADER);
          gl.shaderSource(vertexShader, vertexSource);
          gl.compileShader(vertexShader);

          const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
          gl.shaderSource(fragmentShader, fragmentSource);
          gl.compileShader(fragmentShader);

          this.program = gl.createProgram();
          gl.attachShader(this.program, vertexShader);
          gl.attachShader(this.program, fragmentShader);
          gl.linkProgram(this.program);

          this.uWindLocation = gl.getUniformLocation(this.program, "u_wind");
          this.windTexture = createWindTexture(gl);

          this.aPos = gl.getAttribLocation(this.program, 'a_pos');

          const grid = [];

          const coord = {x: 0, y: 0, z: 0};
          const vertex2 = {x: 0, y: 1, z: 0}; 
          const vertex3 = {x: 1, y: 0, z: 0};

          const vertex4 = vertex2
          const vertex5 = vertex3
          const vertex6 = {x: 1, y: 1, z: 0};
          grid.push(coord.x, coord.y);
          grid.push(vertex2.x, vertex2.y);
          grid.push(vertex3.x,vertex3.y);

          grid.push(vertex4.x,vertex4.y);
          grid.push(vertex5.x,vertex5.y);
          grid.push(vertex6.x,vertex6.y);

          this.buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
          
          //load the quad (big world square into buffer)
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(
                grid
            ),
            gl.STATIC_DRAW
          );
          
        },

        render: function (gl, matrix) {
          gl.useProgram(this.program);
          
          gl.uniformMatrix4fv(
            gl.getUniformLocation(this.program, 'u_matrix'),
            false,
            matrix
          );
          gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
          gl.enableVertexAttribArray(this.aPos);
          gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          

          const bounds = this.map.getBounds();

          const startWorld = Math.floor((bounds.getWest() +180) / 360);
          const endWorld = Math.floor((bounds.getEast() +180) / 360);
          
          const offsetLoc = gl.getUniformLocation(this.program, 'u_world_offset');

          for(let i = startWorld; i <= endWorld; i++) {

            gl.uniform1f(offsetLoc, i);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.windTexture);
            
            gl.uniform1i(this.uWindLocation, 0);

            gl.drawArrays(gl.TRIANGLES, 0, 6);//execute fragment shader for every pixel inside triangles
          }
        }
      };

map.on('load',() => { map.addLayer(genLayer)})