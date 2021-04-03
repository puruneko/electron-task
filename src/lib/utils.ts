export interface IPos {
    x: number;
    y: number;
}

export interface IRect {
    nw: IPos;
    ne: IPos;
    se: IPos;
    sw: IPos;
}

export const ceilfloor = (x: number, top = 1, bottom = 0, th = 0.5): number => {
    return x >= th ? top : bottom;
};

export const overlappingArea = (r1: IRect, r2: IRect): number => {
    const obj = [r1, r2];
    const direction = [
        ['nw', 'ne'],
        ['ne', 'se'],
        ['sw', 'se'],
        ['nw', 'sw'],
    ];
    const minmax = [Math.max, Math.min, Math.min, Math.max];
    const calcMap = [
        // 横obj,縦obj,横辺番号,縦辺番号,横内側番号,縦内側番号,横比較番号,縦比較番号
        [0, 1, 0, 1, 0, 1, 3, 2], // r1:上辺、r2:右辺
        [0, 1, 0, 3, 1, 1, 1, 2], // r1:上辺、r2:左辺
        [1, 0, 0, 1, 0, 1, 3, 2], // r1:右辺、r2:上辺
        [1, 0, 2, 1, 0, 0, 3, 0], // r1:右辺、r2:下辺
        [0, 1, 2, 1, 0, 0, 3, 0], // r1:下辺、r2:右辺
        [0, 1, 2, 3, 1, 0, 1, 0], // r1:下辺、r2:左辺
        [1, 0, 0, 3, 1, 1, 1, 2], // r1:左辺、r2:上辺
        [1, 0, 2, 3, 1, 0, 1, 0], // r1:左辺、r2:下辺
    ];
    // 重なっているか調査
    const area = [];
    for (const c of calcMap) {
        if (
            obj[c[0]][direction[c[2]][0]].x < obj[c[1]][direction[c[3]][0]].x &&
            obj[c[1]][direction[c[3]][1]].x < obj[c[0]][direction[c[2]][1]].x &&
            obj[c[1]][direction[c[3]][0]].y < obj[c[0]][direction[c[2]][0]].y &&
            obj[c[0]][direction[c[2]][1]].y < obj[c[1]][direction[c[3]][1]].y
        ) {
            const h = obj[c[0]][direction[c[2]][c[4]]];
            const h2 = obj[c[0]][direction[c[6]][0]];
            const v = obj[c[1]][direction[c[3]][c[5]]];
            const v2 = obj[c[0]][direction[c[7]][0]];
            area.push(
                Math.abs(minmax[c[6]](h.x, h2.x) - minmax[c[7]](v.x, v2.x)) *
                    Math.abs(minmax[c[6]](h.y, h2.y) - minmax[c[7]](v.y, v2.y)),
            );
        } else {
            area.push(0);
        }
    }
    // 重なっていなかったら0を返す
    if (area.filter(a => a > 0).length == 0) {
        return 0;
    }
    // 重なってたら最大値を返す
    return Math.max(...area);
};
