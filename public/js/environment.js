
let myMesh;

function createEnvironment(scene) {
  console.log("Adding environment");

  //let texture = new THREE.TextureLoader().load("../assets/texture.png");
  let myGeometry = new THREE.BoxGeometry(5, 1, 3);
  let myMaterial = new THREE.MeshBasicMaterial({color: 0xD3D3D3}); //({ map: texture });
  myMesh = new THREE.Mesh(myGeometry, myMaterial);
  myMesh.position.set(-2, 5, 0);
  scene.add(myMesh);

  let background = new THREE.Mesh(new THREE.PlaneGeometry(100, 20, 0), new THREE.MeshBasicMaterial({color: 0x808080, side: THREE.DoubleSide}))
  background.position.set(0, 10, -20)
  scene.add(background)

  let wallLeft = new THREE.Mesh(new THREE.PlaneGeometry(30, 20, 0), new THREE.MeshBasicMaterial({color: 0x808080, side: THREE.DoubleSide}))
  wallLeft.rotateY(Math.PI/2)
  wallLeft.position.set(-50, 10, -5)
  scene.add(wallLeft)

  let wallRight = new THREE.Mesh(new THREE.PlaneGeometry(30, 20, 0), new THREE.MeshBasicMaterial({color: 0x808080, side: THREE.DoubleSide}))
  wallRight.rotateY(Math.PI/2)
  wallRight.position.set(50, 10, -5)
  scene.add(wallRight)
}


function updateEnvironment(scene) {
  // myMesh.position.x += 0.01;
}