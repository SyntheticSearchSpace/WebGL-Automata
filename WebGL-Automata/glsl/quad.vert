precision mediump float;

attribute vec2 quad;

void main() {
    gl_Position = vec4(quad, 0, 1.0);
}
