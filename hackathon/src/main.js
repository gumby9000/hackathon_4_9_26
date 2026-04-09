import './style.css'
import javascriptLogo from './assets/javascript.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { setupCounter } from './counter.js'
import mapboxgl from 'mapbox-gl';
import "mapbox-gl/dist/mapbox-gl.css";

  // sets the access token, associating the map with your Mapbox account and its permissions
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  // creates the map, setting the container to the id of the div you added in step 2, and setting the initial center and zoom level of the map
  const map = new mapboxgl.Map({
      container: 'map', // container ID
      projection: 'mercator',
      minZoom: '2.5',
      style: "mapbox://styles/mapbox/dark-v11",
      // center: [-69, 29.89],
      center: [0,0],
      // zoom: 4 // starting zoom
      zoom: 1 // starting zoom
  });

  const genLayer = {
        id: 'highlight',
        type: 'custom',

        onAdd: function (map, gl) {
          this.map = map;
          this.numvertices = 0;
          const vertexSource = `
                      uniform mat4 u_matrix;
                      attribute vec2 a_pos;
                      uniform float u_world_offset;
                      //attribute vertexColor;
                      
                      //varying vec3 fragmentColor;
                      void main() {
                          vec4 offset_pos = vec4(a_pos.x + u_world_offset, a_pos.y, 0.0, 1.0);
                          gl_Position = u_matrix * offset_pos;
                      }`;

          const fragmentSource = `
                      //varying vec3 fragmentColor;
                      void main() {
                          gl_FragColor = vec4(0, 0.5, 0.5, 0.2);
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

          this.aPos = gl.getAttribLocation(this.program, 'a_pos');

          const grid = [];

          //todo handle date line
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
          this.numvertices = 6;

          // const colors = [];
          // for(let lat = latStart; lat <= latEnd; lat += 0.5) {
          //   for(let lng = lngStart; lng <= lngEnd; lng += 0.5) {
          //     const r = getRandomInRange(0, 255);
          //     const g = getRandomInRange(0, 255);
          //     const b = getRandomInRange(0, 255);
              
          //     for(let i=0; i<6; i++) {
          //       colors.push(r,g,b);
          //     }
          //   }
          // }
        //two routes... draw indiv squares and color each
        //OR make a grid that covers the world that is clear
        //and pass in the color vector whatever that 
            
          this.buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(
                grid
            ),
            gl.STATIC_DRAW
          );
          gl.bindBuffer(gl.ARRAY_BUFFER, null)
          
          // gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
          // gl.bufferData(
          //   gl.ARRAY_BUFFER,
          //   new Uint8Array(
          //     colors
          //   ),
          //   gl.STATIC_DRAW
          // );
          // gl.bindBuffer(gl.ARRAY_BUFFER, null)

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
            gl.drawArrays(gl.TRIANGLES, 0, 6);
          }
        }
      };

map.on('load',() => { map.addLayer(genLayer)})