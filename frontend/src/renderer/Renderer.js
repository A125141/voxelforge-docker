// Three.js scene, camera, lights, render loop.
import * as THREE from 'three';
import { buildTextureAtlas } from './TextureAtlas.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 64, 160);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Lights.
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(100, 200, 50);
    this.scene.add(sun);
    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x6B4F2A, 0.3);
    this.scene.add(hemi);

    // Clouds (simple flat plane).
    const cloudGeom = new THREE.PlaneGeometry(400, 400);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false,
    });
    this.clouds = new THREE.Mesh(cloudGeom, cloudMat);
    this.clouds.rotation.x = -Math.PI / 2;
    this.clouds.position.y = 130;
    this.scene.add(this.clouds);

    this.atlas = buildTextureAtlas();

    window.addEventListener('resize', () => this._onResize());
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.clouds.position.x = this.camera.position.x;
    this.clouds.position.z = this.camera.position.z;
    this.renderer.render(this.scene, this.camera);
  }
}
