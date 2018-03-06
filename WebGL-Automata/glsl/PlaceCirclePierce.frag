precision mediump float;

uniform sampler2D tex0_in;
uniform sampler2D tex1_in;
uniform vec2 tex_size;
uniform float x;
uniform float y;
uniform float size;
uniform float mode;

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

	float R0 = getR(vec2(0.0, 0.0), tex0_in);
	float G0 = getG(vec2(0.0, 0.0), tex0_in);
	float B0 = getB(vec2(0.0, 0.0), tex0_in);

	float R1 = getR(vec2(0.0, 0.0), tex1_in);
	float G1 = getG(vec2(0.0, 0.0), tex1_in);
	float B1 = getB(vec2(0.0, 0.0), tex1_in);

	float R = R0;
	float G = G0;
	float B = B0;


	float centerx = size / 2.0;
	float centery = size / 2.0;
	float center_dist = sqrt(((gl_FragCoord.x-(x+centerx))*(gl_FragCoord.x-(x+centerx))) + ((gl_FragCoord.y-(y+centery))*(gl_FragCoord.y-(y+centery))));
	float center_radius = sqrt((centerx*centerx)+(centery*centery));
	
	float c_size = size/4.0;

	if(center_dist <= center_radius) {

		if(mode == 1.0 || mode == 3.0) {
			float bright = sqrt((c_size/(center_dist))*(c_size/(center_dist)));

			R = (R1 * bright);
			G = (G1 * bright);
			B = (B1 * bright);	

			if(R <= 0.15) {R = 0.0;}
			if(G <= 0.15) {G = 0.0;}
			if(B <= 0.15) {B = 0.0;}/**/

			/*float bright = 0.0-(c_size/(center_dist));

			R = (R * bright)*bright;
			G = (G * bright)*bright;
			B = (B * bright)*bright;	

			if(R <= 0.15) {R = 0.0;}
			if(G <= 0.15) {G = 0.0;}
			if(B <= 0.15) {B = 0.0;}/**/

		}

		if(mode == 5.0) {
			float bright = 1.0/center_dist; //1.0-1.0/(c_size/(center_dist));// 0.01;

			float R_out = R0+(R1 * bright);
			float G_out = G0+(G1 * bright);
			float B_out = B0+(B1 * bright);	

			if(R1+G1+B1 > 0.0){
				if(R_out > R0) { R = R_out; }
				if(G_out > G0) { G = G_out; }
				if(B_out > B0) { B = B_out; }
			}

		}

		if(mode == 4.0) {
			float bright = 1.0/center_dist; //1.0-1.0/(c_size/(center_dist));// 0.01;

			float R_out = R0-(R1 * bright);
			float G_out = G0-(G1 * bright);
			float B_out = B0-(B1 * bright);	

			if(R1+G1+B1 > 0.0){
				if(R_out < R0) { R = R_out; }
				if(G_out < G0) { G = G_out; }
				if(B_out < B0) { B = B_out; }
			}
		}

	if(mode == 6.0) {
			float bright = 1.0-1.0/(c_size/(center_dist));// 

			float R_out = R0+(R1 * bright);
			float G_out = G0+(G1 * bright);
			float B_out = B0+(B1 * bright);	

			if(R1+G1+B1 > 0.0){
				if(R_out > R0) { R = R_out; }
				if(G_out > G0) { G = G_out; }
				if(B_out > B0) { B = B_out; }
			}

		}

		if(mode == 7.0) {
			float bright = 1.0-1.0/(c_size/(center_dist));// 1.0/center_dist;

			float R_out = R0-(R1 * bright);
			float G_out = G0-(G1 * bright);
			float B_out = B0-(B1 * bright);	

			if(R1+G1+B1 > 0.0){
				if(R_out < R0) { R = R_out; }
				if(G_out < G0) { G = G_out; }
				if(B_out < B0) { B = B_out; }
			}
		}

		if(mode == 2.0 || mode == 3.0) {

			if(R > 0.15) { R = 1.0; } else {R = getR(vec2(0.0, 0.0), tex0_in);}
			if(G > 0.15) { G = 1.0; } else {G = getG(vec2(0.0, 0.0), tex0_in);}
			if(B > 0.15) { B = 1.0; } else {B = getB(vec2(0.0, 0.0), tex0_in);}

			//B=G=R;
		}

	}





	gl_FragColor = vec4(R, G, B, 1.0);
}
