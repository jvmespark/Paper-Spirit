
let myMesh;

function createEnvironment(scene) {
  console.log("Adding environment");

  //let texture = new THREE.TextureLoader().load("../assets/texture.png");
  let myGeometry = new THREE.BoxGeometry(5, 1, 3);
  let myMaterial = new THREE.MeshBasicMaterial(); //({ map: texture });
  myMesh = new THREE.Mesh(myGeometry, myMaterial);
  myMesh.position.set(-2, 5, 0);
  scene.add(myMesh);
}


function updateEnvironment(scene) {
  // myMesh.position.x += 0.01;
}