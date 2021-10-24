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

export const createSnake = (
  chain: Snake[],
  { sizeCell }: Options,
  duration: number
) => {
  const snakeN = chain[0] ? getSnakeLength(chain[0]) : 0;

  const snakeParts: Point[][] = Array.from({ length: snakeN }, () => []);

  for (const snake of chain) {
    const cells = snakeToCells(snake);
    for (let i = cells.length; i--; ) snakeParts[i].push(cells[i]);
  }

  const svgElements = snakeParts.map((_) => {
    // compute snake part size
    return `
    <path 
      class="s s0" 
      d="M13.9449 9.71909C13.3621 11.2796 12.2563 12.5897 10.8158 13.4262C9.37534 14.2628 7.68938 14.574 6.04518 14.3068C4.40099 14.0396 2.9003 13.2106 1.79882 11.961C0.697333 10.7114 0.0632031 9.11856 0.00447601 7.45384C-0.0542511 5.78912 0.466059 4.15553 1.47675 2.83143C2.48744 1.50732 3.92598 0.574628 5.54726 0.192258C7.16854 -0.190112 8.87224 0.00150298 10.3681 0.734455C11.8639 1.46741 13.0593 2.69634 13.7507 4.21187L7.2 7.2L13.9449 9.71909Z" fill="#FFE737" stroke="#0C0B0B" stroke-width="2" fill-opacity="1"
    />
    `;
  });

  var rotate = 0;

  const transform = ({ x: oldX, y: oldY }: Point) => {
    return `transform-box: fill-box;
            transform-origin: center;
            transform :translate(${oldX * sizeCell}px,${
      oldY * sizeCell
    }px) rotate(${rotate}deg);`;
  };

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
            transform:translate(${oldX * sizeCell}px,${
      oldY * sizeCell
    }px) rotate(${rotate}deg);`;
  };

  const styles = [
    `.s{ 
      shape-rendering:geometricPrecision;
      animation: none linear ${duration}ms infinite;
    }`,
    ...snakeParts.map((positions, i) => {
      console.log(positions);
      const id = `s${i}`;
      const animationName = id;

      interface PKeys {
        x: number;
        y: number;
        i: number;
        t: number;
      }
      let p2 = removeInterpolatedPositions(
        positions.map((tr, i, { length }) => ({ ...tr, t: i / length, i }))
      ).map(
        (p) =>
          <PKeys>{
            x: p.x,
            y: p.y,
            i: p.i,
            t: p.t,
          }
      );

      return [
        `@keyframes ${animationName} { ` +
          removeInterpolatedPositions(
            positions.map((tr, i, { length }) => ({ ...tr, t: i / length, i }))
          )
            .map((p, i) => {
              var pi = i + 1;

              if (pi === p2.length) {
                pi = 0;
              }

              var valuePer = p.t - p.t * 0.001;

              if (i === 0) {
                if (p.x > p2[pi].x && p.y === p2[pi].y) {
                  rotate = -180;
                } else if (p.x === p2[pi].x && p.y > p2[pi].y) {
                  rotate = -90;
                } else if (p.x === p2[pi].x && p.y < p2[pi].y) {
                  rotate = -270;
                }

                return `${percent(p.t)}%{${transform(p)}}`;
              } else {
                return `${percent(valuePer)}%{${transform(p)}}
                      ${percent(p.t)}%{${transformR(p, p2[pi].x, p2[pi].y)}}`;
              }
            })
            .join("") +
          "}",

        `.s.${id}{${transform(positions[0])};animation-name: ${animationName}}`,
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
