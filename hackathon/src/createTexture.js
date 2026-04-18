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