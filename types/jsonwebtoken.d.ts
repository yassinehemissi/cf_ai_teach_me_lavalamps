declare module "jsonwebtoken" {
  export type Algorithm = "HS256";

  export type SignOptions = {
    algorithm?: Algorithm;
  };

  export type VerifyOptions = {
    algorithms?: Algorithm[];
  };

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string,
    options?: SignOptions,
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string,
    options?: VerifyOptions,
  ): string | object;
}
