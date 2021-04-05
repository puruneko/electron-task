import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { ceilfloor } from '../lib/utils';
import { getTimedelta, getTimeBlocks, getYYYYMMDD, getHHMMSS } from '../lib/time';

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
        overflow: visible;
        display: flex;
        justify-content: space-between;
        z-index: 3;
    `;
    const TimelineCalenderTimebar = styled.div`
        position: absolute;
        height: ${c.cell.height * 0.8};
        border-radius: 7px;
        background-color: gray;
        overflow: visible;
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
    const [firstDragParam, setFirstDragParam] = useState({
        id: -1,
        targetType: null,
        rect: { width: -1, height: -1 },
        pos: { x: -1, y: -1 },
        cell: { start: { x: -1, y: -1 }, pointed: { x: -1, y: -1 } },
    });
    // const [selectedCell, setSelectedCell] = useState({ x: -1, y: -1 });
    const selectedCell = useRef({ x: -1, y: -1 });
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
            (!elem || firstDragParam.id == elem.dataset?.id) &&
            // firstDragParam.rect.width >= 0 &&
            // firstDragParam.rect.height >= 0 &&
            firstDragParam.cell.start.x >= 0 &&
            firstDragParam.cell.start.y >= 0 &&
            firstDragParam.cell.pointed.x >= 0 &&
            firstDragParam.cell.pointed.y >= 0 &&
            firstDragParam.pos.x >= 0 &&
            firstDragParam.pos.y >= 0 &&
            selectedCell.current.x >= 0 &&
            selectedCell.current.y >= 0
        );
        /*
        if (!elem || firstDragParam.id == elem.dataset?.id) {
            if (firstDragParam.cell.start.x >= 0 && firstDragParam.cell.start.y >= 0) {
                if (firstDragParam.cell.pointed.x >= 0 && firstDragParam.cell.pointed.y >= 0) {
                    if (firstDragParam.pos.x >= 0 && firstDragParam.pos.y >= 0) {
                        if (selectedCell.current.x >= 0 && selectedCell.current.y >= 0) {
                            return true;
                        } else {
                            console.log(
                                'CANDRAG(5)',
                                selectedCell.current.x >= 0,
                                selectedCell.current.y >= 0,
                            );
                            return false;
                        }
                    } else {
                        console.log(
                            'CANDRAG(4)',
                            firstDragParam.pos.x >= 0,
                            firstDragParam.pos.y >= 0,
                        );
                        return false;
                    }
                } else {
                    console.log(
                        'CANDRAG(3)',
                        firstDragParam.cell.pointed.x >= 0,
                        firstDragParam.cell.pointed.y >= 0,
                    );
                    return false;
                }
            } else {
                console.log(
                    'CANDRAG(2)',
                    firstDragParam.cell.start.x >= 0,
                    firstDragParam.cell.start.y >= 0,
                );
                return false;
            }
        } else {
            console.log('CANDRAG(1)', elem, firstDragParam.id, elem.dataset?.id);
            return false;
        }
        /*
             &&
            
        );
        */
    };
    const canOver = cellElem => {
        if (canDrag()) {
            if (firstDragParam.targetType == 'whole') {
                return true;
            } else if (firstDragParam.targetType == 'left') {
                return (
                    parseInt(cellElem.dataset.y) == firstDragParam.cell.start.y &&
                    parseInt(cellElem.dataset.x) <= firstDragParam.cell.pointed.x
                );
            } else if (firstDragParam.targetType == 'right') {
                return (
                    parseInt(cellElem.dataset.y) == firstDragParam.cell.start.y &&
                    parseInt(cellElem.dataset.x) >= firstDragParam.cell.pointed.x
                );
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
            'setFirstDragParam',
            { id, targetType, rect, pos, cell },
            timebar.dataset.target,
        );
        setFirstDragParam({ id, targetType, rect, pos, cell });
        selectedCell.current = cell.start;
    };
    const onTimebarDrag = event => {
        const timebar = event.target;
        if (canDrag(timebar)) {
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
                firstDragParam.cell.start.x,
                firstDragParam.cell.start.y,
            );
            const x = event.pageX;
            const y = event.pageY;
            const targetType = timebar.dataset.target;
            if (targetType == 'whole') {
                wrapElem.style.top = y - firstDragParam.pos.y;
                wrapElem.style.left = x - firstDragParam.pos.x;
                console.log(
                    'DRAG',
                    '(pageX,pageY)',
                    { x, y },
                    'targetType',
                    targetType,
                    'wrap.width(left,top)',
                    { left: wrapElem.style.left, top: wrapElem.style.top },
                    'firstDragParam',
                    firstDragParam,
                );
            } else if (targetType == 'left') {
                const dx = firstDragParam.pos.x - x;
                wrapElem.style.left = Math.min(
                    x - firstDragParam.pos.x,
                    firstDragParam.rect.width - c.cell.width,
                );
                const width = Math.max(firstDragParam.rect.width + dx, c.cell.width);
                wrapElem.style.setProperty('width', `${width}px`);
                wrapElem.style.setProperty('min-width', `${width}px`);
                wrapElem.style.setProperty('max-width', `${width}px`);
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
                    'firstDragParam',
                    firstDragParam,
                );
            } else if (targetType == 'right') {
                const dx = x - firstDragParam.pos.x;
                const width = Math.max(firstDragParam.rect.width + dx, c.cell.width);
                wrapElem.style.width = `${width}px`;
                wrapElem.style.minWidth = `${width}px`;
                wrapElem.style.maxWidth = `${width}px`;
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
                    'firstDragParam',
                    firstDragParam,
                );
            }
        } else {
            console.log('DRAG', false);
        }
    };
    const onTimebarDragEnd = event => {
        event.preventDefault();
        console.log('DRAGEND', event.target.className);
        if (canDrag()) {
            // 期間更新
            console.log('DRAGEND', 'selectedCell.current.x', selectedCell.current.x);
            let modifiedIndex = -1;
            const modifiedTasks = tasks.map((task, index) => {
                if (task.id == firstDragParam.id) {
                    const dx = selectedCell.current.x - firstDragParam.cell.pointed.x;
                    const dp = dx * (cellXUnit / cellDivideNumber) * 1000; // [ms]
                    const start = task.period.start.getTime();
                    const end = task.period.end.getTime();
                    let newStart: Date;
                    let newEnd: Date;
                    if (firstDragParam.targetType == 'whole') {
                        newStart = new Date(start + dp);
                        newEnd = new Date(end + dp);
                    } else if (firstDragParam.targetType == 'left') {
                        newStart = new Date(start + dp);
                        newEnd = new Date(end);
                    } else if (firstDragParam.targetType == 'right') {
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
                firstDragParam.targetType == 'whole' &&
                firstDragParam.cell.start.y != selectedCell.current.y
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
            // タスク更新
            setTasks(newTasks);
            // 初期化
            setFirstDragParam({
                id: -1,
                targetType: null,
                rect: { width: -1, height: -1 },
                pos: { x: -1, y: -1 },
                cell: { start: { x: -1, y: -1 }, pointed: { x: -1, y: -1 } },
            });
            selectedCell.current = { x: -1, y: -1 };
        }
    };
    const onTimebarDragOver = event => {
        if (canOver(event.target)) {
            const newSelectedCell = {
                x: parseInt(event.target.dataset.x),
                y: parseInt(event.target.dataset.y),
            };
            selectedCell.current = newSelectedCell;
            event.target.style.backgroundColor = 'gray';
            event.target.style.opacity = '0.5';
            event.target.style.borderRadius = '8px';
            console.log(
                'DRAGOVER',
                event.target.className,
                'selectedCell',
                selectedCell,
                'newSelectedCell',
                newSelectedCell,
                'dataset',
                event.target.dataset,
            );
            if (!selectedCell.current.x) {
                console.log('selectedCell', selectedCell, event.target.dataset);
            }
        } else {
            console.log('DRAGOVER', false, event.target.className);
        }
    };
    const onTimebarDragLeave = event => {
        if (canOver(event.target)) {
            console.log('dragleave', event.target.className);
            event.target.style.backgroundColor = '';
            event.target.style.opacity = '';
            event.target.style.borderRadius = '';
        }
    };
    //
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
                                const minWidth =
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
                                                                minWidth,
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
                                                                    minWidth,
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
