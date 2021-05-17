import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Modal from '@material-ui/core/Modal';
import { useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { TargetType } from '../type/gantt';
import { floor, ceil, ceilfloor, topbottom, useQuery } from '../lib/utils';
import { getTimedelta, getYYYYMMDD, getHHMMSS, getMMDD, getHH, getTime } from '../lib/time';
import { IRootState } from '../type/store';
import PageComponent from '../components/page';

const KanbanContainer = styled.div`
    width: 100%;
    height: 100%;
    margin: 20px;
    padding: 0;
    border: none;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    overflow-y: auto;
`;
const StatusContainer = styled.div`
    border: 1px solid black;
`;
const StatusHeader = styled.div``;
const StatusTasks = styled.div`
    margin: 10px;
    padding: 10px;
    width: 250px;
`;
const TaskContainer = styled.div`
    position: relative;
    margin-top: 5px;
    width: 100%;
    border: 1px solid black;
    background-color: lightgray;
    user-select: none;
    display: flex;
    flex-direction: column;
`;
const StatusTaskTerm = styled.div`
    width: 100%;
    height: 20px;
    background-color: lightgray;
`;
const TaskModalWrapper = styled.div`
    position: absolute;
    top: 5%;
    left: 15%;
    width: 70vw;
    height: 90vh;
    max-width: 70vw;
    max-height: 90vh;
    background-color: white;
`;

const Kanban: React.FC = () => {
    const params = useParams<any>();
    const queries = useQuery();
    const projectId = params.projectId;
    const { statuses, tasks, openTaskId } = useSelector(
        (props: IRootState) => ({
            statuses: props.projects
                .filter((project) => project.id == projectId)[0]
                .properties.filter((p) => p.id == 1)[0].values,
            tasks: props.projects
                .filter((project) => project.id == projectId)[0]
                .pages.filter((page) => page.type == 'task'),
            openTaskId: props.componentStates.kanban.openTaskId,
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    const selectedTaskElems = useRef([]);
    const pointedTaskElem = useRef(null);
    const currentOverElem = useRef(null);
    console.log('Kanban project', tasks, openTaskId);
    // --------------------------------------------------------
    const getContainerByTaskId = (id) => {
        const container = document.querySelectorAll(`.kanbanTask[data-id="${id}"]`);
        return container[0];
    };
    const onDragStart = (event) => {
        const target = event.target;
        pointedTaskElem.current = target;
        const taskElems = document.getElementsByClassName('kanbanTask');
        for (const taskElem of taskElems) {
            taskElem.style.opacity = '0.5';
        }
        //
        if (selectedTaskElems.current === null || selectedTaskElems.current.length == 0) {
            selectedTaskElems.current = [target];
        }
        if (currentOverElem.current === null) {
            currentOverElem.current = target.dataset.id;
        }
    };
    const onDragEnd = (event) => {
        console.log('onDragEnd', currentOverElem.current, selectedTaskElems.current, event.target);
        const taskElems = document.getElementsByClassName('kanbanTask');
        for (const taskElem of taskElems) {
            taskElem.style.opacity = '';
        }
        //
        const newTasks = [];
        if (currentOverElem.current.dataset.id == event.target.dataset.id) {
            // 自分自身にドロップしたら、何も変更しない
            for (const task of tasks) {
                newTasks.push(task);
            }
        } else if (currentOverElem.current.dataset.id == -1) {
            // 最後尾にドロップした場合
            const statusTaskEnd = tasks
                .filter(
                    (task) => task.properties.filter((p) => p.id == 1)[0] == currentOverElem.current.dataset.statusid,
                )
                .slice(-1)[0];
            // ステータスに要素が1つ以上存在する場合
            if (!!statusTaskEnd) {
                for (const task of tasks) {
                    if (task.id == statusTaskEnd.id) {
                        if (selectedTaskElems.current.filter((stask) => stask.dataset.id == task.id).length == 0) {
                            newTasks.push(task);
                        }
                        for (const staskElem of selectedTaskElems.current) {
                            const stask = tasks.filter((task) => task.id == staskElem.dataset.id)[0];
                            newTasks.push({
                                ...stask,
                                properties: stask.properties.map((p) => {
                                    if (p.id == 1) {
                                        return { ...task.properties.filter((p) => p.id == 1)[0] };
                                    } else {
                                        return { ...p };
                                    }
                                }),
                            });
                        }
                    } else if (selectedTaskElems.current.filter((stask) => stask.dataset.id == task.id).length != 0) {
                        continue;
                    } else {
                        newTasks.push(task);
                    }
                }
            } else {
                // ステータスに要素が0の場合
                for (const task of tasks) {
                    // taskがselectedTaskElemsの中にヒットするか
                    const stask = selectedTaskElems.current.filter((stask) => task.id == stask.dataset.id)[0];
                    console.log('stask', stask, !!stask);
                    // ヒットした場合
                    if (!!stask) {
                        newTasks.push({
                            ...task,
                            properties: task.properties.map((p) => {
                                if (p.id == 1) {
                                    return {
                                        ...p,
                                        values: [Number(currentOverElem.current.dataset.statusid)],
                                    };
                                } else {
                                    return { ...p };
                                }
                            }),
                        });
                    } else {
                        newTasks.push(task);
                    }
                }
            }
        } else {
            // 最後尾以外にドロップした場合
            const dy = Number(currentOverElem.current.dataset.y) - Number(pointedTaskElem.current.dataset.y);
            for (const task of tasks) {
                // taskがドロップされたタスクの場合
                if (task.id == currentOverElem.current.dataset.id) {
                    if (currentOverElem.current.dataset.x == pointedTaskElem.current.dataset.x && dy > 0) {
                        newTasks.push(task);
                    }
                    for (const staskElem of selectedTaskElems.current) {
                        const stask = tasks.filter((task) => task.id == staskElem.dataset.id)[0];
                        newTasks.push({
                            ...stask,
                            properties: stask.properties.map((p) => {
                                if (p.id == 1) {
                                    return {
                                        ...task.properties.filter((p) => p.id == 1)[0],
                                    };
                                } else {
                                    return { ...p };
                                }
                            }),
                        });
                    }
                    if (currentOverElem.current.dataset.x != pointedTaskElem.current.dataset.x || dy < 0) {
                        newTasks.push(task);
                    }
                } else if (selectedTaskElems.current.filter((stask) => stask.dataset.id == task.id).length != 0) {
                    // taskがドロップされたタスクではなくて、かつ、選択されているタスクの場合
                    continue;
                } else {
                    // taskがドロップされたタスクではなくて、かつ、選択されているタスクでない場合
                    newTasks.push(task);
                }
            }
        }
        dispatch({
            type: 'setTasks',
            projectId: projectId,
            tasks: newTasks,
        });
        selectedTaskElems.current = [];
        pointedTaskElem.current = null;
        currentOverElem.current = null;
    };
    const onDragOver = (event) => {
        let elem;
        if (parseInt(event.target.dataset.id) != -1) {
            elem = getContainerByTaskId(event.target.dataset.id);
        } else {
            elem = document.querySelector(
                `.kanbanTask[data-statusid="${event.target.dataset.statusid}"][data-id="-1"]`,
            );
        }
        elem.style.backgroundColor = 'red';
        //
        currentOverElem.current = elem;
    };
    const onDragLeave = (event) => {
        let elem;
        if (event.target.dataset.id != -1) {
            elem = getContainerByTaskId(event.target.dataset.id);
        } else {
            elem = document.querySelector(`.kanbanTask[data-statusid="${event.target.dataset.statusid}"]`);
        }
        elem.style.backgroundColor = '';
    };
    const onClickTask = (event) => {
        dispatch({
            type: 'setComponentState',
            componentName: 'kanban',
            state: {
                openTaskId: parseInt(event.target.dataset.id),
            },
        });
    };
    // --------------------------------------------------------
    return (
        <KanbanContainer>
            {statuses.map((status, x) => {
                return (
                    <StatusContainer key={`statusContainer-${x}`}>
                        <StatusHeader>
                            <span style={{ color: status.color }}>{status.name}</span>
                        </StatusHeader>
                        <StatusTasks>
                            {tasks
                                .filter((task) => task.properties.filter((p) => p.id == 1)[0].values[0] == status.id)
                                .map((task, y) => {
                                    const title = task.properties.filter((p) => p.id == 0)[0].values[0];
                                    return (
                                        <TaskContainer
                                            key={`taskContainer-${x}-${y}`}
                                            className={'kanbanTask'}
                                            data-id={task.id}
                                            data-statusid={task.properties.filter((p) => p.id == 1)[0]}
                                            data-x={x}
                                            data-y={y}
                                            draggable={true}
                                            onDragStart={onDragStart}
                                            onDragEnd={onDragEnd}
                                            onDragOver={onDragOver}
                                            onDragLeave={onDragLeave}
                                            onDoubleClick={onClickTask}
                                        >
                                            <span data-id={task.id}>{title}</span>
                                            <span data-id={task.id}>dummy1</span>
                                            <span data-id={task.id}>dummy2</span>
                                        </TaskContainer>
                                    );
                                })}
                            <StatusTaskTerm
                                className={'kanbanTask'}
                                data-id={-1}
                                data-statusid={status.id}
                                data-y={-1}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                            />
                        </StatusTasks>
                    </StatusContainer>
                );
            })}
            <Modal
                open={!!openTaskId}
                onClose={() => {
                    dispatch({
                        type: 'setComponentState',
                        componentName: 'kanban',
                        state: {
                            openTaskId: 0,
                        },
                    });
                }}
            >
                <TaskModalWrapper>
                    <PageComponent projectId={projectId} pageId={openTaskId} headless={false} />
                </TaskModalWrapper>
            </Modal>
        </KanbanContainer>
    );
};

export default Kanban;
