export type CameraCommandName =
  | "focusLamp"
  | "orbitCamera"
  | "resetCamera";

export type CameraCommand = {
  name: CameraCommandName;
  payload?: Record<string, boolean | number | string>;
};

export interface SceneControllerContract {
  executeCameraCommand(command: CameraCommand): void;
}
