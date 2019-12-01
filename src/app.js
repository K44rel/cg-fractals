//import * as THREE from './addons/three.module.js';
import $ from "jquery";
import './styles/app.css';
//import { EffectComposer } from './addons/EffectComposer.js';
//import { RenderPass} from './addons/RenderPass.js';
//import { UnrealBloomPass } from './addons/UnrealBloomPass.js';

import VertexShaderBasic from './shaders/vertexShaderBasic.glsl';
import FragShaderBasic from './shaders/fragShaderBasic.glsl';
import JuliaFragShader from './shaders/juliaFragShader.glsl';
import JuliaVertexShader from './shaders/juliaVertexShader.glsl';
import BuddhaFragShader from './shaders/buddhaFragShader.glsl';
import BuddhaVertexShader from './shaders/buddhaVertexShader.glsl';

var camera, currentScene, renderer, composer, vertexShader, fragShader;
var textures = [];
var scale = 5.0;
var maxIterations = Math.min(1000 / scale, 2000);
var center = new THREE.Vector2(0.5, 0.5);
var renderSize;
var sceneSize = 1;

init();

function init() {
	document.addEventListener("keypress", changeScene);

    document.addEventListener( 'DOMMouseScroll', onMouseWheel, false );	// firefox
    document.addEventListener("mousewheel", onMouseWheel, false);    // chrome
    window.addEventListener("resize", onWindowResize);    // if window size changed

    camera = new THREE.OrthographicCamera( sceneSize / - 2,  sceneSize / 2,  sceneSize / 2, sceneSize / - 2, 0.01, 1000 );
	camera.position.z = 10;

    currentScene = createScene1();
	renderer = new THREE.WebGLRenderer( { antialias: true } );

    renderSize = window.innerHeight < window.innerWidth? window.innerHeight : window.innerWidth;
    renderer.setSize( renderSize, renderSize );
    document.body.appendChild( renderer.domElement );

    oldAnimate();
}

// TODO: MAKE THIS WORK BY GETTING addons FOLDER TO IMPORT CORRECTLY
function animate(){
    composer = new THREE.EffectComposer(renderer);
    var renderPass = new THREE.RenderPass(currentScene, camera);
    composer.addPass(renderPass);
    var effectBloom = new THREE.UnrealBloomPass(new THREE.Vector2(sceneSize, sceneSize), 1.5, 0.4, 0.85);
    effectBloom.threshold = 0;
    effectBloom.strength = 0.5;
    effectBloom.radius = 0;
    composer.addPass(effectBloom);
    
    composer.render();
    requestAnimationFrame( animate );
}

function oldAnimate() {
    requestAnimationFrame( oldAnimate );
    renderer.render( currentScene, camera );
}

function onWindowResize() {
    renderSize = window.innerHeight < window.innerWidth? window.innerHeight : window.innerWidth;
    renderer.setSize(renderSize, renderSize);
}

function onMouseWheel(e) {
    var e = window.event || e;

    // kui mouse event toimus stseenist väljas siis ei zoomi ega uuenda keskkohta
    // kontroll x-koordinaadi järgi
    if (window.innerWidth > renderSize) {
        var windowSideSize = (window.innerWidth - renderSize) / 2;
        if (e.clientX < windowSideSize || e.clientX > windowSideSize + renderSize) {
            return false;
        }
    }
    // kontroll y-koordinaadi järgi
    if (window.innerHeight > renderSize) {
        var windowSideSize = (window.innerHeight - renderSize) / 2;
        if (e.clientY < windowSideSize || e.clientY > windowSideSize + renderSize) {
            return false;
        }
    }

    var scaleSize = 1.1;
    var scaleBefore = scale;

    // zoom
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    scale =  delta > 0 ? scale / scaleSize : scale * scaleSize;
    currentScene.children[0].material.uniforms.scale.value = scale;

    // center update
    // new x
    if (window.innerWidth > renderSize) {
        var windowSideSize = (window.innerWidth - renderSize) / 2;
        var x = (e.clientX - windowSideSize) / renderSize;
    } else {
        var x = e.clientX / window.innerWidth;
    }
    x = (scale * x - (scaleBefore * x + scaleBefore * (0 - center.x))) / scale;

    // new y
    if (window.innerHeight > renderSize) {
        var windowSideSize = (window.innerHeight - renderSize) / 2;
        var y = (e.clientY - windowSideSize) / renderSize;
    } else {
        var y = e.clientY / window.innerHeight;
    }
    y = (scale * y - (scaleBefore * y + scaleBefore * (0 - center.y))) / scale;

    center = new THREE.Vector2(x, y);
    currentScene.children[0].material.uniforms.center.value = center;

    // max iterations update
    maxIterations = Math.min(1000 / scale, 2000);
    currentScene.children[0].material.uniforms.maxIterations.value = maxIterations;
    console.log(maxIterations);

    return false;
}

// change scene with number keys 1,2,3
function changeScene(e) {
    // reset scale and center
    scale = 5.0;
    center = new THREE.Vector2(0.5, 0.5);

    switch (e.code) {
		case "Digit1":
            currentScene = createScene1();
			break;
		case "Digit2":
			currentScene = createScene2();
			break;
		case "Digit3":
			currentScene = createScene3();
			break;
	}
	console.log(e.code);
}

function createScene1() {
	var scene = new THREE.Scene();
    var geometry = new THREE.PlaneBufferGeometry(sceneSize, sceneSize, 1);
    var uvCoord = new Float32Array([
		0,0,
		1,0,
		0,1,
		1,1
    ]);
    geometry.addAttribute("uvCoord", new THREE.BufferAttribute(uvCoord, 2));
	var material = createShaderMaterialMandelbrot(textures[0], VertexShaderBasic, FragShaderBasic);
	var mesh = new THREE.Mesh( geometry, material );
	mesh.name = "mesh";
    scene.add( mesh );
    clearSliders();
    addSlider(
        "colorR1",
        0,
        5,
        0.9,
        0.1,
        function() {
            mesh.material.uniforms.colorR1.value = this.value;
        }
    );

    addSlider(
        "colorG1",
        0,
        5,
        0.9,
        0.1,
        function() {
            mesh.material.uniforms.colorG1.value = this.value;
        }
    );

    addSlider(
        "colorB1",
        0,
        5,
        0.1,
        0.1,
        function() {
            mesh.material.uniforms.colorB1.value = this.value;
        }
    );

	return scene; 
}

function createScene2() {
    var startingConst1 = -0.8;
    var startingConst2 = 0.156;
    var scene = new THREE.Scene();
    var geometry = new THREE.PlaneBufferGeometry(sceneSize, sceneSize, 1);
    var uvCoord = new Float32Array([
        0,0,
        1,0,
        0,1,
        1,1
    ]);
    geometry.addAttribute("uvCoord", new THREE.BufferAttribute(uvCoord, 2));
    var material = createShaderMaterialJulia(textures[0], JuliaVertexShader, JuliaFragShader, startingConst1, startingConst2);
    var mesh = new THREE.Mesh( geometry, material );
    mesh.name = "mesh";
    scene.add( mesh );
    clearSliders();
    addSlider(
        "constant 1",
        -2,
        2,
        -0.8,
        0.001,
        function() {
            mesh.material.uniforms.someConstant1.value = this.value;
        }
    );

    addSlider(
        "constant 2",
        -1,
        1,
        0.156,
        0.001,
        function() {
            mesh.material.uniforms.someConstant2.value = this.value;
        }
    );

    return scene;
}

function createScene3() {
    clearSliders();
	var scene = new THREE.Scene();
    var geometry = new THREE.PlaneBufferGeometry(sceneSize, sceneSize, 1);
    var uvCoord = new Float32Array([
		0,0,
		1,0,
		0,1,
		1,1
    ]);
    geometry.addAttribute("uvCoord", new THREE.BufferAttribute(uvCoord, 2));
	var material = createShaderMaterial(textures[0], BuddhaVertexShader, BuddhaFragShader);
	var mesh = new THREE.Mesh( geometry, material );
	mesh.name = "mesh";
	scene.add( mesh );
	return scene; 
}

function clearSliders() {
    var elements = document.getElementsByClassName("slider-wrapper");
    console.log(elements);
    while (elements[0]) elements[0].parentNode.removeChild(elements[0]);
}

function addSlider(name, min, max, value, step, oninput) {
    var sliderWrapper = document.createElement("div");
    var sliderTitle = document.createTextNode(name);
    var slider = document.createElement("input");
    slider.type = "range";
    slider.name = name;
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.step = step;
    slider.oninput = oninput;
    slider.className = "slider";
    sliderTitle.className = "slider-title";
    sliderWrapper.className = "slider-wrapper";
    sliderWrapper.appendChild(sliderTitle);
    sliderWrapper.appendChild(slider);
    document.getElementById("overlay").appendChild(sliderWrapper);
}
			

function createShaderMaterialMandelbrot(texture, vertexShader, fragShader) {
    return new THREE.ShaderMaterial({
        uniforms: {
            texture: {
                type: 't',
                value: texture
            },
            scale:{
                type: 'float',
                value: scale
            },
            center:{
                type: 'v2',
                value: center
            },
            maxIterations:{
                type: 'int',
                value: maxIterations
            },
            colorR1:{
                type: 'float',
                value: 0.9
            },
            colorG1:{
                type: 'float',
                value: 0.9
            },
            colorB1:{
                type: 'float',
                value: 0.1
            }
        },
        vertexShader: vertexShader,
        fragmentShader: fragShader
    });
}

function createShaderMaterialJulia(texture, vertexShader, fragShader, someConstant1 = 0, someConstant2 = 0) {
    return new THREE.ShaderMaterial({
        uniforms: {
            texture: {
                type: 't',
                value: texture
            },
            scale:{
                type: 'float',
                value: scale
            },
            center:{
                type: 'v2',
                value: center
            },
            someConstant1:{
                type: 'float',
                value: someConstant1
            },
            someConstant2:{
                type: 'float',
                value: someConstant2
            },
            maxIterations:{
                type: 'int',
                value: maxIterations
            }
        },
        vertexShader: vertexShader,
        fragmentShader: fragShader
    });
}