import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import Modal from '@material-ui/core/Modal';
import { useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { TargetType } from '../type/gantt';
import { floor, ceil, ceilfloor, topbottom, useQuery } from '../lib/utils';
import { getTimedelta, getYYYYMMDD, getHHMMSS, getMMDD, getHH, getTime, toISOLikeString } from '../lib/time';
import { IRootState } from '../type/store';
import PageComponent from '../components/page';
import Header from '../components/header';
import EditableLabel from '../components/editableLabel';
import { DateTimePicker, KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import {
    Chip,
    Input,
    MenuItem as MenuItemMui,
    Select as SelectMui,
    Button,
    Menu as MenuMui,
    FormControlLabel,
    Switch,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    TextField,
    Checkbox,
    IconButton,
} from '@material-ui/core';
import DateFnsUtils from '@date-io/date-fns';
import { spacing } from '@material-ui/system';
import commonCss from '../lib/commonCss';
import AddIcon from '@material-ui/icons/Add';
import VisibilityIcon from '@material-ui/icons/Visibility';
import FilterListIcon from '@material-ui/icons/FilterList';
import { DragHandle, ChevronLeft, Sort, ArrowDownward, ArrowUpward, ChevronRight } from '@material-ui/icons';

const filterTasks = (tasksRaw, filters, globalOperator) => {
    console.log('do filter');
    let tasks = tasksRaw;
    const globalOpFunc = {
        or: (a, b) => {
            return a || b;
        },
        and: (a, b) => {
            return a && b;
        },
    };
    const opFunc = {
        eq: (a, b) => {
            return a == b;
        },
        ge: (a, b) => {
            return a <= b;
        },
        le: (a, b) => {
            return a >= b;
        },
    };
    if (filters.filter((filter) => filter.apply).length > 0) {
        tasks = tasksRaw.filter((task) => {
            return filters
                .filter((filter) => filter.apply)
                .reduce(
                    (filtersAll, filterParam) => {
                        return globalOpFunc[globalOperator](
                            filtersAll,
                            task.properties
                                .filter((prop) => prop.id == filterParam.propertyId)[0]
                                .values.reduce((taskValuesAll, value) => {
                                    return (
                                        taskValuesAll ||
                                        opFunc[filterParam.operator](
                                            filterParam.propertyId == 2
                                                ? filterParam.operator == 'le'
                                                    ? value?.end
                                                        ? value?.end
                                                        : value?.start
                                                    : value?.start
                                                : value,
                                            filterParam.propertyId == 2 ? filterParam.value?.start : filterParam.value,
                                        )
                                    );
                                }, false),
                        );
                    },
                    globalOperator == 'or' ? false : true,
                );
        });
    }
    return tasks;
};
const sortTasks = (tasksRaw, properties, sortsObj) => {
    const compFunc = {
        title: (direction) => {
            return (taskObj1, taskObj2) => {
                return (taskObj1.value < taskObj2.value ? -1 : taskObj1.value > taskObj2.value ? 1 : 0) * direction;
            };
        },
        status: (direction) => {
            return (taskObj1, taskObj2) => {
                return (taskObj1.value < taskObj2.value ? -1 : taskObj1.value > taskObj2.value ? 1 : 0) * direction;
            };
        },
        date: (direction) => {
            return (taskObj1, taskObj2) => {
                return (
                    (taskObj1.value.start < taskObj2.value.start
                        ? -1
                        : taskObj1.value.start > taskObj2.value.start
                        ? 1
                        : 0) * direction
                );
            };
        },
        user: (direction) => {
            return (taskObj1, taskObj2) => {
                return (taskObj1.value < taskObj2.value ? -1 : taskObj1.value > taskObj2.value ? 1 : 0) * direction;
            };
        },
        label: (direction) => {
            return (taskObj1, taskObj2) => {
                return (taskObj1.value < taskObj2.value ? -1 : taskObj1.value > taskObj2.value ? 1 : 0) * direction;
            };
        },
        tag: (direction) => {
            return (taskObj1, taskObj2) => {
                return (taskObj1.value < taskObj2.value ? -1 : taskObj1.value > taskObj2.value ? 1 : 0) * direction;
            };
        },
        check: (direction) => {
            return (taskObj1, taskObj2) => {
                return (taskObj1.value < taskObj2.value ? -1 : taskObj1.value > taskObj2.value ? 1 : 0) * direction;
            };
        },
    };
    const minFunc = (arr) => {
        const min = Math.min(...arr);
        if (!min) {
            return arr[0];
        }
        return min;
    };
    let tasks = tasksRaw;
    for (const sortObj of sortsObj.filter((sortObj) => sortObj.apply)) {
        tasks = tasks
            .map((task, index) => {
                return {
                    value: minFunc(task.properties.filter((prop) => prop.id == sortObj.propertyId)[0].values),
                    index,
                };
            })
            .sort(
                compFunc[properties.filter((prop) => prop.id == sortObj.propertyId)[0].name](
                    sortObj.direction == 'desc' ? 1 : -1,
                ),
            )
            .map((sortedObj) => {
                return tasks[sortedObj.index];
            });
    }
    return tasks;
};

const c = {
    status: {
        width: 250,
    },
};

const KanbanContainer = styled.div`
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    overflow-y: auto;
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
    width: ${c.status.width};
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
const MenuIcon = styled.div`
    border-top: 10px solid #f0897f;
    border-right: 10px solid #f0897f;
    border-bottom: 10px solid transparent;
    border-left: 10px solid transparent;
    position: absolute;
    top: 0;
    left: ${c.status.width - 20};
`;

const Kanban: React.FC = () => {
    const params = useParams<any>();
    const queries = useQuery();
    const projectId = params.projectId;
    const {
        globalSettings,
        statuses,
        tasksRaw,
        filters,
        filterOperator,
        sorts,
        propertyVisibility,
        statusVisibility,
        properties,
        openTaskId,
    } = useSelector(
        (props: IRootState) => ({
            globalSettings: props.settings,
            statuses: props.projects
                .filter((project) => project.id == projectId)[0]
                .properties.filter((p) => p.id == 1)[0].values,
            tasksRaw: props.projects
                .filter((project) => project.id == projectId)[0]
                .pages.filter((page) => page.type == 'task'),
            filters: props.projects.filter((project) => project.id == projectId)[0].settings.kanbanFilters,
            filterOperator: props.projects.filter((project) => project.id == projectId)[0].settings
                .ganttFilterLigicalOperator,
            sorts: props.projects.filter((project) => project.id == projectId)[0].settings.kanbanSorts,
            propertyVisibility: props.projects.filter((project) => project.id == projectId)[0].settings
                .kanbanPropertyVisibility,
            statusVisibility: props.projects.filter((project) => project.id == projectId)[0].settings
                .kanbanStatusVisibility,
            properties: props.projects.filter((project) => project.id == projectId)[0].properties,
            openTaskId: props.componentStates.kanban.openTaskId,
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    const displayTasks = sortTasks(filterTasks(tasksRaw, filters, filterOperator), properties, sorts);
    // --------------------------------------------------------
    const selectedTaskElems = useRef([]);
    const pointedTaskElem = useRef(null);
    const currentOverElem = useRef(null);
    console.log('Kanban project', displayTasks, openTaskId);
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
        const statusId = currentOverElem.current.dataset.statusid;
        // スタイル戻し
        currentOverElem.current.style.backgroundColor = '';
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
        // タスクの入れ替え
        const newTasks = [];
        if (currentOverElem.current.dataset.id == event.target.dataset.id) {
            // 自分自身にドロップしたら、何も変更しない
            for (const task of tasksRaw) {
                newTasks.push(task);
            }
        } else if (currentOverElem.current.dataset.id == -1) {
            // 最後尾にドロップした場合
            const statusTaskEnd = tasksRaw
                .filter(
                    (task) => task.properties.filter((p) => p.id == 1)[0] == currentOverElem.current.dataset.statusid,
                )
                .slice(-1)[0];
            // ステータスに要素が1つ以上存在する場合
            if (!!statusTaskEnd) {
                for (const task of tasksRaw) {
                    if (task.id == statusTaskEnd.id) {
                        if (selectedTaskElems.current.filter((stask) => stask.dataset.id == task.id).length == 0) {
                            newTasks.push(task);
                        }
                        for (const staskElem of selectedTaskElems.current) {
                            const stask = tasksRaw.filter((task) => task.id == staskElem.dataset.id)[0];
                            newTasks.push({
                                ...stask,
                                properties: stask.properties.map((p) => {
                                    if (p.id == 1) {
                                        return { ...p, values: [statusId] };
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
                for (const task of tasksRaw) {
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
            // 全タスクに対して入れ替えを行う
            for (const task of tasksRaw) {
                // taskがドロップされたタスクの場合
                if (task.id == currentOverElem.current.dataset.id) {
                    // 同じstatus内での入れ替えで、下方向に入れ替える場合
                    if (currentOverElem.current.dataset.x == pointedTaskElem.current.dataset.x && dy > 0) {
                        // 前に挿入する
                        newTasks.push(task);
                    }
                    // 選択されているタスク全体を挿入する
                    for (const staskElem of selectedTaskElems.current) {
                        const stask = tasksRaw.filter((task) => task.id == staskElem.dataset.id)[0];
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
                    // 同じstatus内での入れ替えで、上方向に入れ替える場合
                    if (currentOverElem.current.dataset.x != pointedTaskElem.current.dataset.x || dy < 0) {
                        // 後ろに挿入する
                        newTasks.push(task);
                    }
                } else if (selectedTaskElems.current.filter((stask) => stask.dataset.id == task.id).length != 0) {
                    // taskがドロップされたタスクではなくて、かつ、選択されているタスクの場合、無視する
                    continue;
                } else {
                    // taskがドロップされたタスクではなくて、かつ、選択されているタスクでない場合、挿入する
                    newTasks.push(task);
                }
            }
        }
        // タスク編集の適用
        dispatch({
            type: 'setTasks',
            projectId: projectId,
            tasks: newTasks,
        });
        // 初期化
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
        const task = displayTasks.filter((task) => task.id == taskId)[0];
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
    const onClickAdd = (event) => {
        console.log('onClickAdd', event.currentTarget, event.currentTarget.dataset);
        const statusId = Number(event.currentTarget.dataset.statusid);
        dispatch({
            type: 'addTask',
            projectId: projectId,
            task: {
                properties: [
                    {
                        id: 1,
                        values: [statusId],
                    },
                    ...filters.map((filter) => {
                        return {
                            id: filter.propertyId,
                            values: [filter.value],
                        };
                    }),
                ],
            },
        });
    };
    // --------------------------------------------------------
    const showProperty = (taskId, propParam) => {
        switch (propParam.type) {
            case 'title':
                return (
                    <EditableLabel
                        id={`property-${taskId}-${propParam.id}`}
                        value={propParam.title}
                        setValue={(v) => setProperty(taskId, propParam.id, [v])}
                        onDoubleClick={() => {
                            onClickTask(taskId);
                        }}
                        style={{ fontSize: 22, marginBottom: 5 }}
                    />
                );
            case 'status':
                return (
                    <SelectMui
                        id={`property-${taskId}-${propParam.id}`}
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
                        input={<Input disableUnderline={true} style={{ margin: 0, padding: 0 }} />}
                        renderValue={(selected: Array<any>) => (
                            <div>
                                {selected.map((value) => (
                                    <Chip
                                        key={value.name}
                                        size="small"
                                        label={value.name}
                                        style={{ backgroundColor: value.color }}
                                    />
                                ))}
                            </div>
                        )}
                        style={{ maxHeight: '100%', maxWidth: '100%' }}
                    >
                        {propParam.allStatusObjList.map((statusObj) => (
                            <MenuItemMui
                                key={statusObj.name}
                                value={statusObj}
                                style={{
                                    backgroundColor:
                                        propParam.selectedStatusObjList.indexOf(statusObj) == -1 ? '' : '#6c6c6c80',
                                }}
                            >
                                {statusObj.name}
                            </MenuItemMui>
                        ))}
                    </SelectMui>
                );
            case 'date':
                if (!propParam.dateValues || !propParam.dateValues.length) {
                    return <span id={`property-${taskId}-${propParam.id}`}></span>;
                }
                return (
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <div style={{ width: '135px', minWidth: '135px' }}>
                            <DateTimePicker
                                id={`property-${taskId}-${propParam.id}`}
                                value={propParam.periodDate.start}
                                ampm={false}
                                invalidDateMessage={<></>}
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
                                InputProps={{ disableUnderline: true, style: { fontSize: 14 } }}
                            />
                        </div>
                    </MuiPickersUtilsProvider>
                );
            case 'user':
                return (
                    <SelectMui
                        id={`property-${taskId}-${propParam.id}`}
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
                                    <Chip
                                        key={value.name}
                                        size="small"
                                        label={value.name}
                                        style={{ backgroundColor: value.color }}
                                    />
                                ))}
                            </div>
                        )}
                        style={{ maxHeight: '100%', maxWidth: '100%' }}
                    >
                        {propParam.allUserObjList.map((userObj) => (
                            <MenuItemMui
                                key={userObj.name}
                                value={userObj}
                                style={{
                                    backgroundColor:
                                        propParam.taskUserObjList.indexOf(userObj) == -1 ? '' : '#6c6c6c80',
                                }}
                            >
                                {userObj.name}
                            </MenuItemMui>
                        ))}
                    </SelectMui>
                );
            case 'label':
                return (
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <label htmlFor={`property-${taskId}-${propParam.id}`} style={{ fontSize: 12, marginRight: 5 }}>
                            {`${propParam.name}: `}
                        </label>
                        <EditableLabel
                            id={`property-${taskId}-${propParam.id}`}
                            value={propParam.labelValues}
                            setValue={(v) => setProperty(taskId, propParam.id, [v])}
                            onDoubleClick={() => {
                                onClickTask(taskId);
                            }}
                            style={{ minWidth: 1 }}
                        />
                    </div>
                );
            case 'tag':
                return (
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <label htmlFor={`property-${taskId}-${propParam.id}`} style={{ fontSize: 12, marginRight: 5 }}>
                            {`${propParam.name}: `}
                        </label>
                        <SelectMui
                            id={`property-${taskId}-${propParam.id}`}
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
                                        <Chip
                                            key={value.name}
                                            size="small"
                                            label={value.name}
                                            style={{ backgroundColor: value.color }}
                                        />
                                    ))}
                                </div>
                            )}
                            style={{ maxHeight: '100%', maxWidth: '100%' }}
                        >
                            {propParam.tagObjs.map((tagObj) => (
                                <MenuItemMui
                                    key={tagObj.name}
                                    value={tagObj}
                                    style={{
                                        backgroundColor:
                                            propParam.selectedTagObjs.indexOf(tagObj) == -1 ? '' : '#6c6c6c80',
                                    }}
                                >
                                    {tagObj.name}
                                </MenuItemMui>
                            ))}
                        </SelectMui>
                    </div>
                );
            case 'check':
                return (
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <label htmlFor={`property-${taskId}-${propParam.id}`} style={{ fontSize: 12, marginRight: 5 }}>
                            {`${propParam.name}: `}
                        </label>
                        <input
                            id={`property-${taskId}-${propParam.id}`}
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
                    </div>
                );
        }
    };
    const displayProps = properties.filter((prop) => prop.id != 1 && propertyVisibility.indexOf(prop.id) != -1);
    const propParams = displayTasks.map((task) => {
        return {
            taskId: task.id,
            propParam: displayProps.map((prop) => {
                switch (prop.type) {
                    case 'title':
                        const title = task.properties.filter((p) => p.id == prop.id)[0].values[0] || '';
                        return { id: prop.id, name: prop.name, type: prop.type, title };
                    case 'status':
                        const allStatusObjList = properties.filter((p) => p.id == prop.id)[0].values || [];
                        const selectedStatusIds = task.properties.filter((p) => p.id == prop.id)[0].values;
                        const selectedStatusObjList = allStatusObjList.filter(
                            (statusObj) => selectedStatusIds.indexOf(statusObj.id) != -1,
                        );
                        return {
                            id: prop.id,
                            name: prop.name,
                            type: prop.type,
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
                            name: prop.name,
                            type: prop.type,
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
                            name: prop.name,
                            type: prop.type,
                            allUserObjList,
                            taskUserIdList,
                            taskUserObjList,
                        };
                    case 'label':
                        const labelValues = task.properties.filter((p) => p.id == prop.id)[0]?.values || [''];
                        return {
                            id: prop.id,
                            name: prop.name,
                            type: prop.type,
                            labelValues,
                        };
                    case 'tag':
                        const tagObjs = properties.filter((p) => p.id == prop.id)[0].values;
                        const selectedTagIds = task.properties.filter((p) => p.id == prop.id)[0]?.values || [];
                        const selectedTagObjs = tagObjs.filter((tagObj) => selectedTagIds.indexOf(tagObj.id) != -1);
                        return {
                            id: prop.id,
                            name: prop.name,
                            type: prop.type,
                            tagObjs,
                            selectedTagIds,
                            selectedTagObjs,
                        };
                    case 'check':
                        const checkValues = task.properties.filter((p) => p.id == prop.id)[0]?.values || [false];
                        return { id: prop.id, name: prop.name, type: prop.type, width: prop.width, checkValues };
                }
            }),
        };
    });
    console.log({ propParams });
    // --------------------------------------------------------
    return (
        <KanbanContainer>
            <style>{commonCss}</style>
            <div
                className="HeaderWrapper"
                style={{ position: 'sticky', left: 0, top: 0, height: 64, width: '100%', zIndex: 1 }}
            >
                <Header
                    height={64}
                    rightComponent={<RightComponent />}
                    rightComponentProps={{ projectId: projectId }}
                />
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
                {statuses
                    .filter((status) => statusVisibility.indexOf(status.id) != -1)
                    .map((status, x) => {
                        return (
                            <StatusContainer key={`statusContainer-${x}`}>
                                <StatusHeader>
                                    <span style={{ color: status.color }}>{status.name}</span>
                                </StatusHeader>
                                <StatusTasks>
                                    {displayTasks
                                        .filter(
                                            (task) =>
                                                task.properties.filter((p) => p.id == 1)[0].values[0] == status.id,
                                        )
                                        .map((task, y) => {
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
                                                    <TaskMenu projectId={projectId} taskId={task.id} />
                                                    {propParams
                                                        .filter((p) => p.taskId == task.id)[0]
                                                        .propParam.map((propParam, index) => {
                                                            return (
                                                                <div
                                                                    key={`props-${x}-${y}-${index}`}
                                                                    className="kanbanTaskItem"
                                                                    data-id={task.id}
                                                                    data-statusid={
                                                                        task.properties.filter((p) => p.id == 1)[0].id
                                                                    }
                                                                    data-x={x}
                                                                    data-y={y}
                                                                    style={{ height: 20 }}
                                                                >
                                                                    {showProperty(task.id, propParam)}
                                                                </div>
                                                            );
                                                        })}
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
                                    >
                                        <button data-statusid={status.id} onClick={onClickAdd}>
                                            <AddIcon />
                                        </button>
                                    </StatusTaskTerm>
                                </StatusTasks>
                            </StatusContainer>
                        );
                    })}
            </Main>
        </KanbanContainer>
    );
};

const TaskMenu = ({ projectId, taskId }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const dispatch = useDispatch();
    const handleClose = (event) => {
        event.stopPropagation();
        setAnchorEl(null);
    };
    const onClickOpen = (event) => {
        event.stopPropagation();
        dispatch({
            type: 'setComponentState',
            componentName: 'kanban',
            state: {
                openTaskId: taskId,
            },
        });
        handleClose(event);
    };
    const onClickDelete = (event) => {
        dispatch({
            type: 'deletePage',
            projectId: projectId,
            pageId: taskId,
        });
        handleClose(event);
    };
    return (
        <MenuIcon
            key={`menuIcon-${taskId}`}
            onClick={(event) => {
                setAnchorEl(event.currentTarget);
            }}
        >
            <MenuMui anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                <MenuItemMui onClick={onClickOpen}>open</MenuItemMui>
                <MenuItemMui onClick={onClickDelete}>delete</MenuItemMui>
            </MenuMui>
        </MenuIcon>
    );
};

const RightComponent: React.FC<any> = ({ projectId }) => {
    const { properties, settings } = useSelector(
        (props: IRootState) => ({
            properties: props.projects.filter((project) => project.id == projectId)[0].properties,
            settings: props.projects.filter((project) => project.id == projectId)[0].settings,
        }),
        shallowEqual,
    );
    return (
        <div>
            <StatusVisibility projectId={projectId} properties={properties} settings={settings} />
            <PropertyVisibility projectId={projectId} properties={properties} settings={settings} />
            <PropertyFilter projectId={projectId} properties={properties} settings={settings} />
            <PropertySort projectId={projectId} properties={properties} settings={settings} />
        </div>
    );
};
const StatusVisibility: React.FC<{ projectId: any; properties: any; settings: any }> = ({
    projectId,
    properties,
    settings,
}) => {
    const dispatch = useDispatch();
    const [anchorProperty, setAnchorProperty] = useState(null);
    return (
        <React.Fragment>
            <Button
                onClick={(event) => {
                    setAnchorProperty(event.target);
                }}
            >
                <VisibilityIcon />
            </Button>
            <MenuMui
                anchorEl={anchorProperty}
                open={!!anchorProperty}
                onClose={() => {
                    setAnchorProperty(null);
                }}
            >
                {properties
                    .filter((prop) => prop.id == 1)[0]
                    .values.map((status, index) => {
                        return (
                            <MenuItemMui key={`rightComponent-propertyMenu-${index}`}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.kanbanStatusVisibility.indexOf(status.id) != -1}
                                            onChange={(event) => {
                                                dispatch({
                                                    type: 'editKanbanStatusVisibility',
                                                    projectId: projectId,
                                                    statusId: status.id,
                                                    visibility: event.target.checked,
                                                });
                                            }}
                                            name={status.name}
                                        />
                                    }
                                    label={status.name}
                                />
                            </MenuItemMui>
                        );
                    })}
            </MenuMui>
        </React.Fragment>
    );
};
const PropertyVisibility: React.FC<{ projectId: any; properties: any; settings: any }> = ({
    projectId,
    properties,
    settings,
}) => {
    const dispatch = useDispatch();
    const [anchorProperty, setAnchorProperty] = useState(null);
    return (
        <React.Fragment>
            <Button
                onClick={(event) => {
                    setAnchorProperty(event.target);
                }}
            >
                <VisibilityIcon />
            </Button>
            <MenuMui
                anchorEl={anchorProperty}
                open={!!anchorProperty}
                onClose={() => {
                    setAnchorProperty(null);
                }}
            >
                {properties
                    .filter((prop) => prop.id != 0)
                    .map((prop, index) => {
                        return (
                            <MenuItemMui key={`rightComponent-propertyMenu-${index}`}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={settings.kanbanPropertyVisibility.indexOf(prop.id) != -1}
                                            onChange={(event) => {
                                                dispatch({
                                                    type: 'editKanbanPropertyVisibility',
                                                    projectId: projectId,
                                                    propertyId: prop.id,
                                                    visibility: event.target.checked,
                                                });
                                            }}
                                            name={prop.name}
                                        />
                                    }
                                    label={prop.name}
                                />
                            </MenuItemMui>
                        );
                    })}
            </MenuMui>
        </React.Fragment>
    );
};
const PropertyFilter: React.FC<{ projectId: any; properties: any; settings: any }> = ({
    projectId,
    properties,
    settings,
}) => {
    const dispatch = useDispatch();
    const [anchorFilter, setAnchorFilter] = useState(null);
    const onClickAdd = () => {
        dispatch({
            type: 'addKanbanFilter',
            projectId: projectId,
            filter: {},
        });
    };
    return (
        <React.Fragment>
            <Button
                aria-controls="filter-menu"
                onClick={(event) => {
                    setAnchorFilter(event.target);
                }}
            >
                <FilterListIcon />
            </Button>
            <MenuMui
                id="filter-menu"
                anchorEl={anchorFilter}
                open={!!anchorFilter}
                onClose={() => {
                    setAnchorFilter(null);
                }}
            >
                <MenuItemMui>
                    <List>
                        <ListItem>
                            Filter
                            <SelectMui
                                value={settings.kanbanFilterLigicalOperator}
                                onChange={(event) => {
                                    dispatch({
                                        type: 'setKanbanFilterLigicalOperator',
                                        projectId: projectId,
                                        operator: event.target.value,
                                    });
                                }}
                            >
                                <MenuItemMui value={'or'}>Or</MenuItemMui>
                                <MenuItemMui value={'and'}>And</MenuItemMui>
                            </SelectMui>
                        </ListItem>
                        <ListItem>
                            <table>
                                <tbody>
                                    {settings.kanbanFilters.map((filter, index) => {
                                        return (
                                            <PropertyFilterRow
                                                key={`filter-${index}`}
                                                projectId={projectId}
                                                properties={properties}
                                                filter={filter}
                                            />
                                        );
                                    })}
                                </tbody>
                            </table>
                        </ListItem>
                        <ListItem
                            button
                            onClick={() => {
                                onClickAdd();
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar>
                                    <AddIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary="Add filter" />
                        </ListItem>
                    </List>
                </MenuItemMui>
            </MenuMui>
        </React.Fragment>
    );
};
const PropertyFilterRow: React.FC<{ projectId: any; properties: any; filter: any }> = ({
    projectId,
    properties,
    filter,
}) => {
    console.log('FilterRow', filter);
    const { users } = useSelector(
        (props: IRootState) => ({
            users: props.settings.users,
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    const onChangeFilter = (key, value) => {
        const newFilter = key == 'propertyId' ? { [key]: value, value: '' } : { [key]: value };
        dispatch({
            type: 'setKanbanFilter',
            projectId: projectId,
            filterId: filter.id,
            filter: newFilter,
        });
    };
    const onApply = (event) => {
        onChangeFilter('apply', event.target.checked);
    };
    const ops = (propId) => {
        const property = properties.filter((prop) => prop.id == propId)[0];
        switch (property.type) {
            case 'title':
                return ['eq'];
            case 'status':
                return ['eq'];
            case 'date':
                return ['eq', 'ge', 'le'];
            case 'user':
                return ['eq'];
            case 'label':
                return ['eq'];
            case 'tag':
                return ['eq'];
            case 'check':
                return ['eq'];
            default:
                return ['eq'];
        }
    };
    const valuesComponent = (propId) => {
        const property = properties.filter((prop) => prop.id == propId)[0];
        switch (property.type) {
            case 'title':
            case 'label':
                return (
                    <TextField
                        value={filter.value}
                        onChange={(event) => {
                            onChangeFilter('value', event.target.value);
                        }}
                    />
                );
            case 'status':
            case 'tag':
                return (
                    <SelectMui
                        value={filter.value}
                        onChange={(event) => {
                            onChangeFilter('value', event.target.value);
                        }}
                    >
                        {property.values.map((v, index) => {
                            return (
                                <MenuItemMui key={index} value={v.id}>
                                    {v.name}
                                </MenuItemMui>
                            );
                        })}
                    </SelectMui>
                );
            case 'date':
                return (
                    <TextField
                        id="datetime-local"
                        type="datetime-local"
                        value={toISOLikeString(filter.value?.start)}
                        onChange={(event) => {
                            onChangeFilter('value', { start: getTime(new Date(event.target.value)), end: null });
                        }}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                );
            case 'user':
                return (
                    <SelectMui
                        value={filter.value}
                        onChange={(event) => {
                            onChangeFilter('value', event.target.value);
                        }}
                    >
                        {users.map((u, index) => {
                            return (
                                <MenuItemMui key={index} value={u.id}>
                                    {u.name}
                                </MenuItemMui>
                            );
                        })}
                    </SelectMui>
                );
            case 'check':
                return (
                    <Checkbox
                        checked={Boolean(filter.value)}
                        onChange={(event) => {
                            onChangeFilter('value', event.target.checked);
                        }}
                    />
                );
            default:
                return undefined;
        }
    };
    return (
        <tr>
            <td>
                <SelectMui
                    value={filter.propertyId}
                    onChange={(event) => {
                        onChangeFilter('propertyId', Number(event.target.value));
                    }}
                >
                    {properties.map((prop, index) => {
                        return (
                            <MenuItemMui key={`PropertyFilterRow-propsId-${index}`} value={prop.id}>
                                {prop.name}
                            </MenuItemMui>
                        );
                    })}
                </SelectMui>
            </td>
            <td>
                <SelectMui
                    value={filter.operator}
                    onChange={(event) => {
                        onChangeFilter('operator', event.target.value);
                    }}
                >
                    {ops(filter.propertyId).map((op, index) => {
                        switch (op) {
                            case 'eq':
                                return (
                                    <MenuItemMui key={`PropertyFilterRow-op-${index}`} value={op}>
                                        <DragHandle />
                                    </MenuItemMui>
                                );
                            case 'ge':
                                return (
                                    <MenuItemMui key={`PropertyFilterRow-op-${index}`} value={op}>
                                        <ChevronLeft />
                                    </MenuItemMui>
                                );
                            case 'le':
                                return (
                                    <MenuItemMui key={`PropertyFilterRow-op-${index}`} value={op}>
                                        <ChevronRight />
                                    </MenuItemMui>
                                );
                        }
                    })}
                </SelectMui>
            </td>
            <td>{valuesComponent(filter.propertyId)}</td>
            <td>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Checkbox
                        checked={Boolean(filter.apply)}
                        onChange={onApply}
                        color="primary"
                        size="small"
                        style={{ padding: 0 }}
                    />
                    <span style={{ fontSize: '11px' }}>apply</span>
                </div>
            </td>
        </tr>
    );
};
const PropertySort: React.FC<{ projectId: any; properties: any; settings: any }> = ({
    projectId,
    properties,
    settings,
}) => {
    const dispatch = useDispatch();
    const [anchorSort, setAnchorSort] = useState(null);
    const onClickAdd = () => {
        dispatch({
            type: 'addKanbanSort',
            projectId: projectId,
            sort: {},
        });
    };
    return (
        <React.Fragment>
            <Button
                aria-controls="sort-menu"
                onClick={(event) => {
                    setAnchorSort(event.target);
                }}
            >
                <Sort />
            </Button>
            <MenuMui
                id="sort-menu"
                anchorEl={anchorSort}
                open={!!anchorSort}
                onClose={() => {
                    setAnchorSort(null);
                }}
            >
                <MenuItemMui>
                    <List>
                        <ListItem>
                            <table>
                                <tbody>
                                    {settings.kanbanSorts.map((sort, index) => {
                                        return (
                                            <PropertySortRow
                                                key={`sort-${index}`}
                                                projectId={projectId}
                                                properties={properties}
                                                sort={sort}
                                            />
                                        );
                                    })}
                                </tbody>
                            </table>
                        </ListItem>
                        <ListItem
                            button
                            onClick={() => {
                                onClickAdd();
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar>
                                    <AddIcon />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary="Add sort" />
                        </ListItem>
                    </List>
                </MenuItemMui>
            </MenuMui>
        </React.Fragment>
    );
};
const PropertySortRow: React.FC<{ projectId: any; properties: any; sort: any }> = ({ projectId, properties, sort }) => {
    console.log('SortRow', sort);
    const dispatch = useDispatch();
    const onChangeSort = (key, value) => {
        dispatch({
            type: 'setKanbanSort',
            projectId: projectId,
            sortId: sort.id,
            sort: {
                [key]: value,
            },
        });
    };
    const onApply = (event) => {
        onChangeSort('apply', event.target.checked);
    };
    return (
        <tr>
            <td>
                <SelectMui
                    value={sort.propertyId}
                    onChange={(event) => {
                        onChangeSort('propertyId', Number(event.target.value));
                    }}
                >
                    {properties.map((prop, index) => {
                        return (
                            <MenuItemMui key={`PropertySortRow-propsId-${index}`} value={prop.id}>
                                {prop.name}
                            </MenuItemMui>
                        );
                    })}
                </SelectMui>
            </td>
            <td>
                <SelectMui
                    value={sort.direction}
                    onChange={(event) => {
                        onChangeSort('direction', event.target.value);
                    }}
                >
                    <MenuItemMui key={`PropertyFilterRow-down`} value={'desc'}>
                        <ArrowDownward />
                    </MenuItemMui>
                    <MenuItemMui key={`PropertyFilterRow-op-up`} value={'asc'}>
                        <ArrowUpward />
                    </MenuItemMui>
                </SelectMui>
            </td>
            <td>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Checkbox
                        checked={Boolean(sort.apply)}
                        onChange={onApply}
                        color="primary"
                        size="small"
                        style={{ padding: 0 }}
                    />
                    <span style={{ fontSize: '11px' }}>apply</span>
                </div>
            </td>
        </tr>
    );
};

export default Kanban;
