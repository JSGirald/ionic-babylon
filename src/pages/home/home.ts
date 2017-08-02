import { ConfigProvider } from './../../providers/config/config';
import { ConfigPage } from './../config/config';
import { BabylonjsProvider } from './../../providers/babylonjs/babylonjs';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Scene, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, Color3, ArcRotateCamera, Texture, PhysicsImpostor, VertexData } from 'babylonjs';

/**
 * Class for the HomePage page.
 */
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {
  firstDie: any;
  ground: any;
  secondDie: any;
  @ViewChild('surface') surface: ElementRef;

  private _scene: Scene;
  private _camera: ArcRotateCamera;
  private _lightOne: HemisphericLight;
  private _lightTwo: HemisphericLight;

  constructor(public navCtrl: NavController, public navParams: NavParams, private engine: BabylonjsProvider, private config: ConfigProvider) {
  }

  ionViewDidLoad() {
    this.engine.createEngine(this.surface.nativeElement);
    this.surface.nativeElement.width = window.innerWidth;
    this.surface.nativeElement.height = window.innerHeight;
    this.surface.nativeElement.style.width = '100%';
    this.surface.nativeElement.style.height = '100%';
    this.createScene();
    this.animate();
  }

  ionViewWillEnter() {
    if (this.config.hasChanged) { // has anything changed?
      // then reset uv settings for both dice
      let options = {
        size: 1.25,
        faceUV: this.config.getFaceUV(this.config.colorOne),
        updatable: false
      }
      //MeshBuilder.UpdateBoxOptions(this.firstDie, options);
      let vertexData = VertexData.CreateBox(options);
      vertexData.applyToMesh(this.firstDie, options.updatable); 

      options = {
        size: 1.25,
        faceUV: this.config.getFaceUV(this.config.colorTwo),
        updatable: false
      }
      //MeshBuilder.UpdateBoxOptions(this.secondDie, options);
      vertexData = VertexData.CreateBox(options);
      vertexData.applyToMesh(this.secondDie, options.updatable);      
    }
  }

  createScene(): void {
    // create a basic BJS Scene object
    this._scene = new Scene(this.engine.getEngine());
    this._scene.enablePhysics(); // use physics!!

    // create an ArcRotateCamera
    // attach the camera to the canvas
    this._camera = new ArcRotateCamera("ArcRotateCamera", 0, 0, 0, Vector3.Zero(), this._scene);
    this._camera.setPosition(new Vector3(0, 15, 1));
    //this._camera.attachControl(this.surface.nativeElement, false);

    // create two  basic light, aiming 0,1,0 - meaning, to the sky
    this._lightOne = new HemisphericLight('light1', new Vector3(1, 0, 0), this._scene);
    this._lightTwo = new HemisphericLight('light1', new Vector3(0, 1, -1), this._scene);
    this._lightOne.intensity = .6;
    this._lightTwo.intensity = .3;

    // materials and textures
    let green = new StandardMaterial("green", this._scene);
    green.diffuseColor = new Color3(0, .7, 0);

    let texture = new Texture('assets/images/die.svg', this._scene);

    // create a built-in "ground" shape and walls
    this.ground = MeshBuilder.CreateGround('ground1', { width: 6, height: 1.618 * 6, subdivisions: 2 }, this._scene);
    this.ground.material = green;
    let physOptions = { mass: 0.0, restitution: .01, friction: .5 };
    this.ground.physicsImpostor = new PhysicsImpostor(this.ground, PhysicsImpostor.PlaneImpostor, physOptions, this._scene);
    let walls = [];
    for (let i = 0; i < 4; i++) {
      walls[i] = MeshBuilder.CreateBox("wall_" + i, { depth: .1, width: 6, height: 32 }, this._scene);
      walls[i].rotation.y = i * Math.PI / 2;
      walls[i].position.y = 3;
      walls[i].material = green;
      if ((i == 1) || (i == 3)) {
        walls[i].scaling.x = 1.618;
      }
      walls[i].physicsImpostor = new PhysicsImpostor(walls[i], PhysicsImpostor.BoxImpostor, { mass: 0 }, this._scene);
    }
    walls[0].position.z = 3 * 1.618;
    walls[2].position.z = -3 * 1.618;
    walls[1].position.x = 3;
    walls[3].position.x = -3;

    // create dice
    let faceUV = this.config.getFaceUV(this.config.colorOne);
    let options = {
      size: 1.25,
      faceUV: faceUV,
    }
    physOptions = { mass: 0.25, restitution: .1, friction: .1 }; // initialise physics
    this.firstDie = MeshBuilder.CreateBox('firstDie', options, this._scene);
    this.firstDie.physicsImpostor = new PhysicsImpostor(this.firstDie, PhysicsImpostor.BoxImpostor, physOptions, this._scene);
    let firstDieMaterial = new StandardMaterial('firstDieMat', this._scene);
    this.firstDie.material = firstDieMaterial;
    firstDieMaterial.diffuseTexture = texture;

    faceUV = this.config.getFaceUV(this.config.colorTwo);
    options = {
      size: 1.25,
      faceUV: faceUV,
    }
    this.secondDie = MeshBuilder.CreateBox('secondDie', options, this._scene);
    this.secondDie.physicsImpostor = new PhysicsImpostor(this.secondDie, PhysicsImpostor.BoxImpostor, physOptions, this._scene);
    let secondDieMaterial = new StandardMaterial('secondDieMat', this._scene);
    this.secondDie.material = secondDieMaterial;
    secondDieMaterial.diffuseTexture = texture;

    // set a random impulse for both dice
    this.rollEm(null);
  }

  animate(): void {
    // run the render loop
    this.engine.start(this._scene);
  }

  rollEm(event): void {
    // roll the dice!
    this.firstDie.position = new Vector3(-0.5, 1.5 + Math.random(), 2.5);
    this.secondDie.position = new Vector3(0.5, 1.5 + Math.random(), 2.5);
    let randomVector = new Vector3((.49 - Math.random()), -0.1, -1 + (- Math.random()));
    this.firstDie.physicsImpostor.applyImpulse(randomVector, this.firstDie.position);
    this.secondDie.physicsImpostor.applyImpulse(randomVector, this.secondDie.position);
  }

  settings(event): void {
    this.navCtrl.push(ConfigPage, {});
  }
}
