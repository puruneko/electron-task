export const ceilfloor = (x: number, top = 1, bottom = 0, th = 0.5): number => {
    return x >= th ? top : bottom;
};
