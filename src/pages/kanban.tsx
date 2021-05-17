import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import Modal from '@material-ui/core/Modal';
import { useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { TargetType } from '../type/gantt';
import { floor, ceil, ceilfloor, topbottom, useQuery } from '../lib/utils';
import { getTimedelta, getYYYYMMDD, getHHMMSS, getMMDD, getHH, getTime } from '../lib/time';
import { IRootState } from '../type/store';
import PageComponent from '../components/page';
import Header from '../components/header';
import EditableLabel from '../components/editableLabel';
import { DateTimePicker, KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { Chip, Input, MenuItem, Select as SelectMui } from '@material-ui/core';
import DateFnsUtils from '@date-io/date-fns';

const KanbanContainer = styled.div`
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    overflow-y: auto;
`;
const Main = styled.div`
    height: 100%;
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
    const { globalSettings, statuses, tasks, properties, openTaskId } = useSelector(
        (props: IRootState) => ({
            globalSettings: props.settings,
            statuses: props.projects
                .filter((project) => project.id == projectId)[0]
                .properties.filter((p) => p.id == 1)[0].values,
            tasks: props.projects
                .filter((project) => project.id == projectId)[0]
                .pages.filter((page) => page.type == 'task'),
            properties: props.projects.filter((project) => project.id == projectId)[0].properties,
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
        console.log('onDragStart', event.target);
        if (event.target.className.match('kanbanTask')) {
            const target = event.target;
            pointedTaskElem.current = target;
            const taskElems = document.getElementsByClassName('kanbanTask');
            for (const taskElem of taskElems) {
                taskElem.style.opacity = '0.5';
                const wrapper = document.querySelector(`.kanbanTaskWrapper[data-id='${taskElem.dataset.id}']`);
                if (wrapper) {
                    wrapper.style.zIndex = '1';
                    wrapper.style.width = taskElem.clientWidth;
                    wrapper.style.height = taskElem.clientHeight;
                } else {
                    console.log('not found.', `.kanbanTaskWrapper[data-id='${taskElem.dataset.id}']`);
                }
            }
            const taskItemElems = document.getElementsByClassName('kanbanTaskItem');
            for (const taskItemElem of taskItemElems) {
                taskItemElem.style.zIndex = '-1';
            }
            //
            if (selectedTaskElems.current === null || selectedTaskElems.current.length == 0) {
                selectedTaskElems.current = [target];
            }
            if (currentOverElem.current === null) {
                currentOverElem.current = target.dataset.id;
            }
        }
    };
    const onDragEnd = (event) => {
        console.log('onDragEnd', currentOverElem.current, selectedTaskElems.current, event.target);
        const taskElems = document.getElementsByClassName('kanbanTask');
        for (const taskElem of taskElems) {
            taskElem.style.opacity = '';
            const wrapper = document.querySelector(`.kanbanTaskWrapper[data-id='${taskElem.dataset.id}']`);
            if (wrapper) {
                wrapper.style.zIndex = '';
                wrapper.style.width = '';
                wrapper.style.height = '';
            } else {
                console.log('not found.', `.kanbanTaskWrapper[data-id='${taskElem.dataset.id}']`);
            }
        }
        const taskItemElems = document.getElementsByClassName('kanbanTaskItem');
        for (const taskItemElem of taskItemElems) {
            taskItemElem.style.zIndex = '';
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
        console.log('onDragOver', event.target);
        let elem;
        if (Number(event.target.dataset.id) != -1) {
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
        console.log('onDragLeave', event.target);
        let elem;
        if (Number(event.target.dataset.id) != -1) {
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
    const setProperty = (taskId, propertyId, values) => {
        const task = tasks.filter((task) => task.id == taskId)[0];
        dispatch({
            type: 'setTask',
            projectId: projectId,
            pageId: taskId,
            page: {
                ...task,
                properties: task.properties.map((prop) => {
                    if (prop.id == propertyId) {
                        return {
                            id: propertyId,
                            values: values,
                        };
                    } else {
                        return { ...prop };
                    }
                }),
            },
        });
    };
    // --------------------------------------------------------
    const showProperty = useCallback((taskId, propParam) => {
        switch (propParam.type) {
            case 'title':
                return (
                    <EditableLabel
                        value={propParam.title}
                        setValue={(v) => setProperty(taskId, propParam.id, [v])}
                        onDoubleClick={() => {
                            onClickTask(taskId);
                        }}
                    />
                );
            case 'status':
                return (
                    <SelectMui
                        labelId="demo-mutiple-name-label"
                        id="demo-mutiple-name"
                        multiple
                        value={propParam.selectedStatusObjList}
                        onChange={(event) => {
                            const values: Array<any> = [...(event.target.value as Array<any>)];
                            dispatch({
                                type: 'editPageProperty',
                                projectId: projectId,
                                pageId: taskId,
                                propertyId: propParam.id,
                                property: {
                                    values: values.map((v) => v.id),
                                },
                            });
                        }}
                        input={<Input disableUnderline={true} />}
                        renderValue={(selected: Array<any>) => (
                            <div>
                                {selected.map((value) => (
                                    <Chip key={value.name} size="small" label={value.name} />
                                ))}
                            </div>
                        )}
                        style={{ maxHeight: '100%', maxWidth: '100%' }}
                    >
                        {propParam.allStatusObjList.map((statusObj) => (
                            <MenuItem
                                key={statusObj.name}
                                value={statusObj}
                                style={{
                                    backgroundColor:
                                        propParam.selectedStatusObjList.indexOf(statusObj) == -1 ? '' : '#6c6c6c80',
                                }}
                            >
                                {statusObj.name}
                            </MenuItem>
                        ))}
                    </SelectMui>
                );
            case 'date':
                if (!propParam.dateValues || !propParam.dateValues.length) {
                    return <></>;
                }
                return (
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <div style={{ display: 'flex' }}>
                            <div style={{ width: '135px', minWidth: '135px' }}>
                                <DateTimePicker
                                    value={propParam.periodDate.start}
                                    ampm={false}
                                    onChange={(date) => {
                                        console.log('datetime-local', date);
                                        dispatch({
                                            type: 'editPageProperty',
                                            projectId: projectId,
                                            pageId: taskId,
                                            propertyId: propParam.id,
                                            property: {
                                                values: [
                                                    {
                                                        start: date.getTime(),
                                                        end: propParam.periodDate.end.getTime(),
                                                    },
                                                ],
                                            },
                                        });
                                    }}
                                    showTodayButton
                                    format="yyyy/MM/dd HH:mm"
                                    InputProps={{ disableUnderline: true }}
                                />
                            </div>
                            〜
                            <div style={{ width: '135px', minWidth: '135px' }}>
                                <DateTimePicker
                                    value={propParam.periodDate.end}
                                    ampm={false}
                                    onChange={(date) => {
                                        dispatch({
                                            type: 'editPageProperty',
                                            projectId: projectId,
                                            pageId: taskId,
                                            propertyId: propParam.id,
                                            property: {
                                                values: [
                                                    {
                                                        start: propParam.periodDate.start.getTime(),
                                                        end: date.getTime(),
                                                    },
                                                ],
                                            },
                                        });
                                    }}
                                    showTodayButton
                                    format="yyyy/MM/dd HH:mm"
                                    InputProps={{ disableUnderline: true }}
                                />
                            </div>
                        </div>
                    </MuiPickersUtilsProvider>
                );
            case 'user':
                return (
                    <SelectMui
                        labelId="demo-mutiple-name-label"
                        id="demo-mutiple-name"
                        multiple
                        value={propParam.taskUserObjList}
                        onChange={(event) => {
                            const values: Array<any> = [...(event.target.value as Array<any>)];
                            dispatch({
                                type: 'editPageProperty',
                                projectId: projectId,
                                pageId: taskId,
                                propertyId: propParam.id,
                                property: {
                                    values: values.map((v) => v.id),
                                },
                            });
                        }}
                        input={<Input disableUnderline={true} />}
                        renderValue={(selected: Array<any>) => (
                            <div style={{ overflowX: 'visible' }}>
                                {selected.map((value) => (
                                    <Chip key={value.name} size="small" label={value.name} />
                                ))}
                            </div>
                        )}
                        style={{ maxHeight: '100%', maxWidth: '100%' }}
                    >
                        {propParam.allUserObjList.map((userObj) => (
                            <MenuItem
                                key={userObj.name}
                                value={userObj}
                                style={{
                                    backgroundColor:
                                        propParam.taskUserObjList.indexOf(userObj) == -1 ? '' : '#6c6c6c80',
                                }}
                            >
                                {userObj.name}
                            </MenuItem>
                        ))}
                    </SelectMui>
                );
            case 'label':
                return (
                    <EditableLabel
                        value={propParam.labelValues}
                        setValue={(v) => setProperty(taskId, propParam.id, [v])}
                        onDoubleClick={() => {
                            onClickTask(taskId);
                        }}
                    />
                );
            case 'tag':
                return (
                    <SelectMui
                        labelId="demo-mutiple-name-label"
                        id="demo-mutiple-name"
                        multiple
                        value={propParam.selectedTagObjs}
                        onChange={(event) => {
                            const values: Array<any> = [...(event.target.value as Array<any>)];
                            dispatch({
                                type: 'editPageProperty',
                                projectId: projectId,
                                pageId: taskId,
                                propertyId: propParam.id,
                                property: {
                                    values: values.map((v) => v.id),
                                },
                            });
                        }}
                        input={<Input disableUnderline={true} />}
                        renderValue={(selected: Array<any>) => (
                            <div>
                                {selected.map((value) => (
                                    <Chip key={value.name} size="small" label={value.name} />
                                ))}
                            </div>
                        )}
                        style={{ maxHeight: '100%', maxWidth: '100%' }}
                    >
                        {propParam.tagObjs.map((tagObj) => (
                            <MenuItem
                                key={tagObj.name}
                                value={tagObj}
                                style={{
                                    backgroundColor: propParam.selectedTagObjs.indexOf(tagObj) == -1 ? '' : '#6c6c6c80',
                                }}
                            >
                                {tagObj.name}
                            </MenuItem>
                        ))}
                    </SelectMui>
                );
            case 'check':
                console.log('check!');
                return (
                    <input
                        type="checkbox"
                        checked={propParam.checkValues[0]}
                        onChange={(event) => {
                            dispatch({
                                type: 'editPageProperty',
                                projectId: projectId,
                                pageId: taskId,
                                propertyId: propParam.id,
                                property: {
                                    values: [event.target.checked],
                                },
                            });
                        }}
                    />
                );
        }
    }, []);
    const displayProps = properties.filter((prop) => prop.display);
    const propParams = tasks.map((task) => {
        return displayProps.map((prop) => {
            switch (prop.type) {
                case 'title':
                    const title = task.properties.filter((p) => p.id == prop.id)[0].values[0] || '';
                    return { id: prop.id, type: prop.type, width: prop.width, title };
                case 'status':
                    const allStatusObjList = properties.filter((p) => p.id == prop.id)[0].values || [];
                    const selectedStatusIds = task.properties.filter((p) => p.id == prop.id)[0].values;
                    const selectedStatusObjList = allStatusObjList.filter(
                        (statusObj) => selectedStatusIds.indexOf(statusObj.id) != -1,
                    );
                    return {
                        id: prop.id,
                        type: prop.type,
                        width: prop.width,
                        allStatusObjList,
                        selectedStatusIds,
                        selectedStatusObjList,
                    };
                case 'date':
                    const dateValues = task.properties.filter((p) => p.id == prop.id)[0]?.values;
                    const periodDate = {
                        start: new Date(dateValues[0].start),
                        end: new Date(dateValues[0].end),
                    };
                    return {
                        id: prop.id,
                        type: prop.type,
                        width: prop.width,
                        dateValues,
                        periodDate,
                    };
                case 'user':
                    const allUserObjList = globalSettings.users;
                    const taskUserIdList = task.properties.filter((p) => p.id == prop.id)[0]?.values || [];
                    const taskUserObjList = allUserObjList.filter(
                        (userObj) => taskUserIdList.indexOf(userObj.id) != -1,
                    );
                    return {
                        id: prop.id,
                        type: prop.type,
                        width: prop.width,
                        allUserObjList,
                        taskUserIdList,
                        taskUserObjList,
                    };
                case 'label':
                    const labelValues = task.properties.filter((p) => p.id == prop.id)[0]?.values || [''];
                    return {
                        id: prop.id,
                        type: prop.type,
                        width: prop.width,
                        labelValues,
                    };
                case 'tag':
                    const tagObjs = properties.filter((p) => p.id == prop.id)[0].values;
                    const selectedTagIds = task.properties.filter((p) => p.id == prop.id)[0]?.values || [];
                    const selectedTagObjs = tagObjs.filter((tagObj) => selectedTagIds.indexOf(tagObj.id) != -1);
                    return {
                        id: prop.id,
                        type: prop.type,
                        width: prop.width,
                        tagObjs,
                        selectedTagIds,
                        selectedTagObjs,
                    };
                case 'check':
                    const checkValues = task.properties.filter((p) => p.id == prop.id)[0]?.values || [false];
                    return { id: prop.id, type: prop.type, width: prop.width, checkValues };
            }
        });
    });
    // --------------------------------------------------------
    return (
        <KanbanContainer>
            <div
                className="HeaderWrapper"
                style={{ position: 'sticky', left: 0, top: 0, height: 64, width: '100%', zIndex: 1 }}
            >
                <Header height={64} rightComponent={<></>} rightComponentProps={{ projectId: projectId }} />
            </div>
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
            <Main>
                {statuses.map((status, x) => {
                    return (
                        <StatusContainer key={`statusContainer-${x}`}>
                            <StatusHeader>
                                <span style={{ color: status.color }}>{status.name}</span>
                            </StatusHeader>
                            <StatusTasks>
                                {tasks
                                    .filter(
                                        (task) => task.properties.filter((p) => p.id == 1)[0].values[0] == status.id,
                                    )
                                    .map((task, y) => {
                                        const title = task.properties.filter((p) => p.id == 0)[0].values[0];
                                        return (
                                            <TaskContainer
                                                key={`taskContainer-${x}-${y}`}
                                                className="kanbanTask"
                                                data-id={task.id}
                                                data-statusid={task.properties.filter((p) => p.id == 1)[0].id}
                                                data-x={x}
                                                data-y={y}
                                                draggable={true}
                                                onDragStart={onDragStart}
                                                onDragEnd={onDragEnd}
                                                onDragOver={onDragOver}
                                                onDragLeave={onDragLeave}
                                                onDoubleClick={onClickTask}
                                            >
                                                <div
                                                    className="kanbanTaskItem"
                                                    data-id={task.id}
                                                    data-statusid={task.properties.filter((p) => p.id == 1)[0].id}
                                                >
                                                    <EditableLabel
                                                        data-id={task.id}
                                                        data-statusid={task.properties.filter((p) => p.id == 1)[0].id}
                                                        value={task.properties.filter((p) => p.id == 0)[0].values[0]}
                                                        setValue={(value) => {
                                                            setProperty(task.id, 0, [value]);
                                                        }}
                                                    />
                                                </div>
                                                {/*
                                                  propParams.map((propParam, index) => {
                                                    return (
                                                        <div
                                                            key={`props-${x}-${y}-${index}`}
                                                            data-statusid={task.properties.filter((p) => p.id == 1)[0]}
                                                        >
                                                            {showProperty(task.id, propParam)}
                                                        </div>
                                                    );
                                                })*/}
                                                <span className="kanbanTaskItem" data-id={task.id}>
                                                    {title}
                                                </span>
                                                <span className="kanbanTaskItem" data-id={task.id}>
                                                    dummy1
                                                </span>
                                                <span className="kanbanTaskItem" data-id={task.id}>
                                                    dummy2
                                                </span>
                                                <span
                                                    className="kanbanTaskWrapper"
                                                    data-id={task.id}
                                                    data-statusid={task.properties.filter((p) => p.id == 1)[0].id}
                                                    data-x={x}
                                                    data-y={y}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: 0,
                                                        height: 0,
                                                    }}
                                                />
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
            </Main>
        </KanbanContainer>
    );
};

export default Kanban;
