import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

const Lab: React.FC = () => {
    const c = {
        cell: {
            width: 40,
            height: 40,
        },
        row: 100,
        col: 100,
    };
    const [barLeft, setBarLeft] = useState(
        [...Array(c.row).keys()].map((_) => {
            return Math.floor((Math.random() * 300) / c.cell.width) * c.cell.width;
        }),
    );
    const dragParam = useRef({
        width: 0,
        height: 0,
        offsetX: 0,
        offsetY: 0,
    });
    const cacheFill = useRef([]);
    const dragStart = (event) => {
        //
        const row = event.target.dataset.row;
        const x = event.clientX;
        const y = event.clientY;
        const rect = event.target.getBoundingClientRect();
        const offsetX = x - rect.left;
        const offsetY = y - rect.top;
        dragParam.current = {
            width: event.target.offsetWidth,
            height: event.target.offsetHeight,
            offsetX,
            offsetY,
        };

        console.log({ dragParam: dragParam.current });
        //
        event.dataTransfer.setDragImage(document.querySelector(`.barWrap[data-row='${row}']`), offsetX, offsetY);
    };
    const drag = (event) => {
        //
        document.getElementById('cellWrapper').style.zIndex = '1';
        document.getElementById('barWrapper').style.zIndex = '-1';
        document.getElementById('barEventWrapper').style.zIndex = '0';
    };
    const dragEnd = (event) => {
        document.getElementById('cellWrapper').style.zIndex = '0';
        document.getElementById('barWrapper').style.zIndex = '1';
        document.getElementById('barEventWrapper').style.zIndex = '1';
    };
    const over = (event) => {
        for (const elem of cacheFill.current) {
            elem.style.backgroundColor = '';
        }
        const row = Number(event.target.dataset.row);
        const col = Number(event.target.dataset.col);
        const x = event.clientX;
        const y = event.clinetY;
        const rect = event.target.getBoundingClientRect();
        const cx = rect.left;
        const cy = rect.top;
        const offsetX = x - cx;
        const offsetY = y - cy;
        const behindWidth = dragParam.current.offsetX - offsetX;
        const behindOverCell = Math.floor(behindWidth / c.cell.width);
        const tailWidth = behindWidth - behindOverCell * c.cell.width;
        const frontWidth = Math.abs(dragParam.current.width - dragParam.current.offsetX + offsetX - c.cell.width);
        const frontOverCell = Math.floor(frontWidth / c.cell.width);
        const headWidth = frontWidth - frontOverCell * c.cell.width;
        const colStart = col - (behindOverCell + (tailWidth > headWidth ? 1 : 0));
        const colEnd = col + (frontOverCell + (headWidth > tailWidth ? 1 : 0));
        console.log('over', {
            row,
            col,
            dragParam: dragParam.current,
            tailWidth,
            headWidth,
            behindOverCell,
            frontOverCell,
            colStart,
            colEnd,
        });
        for (const i of [
            ...Array(
                colEnd - colStart + (colEnd - colStart >= Math.ceil(dragParam.current.width / c.cell.width) ? 0 : 1),
            ).keys(),
        ]) {
            cacheFill.current.push(document.querySelector(`.cell[data-row='${row}'][data-col='${colStart + i}']`));
        }
        for (const elem of cacheFill.current) {
            elem.style.backgroundColor = 'green';
        }
    };
    const leave = (event) => {
        for (const elem of cacheFill.current) {
            elem.style.backgroundColor = '';
        }
        cacheFill.current = [];
    };
    const Wrapper = styled.div`
        position: absolute;
        top: 0;
        left: 0;
    `;
    const Row = styled.div`
        position: relative;
        height: ${c.cell.height};
        display: flex;
    `;
    const Cell = styled.div`
        width: ${c.cell.width};
        height: ${c.cell.height};
        background-color: rgba(38, 39, 136, 0.5);
    `;
    const Bar = styled.div`
        position: absolute;
        width: ${c.cell.width * 5};
        height: ${c.cell.height * 0.9};
    `;
    return (
        <div>
            <Wrapper style={{ zIndex: 0 }} id="cellWrapper">
                {[...Array(c.row).keys()].map((row) => {
                    return (
                        <Row key={row}>
                            {[...Array(c.col).keys()].map((col) => {
                                return (
                                    <Cell
                                        key={col}
                                        className="cell"
                                        data-row={row}
                                        data-col={col}
                                        onDragOver={over}
                                        onDragLeave={leave}
                                    />
                                );
                            })}
                        </Row>
                    );
                })}
            </Wrapper>
            <Wrapper style={{ zIndex: 0 }} id="barWrapper">
                {[...Array(c.row).keys()].map((row) => {
                    return (
                        <Row key={row}>
                            <Bar
                                className="barWrap"
                                data-row={row}
                                style={{ left: barLeft[row], backgroundColor: 'red' }}
                            />
                        </Row>
                    );
                })}
            </Wrapper>
            <Wrapper style={{ zIndex: 1 }} id="barEventWrapper">
                {[...Array(c.row).keys()].map((row) => {
                    return (
                        <Row key={row}>
                            <Bar
                                style={{ left: barLeft[row] }}
                                data-row={row}
                                draggable={true}
                                onDragStart={dragStart}
                                onDrag={drag}
                                onDragEnd={dragEnd}
                            />
                        </Row>
                    );
                })}
            </Wrapper>
        </div>
    );
};

export default Lab;
