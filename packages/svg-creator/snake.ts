import { getSnakeLength, snakeToCells } from "@snk/types/snake";
import type { Snake } from "@snk/types/snake";
import type { Color } from "@snk/types/grid";
import type { Point } from "@snk/types/point";

export type Options = {
  colorDots: Record<Color, string>;
  colorEmpty: string;
  colorBorder: string;
  colorSnake: string;
  sizeCell: number;
  sizeDot: number;
  sizeBorderRadius: number;
};

const percent = (x: number) => (x * 100).toFixed(5);

const lerp = (k: number, a: number, b: number) => (1 - k) * a + k * b;

export const createSnake = (
  chain: Snake[],
  { sizeCell, sizeDot }: Options,
  duration: number
) => {
  const snakeN = chain[0] ? getSnakeLength(chain[0]) : 0;

  const snakeParts: Point[][] = Array.from({ length: snakeN }, () => []);

  for (const snake of chain) {
    const cells = snakeToCells(snake);
    for (let i = cells.length; i--;) snakeParts[i].push(cells[i]);
  }

  const svgElements = snakeParts.map((_, i, { length }) => {
    // compute snake part size
    const dMin = sizeDot * 0.8;
    const dMax = sizeCell * 0.9;
    const iMax = Math.min(4, length);
    const u = (1 - Math.min(i, iMax) / iMax) ** 2;
    const s = lerp(u, dMin, dMax);

    const m = (sizeCell - s) / 2;

    return `
     <image 
      class="s s0"
      x="${m.toFixed(1)}"
      y="${m.toFixed(1)}"
      width="${s.toFixed(1)}"
      height="${s.toFixed(1)}"
      href="https://i.imgur.com/PxsPxvN.png"
    />
    `;
  });

  var rotate = 0;

  const transform = ({ x: oldX, y: oldY }: Point, x: number, y: number) => {
    return `transform-box: fill-box;
            transform-origin: center;
            transform :translate(${(oldX * sizeCell)}px,${(oldY * sizeCell)}px) rotate(${rotate}deg);`;
  }

  const transformR = ({ x: oldX, y: oldY }: Point, x: number, y: number) => {

    if (oldX > x && oldY === y) {
      rotate = -180;
    } else if (oldX < x && oldY === y) {
      rotate = 0;
    } else if (oldX === x && oldY > y) {
      rotate = -90;
    } else if (oldX === x && oldY < y) {
      rotate = -270;
    }

    return `transform-box: fill-box;
            transform-origin: center;
            transform:translate(${(oldX * sizeCell)}px,${(oldY * sizeCell)}px) rotate(${rotate}deg);`;
  }

  const styles = [
    `.s{ 
      shape-rendering:geometricPrecision;
      fill:var(--cs);
      animation: none linear ${duration}ms infinite;
    }`,
    ...snakeParts.map((positions, i) => {
      console.log(positions);
      const id = `s${i}`;
      const animationName = id;

      interface PKeys {
        x: number,
        y: number,
        i: number,
        t: number
      }
      let p2 = removeInterpolatedPositions(
        positions.map((tr, i, { length }) =>
          ({ ...tr, t: i / length, i }))
      ).map((p) => <PKeys>{
        x: p.x,
        y: p.y,
        i: p.i,
        t: p.t
      });

      return [
        `@keyframes ${animationName} { ` +
        removeInterpolatedPositions(
          positions.map((tr, i, { length }) =>
            ({ ...tr, t: i / length, i }))
        )
          .map((p, i) => {
            var pi = i + 1;

            if (pi === (p2.length)) {
              pi = 0;

            }

            var valuePer = (p.t) - (p.t * 0.001);

            if (i === 0) {
              if (p.x > p2[pi].x && p.y === p2[pi].y) {
                rotate = -180;
              } else if (p.x === p2[pi].x && p.y > p2[pi].y) {
                rotate = -90;
              } else if (p.x === p2[pi].x && p.y < p2[pi].y) {
                rotate = -270;
              }

              return `${percent(p.t)}%{${transform(p, p2[pi].x, p2[pi].y)}}`;
            } else {

              return `${percent(valuePer)}%{${transform(p, p2[pi].x, p2[pi].y)}}
                      ${percent(p.t)}%{${transformR(p, p2[pi].x, p2[pi].y)}}`;
            }
          })
          .join("") +
        "}",

        `.s.${id}{${transform(positions[0], positions[0].x, positions[0].y)};animation-name: ${animationName}}`,
      ];
    }),
  ].flat();
  return { svgElements, styles };
};

const removeInterpolatedPositions = <T extends Point>(arr: T[]) =>
  arr.filter((u, i, arr) => {
    if (i - 1 < 0 || i + 1 >= arr.length) return true;

    const a = arr[i - 1];
    const b = arr[i + 1];

    const ex = (a.x + b.x) / 2;
    const ey = (a.y + b.y) / 2;

    // return true;
    return !(Math.abs(ex - u.x) < 0.01 && Math.abs(ey - u.y) < 0.01);
  });
