import $ from "jquery";
import './styles/app.css';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import * as THREE from 'three';
import VertexShader from './shaders/vertexShader.glsl';
import MandelbrotFragShader from './shaders/mandelbrotFragShader.glsl';
import JuliaFragShader_2 from './shaders/juliaFragShader_2.glsl';
import JuliaFragShader_3 from './shaders/juliaFragShader_3.glsl';
import TetrahedronFragShader from './shaders/tetrahedronFragShader.glsl';

let defaultMaxIterations = 400;
let defaultCenter = new THREE.Vector2(0.5, 0.5);
let defaultScale = 5 ;

var camera, currentScene, renderer, composer, effectBloom, renderPass;
var maxIterations, center, scale;
var bloomActivated = false;
var bloom_threshold = 0;
var bloom_strength = 0.5;
var bloom_radius = 0;

var startX,startY;
var dragging = false;

var renderSize;
var sceneSize = 1;
var buttonAnimation;
var bloom = false;
var mousePosition = {x:0, y:0};

init();

function init() {
	document.addEventListener("keypress", onKeyPress);

    document.addEventListener( 'DOMMouseScroll', onMouseWheel, false );	// firefox
    document.addEventListener("mousewheel", onMouseWheel, false);    // chrome
    window.addEventListener("resize", onWindowResize);    // if window size changed
    document.addEventListener('mousemove', function(mouseMoveEvent){
        mousePosition.x = mouseMoveEvent.pageX;
        mousePosition.y = mouseMoveEvent.pageY;
    }, false);



    camera = new THREE.OrthographicCamera( sceneSize / - 2,  sceneSize / 2,  sceneSize / 2, sceneSize / - 2, 0.01, 1000 );
    camera.position.z = 1;
    camera.position.x = 0;
    
	resetSettings();
    currentScene = createTetrahedronScene();
	renderer = new THREE.WebGLRenderer( { antialias: true } );

    renderSize = window.innerHeight < window.innerWidth? window.innerHeight : window.innerWidth;
    renderer.setSize( renderSize, renderSize );
    var canvasContainer = document.getElementById("canvas-container");
    var canvas = renderer.domElement;
    
    //dragging controls
    $('#canvas-container').on('mousedown', function( event ) {
        event.preventDefault();
        dragging = true;
        startX = event.pageX;
        startY = event.pageY;
    });
    $('#canvas-container').on('mouseup', function( event ) {
        event.preventDefault();
        dragging = false;
        startX = 0;
        startY = 0;
    });
    $('#canvas-container').on('mousemove', onMouseDrag);
    
    $('#bloom_threshold').on('input', function() { bloom_threshold = this.value });
    $('#bloom_strength').on('input', function() { bloom_strength = this.value });
    $('#bloom_radius').on('input', function() { bloom_radius = this.value });
    

    canvas.addEventListener("webglcontextlost", function(event) {
        event.preventDefault();
    }, false);


    canvasContainer.appendChild( canvas );
    //document.body.appendChild( renderer.domElement );

    animate();
}

function animate(){
    currentScene.getObjectByName("mesh").material.uniforms.maxIterations.value = maxIterations;
    currentScene.getObjectByName("mesh").material.uniforms.scale.value = scale;
    currentScene.getObjectByName("mesh").material.uniforms.center.value = center;

    if (bloom) {
        composer = new EffectComposer(renderer);
        renderPass = new RenderPass(currentScene, camera);
        composer.addPass(renderPass);
        effectBloom = new UnrealBloomPass(new THREE.Vector2(sceneSize, sceneSize), 1.5, 0.4, 0.85);
        effectBloom.threshold = bloom_threshold;
        effectBloom.strength = bloom_strength;
        effectBloom.radius = bloom_radius;
        composer.addPass(effectBloom);

        composer.render();
    }
    else {
        renderer.render( currentScene, camera );
    }

    currentScene.getObjectByName("mesh").material.needsUpdate = true;
    currentScene.getObjectByName("mesh").material.uniforms.dTime.value = toRad(millis() / 40 % 360);

    requestAnimationFrame( animate );
}


function onWindowResize() {
    renderSize = window.innerHeight < window.innerWidth? window.innerHeight : window.innerWidth;
    renderer.setSize(renderSize, renderSize);
}

function onMouseDrag(e){
    if(dragging){
        var deltaX = startX - e.pageX;
        var deltaY = startY - e.pageY;
        moveCenter(deltaX*0.001, deltaY*0.001);
        startX = e.pageX;
        startY = e.pageY;
    }
    event.preventDefault();
}

function moveCenter(x, y){
    center = new THREE.Vector2(center.x-x, center.y-y);
    return false;
}

function updateZoom(scale){
    var displayNumber = parseFloat((scale/4).toString()).toFixed(3);
    $('#zoom').html(displayNumber+"x");
}

function onMouseWheel(e) {
    //e = window.event || e;

    // kui mouse event toimus stseenist väljas siis ei zoomi ega uuenda keskkohta
    // kontroll x-koordinaadi järgi
    var windowSideSize;
    if (window.innerWidth > renderSize) {
        windowSideSize = (window.innerWidth - renderSize) / 2;
        if (mousePosition.x < windowSideSize || mousePosition.x > windowSideSize + renderSize) {
            return false;
        }
    }
    // kontroll y-koordinaadi järgi
    if (window.innerHeight > renderSize) {
        windowSideSize = (window.innerHeight - renderSize) / 2;
        if (mousePosition.y < windowSideSize || mousePosition.y > windowSideSize + renderSize) {
            return false;
        }
    }

    var scaleSize = 1.1;
    var scaleBefore = scale;

    // zoom
    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    scale = delta > 0 ? scale / scaleSize : scale * scaleSize;
    updateZoom(scale);

    // center update
    // new x
    var x;
    if (window.innerWidth > renderSize) {
        windowSideSize = (window.outerWidth - renderSize) / 2;
        x = (mousePosition.x - windowSideSize) / renderSize;
    } else {
        x = mousePosition.x / window.innerWidth;
    }
    // new y
    var y;
    if (window.innerHeight > renderSize) {
        windowSideSize = (window.innerHeight - renderSize) / 2;
        y = (mousePosition.y - windowSideSize) / renderSize;
    } else {
        y = mousePosition.y / window.innerHeight;
    }

    x = calculateCenterCoordinateAfterZoom(x, center.x, scaleBefore, scale);
    y = calculateCenterCoordinateAfterZoom(y, center.y, scaleBefore, scale);
    center = new THREE.Vector2(x, y);

    return false;
}

function calculateCenterCoordinateAfterZoom(coordinate, centerCoordinate, scaleBefore, scaleNow) {
    return (scaleNow * coordinate - (scaleBefore * coordinate + scaleBefore * (0 - centerCoordinate))) / scaleNow;
}

function resetSettings() {
    scale = defaultScale;
    center = defaultCenter;
    maxIterations = defaultMaxIterations;
}

function millis() {
    return (new Date()).getTime();
}

function toRad(degree) {
    return Math.PI * 2 * degree / 360;
}

// change scene with number keys 1,2,3
function onKeyPress(e) {
    switch (e.code) {
        case "KeyQ":
            onMouseWheel({ detail: -3 , wheelDelta: -3});
            return;
        case "KeyW":
            onMouseWheel({ detail: 3, wheelDelta: 3 });
            return;
    }

    clearOverlay();
    stopAnimation();

    switch (e.code) {
		case "Digit1":
            currentScene = createMandelbrotScene();
			break;
		case "Digit2":
			currentScene = createJuliaSet2Scene();
			break;
		case "Digit3":
			currentScene = createJuliaSet3Scene();
			break;
        case "Digit4":
            currentScene = createTetrahedronScene();
            break;
        default:
            return;
	}

    resetSettings();
}

function createPlaneMesh(VertexShader, FragShader){
    var geometry = new THREE.PlaneBufferGeometry(sceneSize, sceneSize, 1);
    var uvCoord = new Float32Array([
        0,0,
        1,0,
        0,1,
        1,1
    ]);
    geometry.setAttribute("uvCoord", new THREE.BufferAttribute(uvCoord, 2));
    var material = createShaderMaterial(VertexShader, FragShader);
    var mesh = new THREE.Mesh( geometry, material );
    mesh.name = "mesh";

    return mesh
}

function clearOverlay() {
    // sliders
    $('#sliders').empty();

    // dropdowns
    $('#dropdowns').empty();

    // buttons
    $('#buttons').empty();
}

function stopAnimation() {
    clearInterval(buttonAnimation)
}

function addSlider(name, min, max, value, step, onInput) {
    var sliderWrapper = document.createElement("div");
    var sliderTitle = document.createTextNode(name);
    var slider = document.createElement("input");
    slider.type = "range";
    slider.name = name;
    slider.min = min;
    slider.max = max;
    slider.value = value;
    slider.step = step;
    slider.oninput = onInput;
    slider.className = "slider";
    sliderTitle.className = "slider-title";
    sliderWrapper.className = "slider-wrapper";
    sliderWrapper.appendChild(sliderTitle);
    sliderWrapper.appendChild(slider);
    document.getElementById("sliders").appendChild(sliderWrapper);
}

function addDropdown(name, items, onChange) {
    var dropdownWrapper = document.createElement("div");
    var dropdownTitle = document.createTextNode(name);
    var dropdown = document.createElement("select");
    dropdown.name = name;

    items.forEach(
        (item, index) => {
            var option = document.createElement("option");
            option.value = index;
            option.text = item;
            dropdown.appendChild(option);
        }
    );

    dropdown.onchange = onChange;
    dropdown.className = "dropdown";

    dropdownTitle.className = "dropdown-title";
    dropdownWrapper.className = "dropdown-wrapper";
    dropdownWrapper.appendChild(dropdownTitle);
    dropdownWrapper.appendChild(dropdown);
    document.getElementById("dropdowns").appendChild(dropdownWrapper);
}

function addButton(name, onClick, ...args) {
    var button = document.createElement("button");
    button.innerHTML = name;
    button.addEventListener ("click", function() {
        onClick(...args);
    });

    document.getElementById("buttons").appendChild(button);
}

function zoomAnimation(centerX, centerY) {
    stopAnimation();
    resetSettings();
    buttonAnimation = setInterval(frame, 5);
    var times = 1000;
    var scaleChange = 0.99;
    var x, y, newScale;
    function frame() {
        if (times == 0) {
            clearInterval(buttonAnimation);
        } else {
            times = times - 1;
            newScale = scale * scaleChange;
            x = calculateCenterCoordinateAfterZoom(centerX, center.x, scale, newScale);
            y = calculateCenterCoordinateAfterZoom(centerY, center.y, scale, newScale);
            center = new THREE.Vector2(x, y);
            scale = newScale;
        }
    }
}

function constantChangeAnimation(valueFrom, valueTo, realFunction, imagFunction, mesh) {
    stopAnimation();
    resetSettings();
    buttonAnimation = setInterval(frame, 5);

    var changingValue = valueFrom;
    var stepSize = (valueTo - valueFrom)  / 5000;

    function frame() {
        changingValue += stepSize;
        changingValue = changingValue % valueTo;

        mesh.material.uniforms.realConstant.value = realFunction(changingValue);
        mesh.material.uniforms.imaginaryConstant.value = imagFunction(changingValue);
    }
}

function toggleBloom() {
    $('.col-bloom').toggle();
    bloom = !bloom;
}

function createMandelbrotScene() {
    var scene = new THREE.Scene();
    var mesh = createPlaneMesh(VertexShader, MandelbrotFragShader);
    scene.add( mesh );

    addSlider("colorR1", 0, 5, 0.9, 0.1,
        function() {
            mesh.material.uniforms.colorR1.value = this.value;
        }
    );

    addSlider("colorG1", 0, 5, 0.9, 0.1,
        function() {
            mesh.material.uniforms.colorG1.value = this.value;
        }
    );

    addSlider("colorB1", 0, 5, 0.1, 0.1,
        function() {
            mesh.material.uniforms.colorB1.value = this.value;
        }
    );

    addButton("Zoom",
        zoomAnimation,
        0.13798, 0.5, scene
    );

    addButton("Toggle bloom", toggleBloom);

	return scene;
}

function createJuliaSet2Scene() {
    var scene = new THREE.Scene();
    var mesh = createPlaneMesh(VertexShader, JuliaFragShader_2);
    mesh.material.uniforms.realConstant.value = -1.201;
    mesh.material.uniforms.imaginaryConstant.value = 0.156;
    scene.add( mesh );

    addSlider("Real constant", -2, 2, -0.8, 0.001,
        function() {
            mesh.material.uniforms.realConstant.value = this.value;
        }
    );

    addSlider("Imag constant", -1, 1, 0.156, 0.001,
        function() {
            mesh.material.uniforms.imaginaryConstant.value = this.value;
        }
    );

    addButton("Zoom",
        zoomAnimation,
        0.555, 0.485, scene
    );

    addButton("Animate",
        constantChangeAnimation,
        0, 2*Math.PI,
        function(x) {return 0.7885 * Math.cos(x)},
        function(x) {return 0.7885 * Math.sin(x)},
        mesh
    );

    addButton("Toggle bloom", toggleBloom);

    addDropdown("Constant presets", ["-1.201+0.156i", "-0.8+0.156i", "-0.7269+0.1889i"],
        function() {
            switch (this.value) {
                case "0":
                    mesh.material.uniforms.realConstant.value = -1.201;
                    mesh.material.uniforms.imaginaryConstant.value = 0.156;
                    break;
                case "1":
                    mesh.material.uniforms.realConstant.value = -0.8;
                    mesh.material.uniforms.imaginaryConstant.value = 0.156;
                    break;
                case "2":
                    mesh.material.uniforms.realConstant.value = -0.7269;
                    mesh.material.uniforms.imaginaryConstant.value = 0.1889;
                    break;
            }
        });

    return scene;
}

function createJuliaSet3Scene() {
    var scene = new THREE.Scene();
    var mesh = createPlaneMesh(VertexShader, JuliaFragShader_3);
    mesh.material.uniforms.realConstant.value = -0.594;
    mesh.material.uniforms.imaginaryConstant.value = 0.156;
    scene.add( mesh );

    addSlider("Real constant", -2, 2, -0.8, 0.001,
        function() {
            mesh.material.uniforms.realConstant.value = this.value;
        }
    );

    addSlider("Imag constant", -1, 1, 0.156, 0.001,
        function() {
            mesh.material.uniforms.imaginaryConstant.value = this.value;
        }
    );

    addButton("Zoom",
        zoomAnimation,
        0.69, 0.45, scene
    );

    addButton("Toggle bloom", toggleBloom);

    return scene;
}

function createTetrahedronScene() {
    var scene = new THREE.Scene();
    var mesh = createPlaneMesh(VertexShader, TetrahedronFragShader);
    scene.add( mesh );

    addButton("Toggle bloom", toggleBloom);

    return scene;
}

function createShaderMaterial(vertexShader, fragShader) {
    return new THREE.ShaderMaterial({
        uniforms: {
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
            },
            realConstant:{
                type: 'float',
                value: 0.0
            },
            imaginaryConstant:{
                type: 'float',
                value: 0.0
            },
            dTime: { type: 'f', value: 0.0 },
        },
        vertexShader: vertexShader,
        fragmentShader: fragShader
    });
}