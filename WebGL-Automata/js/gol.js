function GOL(canvas) {

	// Core Engine
    var igloo = this.igloo = new Igloo(canvas, { preserveDrawingBuffer: true });
    var gl = igloo.gl;
    if (gl == null) {
        alert('Could not initialize WebGL!');
        throw new Error('No WebGL');
    }

	//Initial Dimensions
	this.S = 1; //Scale (n^2 only)
    var w = canvas.width, h = canvas.height;
	this.canvas = canvas;
    this.statesize = new Float32Array([w/this.S, h/this.S]);
	this.RATIO_DIV = this.statesize[0]/this.statesize[1];

	//Main Loop Timer
    this.timer = null;
    this.lasttick = GOL.now(); 
    this.fps = 0; //fps counter

	//Performance Controls
	this.gpuframes = 1; //GPU frames to compute before rendering
	this.fps_target = 33.3; //Determines framerate. 66.6 = 15fps, 33.3 = 30fps, 16.7 = 60fps

	//Hide the mouse
	document.getElementById("life").style.cursor = "none";

	this.allframecount = 0; //Used to pause after first frame is loaded & rendered

	/* ******************* Initial state setup ******************* */

	this.useMouse = true;
	this.usefilter = false;

	//Recording Functions
	this.recordnow = false;
	this.capture_frame_mod = 4;
	this.export_image = null;
	this.export_images = new Array();
	this.gen = 0;
	this.render_frame = 0;

	/* *********************************************************** */

	//Load the shaders
	this.rule_paths = new Array();
	this.rule_paths.push('glsl/0.frag');
	this.rule_paths.push('glsl/BlurFilter.frag');
   
	//Define the collection of shaders
	this.programs = {
      
		Rule0:	igloo.program('glsl/quad.vert', this.rule_paths[0]),
		blurFilter:	igloo.program('glsl/quad.vert', this.rule_paths[1]),

		//Utility shaders
        copy: 					igloo.program('glsl/quad.vert', 'glsl/copy.frag'),
        merge: 					igloo.program('glsl/quad.vert', 'glsl/TexMerge.frag'),
        place_circle_pierce: 	igloo.program('glsl/quad.vert', 'glsl/PlaceCirclePierce.frag')
    };

	//Rule & seed selection containers
	this.rule_array = new Array(2);
	this.rule_array[0] = this.programs.Rule0;
	this.rule_array[1] = this.programs.blurFilter;




	//Create the quad that displays the texture
    this.buffers = {
        quad: igloo.array(Igloo.QUAD2)
    };

	//Define the textures to be used
    this.textures = {
        layer0_0: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST)
            .blank(this.statesize[0], this.statesize[1]),
        layer0_1: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST)
            .blank(this.statesize[0], this.statesize[1]),

        filter0_0: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST)
            .blank(this.statesize[0], this.statesize[1]),
        filter0_1: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST)
            .blank(this.statesize[0], this.statesize[1]),

        render0: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST)
            .blank(this.statesize[0], this.statesize[1]),

        capture0: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST)
            .blank(this.statesize[0]*this.S, this.statesize[1]*this.S),

        rand0: igloo.texture(null, gl.RGBA, gl.REPEAT, gl.NEAREST)
            .blank(this.statesize[0], this.statesize[1])

    };

	//Bind textures to this so they can be drawn to
    this.framebuffers = {
        step: igloo.framebuffer()
    };

	// ************************************ 
	// ********** Game Additions ********** 
	// ************************************ 

	//Game canvas layer
    this.gc = document.createElement("canvas");
    this.gc.id = "gc";
    this.gc.width = this.canvas.width;
    this.gc.height = this.canvas.height;
	this.gc_ctx = this.gc.getContext("2d");
	document.body.appendChild(this.gc);

	//Game Initial Setup
	this.game_frame = 0; //for timing of second layer, relative to the first

	this.seedStrength = 0.25; 		
	this.seedMode = 1; 				
	this.setRandom(this.textures.layer0_0, this.seedStrength, this.seedMode);
	this.setRandom(this.textures.rand0, this.seedStrength, this.seedMode);

	//Mouse tracking
	this.mouse = [0,0];

}




/* ************************
//     GPU functions     //
************************ */

GOL.prototype.setEmpty = function(tex) {
    var rgba = new Uint8Array(this.statesize[0] * this.statesize[1] * 4);
    for (var i = 0; i < this.statesize[0]*this.statesize[1]; i++) {
        var ii = i * 4;
        rgba[ii + 0] = rgba[ii + 1] = rgba[ii + 2] = 0;
        rgba[ii + 3] = 255;
    }
    tex.subset(rgba, 0, 0, this.statesize[0], this.statesize[1]);
    return this;
};

GOL.prototype.setRandom = function(tex, p, mode) {

	//Mode 0: Binary Mixed
	//Mode 1: Binary Mono
	//Mode 2: Gradient Mixed Gamma
	//Mode 3: Gradient Mixed
	//Mode 4: Binary Red
	//Mode 5: Binary Red Green


    var gl = this.igloo.gl
	var size = this.statesize[0] * this.statesize[1];

    var randR = new Uint8Array(size);
    var randG = new Uint8Array(size);
    var randB = new Uint8Array(size);

	if(mode == 0) { 
		for (var i = 0; i < size; i++) {
		    randR[i] = Math.random() < p ? 1 : 0;
		}

		for (var i = 0; i < size; i++) {
		    randG[i] = Math.random() < p ? 1 : 0;
		}

		for (var i = 0; i < size; i++) {
		    randB[i] = Math.random() < p ? 1 : 0;
		}
    	this.setChans(tex, randR, randG, randB);
	}

	if(mode == 1) {
		for (var i = 0; i < size; i++) {
		    randR[i] = randG[i] = randB[i] = Math.random() < p ? 1 : 0;
		}
    	this.setChans(tex, randR, randG, randB);
	}

	if(mode == 2) { 
		for (var i = 0; i < size; i++) {
		    randR[i] = Math.random()*255*p;
		}

		for (var i = 0; i < size; i++) {
		    randG[i] = Math.random()*255*p;
		}

		for (var i = 0; i < size; i++) {
		    randB[i] = Math.random()*255*p;
		}
		this.setChansImg(randR, randG, randB, tex);
	}

	if(mode == 3) { 
		for (var i = 0; i < size; i++) {
		    if(Math.random() < p) {randR[i] = Math.random()*255;}
		}

		for (var i = 0; i < size; i++) {
		   	if(Math.random() < p) {randG[i] = Math.random()*255;}
		}

		for (var i = 0; i < size; i++) {
		   	if(Math.random() < p) {randB[i] = Math.random()*255;}
		}
		this.setChansImg(randR, randG, randB, tex);
	}

	if(mode == 4) { 
		for (var i = 0; i < size; i++) {
		    randR[i] = Math.random() < p ? 1 : 0;
		}

		for (var i = 0; i < size; i++) {
		    randG[i] = 0;
		}

		for (var i = 0; i < size; i++) {
		    randB[i] = 0;
		}
    	this.setChans(tex, randR, randG, randB);
	}

	if(mode == 5) { 
		for (var i = 0; i < size; i++) {
		    randR[i] = Math.random() < p ? 1 : 0;
		}

		for (var i = 0; i < size; i++) {
		    randG[i] = Math.random() < p ? 1 : 0;
		}

		for (var i = 0; i < size; i++) {
		    randB[i] = 0;
		}
    	this.setChans(tex, randR, randG, randB);
	}

    return this;
};

GOL.prototype.setChans = function(tex, stateR, stateG, stateB) {
    var rgba = new Uint8Array(this.statesize[0] * this.statesize[1] * 4);
    for (var i = 0; i < stateR.length; i++) {
        var ii = i * 4;

        rgba[ii + 0] = stateR[i] ? 255 : 0;
        rgba[ii + 1] = stateG[i] ? 255 : 0;
        rgba[ii + 2] = stateB[i] ? 255 : 0;

        rgba[ii + 3] = 255;
    }
    tex.subset(rgba, 0, 0, this.statesize[0], this.statesize[1]);
    return this;
};

GOL.prototype.swap = function(layer) {

	if(layer == 0) {
		var tmp = this.textures.layer0_0;
		this.textures.layer0_0 = this.textures.layer0_1;
		this.textures.layer0_1 = tmp;
	}	

	if(layer == 1) {
		var tmp = this.textures.filter0_0;
		this.textures.filter0_0 = this.textures.filter0_1;
		this.textures.filter0_1 = tmp;
	}	

    return this;
};

GOL.prototype.step = function(out, in0, in1, rule_prog, layer, x, y, w, h) {
    var gl = this.igloo.gl;
    this.framebuffers.step.attach(out);
    in0.bind(0);
    in1.bind(1);
    rule_prog.use()
        .attrib('quad', this.buffers.quad, 2)
        .uniformi('tex0_in', 0)
        .uniformi('tex1_in', 1)
        .uniform('tex_size', this.statesize)     
        .draw(gl.TRIANGLE_STRIP, 4);
	this.swap(layer);
    return this;
};

GOL.prototype.merge = function(out, in0, in1, in2, in3) {
    var gl = this.igloo.gl;
    this.framebuffers.step.attach(out);
    in0.bind(0);
    in1.bind(1);
    this.programs.merge.use()
        .attrib('quad', this.buffers.quad, 2)
        .uniformi('tex0_in', 0)
        .uniformi('tex1_in', 1)
        .uniform('tex_size', this.statesize)
        .draw(gl.TRIANGLE_STRIP, 4);

    return this;
};

GOL.prototype.draw = function() {
    var gl = this.igloo.gl;
    this.igloo.defaultFramebuffer.bind();
    this.textures.render0.bind(0);
    gl.viewport(0, 0, this.statesize[0]*this.S, this.statesize[1]*this.S);
    this.programs.copy.use()
        .attrib('quad', this.buffers.quad, 2)
        .uniformi('tex0_in', 0)
        .uniform('tex_size', this.statesize)
        .uniform('scale', this.S)
        .draw(gl.TRIANGLE_STRIP, 4);
    return this;
};

GOL.prototype.capture = function(out, in0) {
    var gl = this.igloo.gl;
    this.framebuffers.step.attach(out);
    in0.bind(0);
    this.programs.copy.use()
        .attrib('quad', this.buffers.quad, 2)
        .uniformi('tex0_in', 0)
        .uniform('tex_size', this.statesize)
        .uniform('scale', this.S)
        .draw(gl.TRIANGLE_STRIP, 4);

    return this;
};

GOL.prototype.place_circle_pierce = function(tex0, tex1, tex2, x, y, size, layer, mode) {
    var gl = this.igloo.gl;
    this.framebuffers.step.attach(tex2);
    tex0.bind(0);
    tex1.bind(1);
    this.programs.place_circle_pierce.use()
        .attrib('quad', this.buffers.quad, 2)
        .uniformi('tex0_in', 0)
        .uniformi('tex1_in', 1)
        .uniform('tex_size', this.statesize)
        .uniform('x', x - size/2)
        .uniform('y', y - size/2)
        .uniform('size', size)
        .uniform('mode', mode)
        .draw(gl.TRIANGLE_STRIP, 4);
	this.swap(layer);
    return this;
};


/* ************************
//   End GPU functions   //
************************ */


// ---------------------------------------


/* ************************
//       MAIN LOOP       //
************************ */
GOL.prototype.start = function(canvas) {
    if (this.timer == null) {
        this.timer = setInterval(function(){

			//Once a second, refresh the FPS counter (and temporarily game score)
			if (GOL.now() != this.lasttick) {
				$('.fps').text(this.fps + ' FPS');
				this.lasttick = GOL.now();
				this.fps = 0;
			} else {
				this.fps++;
			}

			//Compute the next frame(s) of the CA
			for (var repeat_frame_i = 0; repeat_frame_i < gol.gpuframes; repeat_frame_i++) { 
				

				// *** process layer 0 *** 
				gol.step(
					gol.textures.layer0_1, gol.textures.layer0_0, gol.textures.rand0, gol.rule_array[0], 0,
					gol.statesize[0]/2, gol.statesize[1]/2, 
					gol.statesize[0]/4, gol.statesize[1]/4
				);

				// *** process Filter *** 
				if(gol.usefilter){
					gol.step(
						gol.textures.filter0_1, gol.textures.filter0_0, gol.textures.layer0_0, gol.rule_array[1], 1,
						gol.statesize[0]/2, gol.statesize[1]/2, 
						gol.statesize[0]/4, gol.statesize[1]/4
					);
				}

				//player mouse seeder
				if(gol.useMouse) {gol.place_circle_pierce(gol.textures.layer0_0, gol.textures.rand0, gol.textures.layer0_1, gol.mouse[0], gol.mouse[1], 16, 0, 3);}

				
				gol.game_frame++;
			}

			//Merge the generated textures
			gol.merge(
				gol.textures.render0,
				gol.textures.layer0_0,
				gol.textures.filter0_0
			);

			//Render the final texture to the screen
			gol.draw();					

			//pause on loading, after the first frame is drawn
			if(gol.allframecount == 1) {gol.toggle();}
			
			//Count the total number of displayed/rendered frames
			gol.allframecount++;	



			//Image Export handler
			if (gol.recordnow === true) {

				gol.gen += 1;
				if(gol.gen % gol.capture_frame_mod === 0/*(gol.gen > 600 && gol.gen % 100 === 0) || (gol.gen < 600 && gol.gen % 10 === 0) || (gol.gen < 30)*/){
					
					var rendmod = 100;

					gol.capture(
						gol.textures.capture0,
						gol.textures.render0
					);

					gol.export_image = gol.exportImage(gol.igloo.gl, gol.textures.capture0.texture, gol.canvas.width, gol.canvas.height);
					gol.export_images[gol.render_frame%rendmod] = gol.export_image;
					gol.render_frame += 1;


					if(gol.render_frame % rendmod === 0)	{
						gol.downloadAll(gol.export_images, gol.render_frame-rendmod);
					}
				}
			}

        }, this.fps_target);     //Determines framerate. 66.6 = 15fps, 33.3 = 30fps, 16.7 = 60fps
		
    }
    return this;
};


// ---------------------------------------

/* ************************
//   General functions   //
************************ */

GOL.now = function() {
    return Math.floor(Date.now() / 1000);
};

GOL.prototype.stop = function() {
    clearInterval(this.timer);
    this.timer = null;
    return this;
};

GOL.prototype.toggle = function() {
    if (this.timer == null) {
        this.start();
    } else {
        this.stop();
    }
};

GOL.prototype.exportImage = function(gl, texture, width, height) {

    // Create a framebuffer backed by the texture
    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    // Read the contents of the framebuffer
    var data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);

    gl.deleteFramebuffer(framebuffer);

    // Create a 2D canvas to store the result 
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var context = canvas.getContext('2d');

    // Copy the pixels to a 2D canvas
    var imageData = context.createImageData(width, height);
    imageData.data.set(data);
    context.putImageData(imageData, 0, 0);

    var img = new Image();
    img.src = canvas.toDataURL("image/png");

    return img;
};

//Export saved PNG images to a new tab for viewing.
GOL.prototype.imageDump = function() {

	//Write a html document containing the images
	var s = "";
	for (var i = 0; i < gol.export_images.length; i++) {
		s = s + '<img src="'+gol.export_images[i]+'"/>';
	}
	
	//open a new tab and display the images
	var newWindow = window.open();
	newWindow.document.write(s);
	newWindow.document.close();

	//Clear the images from memory
	gol.export_images = [];

};

/* Download an img */
GOL.prototype.download = function(img, imgnum) {
	var zerStr = "";
	for (i = 0; i < 6-imgnum.toString().length; i++) {
		zerStr += "0";
	}
	zerStr+=imgnum.toString();

    var link = document.createElement("a");
    link.href = img.src;
    link.download = "image" + zerStr + ".png";
    link.style.display = "none";
    var evt = new MouseEvent("click", {
        "view": window,
        "bubbles": true,
        "cancelable": true
    });

    document.body.appendChild(link);
    link.dispatchEvent(evt);
    document.body.removeChild(link);
    //console.log("Downloading...");
}

/* Download all images in 'imgs'. 
 * Optionaly filter them by extension (e.g. "jpg") and/or 
 * download the 'limit' first only  */
GOL.prototype.downloadAll = function(imgs, imgnum) {

    /* (Try to) download the images */ 
	for (var i = 0; i < imgs.length; i++) {
        gol.download(imgs[i], imgnum+i);
    }

}


/**
 * Find simulation coordinates for event.
 * This is a workaround for Firefox bug #69787 and jQuery bug #8523.
 * @returns {Array} target-relative offset
 */
GOL.prototype.eventCoord = function(event) {
    var $target = $(event.target),
        offset = $target.offset(),
        border = 1,
        x = event.pageX - offset.left - border,
        y = $target.height() - (event.pageY - offset.top - border);
    return [Math.floor(x), Math.floor(y)];
};



//Builds the menu & event handlers
function addGUI() { 
    var gui = new dat.GUI(),
        cont = new myConfig();
	gui.cont = cont;

	// ***********************************************

    gui.add(cont, 'bPause')			.name('Pause').onFinishChange(tog);
    gui.add(cont, 'bMouse')			.name('Mouse Seeding').onFinishChange(mouse);
    gui.add(cont, 'bFilter')		.name('Apply Filter').onFinishChange(tog_filter);
    gui.add(cont, 'bRecord')		.name('Record Frames').onFinishChange(tog_record);


    gui.add(cont, 'fps', 1, 60)				.step(1.0).name('Target FPS').onFinishChange(set_fps);
    gui.add(cont, 'gpuframes', 1, 32)		.step(1.0).name('GPU Frames').onFinishChange(set_gpuframes);
    gui.add(cont, 'reseed', 0, 1)			.step(0.01).name('Reseed Strength').onFinishChange(set_reseed);
    gui.add(cont, 'recframerate', 1, 1024)	.step(1.0).name('Record Frame-skip').onFinishChange(set_frame_capture);
    //gui.add(cont, 'seedmode', 0, 5)			.step(1).name('Seed Mode').onFinishChange(set_seedmode);

	// ***********************************************

	function tog(){
		gol.toggle();
		document.getElementById("life").focus();
	}

	function mouse(){
		gol.useMouse = !gol.useMouse;
		document.getElementById("life").focus();
	}

	function tog_record(value){
		gol.recordnow = !gol.recordnow;
		document.getElementById("life").focus();
	}

	function tog_filter(value){
		gol.usefilter = !gol.usefilter;
		gol.setEmpty(gol.textures.filter0_0);
		document.getElementById("life").focus();
	}

	function set_frame_capture(value){
		gol.capture_frame_mod = value;
	}

   	function set_fps(value){
		gol.toggle();
        gol.fps_target = 1000/value;
		gol.toggle();
		document.getElementById("life").focus();
	}

   	function set_gpuframes(value){
		gol.toggle();
        gol.gpuframes = Math.round(value);
		gol.toggle();
		document.getElementById("life").focus();
	}

   	function set_reseed(value){
		gol.toggle();
		gol.seedStrength = value;
        gol.setRandom(gol.textures.layer0_0, gol.seedStrength, gol.seedMode);
        gol.setRandom(gol.textures.rand0, gol.seedStrength, gol.seedMode);
		//gol.reset_rules(0);
		gol.toggle();
		document.getElementById("life").focus();
	}

			
   	function set_seedmode(value){
		gol.seedMode = value;
		document.getElementById("life").focus();
	}


	// ***********************************************

	return gui;
	
}

function myConfig() {
	this.bPause = true;
	this.bMouse = gol.useMouse;
	this.bFilter = gol.usefilter;
	this.bRecord = gol.recordnow;
	this.recframerate = gol.capture_frame_mod;
	this.fps = 30;
	this.gpuframes = gol.gpuframes;
	this.reseed = gol.seedStrength;
	this.seedmode = gol.seedMode;
}

function Controller(gol) {
    this.gol = gol;
    var _this = this;
    var $canvas = $(gol.igloo.canvas);
    var $canvas_gc = $(gol.gc);

	gol.gui = addGUI();

	//Prevent default actions like right-click menus
    $canvas_gc.on('contextmenu', function(event) {
        event.preventDefault();
        return false;
    });	

	$canvas_gc.on('mousemove', function(event) {
        var pos = gol.eventCoord(event);
        gol.mouse[0] = pos[0]/(gol.S);
		gol.mouse[1] = ((gol.statesize[1])-pos[1]/gol.S);
    });	
}

GOL.prototype.reset_rules = function() {
	
	gol.programs = {
		Rule0:	gol.igloo.program('glsl/quad.vert', gol.rule_paths[0]),
		blurFilter:	igloo.program('glsl/quad.vert', gol.rule_paths[1]),

		//Utility shaders
        copy: 					gol.igloo.program('glsl/quad.vert', 'glsl/copy.frag'),
        merge: 					gol.igloo.program('glsl/quad.vert', 'glsl/TexMerge.frag'),
        place_circle_pierce: 	gol.igloo.program('glsl/quad.vert', 'glsl/PlaceCirclePierce.frag')
    };

	gol.rule_array[0] = gol.programs.Rule0;
	gol.rule_array[1] = gol.programs.blurFilter;
}


/* ************************
// End General functions //
************************ */


// Initialize everything. Entry Point. 
var gol = null, controller = null, player = null;
$(document).ready(function() {
    var $canvas = $('#life');
    gol = new GOL($canvas[0]).draw().start($canvas[0]);
    controller = new Controller(gol); //GUI
});

//Don't scroll on spacebar
$(window).on('keydown', function(event) {
    return !(event.keyCode === 32);
});

