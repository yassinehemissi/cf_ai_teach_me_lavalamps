import {
  CanvasTexture,
  DoubleSide,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";

type RoomTextureSet = {
  wallTexture: CanvasTexture;
  ceilingTexture: CanvasTexture;
  floorTexture: CanvasTexture;
};

type RoomMaterialSet = {
  wallMaterial: MeshStandardMaterial;
  floorMaterial: MeshStandardMaterial;
  ceilingMaterial: MeshStandardMaterial;
};

let sharedRoomTextures: RoomTextureSet | null = null;
let sharedRoomMaterials: RoomMaterialSet | null = null;

export function getSharedRoomMaterials() {
  if (!sharedRoomMaterials) {
    const { wallTexture, ceilingTexture, floorTexture } = getSharedRoomTextures();

    sharedRoomMaterials = {
      wallMaterial: new MeshStandardMaterial({
        color: "#B9B9B9",
        map: wallTexture,
        roughness: 0.98,
        metalness: 0.02,
        side: DoubleSide,
      }),
      floorMaterial: new MeshStandardMaterial({
        color: "#B9B9B9",
        map: floorTexture,
        roughness: 1,
        metalness: 0.01,
        side: DoubleSide,
      }),
      ceilingMaterial: new MeshStandardMaterial({
        color: "#B9B9B9",
        map: ceilingTexture,
        roughness: 0.98,
        metalness: 0.01,
        side: DoubleSide,
      }),
    };
  }

  return sharedRoomMaterials;
}

function getSharedRoomTextures() {
  if (!sharedRoomTextures) {
    sharedRoomTextures = {
      wallTexture: createWallTexture(),
      ceilingTexture: createCeilingTexture(),
      floorTexture: createFloorTexture(),
    };
  }

  return sharedRoomTextures;
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

  return finalizeTexture(canvas, 6, 3);
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

  return finalizeTexture(canvas, 5, 5);
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

  return finalizeTexture(canvas, 6, 6);
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
) {
  const texture = new CanvasTexture(canvas);

  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  return texture;
}
