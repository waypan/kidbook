import type { Point } from './calibrationTypes';

export function computeHomography(src: Point[], dst: Point[]): number[] {
  if (src.length !== 4 || dst.length !== 4) {
    throw new Error('computeHomography requires exactly 4 source and 4 destination points');
  }

  const matrix: number[][] = Array.from({ length: 8 }, () => new Array(9).fill(0));

  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];

    matrix[2 * i][0] = x;
    matrix[2 * i][1] = y;
    matrix[2 * i][2] = 1;
    matrix[2 * i][3] = 0;
    matrix[2 * i][4] = 0;
    matrix[2 * i][5] = 0;
    matrix[2 * i][6] = -u * x;
    matrix[2 * i][7] = -u * y;
    matrix[2 * i][8] = u;

    matrix[2 * i + 1][0] = 0;
    matrix[2 * i + 1][1] = 0;
    matrix[2 * i + 1][2] = 0;
    matrix[2 * i + 1][3] = x;
    matrix[2 * i + 1][4] = y;
    matrix[2 * i + 1][5] = 1;
    matrix[2 * i + 1][6] = -v * x;
    matrix[2 * i + 1][7] = -v * y;
    matrix[2 * i + 1][8] = v;
  }

  const solution = solveLinearSystem(matrix);
  return [...solution, 1];
}

export function transformPoint(point: Point, h: number[]): Point {
  const [x, y] = point;
  const denominator = h[6] * x + h[7] * y + h[8];
  const pageX = (h[0] * x + h[1] * y + h[2]) / denominator;
  const pageY = (h[3] * x + h[4] * y + h[5]) / denominator;
  return [pageX, pageY];
}

export function clientPointToVideoPoint(
  clientX: number,
  clientY: number,
  video: HTMLVideoElement,
  mirrored = true
): Point {
  const rect = video.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * video.videoWidth;
  const y = ((clientY - rect.top) / rect.height) * video.videoHeight;
  return mirrored ? [video.videoWidth - x, y] : [x, y];
}

function solveLinearSystem(matrix: number[][]): number[] {
  const n = 8;

  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(matrix[j][i]) > Math.abs(matrix[pivot][i])) {
        pivot = j;
      }
    }

    if (Math.abs(matrix[pivot][i]) < 1e-12) {
      throw new Error('Cannot solve homography matrix: singular system');
    }

    if (pivot !== i) {
      const temp = matrix[i];
      matrix[i] = matrix[pivot];
      matrix[pivot] = temp;
    }

    const divisor = matrix[i][i];
    for (let k = i; k < n + 1; k++) {
      matrix[i][k] /= divisor;
    }

    for (let j = i + 1; j < n; j++) {
      const factor = matrix[j][i];
      for (let k = i; k < n + 1; k++) {
        matrix[j][k] -= factor * matrix[i][k];
      }
    }
  }

  const solution = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let value = matrix[i][n];
    for (let j = i + 1; j < n; j++) {
      value -= matrix[i][j] * solution[j];
    }
    solution[i] = value / matrix[i][i];
  }

  return solution;
}
