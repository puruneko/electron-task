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
    margin: 20px;
    padding: 0;
    border: none;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
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
    width: 80vw;
    height: 80vh;
    background-color: white;
`;

const Kanban: React.FC = () => {
    const params = useParams<any>();
    const queries = useQuery();
    const projectId = params.projectId;
    const { project, openTaskId } = useSelector(
        (props: IRootState) => ({
            project: props.projects.filter(project => project.id == projectId)[0],
            openTaskId: props.componentStates.kanban.openTaskId,
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    const selectedTaskElems = useRef([]);
    const currentOverElem = useRef(null);
    console.log('Kanban project', project, openTaskId);
    // --------------------------------------------------------
    const getContainerByTaskId = id => {
        const container = document.querySelectorAll(`.kanbanTask[data-id="${id}"]`);
        return container[0];
    };
    const onDragStart = event => {
        const target = event.target;
        const taskElems = document.getElementsByClassName('kanbanTask');
        for (const task of taskElems) {
            task.style.opacity = '0.5';
        }
        //
        if (selectedTaskElems.current === null || selectedTaskElems.current.length == 0) {
            selectedTaskElems.current = [target];
        }
        if (currentOverElem.current === null) {
            currentOverElem.current = target.dataset.id;
        }
    };
    const onDragEnd = event => {
        console.log('onDragEnd', currentOverElem.current, selectedTaskElems.current, event.target);
        const taskElems = document.getElementsByClassName('kanbanTask');
        for (const task of taskElems) {
            task.style.opacity = '';
        }
        //
        const newTasks = [];
        if (currentOverElem.current.dataset.id == event.target.dataset.id) {
            // 自分自身にドロップしたら、何も変更しない
            for (const task of project.tasks) {
                newTasks.push(task);
            }
        } else if (currentOverElem.current.dataset.id == -1) {
            // 最後尾にドロップした場合
            const statusTaskEnd = project.tasks
                .filter(task => task.statusId == currentOverElem.current.dataset.statusid)
                .slice(-1)[0];
            // ステータスに要素が1つ以上存在する場合
            if (!!statusTaskEnd) {
                for (const task of project.tasks) {
                    if (task.id == statusTaskEnd.id) {
                        if (
                            selectedTaskElems.current.filter(stask => stask.dataset.id == task.id)
                                .length == 0
                        ) {
                            newTasks.push(task);
                        }
                        for (const stask of selectedTaskElems.current) {
                            newTasks.push({
                                ...project.tasks.filter(task => task.id == stask.dataset.id)[0],
                                statusId: task.statusId,
                            });
                        }
                    } else if (
                        selectedTaskElems.current.filter(stask => stask.dataset.id == task.id)
                            .length != 0
                    ) {
                        continue;
                    } else {
                        newTasks.push(task);
                    }
                }
            } else {
                // ステータスに要素が0の場合
                for (const task of project.tasks) {
                    // taskがselectedTaskElemsの中にヒットするか
                    const stask = selectedTaskElems.current.filter(
                        stask => task.id == stask.dataset.id,
                    )[0];
                    console.log('stask', stask, !!stask);
                    // ヒットした場合
                    if (!!stask) {
                        newTasks.push({
                            ...task,
                            statusId: parseInt(currentOverElem.current.dataset.statusid),
                        });
                    } else {
                        newTasks.push(task);
                    }
                }
            }
        } else {
            for (const task of project.tasks) {
                if (task.id == currentOverElem.current.dataset.id) {
                    for (const stask of selectedTaskElems.current) {
                        newTasks.push({
                            ...project.tasks.filter(task => task.id == stask.dataset.id)[0],
                            statusId: task.statusId,
                        });
                    }
                    newTasks.push(task);
                } else if (
                    selectedTaskElems.current.filter(stask => stask.dataset.id == task.id).length !=
                    0
                ) {
                    continue;
                } else {
                    newTasks.push(task);
                }
            }
        }
        dispatch({
            type: 'setTasks',
            projectId: project.id,
            tasks: newTasks,
        });
        selectedTaskElems.current = [];
        currentOverElem.current = null;
    };
    const onDragOver = event => {
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
    const onDragLeave = event => {
        let elem;
        if (event.target.dataset.id != -1) {
            elem = getContainerByTaskId(event.target.dataset.id);
        } else {
            elem = document.querySelector(
                `.kanbanTask[data-statusid="${event.target.dataset.statusid}"]`,
            );
        }
        elem.style.backgroundColor = '';
    };
    const onClickTask = event => {
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
            {project.status.map((status, index1) => {
                return (
                    <StatusContainer key={`statusContainer-${index1}`}>
                        <StatusHeader>
                            <span style={{ color: status.color }}>{status.name}</span>
                        </StatusHeader>
                        <StatusTasks>
                            {project.tasks
                                .filter(task => task.statusId == status.id)
                                .map((task, index2) => {
                                    return (
                                        <TaskContainer
                                            key={`taskContainer-${index1}-${index2}`}
                                            className={'kanbanTask'}
                                            data-id={task.id}
                                            data-statusid={task.statusId}
                                            data-y={index2}
                                            draggable={true}
                                            onDragStart={onDragStart}
                                            onDragEnd={onDragEnd}
                                            onDragOver={onDragOver}
                                            onDragLeave={onDragLeave}
                                            onClick={onClickTask}
                                        >
                                            <span data-id={task.id}>{task.title}</span>
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
                isOpen={!!openTaskId}
                open={!!openTaskId}
                onRequestClose={() => {
                    dispatch({
                        type: 'setComponentState',
                        componentName: 'kanban',
                        state: {
                            openTaskId: 0,
                        },
                    });
                }}
                onClose={() => {
                    dispatch({
                        type: 'setComponentState',
                        componentName: 'kanban',
                        state: {
                            openTaskId: 0,
                        },
                    });
                }}
                hideBackdrop={true}
            >
                <TaskModalWrapper>
                    <PageComponent projectId={project.id} pageId={openTaskId} headless={false} />
                </TaskModalWrapper>
            </Modal>
        </KanbanContainer>
    );
};

export default Kanban;
