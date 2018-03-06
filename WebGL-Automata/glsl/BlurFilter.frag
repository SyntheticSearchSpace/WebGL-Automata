precision mediump float;

uniform sampler2D tex0_in;
uniform sampler2D tex1_in;
uniform vec2 tex_size;

float getR(vec2 offset, sampler2D tex) {
	return (texture2D(tex, (gl_FragCoord.xy + offset) / tex_size).r);
}

float getG(vec2 offset, sampler2D tex) {
	return (texture2D(tex, (gl_FragCoord.xy + offset) / tex_size).g);
}

float getB(vec2 offset, sampler2D tex) {
	return (texture2D(tex, (gl_FragCoord.xy + offset) / tex_size).b);
}


void main() {

	float cR_out = 0.0;
	float cG_out = 0.0;
	float cB_out = 0.0;

    float cR0 = getR(vec2(0.0, 0.0), tex0_in);
    float cG0 = getG(vec2(0.0, 0.0), tex0_in);
    float cB0 = getB(vec2(0.0, 0.0), tex0_in);

    float cR1 = getR(vec2(0.0, 0.0), tex1_in);
    float cG1 = getG(vec2(0.0, 0.0), tex1_in);
    float cB1 = getB(vec2(0.0, 0.0), tex1_in);

	int mode = 2;	

	if(mode == 0) {	
		cR_out = (cR0*0.995 + cR1*0.08) - 0.005;
		cG_out = (cG0*0.995 + cG1*0.08) - 0.005;
		cB_out = (cB0*0.995 + cB1*0.08) - 0.005;
	}

	if(mode == 1) {	
		float n0r = getR(vec2(-1.0, 0.0), tex1_in);
		float n0g = getG(vec2(-1.0, 0.0), tex1_in);
		float n0b = getB(vec2(-1.0, 0.0), tex1_in);

		float n1r = getR(vec2(1.0, 0.0), tex1_in);
		float n1g = getG(vec2(1.0, 0.0), tex1_in);
		float n1b = getB(vec2(1.0, 0.0), tex1_in);

		float n2r = getR(vec2(0.0, -1.0), tex1_in);
		float n2g = getG(vec2(0.0, -1.0), tex1_in);
		float n2b = getB(vec2(0.0, -1.0), tex1_in);

		float n3r = getR(vec2(0.0, 1.0), tex1_in);
		float n3g = getG(vec2(0.0, 1.0), tex1_in);
		float n3b = getB(vec2(0.0, 1.0), tex1_in);
			
		cR_out = (cR0 + ((n0r+n1r+n2r+n3r)/5.0)*0.1) - 0.005;
		cG_out = (cG0 + ((n0g+n1g+n2g+n3g)/5.0)*0.1) - 0.005;
		cB_out = (cB0 + ((n0b+n1b+n2b+n3b)/5.0)*0.1) - 0.005;
	}

	if(mode == 2) {	

		float r1 = (getR(vec2(1.0, 0.0), tex0_in) + 
					getR(vec2(1.0, 1.0), tex0_in) + 
					getR(vec2(0.0, 1.0), tex0_in) +  
					getR(vec2(-1.0, 0.0), tex0_in) +  
					getR(vec2(-1, -1.0), tex0_in) +  
					getR(vec2(0.0, -1.0), tex0_in) +  
					getR(vec2(1.0, -1.0), tex0_in) +  
					getR(vec2(-1.0, 1.0), tex0_in) +  
					getR(vec2(0.0, 0.0), tex0_in)) / 9.0;

		float g1 = (getG(vec2(1.0, 0.0), tex0_in) +  
					getG(vec2(1.0, 1.0), tex0_in) +  
					getG(vec2(0.0, 1.0), tex0_in) +  
					getG(vec2(-1.0, 0.0), tex0_in) +  
					getG(vec2(-1.0, -1.0), tex0_in) +  
					getG(vec2(0.0, -1.0), tex0_in) +  
					getG(vec2(1.0, -1.0), tex0_in) +  
					getG(vec2(-1.0, 1.0), tex0_in) +  
					getG(vec2(0.0, 0.0), tex0_in)) / 9.0;

		float b1 = (getB(vec2(1.0, 0.0), tex0_in) +  
					getB(vec2(1.0, 1.0), tex0_in) +  
					getB(vec2(0.0, 1.0), tex0_in) +  
					getB(vec2(-1.0, 0.0), tex0_in) +  
					getB(vec2(-1.0, -1.0), tex0_in) +  
					getB(vec2(0.0, -1.0), tex0_in) +  
					getB(vec2(1.0, -1.0), tex0_in) +  
					getB(vec2(-1.0, 1.0), tex0_in) +  
					getB(vec2(0.0, 0.0), tex0_in)) / 9.0;


		float r2 = (r1+cR1*0.125);
		float g2 = (g1+cG1*0.125);
		float b2 = (b1+cB1*0.125);

		float max = 0.7;

		if(r2 > max) {r2 = max;}
		if(g2 > max) {g2 = max;}
		if(b2 > max) {b2 = max;}

		cR_out = r2 - 0.004;
		cG_out = g2 - 0.004;
		cB_out = b2 - 0.004;

	}

    gl_FragColor = vec4(cR_out, cG_out, cB_out, 1.0);

}



/**/
