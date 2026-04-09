import React, { useEffect, useState, useRef } from "react";
import mapboxgl from "mapbox-gl"
import { Nanum_Myeongjo } from "next/font/google";
export const useGenLayer = (data, map, gl) => {
    
  function getRandomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }


    return {
        id: 'highlight',
        type: 'custom',

        onAdd: function (map, gl) {
          this.numvertices = 0;
          const vertexSource = `
                      uniform mat4 u_matrix;
                      attribute vec2 a_pos;
                      //attribute vertexColor;
                      
                      //varying vec3 fragmentColor;
                      void main() {
                          gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0);
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
          const latStart = 26;
          const latEnd = 27;
          const lngStart = -80.5;
          const lngEnd = -80;
          // const latStart = -89.5;
          // const latEnd = 89.0;
          // const lngStart = -179;
          // const lngEnd = 179.0;

          const tempData =[[-80,28],[-80,27.5]]

          for(let lat = latStart; lat <= latEnd; lat += 0.5) {
            for(let lng = lngStart; lng <= lngEnd; lng += 0.5) {
              const coord = mapboxgl.MercatorCoordinate.fromLngLat({lng: lng-0.25, lat:lat-0.25});
              const vertex2 = mapboxgl.MercatorCoordinate.fromLngLat({lng: lng-0.25, lat:lat+0.25});
              const vertex3 = mapboxgl.MercatorCoordinate.fromLngLat({lng: lng+0.25, lat: lat-0.25});

              const vertex4 = vertex2
              const vertex5 = vertex3
              const vertex6 = mapboxgl.MercatorCoordinate.fromLngLat({lng: lng+0.25, lat: lat+0.25});

              grid.push(coord.x, coord.y);
              grid.push(vertex2.x, vertex2.y);
              grid.push(vertex3.x,vertex3.y);

              grid.push(vertex4.x,vertex4.y);
              grid.push(vertex5.x,vertex5.y);
              grid.push(vertex6.x,vertex6.y);
              this.numvertices+=6;
            }
          }
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
          gl.drawArrays(gl.TRIANGLES, 0, this.numvertices); // don't understand why TRIANGLE not work, but its better this way //update triangles may work
          // console.log(this.numvertices);
        }
      };
}