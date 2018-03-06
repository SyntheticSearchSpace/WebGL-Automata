precision mediump float;

uniform sampler2D tex0_in;
uniform vec2 tex_size;
uniform float scale;

void main() {

	gl_FragColor = texture2D(tex0_in, gl_FragCoord.xy / (tex_size*scale));

}
