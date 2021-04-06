import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { ceilfloor } from '../lib/utils';
import { getTimedelta, getTimeBlocks, getYYYYMMDD, getHHMMSS } from '../lib/time';
import { start } from 'repl';

const Timeline: React.FC = () => {
    const calenderPeriod = 'date';
    const cellXUnit = 60 * 60 * 24; // [s]
    const cellDivideNumber = 2;
    const calenderRange = {
        start: new Date(2021, 3, 1, 0, 0),
        end: new Date(2021, 5, 1, 0, 0),
    };
    const calenderRangeDiff = getTimedelta(calenderRange.start, calenderRange.end).date;
    const [tasks, setTasks] = useState([
        {
            id: 1,
            title: 'task1',
            period: {
                start: new Date(2021, 3, 2, 10, 30),
                end: new Date(2021, 3, 2, 11, 0),
            },
            status: 'TODO',
            assign: null,
            tags: [],
            properties: [],
            body: [],
        },
        {
            id: 2,
            title: 'task_2',
            period: {
                start: new Date(2021, 3, 3, 10, 0),
                end: new Date(2021, 3, 4, 16, 0),
            },
            status: 'DOING',
            assign: null,
            tags: [],
            properties: [],
            body: [],
        },
        {
            id: 3,
            title: 'task_3',
            period: {
                start: new Date(2021, 3, 3, 16, 0),
                end: new Date(2021, 3, 5, 10, 0),
            },
            status: 'DOING',
            assign: null,
            tags: [],
            properties: [],
            body: [],
        },
    ]);
    const c = {
        header: {
            height: 50,
        },
        timelineHeader: {
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
        },
        timebar: {
            zIndex: 2,
        },
    };
    const Header = styled.div`
        position: fixed;
        top: 0;
        left: 0;
        height: ${c.header.height};
    `;
    const Main = styled.div`
        position: absolute;
        top: ${c.header.height};
        left: 0;
    `;
    const SelectedArea = styled.div`
        display: 'none';
        position: 'fixed';
        top: 0;
        left: 0;
        width: 0;
        height: 0;
    `;
    const TimelineTaskContainer = styled.div`
        position: absolute;
        top: 0;
        left: 0;
        width: ${c.task.container.width};
        background-color: red;
    `;
    const TimelineTaskHeader = styled.div`
        width: 100%;
        height: ${c.timelineHeader.height};
        background-color: blue;
    `;
    const TimelineTaskList = styled.div``;
    const TimelineTaskRow = styled.div`
        display: flex;
        width: 100%;
        height: ${c.cell.height};
    `;
    const TimelineTaskTitle = styled.div``;
    const TimelineTaskProperty = styled.div``;
    const TimelineCalenderContainer = styled.div`
        width: 100vw;
        margin-left: ${c.task.container.width};
        overflow-y: scroll;
    `;
    const TimelineCalenderHeader = styled.div`
        background-color: blue;
        width: ${calenderRangeDiff * c.cell.width * cellDivideNumber + c.task.container.width};
        height: ${c.timelineHeader.height};
    `;
    const TimelineCalenderHeaderParentContainer = styled.div`
        height: ${c.timelineHeader.height / 2};
        display: flex;
        overflow: visible;
    `;
    const TimelineCalenderHeaderParent = styled.div`
        height: ${c.timelineHeader.height / 2};
        position: sticky;
    `;
    const TimelineCalenderHeaderChildContainer = styled.div`
        width: 100%;
        height: ${c.timelineHeader.height / 2};
        display: flex;
    `;
    const TimelineCalenderHeaderChild = styled.div`
        width: ${c.cell.width * cellDivideNumber};
        height: ${c.timelineHeader.height / 2};
    `;
    const TimelineCalenderBodyWrapper = styled.div`
        position: relative;
        width: 100%;
        background-color: pink; //lightgray
    `;
    const TimelineCalenderBody = styled.div`
        position: relative;
        width: 100%;
        z-index: ${c.calenderBody.zIndex};
    `;
    const TimelineCalenderRow = styled.div`
        position: relative;
        display: flex;
        width: 100%;
    `;
    const TimelineCalenderCell = styled.div`
        position: relative;
        width: ${c.cell.width};
        height: ${c.cell.height};
        flex: 0 0 ${c.cell.width};
        flex-shrink: 0;
        display: flex;
        justify-content: start;
        align-items: center;
    `;
    const TimelineCalenderTimebarWrap = styled.div`
        position: absolute;
        margin-left: ${c.cell.width * 0.05};
        margin-right: ${c.cell.width * 0.05};
        height: ${c.cell.height * 0.8};
        border-radius: 7px;
        background-color: gray;
        z-index: 3;
    `;
    const TimelineCalenderTimebar = styled.div`
        position: absolute;
        height: ${c.cell.height * 0.8};
        border-radius: 7px;
        background-color: gray;
        overflow: hidden;
        display: flex;
        justify-content: space-between;
        z-index: 3;
    `;
    const TimelineCalenderTimebarSide = styled.div`
        height: 100%;
        width: ${c.cell.width * 0.2};
        border-radius: 7px;
        background-color: transparent;
        cursor: col-resize;
        z-index: 4;
    `;
    //
    const createParentTimelineLabel = () => {
        const start = calenderRange.start;
        const parents = [...Array(calenderRangeDiff).keys()].map(i => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d.getMonth();
        });
        return [...new Set(parents)].map(i => {
            return {
                parent: i,
                number: parents.filter(x => x == i).length,
            };
        });
    };
    //
    const timebarDragParam = useRef({
        id: -1,
        targetType: null,
        rect: { width: -1, height: -1 },
        pos: { x: -1, y: -1 },
        cell: { start: { x: -1, y: -1 }, pointed: { x: -1, y: -1 } },
    });
    const selectedCell = useRef({ x: -1, y: -1 });
    const dragReady = useRef(false);
    const mousedownStart = useRef({ x: -1, y: -1 });
    const selectedTimebar = useRef([]);
    //
    const getTimeberWidth = (start: Date, end: Date): number => {
        let block: number;
        switch (calenderPeriod) {
            case 'date':
                const days = end.getDate() - start.getDate();
                const startDivideNumber = Math.floor(start.getHours() / (24 / cellDivideNumber));
                const endDivideNumber = Math.floor(end.getHours() / (24 / cellDivideNumber));
                block = days * cellDivideNumber + 1 + endDivideNumber - startDivideNumber;
                break;
        }
        return c.cell.width * block;
    };
    const canDrag = (elem = null) => {
        return (
            (!elem || timebarDragParam.current.id == elem.dataset?.id) &&
            // timebarDragParam.current.rect.width >= 0 &&
            // timebarDragParam.current.rect.height >= 0 &&
            timebarDragParam.current.cell.start.x >= 0 &&
            timebarDragParam.current.cell.start.y >= 0 &&
            timebarDragParam.current.cell.pointed.x >= 0 &&
            timebarDragParam.current.cell.pointed.y >= 0 &&
            timebarDragParam.current.pos.x >= 0 &&
            timebarDragParam.current.pos.y >= 0 &&
            selectedCell.current.x >= 0 &&
            selectedCell.current.y >= 0
        );
    };
    const canOver = cellElem => {
        if (canDrag()) {
            if (cellElem.dataset.target == 'cell') {
                const timebarCellWidth = Math.floor(
                    timebarDragParam.current.rect.width / c.cell.width,
                );
                if (timebarDragParam.current.targetType == 'whole') {
                    return true;
                } else if (timebarDragParam.current.targetType == 'left') {
                    return (
                        parseInt(cellElem.dataset.y) == timebarDragParam.current.cell.start.y &&
                        parseInt(cellElem.dataset.x) <=
                            timebarDragParam.current.cell.start.x + timebarCellWidth
                    );
                } else if (timebarDragParam.current.targetType == 'right') {
                    return (
                        parseInt(cellElem.dataset.y) == timebarDragParam.current.cell.start.y &&
                        parseInt(cellElem.dataset.x) >= timebarDragParam.current.cell.start.x
                    );
                }
            }
            return false;
        } else {
            return false;
        }
    };
    const getElementByPosition = (x, y, targetType = 'wrap') => {
        const elems = document.querySelectorAll(`[data-target='${targetType}']`);
        if (!elems || !elems.length) {
            return null;
        }
        const elem = [...elems].filter(
            e => parseInt(e.dataset.y) == y && parseInt(e.dataset.x) == x,
        )[0];
        if (!elem) {
            return null;
        }
        return elem;
    };
    const onTimebarDragStart = event => {
        if (event.target.className.match('timelineCalenderTimebarGroup')) {
            const timebar = event.target;
            const id = timebar.dataset.id;
            const targetType = timebar.dataset.target;
            const pos = {
                x: event.pageX,
                y: event.pageY,
            };
            const cellStart = {
                x: parseInt(timebar.dataset.x),
                y: parseInt(timebar.dataset.y),
            };
            const wrapElem = getElementByPosition(cellStart.x, cellStart.y);
            const rect = {
                width: wrapElem.offsetWidth,
                height: wrapElem.offsetHeight,
            };
            const wrapElemPos = {
                top: wrapElem.getBoundingClientRect().top,
                left: wrapElem.getBoundingClientRect().left,
            };
            const cell = {
                start: cellStart,
                pointed: {
                    x:
                        Math.floor((pos.x - wrapElemPos.left) / c.cell.width) +
                        parseInt(timebar.dataset.x),
                    y: parseInt(timebar.dataset.y),
                },
            };
            console.log(
                'DRAGSTART',
                event.target.className,
                'wrapElemPos',
                wrapElemPos,
                'settimebarDragParam.current',
                { id, targetType, rect, pos, cell },
                timebar.dataset.target,
            );
            timebarDragParam.current = { id, targetType, rect, pos, cell };
            selectedCell.current = cell.start;
            dragReady.current = true;
        }
    };
    const onTimebarDrag = event => {
        const timebar = event.target;
        if (canDrag(timebar) && dragReady.current) {
            dragReady.current = false;
            // timebarを半透明に
            const timebars = document.getElementsByClassName('timelineCalenderTimebarGroup');
            for (const tb of timebars) {
                tb.style.zIndex = -1;
                if (tb.dataset.id == timebar.dataset.id) {
                    continue;
                }
                tb.style.opacity = 0.5;
            }
            // 移動
            const wrapElem = getElementByPosition(
                timebarDragParam.current.cell.start.x,
                timebarDragParam.current.cell.start.y,
            );
            const x = event.pageX;
            const y = event.pageY;
            const targetType = timebar.dataset.target;
            if (targetType == 'whole') {
                wrapElem.style.left = x - timebarDragParam.current.pos.x;
                wrapElem.style.top = y - timebarDragParam.current.pos.y;
                console.log(
                    'DRAG',
                    '(pageX,pageY)',
                    { x, y },
                    'targetType',
                    targetType,
                    'wrap.width(left,top)',
                    { left: wrapElem.style.left, top: wrapElem.style.top },
                    'timebarDragParam.current',
                    timebarDragParam.current,
                );
            } else if (targetType == 'left') {
                // left
                const left = Math.min(
                    x - timebarDragParam.current.pos.x,
                    timebarDragParam.current.rect.width - c.cell.width,
                );
                wrapElem.style.left = left;
                // width
                const dx = timebarDragParam.current.pos.x - x;
                const width = Math.max(timebarDragParam.current.rect.width + dx, c.cell.width);
                wrapElem.style.width = width;
                console.log(
                    'DRAG',
                    '(pageX,pageY)',
                    { x, y },
                    'targetType',
                    targetType,
                    'dx',
                    dx,
                    'wrap.width',
                    {
                        width: wrapElem.style.width,
                        maxWidth: wrapElem.style.maxWidth,
                        minWidth: wrapElem.style.minWidth,
                    },
                    'timebarDragParam.current',
                    timebarDragParam.current,
                );
            } else if (targetType == 'right') {
                // width
                const dx = x - timebarDragParam.current.pos.x;
                const width = Math.max(timebarDragParam.current.rect.width + dx, c.cell.width);
                wrapElem.style.width = width;
                console.log(
                    'DRAG',
                    '(pageX,pageY)',
                    { x, y },
                    'targetType',
                    targetType,
                    'dx',
                    dx,
                    'wrap.width',
                    wrapElem.style.width,
                    'timebarDragParam.current',
                    timebarDragParam.current,
                );
            }
            dragReady.current = true;
        } else {
            console.log('DRAG', false);
        }
    };
    const onTimebarDragEnd = event => {
        console.log('DRAGEND', event.target.className);
        if (canDrag()) {
            // 期間更新
            console.log('DRAGEND', 'selectedCell.current.x', selectedCell.current.x);
            let modifiedIndex = -1;
            const modifiedTasks = tasks.map((task, index) => {
                if (task.id == timebarDragParam.current.id) {
                    const dx = selectedCell.current.x - timebarDragParam.current.cell.pointed.x;
                    const dp = dx * (cellXUnit / cellDivideNumber) * 1000; // [ms]
                    const start = task.period.start.getTime();
                    const end = task.period.end.getTime();
                    let newStart: Date;
                    let newEnd: Date;
                    if (timebarDragParam.current.targetType == 'whole') {
                        newStart = new Date(start + dp);
                        newEnd = new Date(end + dp);
                    } else if (timebarDragParam.current.targetType == 'left') {
                        newStart = new Date(start + dp);
                        newEnd = new Date(end);
                    } else if (timebarDragParam.current.targetType == 'right') {
                        newStart = new Date(start);
                        newEnd = new Date(end + dp);
                    }
                    modifiedIndex = index;
                    console.log('dp[h]', dp / 1000 / (60 * 60), 'start', start, 'end', end);
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
            if (
                timebarDragParam.current.targetType == 'whole' &&
                timebarDragParam.current.cell.start.y != selectedCell.current.y
            ) {
                let counter = modifiedIndex == 0 ? 0 : -1;
                newTasks = modifiedTasks.map((task, index) => {
                    if (index == selectedCell.current.y) {
                        return { ...modifiedTasks[modifiedIndex] };
                    } else {
                        counter++;
                        if (counter == modifiedIndex) {
                            counter++;
                        }
                        return { ...modifiedTasks[counter] };
                    }
                });
            } else {
                newTasks = [...modifiedTasks];
            }
            // 初期化
            timebarDragParam.current = {
                id: -1,
                targetType: null,
                rect: { width: -1, height: -1 },
                pos: { x: -1, y: -1 },
                cell: { start: { x: -1, y: -1 }, pointed: { x: -1, y: -1 } },
            };
            selectedCell.current = { x: -1, y: -1 };
            // タスク更新
            setTasks(newTasks);
        }
    };
    const onTimebarDragOver = event => {
        if (canOver(event.target)) {
            // 選択中セルの更新
            const newSelectedCell = {
                x: parseInt(event.target.dataset.x),
                y: parseInt(event.target.dataset.y),
            };
            selectedCell.current = newSelectedCell;
            console.log('DRAGOVER', 'selectedCell', selectedCell.current);
            // 選択中セルの背景色変更
            if (
                timebarDragParam.current.targetType == 'left' ||
                timebarDragParam.current.targetType == 'right'
            ) {
                event.target.style.backgroundColor = 'gray';
                event.target.style.opacity = '0.5';
                event.target.style.borderRadius = '8px';
            } else if (timebarDragParam.current.targetType == 'whole') {
                const x = event.pageX;
                const y = event.pageY;
                const wrapElem = getElementByPosition(
                    timebarDragParam.current.cell.start.x,
                    timebarDragParam.current.cell.start.y,
                );
                const wrapRect = {
                    width: wrapElem.offsetWidth,
                    height: wrapElem.offsetHeight,
                };
                const wrapCellWidth = Math.ceil(wrapRect.width / c.cell.width);
                const wrapElemPos = {
                    top: wrapElem.getBoundingClientRect().top,
                    left: wrapElem.getBoundingClientRect().left,
                };
                const startCell = {
                    x: newSelectedCell.x - Math.floor((x - wrapElemPos.left) / c.cell.width),
                    y: newSelectedCell.y,
                };
                console.log('startCell', startCell, 'wrapCellWidth', wrapCellWidth);
                const overElems = [...Array(wrapCellWidth).keys()].map(i => {
                    return getElementByPosition(i + startCell.x, newSelectedCell.y, 'cell');
                });
                if (overElems.length == 1) {
                    overElems[0].style.backgroundColor = 'gray';
                    overElems[0].style.opacity = '0.5';
                    overElems[0].style.borderRadius = '8px';
                } else {
                    for (const [index, elem] of overElems.entries()) {
                        elem.style.backgroundColor = 'gray';
                        elem.style.opacity = '0.5';
                        if (index == 0) {
                            elem.style.borderTopLeftRadius = '8px';
                            elem.style.borderBottomLeftRadius = '8px';
                        } else if (index == wrapCellWidth - 1) {
                            elem.style.borderTopRightRadius = '8px';
                            elem.style.borderBottomRightRadius = '8px';
                        }
                    }
                }
            }
        } else {
            console.log('DRAGOVER', false, event.target.className);
        }
    };
    const onTimebarDragLeave = event => {
        if (canOver(event.target)) {
            // 選択中セルの背景色変更
            if (
                timebarDragParam.current.targetType == 'left' ||
                timebarDragParam.current.targetType == 'right'
            ) {
                event.target.style.backgroundColor = '';
                event.target.style.opacity = '';
                event.target.style.borderRadius = '';
            } else if (timebarDragParam.current.targetType == 'whole') {
                const x = event.pageX;
                const y = event.pageY;
                const wrapElem = getElementByPosition(
                    timebarDragParam.current.cell.start.x,
                    timebarDragParam.current.cell.start.y,
                );
                const wrapRect = {
                    width: wrapElem.offsetWidth,
                    height: wrapElem.offsetHeight,
                };
                const wrapCellWidth = Math.ceil(wrapRect.width / c.cell.width);
                const wrapElemPos = {
                    top: wrapElem.getBoundingClientRect().top,
                    left: wrapElem.getBoundingClientRect().left,
                };
                const startCell = {
                    x: selectedCell.current.x - Math.floor((x - wrapElemPos.left) / c.cell.width),
                    y: selectedCell.current.y,
                };
                console.log('startCell', startCell, 'wrapCellWidth', wrapCellWidth);
                const overElems = [...Array(wrapCellWidth).keys()].map(i => {
                    return getElementByPosition(i + startCell.x, selectedCell.current.y, 'cell');
                });
                if (overElems.length == 1) {
                    overElems[0].style.backgroundColor = '';
                    overElems[0].style.opacity = '';
                    overElems[0].style.borderRadius = '';
                } else {
                    for (const [index, elem] of overElems.entries()) {
                        elem.style.backgroundColor = '';
                        elem.style.opacity = '';
                        if (index == 0) {
                            elem.style.borderTopLeftRadius = '';
                            elem.style.borderBottomLeftRadius = '';
                        } else if (index == wrapCellWidth - 1) {
                            elem.style.borderTopRightRadius = '';
                            elem.style.borderBottomRightRadius = '';
                        }
                    }
                }
            }
        } else {
            console.log('DRAGLEAVE', false, event.target.className);
        }
    };
    //
    useEffect(() => {
        /*
        document.addEventListener('mousedown', event => {
            if (!event.target.className.match('timelineCalenderTimebarGroup')) {
                console.log('document.mousedown', event.target.className);
                // 選択されていいるtimebarの解除
                if (selectedTimebar.current.length) {
                    for (const elem of selectedTimebar.current) {
                        elem.style.backgroundColor = '';
                    }
                    selectedTimebar.current = [];
                }
                // マウス移動の起点を作成
                mousedownStart.current = { x: event.clientX, y: event.clientY };
            }
        });
        document.addEventListener('mousemove', event => {
            if (!event.target.className.match('timelineCalenderTimebarGroup')) {
                // マウス起点が作られていたら、移動したぶんだけ長方形を描画
                if (mousedownStart.current.x >= 0 && mousedownStart.current.y >= 0) {
                    console.log('document.mousemove');
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
                    selectedAreaElem.style.backgroundColor = 'blue';
                    selectedAreaElem.style.opacity = '0.3';
                    selectedAreaElem.style.zIndex = '100';
                }
            }
        });
        document.addEventListener('mouseup', event => {
            if (!event.target.className.match('timelineCalenderTimebarGroup')) {
                if (mousedownStart.current.x >= 0 && mousedownStart.current.y >= 0) {
                    console.log('document.mouseup');
                    // selection取得
                    const selectedObject = window.getSelection();
                    const selectedDOM = selectedObject.getRangeAt(0).cloneContents();
                    const selectedTimebarWhole = selectedDOM.querySelectorAll(
                        '[data-target="whole"]',
                    );
                    // 色変更
                    for (const elem of selectedTimebarWhole) {
                        elem.style.backgroundColor = 'blue';
                        selectedTimebar.current.push(elem);
                    }
                    // マウス移動を終了
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
        });
        */
    }, []);
    //
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
            <Header></Header>
            <Main>
                <SelectedArea id="selectedArea" />
                <TimelineTaskContainer>
                    <TimelineTaskHeader></TimelineTaskHeader>
                    <TimelineTaskList>
                        {tasks.map((task, index) => {
                            return (
                                <TimelineTaskRow key={`task-row-${index}`}>
                                    <TimelineTaskTitle>{task.title}</TimelineTaskTitle>
                                    <TimelineTaskProperty>
                                        {`${getYYYYMMDD(task.period.start)} ${getHHMMSS(
                                            task.period.start,
                                        )}`}
                                        〜
                                        {`${getYYYYMMDD(task.period.end)} ${getHHMMSS(
                                            task.period.end,
                                        )}`}
                                    </TimelineTaskProperty>
                                    <TimelineTaskProperty>{task.status}</TimelineTaskProperty>
                                </TimelineTaskRow>
                            );
                        })}
                    </TimelineTaskList>
                </TimelineTaskContainer>
                <TimelineCalenderContainer>
                    <TimelineCalenderHeader>
                        <TimelineCalenderHeaderParentContainer>
                            {createParentTimelineLabel().map((parent, index) => {
                                return (
                                    <TimelineCalenderHeaderParent
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
                                    </TimelineCalenderHeaderParent>
                                );
                            })}
                        </TimelineCalenderHeaderParentContainer>
                        <TimelineCalenderHeaderChildContainer>
                            {[...Array(calenderRangeDiff).keys()].map(j => {
                                const d = new Date(calenderRange.start);
                                d.setDate(d.getDate() + j);
                                return (
                                    <TimelineCalenderHeaderChild key={`calender-header-child-${j}`}>
                                        {d.getDate()}
                                    </TimelineCalenderHeaderChild>
                                );
                            })}
                        </TimelineCalenderHeaderChildContainer>
                    </TimelineCalenderHeader>
                    <TimelineCalenderBodyWrapper>
                        <TimelineCalenderBody id="TimelineCalenderBody">
                            <div style={{ position: 'absolute', top: 0, left: 0 }}>test</div>
                            {tasks.map((task, y) => {
                                const width =
                                    getTimeberWidth(task.period.start, task.period.end) -
                                    c.cell.width * 0.02;
                                const tps = task.period.start;
                                return (
                                    <TimelineCalenderRow key={`calender-row-${y}`}>
                                        {[
                                            ...Array(calenderRangeDiff * cellDivideNumber).keys(),
                                        ].map(x => {
                                            const s = new Date(calenderRange.start);
                                            s.setHours(s.getHours() + x * 12);
                                            const year = s.getFullYear() == tps.getFullYear();
                                            const month = s.getMonth() == tps.getMonth();
                                            const date = s.getDate() == tps.getDate();
                                            const hour =
                                                ceilfloor(s.getHours() / 24) ==
                                                ceilfloor(tps.getHours() / 24);
                                            return (
                                                <TimelineCalenderCell
                                                    key={`calender-cell-${y}-${x}`}
                                                    className="TimelineCalenderCell"
                                                    data-x={x}
                                                    data-y={y}
                                                    data-target="cell"
                                                    onDragOver={onTimebarDragOver}
                                                    onDragLeave={onTimebarDragLeave}
                                                >
                                                    {year && month && date && hour ? (
                                                        <TimelineCalenderTimebarWrap
                                                            className="timelineCalenderTimebarGroup"
                                                            data-id={task.id}
                                                            data-x={x}
                                                            data-y={y}
                                                            data-target="wrap"
                                                            style={{
                                                                width,
                                                            }}
                                                        >
                                                            {x}
                                                            <TimelineCalenderTimebar
                                                                className="timelineCalenderTimebarGroup"
                                                                draggable="true"
                                                                data-id={task.id}
                                                                data-x={x}
                                                                data-y={y}
                                                                data-target="whole"
                                                                style={{
                                                                    position: 'absolute',
                                                                    top: 0,
                                                                    left: 0,
                                                                    width,
                                                                    backgroundColor: 'transparent',
                                                                }}
                                                                onMouseDown={onTimebarDragStart}
                                                                onDrag={onTimebarDrag}
                                                                onDragEnd={onTimebarDragEnd}
                                                            >
                                                                <TimelineCalenderTimebarSide
                                                                    className="timelineCalenderTimebarGroup"
                                                                    draggable="true"
                                                                    data-id={task.id}
                                                                    data-x={x}
                                                                    data-y={y}
                                                                    data-target="left"
                                                                    onMouseDown={onTimebarDragStart}
                                                                    onDrag={onTimebarDrag}
                                                                    onDragEnd={onTimebarDragEnd}
                                                                />
                                                                <TimelineCalenderTimebarSide
                                                                    className="timelineCalenderTimebarGroup"
                                                                    draggable="true"
                                                                    data-id={task.id}
                                                                    data-x={x}
                                                                    data-y={y}
                                                                    data-target="right"
                                                                    onMouseDown={onTimebarDragStart}
                                                                    onDrag={onTimebarDrag}
                                                                    onDragEnd={onTimebarDragEnd}
                                                                />
                                                            </TimelineCalenderTimebar>
                                                        </TimelineCalenderTimebarWrap>
                                                    ) : (
                                                        <></>
                                                    )}
                                                </TimelineCalenderCell>
                                            );
                                        })}
                                    </TimelineCalenderRow>
                                );
                            })}
                        </TimelineCalenderBody>
                    </TimelineCalenderBodyWrapper>
                </TimelineCalenderContainer>
            </Main>
        </div>
    );
};

export default Timeline;
