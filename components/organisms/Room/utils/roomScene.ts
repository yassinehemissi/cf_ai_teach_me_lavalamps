import { Group, Mesh, MeshStandardMaterial, PlaneGeometry } from "three";

import type { RoomBounds } from "../Room.types";

import { getDoorLayout } from "./roomLayout";
import { getSharedRoomMaterials } from "./roomTextures";

export function createRoomScene(roomBounds: RoomBounds): Group {
  const room = new Group();
  const { wallMaterial, floorMaterial, ceilingMaterial } = getSharedRoomMaterials();
  const { doorMinZ, doorMaxZ, doorTopY, doorWidth } = getDoorLayout(roomBounds);

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
      size: [doorWidth, roomBounds.max.y - doorTopY],
      position: [
        roomBounds.min.x,
        (doorTopY + roomBounds.max.y) * 0.5,
        0,
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
