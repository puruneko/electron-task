import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { ceilfloor, IPos, IRect, overlappingArea } from '../lib/utils';
import { getTimedelta, getTimeBlocks, getYYYYMMDD, getHHMMSS } from '../lib/time';

const Timeline: React.FC = () => {
    const cellDivideNumber = 2;
    const calenderRange = {
        start: new Date(2021, 3, 1, 0, 0),
        end: new Date(2021, 5, 1, 0, 0),
    };
    const calenderRangeDiff = getTimedelta(calenderRange.start, calenderRange.end).date;
    const tasks = [
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
    ];
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
        background-color: lightgray;
    `;
    const TimelineCalenderBody = styled.div`
        position: relative;
        width: 100%;
        background-color: lightgray;
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
    const TimelineCalenderTimebar = styled.div`
        position: absolute;
        padding-left: ${c.cell.width * 0.05};
        padding-right: ${c.cell.width * 0.05};
        height: ${c.cell.height * 0.9};
        border-radius: 7px;
        background-color: gray;
        overflow: visible;
        display: flex;
        justify-content: space-between;
        z-index: 3;
    `;
    const TimelineCalenderTimebarSide = styled.div`
        position: relative;
        height: 100%;
        width: ${c.cell.width * 0.1};
        border-radius: 7px;
        background-color: transparent;
        overflow: visible;
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
    const [firstDragParam, setFirstDragParam] = useState({
        id: -1,
        cell: { x: -1, y: -1 },
        pos: { x: -1, y: -1 },
    });
    const getTimeberWidth = (start: Date, end: Date): number => {
        return c.cell.width * cellDivideNumber * getTimeBlocks(start, end, 'date');
    };
    const canDrag = (elem = null) => {
        return (
            (!elem || firstDragParam.id == elem.dataset?.id) &&
            firstDragParam.pos.x >= 0 &&
            firstDragParam.pos.y >= 0
        );
    };
    const getElementByPosition = (x, y, targetType = 'whole') => {
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
    const onTimebarMouseDown = event => {
        console.log('mousedown', event.target.className);
        const timebar = event.target;
        if (!canDrag(timebar)) {
            const id = timebar.dataset.id;
            const cell = {
                x: parseInt(timebar.dataset.x),
                y: parseInt(timebar.dataset.y),
            };
            const pos = {
                x: event.pageX,
                y: event.pageY,
            };
            console.log('setFirstDragParam', { id, cell, pos });
            setFirstDragParam({ id, cell, pos });
        }
    };
    const onTimebarDrag = event => {
        console.log('drag', event.target.className);
        const timebar = event.target;
        if (canDrag(timebar)) {
            // timebarを半透明に
            const timebars = document.getElementsByClassName('timelineCalenderTimebarGroup');
            for (const tb of timebars) {
                if (tb.dataset.id == timebar.dataset.id) {
                    tb.style.zIndex = 0;
                    // continue;
                }
                tb.style.zIndex = -1;
                tb.style.opacity = 0.5;
            }
            // 移動
            const wrapElem = getElementByPosition(
                firstDragParam.cell.x,
                firstDragParam.cell.y,
                'wrap',
            );
            const x = event.pageX;
            const y = event.pageY;
            wrapElem.style.top = y - firstDragParam.pos.y;
            wrapElem.style.left = x - firstDragParam.pos.x;
        }
    };
    const onTimebarDragEnd = event => {
        console.log('dragend', event.target.className);
        setFirstDragParam({
            id: -1,
            cell: { x: -1, y: -1 },
            pos: { x: -1, y: -1 },
        });
    };
    const onTimebarDragOver = event => {
        if (canDrag()) {
            console.log('dragover', event.target.className);
            event.target.style.backgroundColor = 'yellow';
        }
    };
    const onTimebarDragLeave = event => {
        if (canDrag()) {
            console.log('dragleave', event.target.className);
            event.target.style.backgroundColor = '';
        }
    };
    //
    console.log(calenderRange, calenderRangeDiff, tasks);
    return (
        <div>
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
                                const minWidth = getTimeberWidth(
                                    task.period.start,
                                    task.period.end,
                                );
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
                                                        <TimelineCalenderTimebar
                                                            className="timelineCalenderTimebarGroup"
                                                            draggable={true}
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
                                                                draggable={true}
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
                                                                onMouseDown={onTimebarMouseDown}
                                                                onDragStart={onTimebarMouseDown}
                                                                onDrag={onTimebarDrag}
                                                                onDragEnd={onTimebarDragEnd}
                                                            >
                                                                <TimelineCalenderTimebarSide
                                                                    className="timelineCalenderTimebarGroup"
                                                                    data-id={task.id}
                                                                    data-x={x}
                                                                    data-y={y}
                                                                    data-target="left"
                                                                />
                                                                <TimelineCalenderTimebarSide
                                                                    className="timelineCalenderTimebarGroup"
                                                                    data-id={task.id}
                                                                    data-x={x}
                                                                    data-y={y}
                                                                    data-target="right"
                                                                />
                                                            </TimelineCalenderTimebar>
                                                        </TimelineCalenderTimebar>
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
