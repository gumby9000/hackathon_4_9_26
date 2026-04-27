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
      center: [-50,27],
      zoom: 2,
      // minZoom: 2,
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: { enabled: false },
  });

  const genLayer = {
        id: 'highlight',
        type: 'custom',

        onAdd: function (map, gl) {
          this.map = map;
          const vertexSource = `
                      uniform mat4 u_matrix;
                      uniform float u_world_offset;
                      attribute vec2 a_pos;
                      attribute float a_alpha;
                      varying vec2 v_pos;
                      varying float v_alpha;
                      
                      void main() {
                          v_pos = a_pos; // save raw 0.0-1.0 pos
                          v_alpha = a_alpha;
                          vec4 offset_pos = vec4(a_pos.x + u_world_offset, a_pos.y, 0.0, 1.0);
                          gl_Position = u_matrix * offset_pos;
                          gl_PointSize = 2.5;
                      }`;

          const fragmentSource = `
                      precision highp float;
                      varying vec2 v_pos;
                      varying float v_alpha;
                      uniform sampler2D u_wind;
                      uniform float u_uMin;
                      uniform float u_uMax;
                      uniform float u_vMin;
                      uniform float u_vMax;

                      void main() {
                      
                          float y = v_pos.y;
                          float lat = 2.0 * atan(exp(3.14159265 * (1.0 - 2.0 * y))) - 1.57079632679;

                          float texY =  (lat / 3.14159265 + 0.5);
                          
                          vec2 lookupPos = vec2(v_pos.x, texY);
                          vec4 color = texture2D(u_wind, lookupPos);
                          
                          float u = color.r * (u_uMax - u_uMin) + u_uMin;
                          float v = color.g * (u_vMax - u_vMin) + u_vMin;

                          float speed = length(vec2(u, v));
                          //float n = clamp(speed / 22.0, 0.0, 1.0);
                          float n = color.r;

                          vec3 lowColor = vec3(0.05, 0.05, 0.2);
                          vec3 highColor = vec3(0.9, 0.3, 0.0);
                          

vec3 c0 = vec3(0.015, 0.023, 0.231);  // #04063b (0ft)
    vec3 c1 = vec3(0.051, 0.439, 0.933);  // #0d70ee (2ft)
    vec3 c2 = vec3(0.094, 0.898, 0.663);  // #18e5a9 (4ft)
    vec3 c3 = vec3(0.208, 0.816, 0.169);  // #35d02b (6ft)
    vec3 c4 = vec3(0.933, 0.918, 0.055);  // #eeea0e (8ft)
    vec3 c5 = vec3(0.992, 0.604, 0.149);  // #fd9a26 (10ft)
    vec3 c6 = vec3(0.992, 0.333, 0.129);  // #fd5521 (12ft)
    vec3 c7 = vec3(0.722, 0.024, 0.063);  // #b80610 (16ft)
    vec3 c8 = vec3(0.635, 0.165, 0.655);  // #a22aa7 (18ft)
    vec3 c9 = vec3(0.361, 0.082, 0.400);  // #5c1566 (40ft)

    vec3 _color;

    // Normalizing stops based on a 40ft max scale
    // Stops: 0, 2, 4, 6, 8, 10, 12, 16, 18, 40
    // Normalized (val/40): 0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.45, 1.0

    if (n == 0.0)      _color = vec3(0.0, 0.0, 0.0);
    else if (n < 0.05) _color = mix(c0, c1, (n - 0.0) / 0.05);
    else if (n < 0.1)  _color = mix(c1, c2, (n - 0.05) / 0.05);
    else if (n < 0.15) _color = mix(c2, c3, (n - 0.1) / 0.05);
    else if (n < 0.2)  _color = mix(c3, c4, (n - 0.15) / 0.05);
    else if (n < 0.25) _color = mix(c4, c5, (n - 0.2) / 0.05);
    else if (n < 0.3)  _color = mix(c5, c6, (n - 0.25) / 0.05);
    else if (n < 0.4)  _color = mix(c6, c7, (n - 0.3) / 0.1);
    else if (n < 0.45) _color = mix(c7, c8, (n - 0.4) / 0.05);
    else               _color = mix(c8, c9, (n - 0.45) / 0.55)
;

                          gl_FragColor = vec4(_color, 0.9);
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

          this.windTexture = gl.createTexture();

          const img = new Image();
          img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, this.windTexture);

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            
            this.map.triggerRepaint();
            
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            this.windData = ctx.getImageData(0, 0, img.width, img.height).data;
            this.windWidth = img.width;
            this.windHeight = img.height;
          }
          
          img.src = './image.png';
          this.uWindLocation = gl.getUniformLocation(this.program, "u_wind");

          this.uMinLoc = gl.getUniformLocation(this.program, "u_uMin");
          this.uMaxLoc = gl.getUniformLocation(this.program, "u_uMax");
          this.vMinLoc = gl.getUniformLocation(this.program, "u_vMin");
          this.vMaxLoc = gl.getUniformLocation(this.program, "u_vMax");

          this.aPos = gl.getAttribLocation(this.program, 'a_pos');
          this.aAlpha = gl.getAttribLocation(this.program, 'a_alpha');

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
          
          this.numParticles = 90000;
          this.particles = [];
          //add particles at random pos
          for (let i = 0; i < this.numParticles; i++) {
              this.particles.push({ x: Math.random(), y: Math.random(), life: Math.random(), history: [] });
              // this.particles.push({ x: 1, y: 1, life: 1 });
          }
          const TRAIL_LENGTH = 10;
          this.trailLength = TRAIL_LENGTH;
          this.particlePositions = new Float32Array(this.numParticles * TRAIL_LENGTH * 2);
          this.particleAlphas = new Float32Array(this.numParticles * TRAIL_LENGTH)
          this.particleBuffer = gl.createBuffer();
          this.alphaBuffer = gl.createBuffer();
        },

        render: function (gl, matrix) {
          gl.useProgram(this.program);
          
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.windTexture);
          gl.uniform1i(this.uWindLocation, 0);
          
          gl.uniform1f(this.uMinLoc, 0);
          gl.uniform1f(this.uMaxLoc, 17);
          gl.uniform1f(this.vMinLoc, 0);
          gl.uniform1f(this.vMaxLoc, 17);

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
          
          if (this.windData) {
              for (let i = 0; i < this.numParticles; i++) {
                const p = this.particles[i];

                // p.history.push({x: p.x, y: p.y});
                // if(p.history.length > this.trailLength) p.history.shift();

                // 1. Map 0.0-1.0 pos to wind image pixels
                const px = Math.floor(p.x * this.windWidth);
                const lat =
                  2 * Math.atan(Math.exp(Math.PI * (1 - 2 * p.y))) -
                  Math.PI / 2;
                const texY = lat / Math.PI + 0.5;
                const py = Math.floor((1 - texY) * this.windHeight); // use texY instead of p.y
                const idx = (py * this.windWidth + px) * 4;
                // const u = (this.windData[idx] / 255.0) * (17);
                // const v = (this.windData[idx + 1] / 255.0) * 360;
                // const mag = (this.windData[idx] / 255.0) * (17);
                const mag = 4;
                const deg = (this.windData[idx + 1] / 255.0) * 360; 
                // const deg = 0; <- this creates straight north south particles
                const rad = deg * (Math.PI / 180);
                const u = -mag * Math.sin(rad) * 0.00001;
                const v = mag * Math.cos(rad) * 0.00001;

                p.x += u;
                p.y += v;
                p.life -= 0.01;

                if (p.life <= 0) {
                  // p.life = (Math.random() * 10) +Math.random();
                  p.x = Math.random();
                  p.y = Math.random();
                  p.life = Math.random();
                  p.history = [];
                }

                // 5. Fill the Float32Array
                for (let j = 0; j < p.history.length; j++) {
                  // const idx2 = (i * this.trailLength + j) * 2;
                  const alphaIdx = i * this.trailLength + j;

                  // this.particlePositions[idx2] = p.x;
                  // this.particlePositions[idx + 1] = p.y;

                  // this.particlePositions[idx2] = p.history[j].x;
                  // this.particlePositions[idx + 1] = p.history[j].y;

                  // const ageFraction = j / (p.history.length - 1 || 1);
                  // this.particleAlphas[alphaIdx] = ageFraction * 0.8;
                  // this.particleAlphas[alphaIdx] = 1.0;
                }
                this.particlePositions[i * 2] = p.x;
                this.particlePositions[i * 2 + 1] = p.y;
              }

              // 6. Draw the particles as points
              const totalPoints = this.numParticles * this.trailLength;
              gl.bindBuffer(gl.ARRAY_BUFFER, this.particleBuffer);
              gl.bufferData(gl.ARRAY_BUFFER, this.particlePositions, gl.DYNAMIC_DRAW);
              gl.enableVertexAttribArray(this.aPos);
              gl.vertexAttribPointer(this.aPos, 2, gl.FLOAT, false, 0, 0);
              
              gl.bindBuffer(gl.ARRAY_BUFFER, this.alphaBuffer);
              gl.bufferData(gl.ARRAY_BUFFER, this.particleAlphas, gl.DYNAMIC_DRAW);
              gl.enableVertexAttribArray(this.aAlpha);
              gl.vertexAttribPointer(this.aAlpha, 1, gl.FLOAT, false, 0, 0);
              // Set a neutral offset for particles (center world)
              gl.uniform1f(offsetLoc, 0); 
              gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
              gl.drawArrays(gl.POINTS, 0, totalPoints);

              // 7. Loop the animation
              this.map.triggerRepaint();
              gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          }
        }
      };

map.on('load',() => { map.addLayer(genLayer)})