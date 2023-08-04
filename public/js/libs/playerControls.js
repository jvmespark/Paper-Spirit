

THREE.PlayerControls = function (camera, player, scene, domElement) {

	this.camera = camera;
	this.player = player;
	this.scene = scene;
	this.domElement = (domElement !== undefined) ? domElement : document;
	this.clock = new THREE.Clock();

	// API

	this.enabled = true;

	this.center = new THREE.Vector3(player.position.x, player.position.y, player.position.z);

	this.moveSpeed = 0.2;
	this.turnSpeed = 0.08;
	this.jumpSpeed = 0.5;
	this.gravity = 1;
	this.jumpTime = 0;

	this.userZoom = true;
	this.userZoomSpeed = 1.0;

	this.userRotate = true;
	this.userRotateSpeed = 1.5;

	this.autoRotate = true;
	this.autoRotateSpeed = 0.1;
	this.YAutoRotation = false;

	this.minPolarAngle = 0;
	this.maxPolarAngle = Math.PI;

	this.minDistance = 0;
	this.maxDistance = Infinity;

	// internals

	var scope = this;

	var EPS = 0.000001;
	var PIXELS_PER_ROUND = 1800;

	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();

	var zoomStart = new THREE.Vector2();
	var zoomEnd = new THREE.Vector2();
	var zoomDelta = new THREE.Vector2();

	var phiDelta = 0;
	var thetaDelta = 0;
	var scale = 1;

	var lastPosition = new THREE.Vector3(player.position.x, player.position.y, player.position.z);
	var playerIsMoving = false;
	var playerIsJumping = false;
	var playerGrounded = true;

	var keyState = {};
	var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2 };
	var state = STATE.NONE;

	this.cameraY = 9
	this.cameraZ = 12
	camera.position.y = this.cameraY;
	camera.position.z = this.cameraZ;
	camera.rotateX(-0.5);

	var bullets = []
	var lastBulletTime = 0
	var bulletReloadTime = 0.5
	// events

	var changeEvent = { type: 'change' };

	this.rotateLeft = function (angle) {

		if (angle === undefined) {

			angle = getAutoRotationAngle();

		}

		thetaDelta -= angle;

	};

	this.rotateRight = function (angle) {

		if (angle === undefined) {

			angle = getAutoRotationAngle();

		}

		thetaDelta += angle;

	};

	this.rotateUp = function (angle) {

		if (angle === undefined) {

			angle = getAutoRotationAngle();

		}

		phiDelta -= angle;

	};

	this.rotateDown = function (angle) {

		if (angle === undefined) {

			angle = getAutoRotationAngle();

		}

		phiDelta += angle;

	};

	this.zoomIn = function (zoomScale) {

		if (zoomScale === undefined) {

			zoomScale = getZoomScale();

		}

		scale /= zoomScale;

	};

	this.zoomOut = function (zoomScale) {

		if (zoomScale === undefined) {

			zoomScale = getZoomScale();

		}

		scale *= zoomScale;

	};

	this.update = function () {

		this.checkKeyStates();

		this.center = this.player.position;

		var position = this.camera.position;
		var offset = position.clone().sub(this.center);

		// angle from z-axis around y-axis

		var theta = Math.atan2(offset.x, offset.z);

		// angle from y-axis

		var phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);

		theta += thetaDelta;
		phi += phiDelta;

		// restrict phi to be between desired limits
		phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));

		// restrict phi to be between EPS and PI-EPS
		phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

		var radius = offset.length() * scale;

		radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));

		offset.x = radius * Math.sin(phi) * Math.sin(theta);
		offset.y = radius * Math.cos(phi);
		offset.z = radius * Math.sin(phi) * Math.cos(theta);

		position.copy(this.center).add(offset);

		thetaDelta = 0;
		phiDelta = 0;
		scale = 1;


		if (lastPosition.distanceTo(this.player.position) > 0) {


			lastPosition.copy(this.player.position);

		} else if (lastPosition.distanceTo(this.player.position) == 0) {

			playerIsMoving = false;

		}

		if (playerIsJumping) {
			if (this.player.position.y < 0.5) {
				this.player.position.y = 0.5;
				this.camera.position.y = 0.5 + this.cameraY;
				playerIsJumping = false;
				playerGrounded = true;
			}
			else {
				this.player.position.y += this.jumpSpeed - (this.gravity * (this.clock.getElapsedTime() - this.jumpTime));
				this.camera.position.y += this.jumpSpeed - (this.gravity * (this.clock.getElapsedTime() - this.jumpTime));
			}
		}

		bullets.forEach(b=>{
			b.position.x += 0.5
		})
	};

	this.checkKeyStates = function () {

		/*
			WASD = move 

			J = shoot

			K = jump

			L = lock

			Semicolon = EX

			Space = dash

			I = switch weapon (couldn't think of a good key...)
		*/
		if (keyState[81]) {
			// q
			// shoot right
			if (keyState[68]) {
				if (this.clock.getElapsedTime() >= lastBulletTime + bulletReloadTime || lastBulletTime === 0) {
					let bullet = new THREE.Mesh( new THREE.PlaneGeometry(1, 0.5, 1), );
					bullet.position.set(player.position.x,player.position.y + 1,player.position.z);
					this.scene.add(bullet);
					bullets.push(bullet);
					lastBulletTime = this.clock.getElapsedTime();
				}
			}
			// shoot left
			// shoot up
			// shoot down
		}
		if (keyState[87]) {
			// w
		}
		if (keyState[69]) {
			// e
		}
		if (keyState[82]) {
			// r
		}

		if (keyState[83] || keyState[75]) {
			// drop levels until ground floor
		}

		if (keyState[32]) {
			// space - jump
			if (playerGrounded) {
				playerIsMoving = true;
				playerIsJumping = true;
				playerGrounded = false;
				this.jumpTime = this.clock.getElapsedTime()
			}
		}

		if (keyState[37] || keyState[65] || keyState[74]) {

			// left arrow or 'a' or j- move left
			playerIsMoving = true;

			this.player.position.x -= this.moveSpeed;
			this.camera.position.x -= this.moveSpeed;

		}

		if (keyState[39] || keyState[68] || keyState[76]) {

			// right arrow or 'd' or l - move right
			playerIsMoving = true;

			this.player.position.x += this.moveSpeed;
			this.camera.position.x += this.moveSpeed;

		}

	};

	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow(0.95, scope.userZoomSpeed);

	}

	function onMouseDown(event) {

		if (scope.enabled === false) return;
		if (scope.userRotate === false) return;

		event.preventDefault();

		if (event.button === 0) {

			state = STATE.ROTATE;

			rotateStart.set(event.clientX, event.clientY);

		} else if (event.button === 1) {

			state = STATE.ZOOM;

			zoomStart.set(event.clientX, event.clientY);

		}

		document.addEventListener('mousemove', onMouseMove, false);
		document.addEventListener('mouseup', onMouseUp, false);

	}

	function onMouseMove(event) {

		if (scope.enabled === false) return;

		event.preventDefault();

		if (state === STATE.ROTATE) {

			rotateEnd.set(event.clientX, event.clientY);
			rotateDelta.subVectors(rotateEnd, rotateStart);

			scope.rotateLeft(2 * Math.PI * rotateDelta.x / PIXELS_PER_ROUND * scope.userRotateSpeed);
			scope.rotateUp(2 * Math.PI * rotateDelta.y / PIXELS_PER_ROUND * scope.userRotateSpeed);

			rotateStart.copy(rotateEnd);

		} else if (state === STATE.ZOOM) {

			zoomEnd.set(event.clientX, event.clientY);
			zoomDelta.subVectors(zoomEnd, zoomStart);

			if (zoomDelta.y > 0) {

				scope.zoomIn();

			} else {

				scope.zoomOut();

			}

			zoomStart.copy(zoomEnd);
		}

	}

	function onMouseUp(event) {

		if (scope.enabled === false) return;
		if (scope.userRotate === false) return;

		document.removeEventListener('mousemove', onMouseMove, false);
		document.removeEventListener('mouseup', onMouseUp, false);

		state = STATE.NONE;

	}

	function onMouseWheel(event) {

		if (scope.enabled === false) return;
		if (scope.userRotate === false) return;

		var delta = 0;

		if (event.wheelDelta) { //WebKit / Opera / Explorer 9

			delta = event.wheelDelta;

		} else if (event.detail) { // Firefox

			delta = - event.detail;

		}

		if (delta > 0) {

			scope.zoomOut();

		} else {

			scope.zoomIn();

		}

	}

	function onKeyDown(event) {

		event = event || window.event;

		keyState[event.keyCode || event.which] = true;

	}

	function onKeyUp(event) {

		event = event || window.event;

		keyState[event.keyCode || event.which] = false;

	}

	this.domElement.addEventListener('contextmenu', function (event) { event.preventDefault(); }, false);
	this.domElement.addEventListener('mousedown', onMouseDown, false);
	this.domElement.addEventListener('mousewheel', onMouseWheel, false);
	this.domElement.addEventListener('DOMMouseScroll', onMouseWheel, false); // firefox
	this.domElement.addEventListener('keydown', onKeyDown, false);
	this.domElement.addEventListener('keyup', onKeyUp, false);

};

THREE.PlayerControls.prototype = Object.create(THREE.EventDispatcher.prototype);