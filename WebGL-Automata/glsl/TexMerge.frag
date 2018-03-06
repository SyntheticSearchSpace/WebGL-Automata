precision mediump float;

uniform sampler2D tex0_in;
uniform sampler2D tex1_in;
uniform vec2 tex_size;

float get_col_sum(sampler2D tex) {
	return 
		texture2D(tex, (gl_FragCoord.xy) / tex_size).r +
		texture2D(tex, (gl_FragCoord.xy) / tex_size).g +
		texture2D(tex, (gl_FragCoord.xy) / tex_size).b;
}

void main() {
	gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
	if(get_col_sum(tex1_in) > 0.0) { gl_FragColor = texture2D(tex1_in, gl_FragCoord.xy / tex_size); }
	if(get_col_sum(tex0_in) > 0.0) { gl_FragColor = texture2D(tex0_in, gl_FragCoord.xy / tex_size); }
}
