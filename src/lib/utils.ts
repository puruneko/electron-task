export const floor = Math.floor;
export const ceil = Math.ceil;

export const ceilfloor = (x: number, top = 1, bottom = 0, th = 0.5): number => {
    return x >= th ? top : bottom;
};

export const topbottom = (target: number, top: number, bottom: number): number => {
    let top_ = top;
    let bottom_ = bottom;
    if (top < bottom) {
        bottom_ = top;
        top_ = bottom;
    }
    return Math.min(Math.max(target, bottom_), top_);
};
