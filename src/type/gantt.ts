import { ID, Index } from '../type/index';

export type Second = number;
export type Period = {
    start: Date;
    end: Date;
};
export type Pos = {
    x: number;
    y: number;
};
export type Size = {
    width: number;
    height: number;
};
export type Rect = {
    top: number;
    left: number;
};
export type Cell = {
    x: number;
    y: number;
};
//
export type CalenderPeriod = 'year' | 'half' | 'month' | 'date' | 'day';
export type TargetType = 'cell' | 'wrap' | 'whole' | 'left' | 'right';
export interface ICalenderElement {
    pos: Pos;
    size: Size;
    cell: Cell;
    dataset: { [key: string]: string | number };
    ref: HTMLElement;
}
export interface ITimebarDragInitial {
    id: number;
    targetType: TargetType;
    all: ICalenderElement;
    min: ICalenderElement;
    pointed: ICalenderElement;
    pointedMousePos: Pos;
    protectedCellCount: number;
}
