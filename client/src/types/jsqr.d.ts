// jsqr.d.ts
// Place this file in: client/src/types/jsqr.d.ts

declare module 'jsqr' {
  export interface QRCode {
    binaryData: number[];
    data: string;
    chunks: Array<{
      type: string;
      bytes: number[];
    }>;
    version: number;
    location: {
      topRightCorner: Point;
      topLeftCorner: Point;
      bottomRightCorner: Point;
      bottomLeftCorner: Point;
      topRightFinderPattern: Point;
      topLeftFinderPattern: Point;
      bottomLeftFinderPattern: Point;
      bottomRightAlignmentPattern?: Point;
    };
  }

  export interface Point {
    x: number;
    y: number;
  }

  export interface Options {
    inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst';
  }

  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: Options
  ): QRCode | null;
}