import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { GeneratedIdentifierFlags } from 'typescript';

const c = {
    header: {
        height: 500,
    },
    ganttHeader: {
        height: 50,
    },
    cell: {
        width: 50,
        height: 50,
    },
};
const taskNumber = 50;
const calenderWidth = 10000;
const Wrapper = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
`;
const Header = styled.div`
    width: 100%;
    height: ${c.header.height};
    background-color: red;
`;
const ContentsWrapper = styled.div`
    width: 100%;
    height: calc(100% - ${c.header.height}px);
    overflow-x: auto;
    overflow-y: auto;
`;
const HeaderWrapper = styled.div`
    width: ${calenderWidth}; /* 重要 */
    height: ${c.ganttHeader.height};
    display: flex;
    position: sticky;
    top: 0;
    z-index: 2;
`;
const TaskHeader = styled.div`
    height: ${c.ganttHeader.height};
    min-width: 300px;
    background-color: gray;
    position: sticky;
    left: 0;
    top: 0;
    z-index: 2;
`;
const CalenderHeader = styled.div`
    min-width: ${calenderWidth};
    height: ${c.ganttHeader.height};
    background-color: pink;
    display: flex;
    position: sticky;
    top: 0;
    left: 0;
    z-index: 1;
`;
const CalenderPhase = styled.div`
    width: 200;
    height: ${c.ganttHeader.height};
    position: sticky;
    left: 300px;
    background-color: inherit;
`;
const Main = styled.div`
    width: ${calenderWidth}; /* 重要 */
    min-height: 100%;
    display: flex;
    z-index: 1;
`;
const TaskWrapper = styled.div`
    width: 300px;
    min-height: 100%;
    position: sticky;
    left: 0;
    top: ${c.ganttHeader.height};
    z-index: 1;
    display: flex;
    flex-direction: column;
    background-color: blue;
`;
const Tasks = styled.div``;
const TaskRow = styled.div`
    width: 300px;
    height: ${c.cell.height};
`;
const CalenderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    background-color: green;
    z-index: 0;
`;
const Calenders = styled.div``;
const CalenderRow = styled.div`
    min-width: ${calenderWidth};
    height: ${c.cell.height};
`;
const Lab: React.FC = () => {
    const options = [
        { value: 1, name: 'A' },
        { value: 2, name: 'B' },
        { value: 3, name: 'C' },
        { value: 4, name: 'D' },
        { value: 5, name: 'E' },
    ];
    const [s, setS] = useState([]);
    const [open, setOpen] = useState(false);
    const greenRef = useRef('');
    return (
        <Wrapper>
            <Header>
                <button
                    onClick={(event) => {
                        greenRef.current = greenRef.current ? '' : 'green';
                        console.log('greenRef', greenRef.current);
                    }}
                >
                    GREEN
                </button>
                <div style={{ backgroundColor: greenRef.current }}>GREEN??</div>
            </Header>
            <ContentsWrapper>
                <HeaderWrapper>
                    <TaskHeader></TaskHeader>
                    <CalenderHeader>
                        {[...Array(100).keys()].map((i) => {
                            return <CalenderPhase key={i}>{i}</CalenderPhase>;
                        })}
                    </CalenderHeader>
                </HeaderWrapper>
                <Main>
                    <TaskContainer />
                    <CalenderContainer />
                </Main>
            </ContentsWrapper>
        </Wrapper>
    );
};

const TaskContainer: React.FC = () => {
    return (
        <TaskWrapper>
            <Tasks>
                {[...Array(taskNumber).keys()].map((i) => {
                    return <TaskRow key={`taskrow-${i}`}>{i}</TaskRow>;
                })}
            </Tasks>
        </TaskWrapper>
    );
};

const CalenderContainer: React.FC = () => {
    return (
        <CalenderWrapper>
            <Calenders>
                {[...Array(taskNumber).keys()].map((i) => {
                    return <CalenderRow key={`taskrow-${i}`}>{i}</CalenderRow>;
                })}
            </Calenders>
        </CalenderWrapper>
    );
};

export default Lab;
