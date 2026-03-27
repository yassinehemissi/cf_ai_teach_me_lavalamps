"use client";

import { useMemo } from "react";
import {
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";

import type { RoomBounds, RoomState, RoomWallMount } from "./Room.types";

const ROOM_SCALE = 1;
const ROOM_WIDTH = 56;
const ROOM_HEIGHT = 24;
const ROOM_DEPTH = 44;
const DOOR_WIDTH = 6.8;
const DOOR_HEIGHT = 14.4;
const DOOR_CENTER_Z = 0;

export function useRoomState(): RoomState {
  return useMemo(() => createRoomState(), []);
}

function createRoomState(): RoomState {
  const roomBounds: RoomBounds = {
    min: {
      x: -ROOM_WIDTH * 0.5,
      y: 0,
      z: -ROOM_DEPTH * 0.5,
    },
    max: {
      x: ROOM_WIDTH * 0.5,
      y: ROOM_HEIGHT,
      z: ROOM_DEPTH * 0.5,
    },
  };

  return {
    roomScene: createRoomScene(roomBounds),
    roomScale: ROOM_SCALE,
    wallMount: createWallMount(roomBounds),
  };
}

function createRoomScene(roomBounds: RoomBounds): Group {
  const room = new Group();
  const wallTexture = createWallTexture();
  const ceilingTexture = createCeilingTexture();
  const floorTexture = createFloorTexture();
  const wallMaterial = new MeshStandardMaterial({
    color: "#B9B9B9",
    map: wallTexture,
    roughness: 0.98,
    metalness: 0.02,
    side: DoubleSide,
  });
  const floorMaterial = new MeshStandardMaterial({
    color: "#B9B9B9",
    map: floorTexture,
    roughness: 1,
    metalness: 0.01,
    side: DoubleSide,
  });
  const ceilingMaterial = new MeshStandardMaterial({
    color: "#B9B9B9",
    map: ceilingTexture,
    roughness: 0.98,
    metalness: 0.01,
    side: DoubleSide,
  });

  const width = roomBounds.max.x - roomBounds.min.x;
  const height = roomBounds.max.y - roomBounds.min.y;
  const depth = roomBounds.max.z - roomBounds.min.z;
  const centerX = (roomBounds.min.x + roomBounds.max.x) * 0.5;
  const centerY = (roomBounds.min.y + roomBounds.max.y) * 0.5;
  const centerZ = (roomBounds.min.z + roomBounds.max.z) * 0.5;

  room.add(
    createRectangle({
      size: [width, depth],
      position: [centerX, roomBounds.min.y, centerZ],
      rotation: [-Math.PI * 0.5, 0, 0],
      material: floorMaterial,
      name: "room-floor",
    }),
  );
  room.add(
    createRectangle({
      size: [width, depth],
      position: [centerX, roomBounds.max.y, centerZ],
      rotation: [Math.PI * 0.5, 0, 0],
      material: ceilingMaterial,
      name: "room-ceiling",
    }),
  );
  room.add(
    createRectangle({
      size: [width, height],
      position: [centerX, centerY, roomBounds.min.z],
      rotation: [0, 0, 0],
      material: wallMaterial,
      name: "room-wall-mount",
    }),
  );
  room.add(
    createRectangle({
      size: [width, height],
      position: [centerX, centerY, roomBounds.max.z],
      rotation: [0, Math.PI, 0],
      material: wallMaterial,
      name: "room-wall-opposite",
    }),
  );
  room.add(
    createRectangle({
      size: [depth, height],
      position: [roomBounds.max.x, centerY, centerZ],
      rotation: [0, -Math.PI * 0.5, 0],
      material: wallMaterial,
      name: "room-wall-side",
    }),
  );

  const doorMinZ = DOOR_CENTER_Z - DOOR_WIDTH * 0.5;
  const doorMaxZ = DOOR_CENTER_Z + DOOR_WIDTH * 0.5;
  const doorTopY = roomBounds.min.y + DOOR_HEIGHT;

  room.add(
    createRectangle({
      size: [doorMinZ - roomBounds.min.z, height],
      position: [
        roomBounds.min.x,
        centerY,
        (roomBounds.min.z + doorMinZ) * 0.5,
      ],
      rotation: [0, Math.PI * 0.5, 0],
      material: wallMaterial,
      name: "room-door-wall-left",
    }),
  );
  room.add(
    createRectangle({
      size: [roomBounds.max.z - doorMaxZ, height],
      position: [
        roomBounds.min.x,
        centerY,
        (doorMaxZ + roomBounds.max.z) * 0.5,
      ],
      rotation: [0, Math.PI * 0.5, 0],
      material: wallMaterial,
      name: "room-door-wall-right",
    }),
  );
  room.add(
    createRectangle({
      size: [DOOR_WIDTH, roomBounds.max.y - doorTopY],
      position: [
        roomBounds.min.x,
        (doorTopY + roomBounds.max.y) * 0.5,
        DOOR_CENTER_Z,
      ],
      rotation: [0, Math.PI * 0.5, 0],
      material: wallMaterial,
      name: "room-door-wall-top",
    }),
  );

  return room;
}

function createRectangle({
  size,
  position,
  rotation,
  material,
  name,
}: {
  size: [number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  material: MeshStandardMaterial;
  name: string;
}): Mesh {
  const mesh = new Mesh(new PlaneGeometry(size[0], size[1]), material);

  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.receiveShadow = true;
  mesh.castShadow = false;

  return mesh;
}

function createWallTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  const size = 256;

  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create room wall texture.");
  }

  context.fillStyle = "#b9b9b9";
  context.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const grain = 184 + Math.floor(Math.random() * 28);
      const alpha = 0.08 + Math.random() * 0.08;

      context.fillStyle = `rgba(${grain}, ${grain - 4}, ${grain - 6}, ${alpha})`;
      context.fillRect(x, y, 1, 1);
    }
  }

  context.strokeStyle = "rgba(130, 130, 130, 0.18)";
  context.lineWidth = 2;

  for (let x = 32; x < size; x += 48) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, size);
    context.stroke();
  }

  context.strokeStyle = "rgba(255, 255, 255, 0.08)";
  context.lineWidth = 1.5;

  for (let y = 40; y < size; y += 56) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(size, y);
    context.stroke();
  }

  const texture = new CanvasTexture(canvas);

  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(6, 3);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

function createCeilingTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  const size = 256;

  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create room ceiling texture.");
  }

  context.fillStyle = "#c8c8c8";
  context.fillRect(0, 0, size, size);

  context.strokeStyle = "rgba(120, 120, 120, 0.24)";
  context.lineWidth = 2;

  for (let x = 0; x <= size; x += 32) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, size);
    context.stroke();
  }

  for (let y = 0; y <= size; y += 32) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(size, y);
    context.stroke();
  }

  context.fillStyle = "rgba(255, 255, 255, 0.08)";

  for (let y = 8; y < size; y += 32) {
    context.fillRect(0, y, size, 2);
  }

  const texture = new CanvasTexture(canvas);

  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(5, 5);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

function createFloorTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  const size = 256;

  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to create room floor texture.");
  }

  context.fillStyle = "#a7a7a7";
  context.fillRect(0, 0, size, size);

  context.strokeStyle = "rgba(90, 90, 90, 0.22)";
  context.lineWidth = 3;

  for (let x = 0; x <= size; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, size);
    context.stroke();
  }

  for (let y = 0; y <= size; y += 40) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(size, y);
    context.stroke();
  }

  for (let index = 0; index < 900; index += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = 120 + Math.floor(Math.random() * 35);
    const alpha = 0.08 + Math.random() * 0.08;

    context.fillStyle = `rgba(${shade}, ${shade}, ${shade - 4}, ${alpha})`;
    context.fillRect(x, y, 2, 2);
  }

  const texture = new CanvasTexture(canvas);

  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}

function createWallMount(roomBounds: RoomBounds): RoomWallMount {
  return {
    axis: "z",
    side: "min",
    wallValue: roomBounds.min.z,
    roomBounds,
    doorWall: {
      axis: "x",
      side: "min",
      wallValue: roomBounds.min.x,
    },
  };
}
