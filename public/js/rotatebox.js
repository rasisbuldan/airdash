/***** Template *****/
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
/***** Template *****/

/* Add cube */
var geometry = new THREE.BoxGeometry();
var material = new THREE.MeshBasicMaterial({
    color: 0x00ff00
});
var cube = new THREE.Mesh(geometry, material);
scene.add(cube);

/***** Light *****/
var light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

camera.position.z = 5;

/***** Movement *****/
var xSpeed = 0.1;
var ySpeed = 0.1;

/* Keyboard input for move */
document.addEventListener("keydown", (event) => {
    var keyCode = event.which;
    console.log('Key pressed: ', keyCode)

    switch (keyCode) {
        case 38:
            cube.rotation.x -= ySpeed;
            break;
        case 40:
            cube.rotation.x += ySpeed;
            break;
        case 37:
            cube.rotation.y -= xSpeed;
            break;
        case 39:
            cube.rotation.y += xSpeed;
            break;
        case 32:
            cube.rotation.set(0, 0, 0);
            break;
        default:
            break;
    }

    /* Request render every keypress */
    /* animate(); */
})


function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();