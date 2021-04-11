import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { TargetType } from '../type/gantt';
import { floor, ceil, ceilfloor, topbottom, useQuery } from '../lib/utils';
import { getTimedelta, getYYYYMMDD, getHHMMSS, getMMDD, getHH, getTime } from '../lib/time';
import { IPage } from '../type/root';
import { IRootState } from '../type/store';
import {
    Second,
    Period,
    Pos,
    CalenderPeriod,
    ITimebarDragInitial,
    ICalenderElement,
} from '../type/gantt';

const Gantt: React.FC = () => {
    const params = useParams<any>();
    const queries = useQuery();
    console.log('window.location', window.location, 'params', params, 'queries', queries);
    const dispatch = useDispatch();
    const { project, tasks } = useSelector(
        (props: IRootState) => ({
            project: props.projects[params.projectName],
            tasks: props.projects[params.projectName].tasks,
        }),
        shallowEqual,
    );
    console.log('project data', project);
    const setTasks = newTasks => {
        dispatch({
            type: 'setTasks',
            projectName: project.name,
            tasks: newTasks,
        });
    };
    const ganttScale = project.settings.ganttScale;
    const cellXUnit = (scale => {
        switch (scale) {
            case 'date':
                return 60 * 60 * 24 * 1000; // [ms]
        }
    })(ganttScale);
    const cellDivideNumber = project.settings.ganttCellDivideNumber;
    const calenderRange: Period = {
        start: new Date(Date.now() - cellXUnit * 1), // 今の1cell前から
        end: new Date(Date.now() + cellXUnit * 30), // 30cell後まで
    };
    const calenderRangeDiff = getTimedelta(calenderRange.start, calenderRange.end).date;
    console.log('calender params', ganttScale, cellDivideNumber, calenderRange, calenderRangeDiff);
    const c = {
        color: {
            multiSelected: 'rgba(0, 181, 51, 0.5)',
            dragArea: 'rgba(0, 12, 181, 0.5)',
        },
        header: {
            height: 50,
        },
        ganttHeader: {
            height: 50,
        },
        task: {
            container: {
                width: 300,
            },
        },
        calenderBody: {
            zIndex: 0,
        },
        cell: {
            width: 40,
            height: 30,
            zIndex: 1,
        },
        timebar: {
            marginXCoef: 0.05,
            yShrinkCoef: 0.8,
            sideWidthCoef: 0.2,
            zIndex: 2,
        },
    };
    const Main = styled.div`
        position: absolute;
        top: 0;
        left: 0;
    `;
    const SelectedArea = styled.div`
        display: 'none';
        position: 'fixed';
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        z-index: 100;
    `;
    const GanttTaskContainer = styled.div`
        position: absolute;
        top: 0;
        left: 0;
        width: ${c.task.container.width};
        background-color: red;
    `;
    const GanttTaskHeader = styled.div`
        width: 100%;
        height: ${c.ganttHeader.height};
        background-color: blue;
    `;
    const GanttTaskList = styled.div``;
    const GanttTaskRow = styled.div`
        display: flex;
        width: 100%;
        height: ${c.cell.height};
    `;
    const GanttTaskTitle = styled.div``;
    const GanttTaskProperty = styled.div``;
    const GanttCalenderContainer = styled.div`
        width: 100vw;
        margin-left: ${c.task.container.width};
        overflow-y: scroll;
    `;
    const GanttCalenderHeader = styled.div`
        background-color: blue;
        width: ${calenderRangeDiff * c.cell.width * cellDivideNumber + c.task.container.width};
        height: ${c.ganttHeader.height};
    `;
    const GanttCalenderHeaderParentContainer = styled.div`
        height: ${c.ganttHeader.height / 2};
        display: flex;
        overflow: visible;
    `;
    const GanttCalenderHeaderParent = styled.div`
        height: ${c.ganttHeader.height / 2};
        position: sticky;
    `;
    const GanttCalenderHeaderChildContainer = styled.div`
        width: 100%;
        height: ${c.ganttHeader.height / 2};
        display: flex;
    `;
    const GanttCalenderHeaderChild = styled.div`
        width: ${c.cell.width * cellDivideNumber};
        height: ${c.ganttHeader.height / 2};
    `;
    const GanttCalenderBodyWrapper = styled.div`
        position: relative;
        width: 100%;
        background-color: pink; //lightgray
    `;
    const GanttCalenderBody = styled.div`
        position: relative;
        width: 100%;
    `;
    const GanttCalenderRow = styled.div`
        position: relative;
        display: flex;
        width: 100%;
    `;
    const GanttCalenderCell = styled.div`
        position: relative;
        width: ${c.cell.width};
        height: ${c.cell.height};
        flex: 0 0 ${c.cell.width};
        flex-shrink: 0;
        display: flex;
        justify-content: start;
        align-items: center;
        float: 'left';
        user-select: none;
    `;
    const GanttCalenderTimebarWrap = styled.div`
        position: absolute;
        left: ${c.cell.width * c.timebar.marginXCoef};
        height: ${c.cell.height * c.timebar.yShrinkCoef};
        border-radius: 7px;
        background-color: gray;
        z-index: 1;
        user-select: none;
    `;
    const GanttCalenderTimebar = styled.div`
        position: absolute;
        top: 0;
        left: 0;
        height: ${c.cell.height * c.timebar.yShrinkCoef};
        border-radius: 7px;
        background-color: transparent;
        overflow: hidden;
        display: flex;
        justify-content: space-between;
    `;
    const GanttCalenderTimebarSide = styled.div`
        height: 100%;
        width: ${c.cell.width * c.timebar.sideWidthCoef};
        border-radius: 7px;
        background-color: transparent;
        cursor: col-resize;
    `;
    // --------------------------------------------------------
    const createParentGanttLabel = () => {
        const start = calenderRange.start;
        const parents = [...Array(calenderRangeDiff).keys()].map(i => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d.getMonth() + 1;
        });
        return [...new Set(parents)].map(i => {
            return {
                parent: i,
                number: parents.filter(x => x == i).length,
            };
        });
    };
    // --------------------------------------------------------
    const [selectedTask, setSelectedTask] = useState(null);
    // --------------------------------------------------------
    const calenderBodyParam = useRef<ICalenderElement>(null);
    const timebarDragInitial = useRef<ITimebarDragInitial>(null);
    const lastScroll = useRef<Pos>({ x: 0, y: 0 });
    const mousedownStart = useRef<Pos>({ x: -1, y: -1 });
    const selectedCElem = useRef<Array<ICalenderElement>>([]);
    const keydown = useRef(null);
    // --------------------------------------------------------
    const getElementsByClassName = (
        className: string | Element | HTMLElement,
    ): Array<HTMLElement> => {
        let cn;
        if (className instanceof String) {
            cn = className as string;
        } else {
            cn = (className as Element).className as string;
        }
        const elements = [...document.getElementsByClassName(cn)].map(elem => {
            return elem as HTMLElement;
        });
        return elements;
    };
    const getElementByPosition = (
        x: number | string,
        y: number | string,
        targetType = 'wrap',
    ): HTMLElement => {
        const elems = document.querySelectorAll(`[data-target='${targetType}']`);
        if (!elems || !elems.length) {
            return null;
        }
        const elem = [...elems].filter(
            (e: HTMLElement) =>
                parseInt(e.dataset.y) == parseInt(`${y}`) &&
                parseInt(e.dataset.x) == parseInt(`${x}`),
        )[0];
        if (!elem) {
            return null;
        }
        return elem as HTMLElement;
    };
    const getTimeberWidth = (start: Date | number, end: Date | number): number => {
        let block: number;
        const start_ = new Date(start);
        const end_ = new Date(end);
        switch (ganttScale) {
            case 'date':
                const days = end_.getDate() - start_.getDate();
                const startDivideNumber = floor(start_.getHours() / (24 / cellDivideNumber));
                const endDivideNumber = floor(end_.getHours() / (24 / cellDivideNumber));
                block = days * cellDivideNumber + 1 + endDivideNumber - startDivideNumber;
                break;
        }
        return c.cell.width * block;
    };
    const width2cellNum = (width: number): number => {
        return floor(width / c.cell.width);
    };
    const height2cellNum = (height: number): number => {
        return floor(height / c.cell.height);
    };
    const getCalemderElementSnapshot = (elem: HTMLElement): ICalenderElement => {
        // スクロールが0の状態のときのパラメータ
        const scroll = getScroll();
        const rect = elem.getBoundingClientRect();
        const pos = { x: rect.left + scroll.x, y: rect.top + scroll.y };
        const size = { width: elem.offsetWidth, height: elem.offsetHeight };
        const cell =
            calenderBodyParam.current !== null
                ? {
                      x: width2cellNum(pos.x - calenderBodyParam.current.pos.x),
                      y: height2cellNum(rect.top - calenderBodyParam.current.pos.y),
                  }
                : { x: -1, y: -1 };
        return {
            pos,
            size,
            cell,
            dataset: elem.dataset,
            ref: elem as HTMLElement,
        };
    };
    const isDragging = () => {
        return timebarDragInitial.current !== null;
    };
    const getScroll = (): Pos => {
        const calenderContainer = document.getElementById('ganttCalenderContainer');
        return {
            x: calenderContainer.scrollLeft,
            y: calenderContainer.scrollTop,
        };
    };
    const onTimebarDragStart = event => {
        const target: HTMLElement = event.target as HTMLElement;
        // timberをクリックしたか判定
        if (target.className.match('ganttCalenderTimebarGroup')) {
            console.log('DRAGSTART', 'scrollLeft', target.scrollLeft);
            event.dataTransfer.setDragImage(new Image(), 0, 0);
            // 代表要素
            const pointedTimebar = target;
            if (selectedCElem.current.length == 0) {
                const wrap = getElementByPosition(
                    pointedTimebar.dataset.x,
                    pointedTimebar.dataset.y,
                );
                selectedCElem.current = [getCalemderElementSnapshot(wrap)];
            }
            // ----各パラメータを計算
            const id = parseInt(pointedTimebar.dataset.id);
            const targetType = pointedTimebar.dataset.target as TargetType;
            const scroll = getScroll();
            const pointedMousePos = {
                x: event.clientX + scroll.x,
                y: event.clientY + scroll.y,
            };
            const pointed = getCalemderElementSnapshot(pointedTimebar);
            // 最大最小を計算
            const allPos = {
                x: Math.min(
                    ...selectedCElem.current.map(timebar => {
                        return timebar.pos.x;
                    }),
                ),
                y: Math.min(
                    ...selectedCElem.current.map(timebar => {
                        return timebar.pos.y;
                    }),
                ),
            };
            const allSize = {
                width:
                    Math.max(
                        ...selectedCElem.current.map(timebar => {
                            return timebar.pos.x + timebar.size.width;
                        }),
                    ) - allPos.x,
                height:
                    Math.max(
                        ...selectedCElem.current.map(timebar => {
                            return timebar.pos.y + timebar.size.height;
                        }),
                    ) - allPos.y,
            };
            const allCell = {
                x: width2cellNum(allPos.x - calenderBodyParam.current.pos.x),
                y: height2cellNum(allPos.y - calenderBodyParam.current.pos.y),
            };
            // width最小
            const min = selectedCElem.current.sort((a, b) => {
                return a.size.width - b.size.width;
            })[0];
            // allのデータまとめ
            const all = {
                pos: allPos,
                size: allSize,
                cell: allCell,
                dataset: null,
                ref: null,
            };
            // protectedCellCountの計算
            const tasksProtectedCellCount = selectedCElem.current.map(timebar => {
                const task = tasks.filter(t => t.id == timebar.dataset.id)[0];
                const diff =
                    (getTime(new Date(task.period.end)) - getTime(new Date(task.period.start))) /
                    cellXUnit;
                return diff - Math.trunc(diff) < 1.0 / cellDivideNumber ? 1 : 0;
            });
            const protectedCellCount = tasksProtectedCellCount.indexOf(1) != -1 ? 1 : 0;
            // パラメータセット
            timebarDragInitial.current = {
                id,
                targetType,
                all,
                min,
                pointed,
                pointedMousePos,
                protectedCellCount,
            };
            console.log(
                'DRAGSTART',
                target.className,
                'timebarDragInitial',
                timebarDragInitial.current,
                'selectedCElem',
                selectedCElem.current,
            );
            // セル反転
            if (targetType == 'whole') {
                for (const timebar of selectedCElem.current) {
                    const wrapElem = getElementByPosition(timebar.dataset.x, timebar.dataset.y);
                    const cellWidth = width2cellNum(timebar.size.width + 1);
                    const wrapCElem = getCalemderElementSnapshot(wrapElem);
                    for (const index of [...Array(cellWidth).keys()]) {
                        const cell = getElementByPosition(
                            wrapCElem.cell.x + index,
                            wrapCElem.cell.y,
                            'cell',
                        );
                        cell.style.backgroundColor = 'rgba(179, 179, 179, 0.5)';
                    }
                }
                console.log('DRAG whole');
            } else if (targetType == 'left') {
                for (const timebar of selectedCElem.current) {
                    const wrapElem = getElementByPosition(timebar.dataset.x, timebar.dataset.y);
                    const wrapCElem = getCalemderElementSnapshot(wrapElem);
                    // スタイル適用
                    const updatedCell = getElementByPosition(
                        wrapCElem.cell.x,
                        wrapCElem.cell.y,
                        'cell',
                    );
                    updatedCell.style.backgroundColor = 'rgba(179, 179, 179, 0.5)';
                }
            } else if (targetType == 'right') {
                for (const timebar of selectedCElem.current) {
                    const wrapElem = getElementByPosition(timebar.dataset.x, timebar.dataset.y);
                    const wrapCElem = getCalemderElementSnapshot(wrapElem);
                    // スタイル適用
                    const updatedCell = getElementByPosition(
                        wrapCElem.cell.x + width2cellNum(wrapCElem.size.width),
                        wrapCElem.cell.y,
                        'cell',
                    );
                    updatedCell.style.backgroundColor = 'rgba(179, 179, 179, 0.5)';
                }
            }
        }
    };
    const onTimebarDrag = event => {
        if (isDragging()) {
            const timebar = event.target;
            const scroll = getScroll();
            const tdi = timebarDragInitial.current;
            const cbp = calenderBodyParam.current;
            // timebarを半透明に
            const timebars = getElementsByClassName('ganttCalenderTimebarGroup');
            for (const tb of timebars) {
                if (
                    parseInt(tb.dataset.id) == timebar.dataset.id ||
                    selectedCElem.current
                        .map(timebar => {
                            return timebar.dataset.id;
                        })
                        .indexOf(parseInt(tb.dataset.id)) != -1
                ) {
                    continue;
                }
                tb.style.opacity = '0.5';
            }
            // ----移動
            const x = event.clientX + scroll.x;
            const y = event.clientY + scroll.y;
            if (x == 0 && y == 0) {
                // ジャンプ回避
                return;
            }
            const dx = x - tdi.pointedMousePos.x;
            const dy = y - tdi.pointedMousePos.y;
            console.log('DRAG', '(dx,dy)', { dx, dy });
            // 移動計算
            const targetType = timebar.dataset.target;
            if (targetType == 'whole') {
                // 左上座標チェック
                const updateX =
                    tdi.all.pos.x + dx - c.cell.width * 0.01 > cbp.pos.x &&
                    tdi.all.pos.x + tdi.all.size.width + dx + c.cell.width * 0.01 <
                        cbp.pos.x + cbp.size.width;
                const updateY =
                    tdi.all.pos.y + dy - c.cell.height * 0.1 > cbp.pos.y &&
                    tdi.all.pos.y + tdi.all.size.height + dy + c.cell.height * 0.01 <
                        cbp.pos.y + cbp.size.height;
                for (const timebar of selectedCElem.current) {
                    const wrapElem = getElementByPosition(timebar.dataset.x, timebar.dataset.y);
                    const wrapCElem = getCalemderElementSnapshot(wrapElem);
                    const cellWidth = width2cellNum(timebar.size.width + 1);
                    if (updateX) {
                        // 移動
                        const left = dx;
                        wrapElem.style.left = `${left}px`;
                    }
                    if (updateY) {
                        // 移動
                        const top = dy;
                        wrapElem.style.top = `${top}px`;
                    }
                    // セル反転
                    const updatedWrapCElem = getCalemderElementSnapshot(wrapElem);
                    if (
                        wrapCElem.cell.x != updatedWrapCElem.cell.x ||
                        wrapCElem.cell.y != updatedWrapCElem.cell.y
                    ) {
                        // 消す
                        for (const index of [...Array(cellWidth).keys()]) {
                            const cell = getElementByPosition(
                                wrapCElem.cell.x + index,
                                wrapCElem.cell.y,
                                'cell',
                            );
                            cell.style.backgroundColor = '';
                        }
                        // 反転
                        for (const index of [...Array(cellWidth).keys()]) {
                            const cell = getElementByPosition(
                                updatedWrapCElem.cell.x + index,
                                updatedWrapCElem.cell.y,
                                'cell',
                            );
                            cell.style.backgroundColor = 'rgba(179, 179, 179, 0.5)';
                        }
                    }
                    console.log('wrap move', wrapElem.style.left, wrapElem.style.top);
                }
                console.log('DRAG whole');
            } else if (targetType == 'left') {
                const updateX =
                    tdi.min.size.width - dx > c.cell.width * (0.9 + tdi.protectedCellCount) &&
                    tdi.all.pos.x + dx > cbp.pos.x;
                console.log('updateX', updateX);
                for (const timebar of selectedCElem.current) {
                    const wrapElem = getElementByPosition(timebar.dataset.x, timebar.dataset.y);
                    const wrapCElem = getCalemderElementSnapshot(wrapElem);
                    // 移動
                    if (updateX) {
                        const width = timebar.size.width - dx;
                        const left = dx - (tdi.pointed.pos.x - tdi.pointedMousePos.x);
                        wrapElem.style.left = `${left}px`;
                        wrapElem.style.width = `${width}px`;
                    }
                    // スタイル適用
                    const updatedWrapCElem = getCalemderElementSnapshot(wrapElem);
                    if (
                        wrapCElem.cell.x != updatedWrapCElem.cell.x ||
                        wrapCElem.cell.y != updatedWrapCElem.cell.y
                    ) {
                        // スタイル戻し
                        const cell = getElementByPosition(
                            wrapCElem.cell.x,
                            wrapCElem.cell.y,
                            'cell',
                        );
                        cell.style.backgroundColor = '';
                        // スタイル適用
                        const updatedCell = getElementByPosition(
                            updatedWrapCElem.cell.x,
                            updatedWrapCElem.cell.y,
                            'cell',
                        );
                        updatedCell.style.backgroundColor = 'rgba(179, 179, 179, 0.5)';
                    }
                }
            } else if (targetType == 'right') {
                const updateX =
                    tdi.min.size.width + dx > c.cell.width * (0.9 + tdi.protectedCellCount) &&
                    tdi.all.pos.x + tdi.all.size.width + dx < cbp.pos.x + cbp.size.width;
                for (const timebar of selectedCElem.current) {
                    const wrapElem = getElementByPosition(timebar.dataset.x, timebar.dataset.y);
                    const wrapCElem = getCalemderElementSnapshot(wrapElem);
                    // 移動
                    if (updateX) {
                        const width = timebar.size.width + dx;
                        wrapElem.style.width = `${width}px`;
                    }
                    // スタイル適用
                    const updatedWrapCElem = getCalemderElementSnapshot(wrapElem);
                    if (
                        wrapCElem.cell.x + width2cellNum(wrapCElem.size.width) !=
                            updatedWrapCElem.cell.x + width2cellNum(updatedWrapCElem.size.width) ||
                        wrapCElem.cell.y != updatedWrapCElem.cell.y
                    ) {
                        // スタイル戻し
                        const cell = getElementByPosition(
                            wrapCElem.cell.x + width2cellNum(wrapCElem.size.width),
                            wrapCElem.cell.y,
                            'cell',
                        );
                        cell.style.backgroundColor = '';
                        // スタイル適用
                        const updatedCell = getElementByPosition(
                            updatedWrapCElem.cell.x + width2cellNum(updatedWrapCElem.size.width),
                            updatedWrapCElem.cell.y,
                            'cell',
                        );
                        updatedCell.style.backgroundColor = 'rgba(179, 179, 179, 0.5)';
                        console.log('DRAG right', wrapCElem, updatedWrapCElem);
                    }
                }
            }
        }
    };
    const onTimebarDragEnd = event => {
        const target: HTMLElement = event.target as HTMLElement;
        console.log('DRAGEND', target.className);
        if (isDragging()) {
            const tdi = timebarDragInitial.current;
            const cbp = calenderBodyParam.current;
            // 期間更新
            const scroll = getScroll();
            const x = event.clientX + scroll.x;
            const y = event.clientY + scroll.y;
            const dx = x - tdi.pointedMousePos.x;
            const dy = y - tdi.pointedMousePos.y;
            let baseCellX;
            let baseCellY;
            let corDx;
            if (tdi.targetType == 'whole') {
                corDx = topbottom(
                    tdi.all.pos.x - cbp.pos.x + dx,
                    cbp.size.width - tdi.all.size.width,
                    0,
                );
                baseCellX = tdi.all.cell.x;
                baseCellY = tdi.all.cell.y;
            } else if (tdi.targetType == 'left') {
                corDx = topbottom(
                    tdi.all.pos.x - cbp.pos.x + dx,
                    tdi.all.pos.x - cbp.pos.x + tdi.min.size.width - c.cell.width,
                    0,
                );
                baseCellX = tdi.all.cell.x;
                baseCellY = tdi.all.cell.y;
            } else if (tdi.targetType == 'right') {
                corDx = topbottom(
                    tdi.all.pos.x + tdi.all.size.width - cbp.pos.x + dx,
                    cbp.size.width - tdi.all.size.width,
                    tdi.all.pos.x - cbp.pos.x + c.cell.width * 0.9,
                );
                baseCellX = tdi.all.cell.x + floor(tdi.all.size.width / c.cell.width);
                baseCellY = tdi.all.cell.y;
            }
            const corDy = topbottom(
                tdi.all.pos.y - cbp.pos.y + dy,
                cbp.size.height - tdi.all.size.height,
                0,
            );
            const cx = width2cellNum(corDx);
            const cy = height2cellNum(corDy);
            let dcx;
            if (tdi.targetType == 'whole') {
                dcx = topbottom(
                    cx - baseCellX,
                    width2cellNum(
                        cbp.pos.x + cbp.size.width - (tdi.all.pos.x + tdi.all.size.width),
                    ),
                    -tdi.all.cell.x,
                );
            } else if (tdi.targetType == 'left') {
                dcx = topbottom(
                    cx - baseCellX,
                    width2cellNum(tdi.min.size.width) - tdi.protectedCellCount,
                    -tdi.all.cell.x,
                );
                console.log(
                    'DRAGEND left',
                    tdi.targetType,
                    'dcx default',
                    cx - baseCellX,
                    'topvalue',
                    width2cellNum(tdi.min.size.width) - tdi.protectedCellCount,
                    'bottomvalue',
                    -tdi.all.cell.x,
                );
            } else if (tdi.targetType == 'right') {
                dcx = topbottom(
                    cx - baseCellX,
                    width2cellNum(
                        cbp.pos.x + cbp.size.width - (tdi.all.pos.x + tdi.all.size.width),
                    ),
                    -width2cellNum(tdi.min.size.width) + tdi.protectedCellCount,
                );
                console.log(
                    'DRAGEND right',
                    tdi.targetType,
                    'dcx default',
                    cx - baseCellX,
                    'topvalue',
                    width2cellNum(
                        cbp.pos.x + cbp.size.width - (tdi.all.pos.x + tdi.all.size.width),
                    ),
                    'bottomvalue',
                    -width2cellNum(tdi.min.size.width) + tdi.protectedCellCount,
                );
            }
            const dcy = cy - baseCellY;
            const dp = dcx * (cellXUnit / cellDivideNumber); // [ms]
            const selectedTimebarIds = selectedCElem.current.map(timebar =>
                parseInt(timebar.dataset.id as string),
            );
            console.log('DRAGEND', 'param', { x, dx, corDx, corDy, cx, dcx, dp, tdi });
            const modifiedIndex = [];
            const dateModifiedTasks = tasks.map((task, index) => {
                if (selectedTimebarIds.indexOf(task.id) != -1) {
                    // 期間の編集
                    const start = task.period.start;
                    const end = task.period.end;
                    let newStart: Date;
                    let newEnd: Date;
                    if (tdi.targetType == 'whole') {
                        newStart = start + dp;
                        newEnd = end + dp;
                    } else if (tdi.targetType == 'left') {
                        newStart = start + dp;
                        newEnd = end;
                    } else if (tdi.targetType == 'right') {
                        newStart = start;
                        newEnd = end + dp;
                    }
                    modifiedIndex.push(index);
                    //
                    return {
                        ...task,
                        period: {
                            start: newStart,
                            end: newEnd,
                        },
                    };
                } else {
                    return { ...task };
                }
            });
            // 順序入れ替え
            let newTasks;
            if (tdi.targetType == 'whole' && tdi.pointed.cell.y != cy) {
                let counter = -1;
                let modifiedCounter = 0;
                newTasks = dateModifiedTasks.map((task, index) => {
                    if (modifiedIndex[modifiedCounter] + dcy == index) {
                        const newone = { ...dateModifiedTasks[modifiedIndex[modifiedCounter]] };
                        modifiedCounter++;
                        return newone;
                    } else {
                        counter++;
                        while (modifiedIndex.indexOf(counter) != -1) {
                            counter++;
                        }
                        return { ...dateModifiedTasks[counter] };
                    }
                });
            } else {
                newTasks = [...dateModifiedTasks];
            }
            // 初期化
            timebarDragInitial.current = null;
            releaseSelectedCElem();
            // タスク更新
            setTasks(newTasks);
            // スクロール量の引き継ぎ
            lastScroll.current = scroll;
        }
    };
    const releaseSelectedCElem = (dataReset = true) => {
        console.log('release', dataReset);
        for (const timebar of selectedCElem.current) {
            timebar.ref.style.backgroundColor = '';
        }
        selectedCElem.current = null;
        if (dataReset) {
            selectedCElem.current = [];
        }
    };
    // --------------------------------------------------------
    const onTimebarDoubleClick = event => {
        console.log('double clicked');
        const task = tasks.filter(t => t.id == event.target.dataset.id)[0];
        setSelectedTask(task);
    };
    const closeTaskModal = () => {
        setSelectedTask(null);
    };
    // --------------------------------------------------------
    useEffect(() => {
        document.addEventListener('keydown', event => {
            console.log('key', event.key);
            if (event.key == 'Control') {
                keydown.current = event.key;
            }
        });
        document.addEventListener('keyup', () => {
            keydown.current = null;
        });
        document.addEventListener('mousedown', event => {
            const target: HTMLElement = event.target as HTMLElement;
            console.log('document.mousedown', target.className, mousedownStart.current);
            // cellのクリック
            if (target.className.match('ganttCalenderCell')) {
                // 範囲内のtimebarを元に戻す
                releaseSelectedCElem();
                // マウス移動の起点を作成
                if (mousedownStart.current.x == -1 && mousedownStart.current.y == -1) {
                    mousedownStart.current = { x: event.clientX, y: event.clientY };
                } else {
                    mousedownStart.current = { x: -1, y: -1 };
                    const selectedAreaElem = document.getElementById('selectedArea');
                    selectedAreaElem.style.display = 'none';
                    selectedAreaElem.style.position = 'fixed';
                    selectedAreaElem.style.top = `0`;
                    selectedAreaElem.style.left = `0`;
                    selectedAreaElem.style.width = `0`;
                    selectedAreaElem.style.height = `0`;
                    selectedAreaElem.style.backgroundColor = '';
                    selectedAreaElem.style.opacity = '';
                }
            }
            // Ctrl + timebarのクリック
            if (
                target.className.match('ganttCalenderTimebarGroup') &&
                keydown.current == 'Control'
            ) {
                const x = target.dataset.x;
                const y = target.dataset.y;
                const wrapElem = getElementByPosition(x, y);
                wrapElem.style.backgroundColor = c.color.multiSelected;
                selectedCElem.current.push(getCalemderElementSnapshot(wrapElem));
            }
        });
        document.addEventListener('mousemove', event => {
            // マウス起点が作られていたら、移動したぶんだけ長方形を描画
            if (mousedownStart.current.x >= 0 && mousedownStart.current.y >= 0) {
                console.log('document.mousemove');
                // 長方形描画
                const x = event.clientX;
                const y = event.clientY;
                const sx = mousedownStart.current.x;
                const sy = mousedownStart.current.y;
                const dx = x - sx;
                const dy = y - sy;
                const left = dx > 0 ? sx : x;
                const top = dy > 0 ? sy : y;
                const selectedAreaElem = document.getElementById('selectedArea');
                selectedAreaElem.style.display = 'block';
                selectedAreaElem.style.position = 'fixed';
                selectedAreaElem.style.top = `${top}px`;
                selectedAreaElem.style.left = `${left}px`;
                selectedAreaElem.style.width = `${Math.abs(dx)}px`;
                selectedAreaElem.style.height = `${Math.abs(dy)}px`;
                selectedAreaElem.style.backgroundColor = c.color.dragArea;
                // 範囲内のtimebarを反転
                const timebars = getElementsByClassName('ganttCalenderTimebarGroup').filter(
                    e => e.dataset.target == 'wrap',
                );
                const selected = [];
                for (const timebar of timebars) {
                    const rect = timebar.getBoundingClientRect();
                    // 領域内の場合
                    if (
                        ((x <= rect.left && rect.left <= sx) ||
                            (sx <= rect.left && rect.left <= x)) &&
                        ((y <= rect.top && rect.top <= sy) || (sy <= rect.top && rect.top <= y))
                    ) {
                        timebar.style.backgroundColor = c.color.multiSelected;
                        selected.push(getCalemderElementSnapshot(timebar));
                        // 領域外の場合
                    } else {
                        timebar.style.backgroundColor = '';
                    }
                }
                selectedCElem.current = selected;
            }
        });
        document.addEventListener('mouseup', () => {
            // 範囲選択終了
            if (mousedownStart.current.x >= 0 && mousedownStart.current.y >= 0) {
                console.log('document.mouseup');
                // 範囲選択長方形の描画終了
                mousedownStart.current = { x: -1, y: -1 };
                const selectedAreaElem = document.getElementById('selectedArea');
                selectedAreaElem.style.display = 'none';
                selectedAreaElem.style.position = 'fixed';
                selectedAreaElem.style.top = `0`;
                selectedAreaElem.style.left = `0`;
                selectedAreaElem.style.width = `0`;
                selectedAreaElem.style.height = `0`;
                selectedAreaElem.style.backgroundColor = '';
            }
        });
    }, []);
    useEffect(() => {
        // calenderBodyParamを更新
        calenderBodyParam.current = getCalemderElementSnapshot(
            document.getElementById('GanttCalenderBody'),
        );
        console.log('calenderBodyParam', calenderBodyParam.current);
        // スクロール量を保持
        const calenderContainer = document.getElementById('ganttCalenderContainer');
        calenderContainer.scrollTo(lastScroll.current.x, lastScroll.current.y);
        //
        console.log('tasks', tasks);
    }, [calenderBodyParam.current, tasks]);
    // --------------------------------------------------------
    const defaultContentStyle = {
        position: 'fixed',
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        minWidth: '40vw',
        minHeight: '40vh',
        maxWidth: '80vw',
        maxHeight: '80vh',
        backgroundColor: 'white',
    };
    return (
        <div>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: 'red',
                }}
            ></div>
            <Main>
                <SelectedArea id="selectedArea" />
                <Modal
                    contentLabel="Example Modal"
                    style={defaultContentStyle}
                    isOpen={!!selectedTask}
                    onRequestClose={closeTaskModal}
                    ariaHideApp={false}
                >
                    {selectedTask ? (
                        <div>
                            <p>{selectedTask.title}</p>
                            <p>
                                {`「${getMMDD(selectedTask.period.start)}:${getHH(
                                    selectedTask.period.start,
                                )}`}
                                〜
                                {`${getMMDD(selectedTask.period.end)}:${getHH(
                                    selectedTask.period.end,
                                )}」`}
                            </p>
                            <p>{selectedTask.status}</p>
                            <p>{selectedTask.assign}</p>
                            <p>{selectedTask.tags}</p>
                            <p>{selectedTask.properties}</p>
                            <p>{selectedTask.body}</p>
                        </div>
                    ) : (
                        <div>工事中</div>
                    )}
                </Modal>
                <GanttTaskContainer>
                    <GanttTaskHeader></GanttTaskHeader>
                    <GanttTaskList>
                        {tasks.map((task, index) => {
                            return (
                                <GanttTaskRow key={`task-row-${index}`}>
                                    <GanttTaskTitle>{task.title}</GanttTaskTitle>
                                    <GanttTaskProperty>
                                        {`「${getMMDD(task.period.start)}:${getHH(
                                            task.period.start,
                                        )}`}
                                        〜
                                        {`${getMMDD(task.period.end)}:${getHH(task.period.end)}」`}
                                    </GanttTaskProperty>
                                    <GanttTaskProperty>{task.status}</GanttTaskProperty>
                                </GanttTaskRow>
                            );
                        })}
                    </GanttTaskList>
                </GanttTaskContainer>
                <GanttCalenderContainer id="ganttCalenderContainer">
                    <GanttCalenderHeader>
                        <GanttCalenderHeaderParentContainer>
                            {createParentGanttLabel().map((parent, index) => {
                                return (
                                    <GanttCalenderHeaderParent
                                        key={`calender-header-parent-${index}`}
                                    >
                                        <div
                                            style={{
                                                position: 'sticky',
                                                left: 0,
                                                width: c.cell.width * cellDivideNumber,
                                            }}
                                        >
                                            {parent.parent}
                                        </div>
                                        <div
                                            style={{
                                                width:
                                                    parent.number * c.cell.width * cellDivideNumber,
                                            }}
                                        ></div>
                                    </GanttCalenderHeaderParent>
                                );
                            })}
                        </GanttCalenderHeaderParentContainer>
                        <GanttCalenderHeaderChildContainer>
                            {[...Array(calenderRangeDiff).keys()].map(j => {
                                const d = new Date(calenderRange.start);
                                d.setDate(d.getDate() + j);
                                return (
                                    <GanttCalenderHeaderChild key={`calender-header-child-${j}`}>
                                        {d.getDate()}
                                    </GanttCalenderHeaderChild>
                                );
                            })}
                        </GanttCalenderHeaderChildContainer>
                    </GanttCalenderHeader>
                    <GanttCalenderBodyWrapper>
                        <GanttCalenderBody id="GanttCalenderBody">
                            <div style={{ position: 'absolute', top: 0, left: 0 }}>test</div>
                            {tasks.map((task, y) => {
                                const width =
                                    getTimeberWidth(task.period.start, task.period.end) -
                                    c.cell.width * 0.02;
                                const tps = new Date(task.period.start);
                                return (
                                    <GanttCalenderRow key={`calender-row-${y}`}>
                                        {[
                                            ...Array(calenderRangeDiff * cellDivideNumber).keys(),
                                        ].map(x => {
                                            const s = new Date(calenderRange.start);
                                            s.setHours(s.getHours() + x * (24 / cellDivideNumber));
                                            const year = s.getFullYear() == tps.getFullYear();
                                            const month = s.getMonth() + 1 == tps.getMonth() + 1;
                                            const date = s.getDate() == tps.getDate();
                                            const hour =
                                                ceilfloor(s.getHours() / 24) ==
                                                ceilfloor(tps.getHours() / 24);
                                            return (
                                                <GanttCalenderCell
                                                    key={`calender-cell-${y}-${x}`}
                                                    className="ganttCalenderCell"
                                                    data-x={x}
                                                    data-y={y}
                                                    data-target="cell"
                                                >
                                                    {year && month && date && hour ? (
                                                        <GanttCalenderTimebarWrap
                                                            className="ganttCalenderTimebarGroup"
                                                            data-id={task.id}
                                                            data-x={x}
                                                            data-y={y}
                                                            data-target="wrap"
                                                            style={{
                                                                width,
                                                            }}
                                                        >
                                                            {task.id}
                                                            <GanttCalenderTimebar
                                                                className="ganttCalenderTimebarGroup"
                                                                draggable="true"
                                                                data-id={task.id}
                                                                data-x={x}
                                                                data-y={y}
                                                                data-target="whole"
                                                                style={{
                                                                    width,
                                                                }}
                                                                onDoubleClick={onTimebarDoubleClick}
                                                                onDragStart={onTimebarDragStart}
                                                                onDrag={onTimebarDrag}
                                                                onDragEnd={onTimebarDragEnd}
                                                            >
                                                                <GanttCalenderTimebarSide
                                                                    className="ganttCalenderTimebarGroup"
                                                                    draggable="true"
                                                                    data-id={task.id}
                                                                    data-x={x}
                                                                    data-y={y}
                                                                    data-target="left"
                                                                    onDragStart={onTimebarDragStart}
                                                                    onDrag={onTimebarDrag}
                                                                    onDragEnd={onTimebarDragEnd}
                                                                />
                                                                <GanttCalenderTimebarSide
                                                                    className="ganttCalenderTimebarGroup"
                                                                    draggable="true"
                                                                    data-id={task.id}
                                                                    data-x={x}
                                                                    data-y={y}
                                                                    data-target="right"
                                                                    onDragStart={onTimebarDragStart}
                                                                    onDrag={onTimebarDrag}
                                                                    onDragEnd={onTimebarDragEnd}
                                                                />
                                                            </GanttCalenderTimebar>
                                                        </GanttCalenderTimebarWrap>
                                                    ) : (
                                                        <></>
                                                    )}
                                                </GanttCalenderCell>
                                            );
                                        })}
                                    </GanttCalenderRow>
                                );
                            })}
                        </GanttCalenderBody>
                    </GanttCalenderBodyWrapper>
                </GanttCalenderContainer>
            </Main>
        </div>
    );
};

export default Gantt;
