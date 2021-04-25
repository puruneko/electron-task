import React, { memo, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import Modal from '@material-ui/core/Modal';
import { useParams } from 'react-router-dom';
import { createDispatchHook, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { TargetType } from '../type/gantt';
import { floor, ceil, ceilfloor, topbottom, useQuery, createDict, between } from '../lib/utils';
import { getTimedelta, getYYYYMMDD, getHHMMSS, getMMDD, getHH, getTime, toISOLikeString } from '../lib/time';
import { IRootState } from '../type/store';
import { Second, Period, Pos, CalenderPeriod, ITimebarDragInitial, ICalenderElement } from '../type/gantt';
import {
    Avatar,
    Button,
    Checkbox,
    Chip,
    FormControlLabel,
    IconButton,
    Input,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Menu,
    MenuItem,
    requirePropFactory,
    Select,
    Switch,
    TextField,
} from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import VisibilityIcon from '@material-ui/icons/Visibility';
import FilterListIcon from '@material-ui/icons/FilterList';
import EditableLabel from '../components/editableLabel';
import PageComponent from '../components/page';
import Header from '../components/header';
import { ArrowDownward, ArrowUpward, CheckBox, ChevronLeft, ChevronRight, DragHandle, Sort } from '@material-ui/icons';
import { KeyboardDatePicker } from '@material-ui/pickers';

const c = {
    color: {
        header: 'gray',
        body: 'lightgray',
        multiSelected: 'rgba(0, 181, 51, 0.5)',
        dragArea: 'rgba(0, 12, 181, 0.5)',
    },
    borderCss: `border-right: 1px solid black;
    border-bottom: 1px solid black;`,
    header: {
        height: 64,
    },
    ganttHeader: {
        height: 50,
    },
    task: {
        container: {
            leftMargin: 30,
            width: 300,
            zIndex: 5,
        },
    },
    calenderBody: {
        zIndex: 0,
    },
    cell: {
        width: 40,
        height: 40,
        zIndex: 1,
    },
    timebar: {
        marginXCoef: 0.05,
        yShrinkCoef: 0.8,
        sideWidthCoef: 0.2,
        zIndex: 2,
    },
};

const GanttContainer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
`;

const Main = styled.div`
    position: absolute;
    top: ${c.header.height};
    left: 0;
    width: 100%;
    min-width: 100%;
    height: calc(100% - ${c.header.height}px);
    min-height: calc(100% - ${c.header.height}px);
    overflow-y: scroll;
    overflow-x: scroll;
    display: flex;
`;
const SelectedArea = styled.div`
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    z-index: 100;
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

const filterTasks = (tasksRaw, filters, globalOperator) => {
    let tasks = tasksRaw;
    const globalOpFunc = {
        'or': (a,b) => {return a || b},
        'and': (a,b) => {return a && b},
    }
    const opFunc = {
        'eq': (a,b) => { return a == b },
        'gt': (a,b) => { return a < b },
        'lt': (a,b) => { return a > b },
    }
    if (filters.filter(filter=>filter.apply).length > 0) {
        tasks = tasksRaw.filter((task) => {
            return filters.filter(filter=>filter.apply).reduce((filtersAll, filterParam) => {
                return globalOpFunc[globalOperator](
                    filtersAll,
                    task.properties.filter(prop=>prop.id==filterParam.propertyId)[0].values.reduce((taskValuesAll, value) => {
                        return taskValuesAll || opFunc[filterParam.operator](
                            filterParam.propertyId == 3 ? filterParam.operator == 'lt' ? value.end : value.start : value,
                            filterParam.propertyId == 3 ? getTime(new Date(filterParam.value)) : filterParam.value,
                        )
                    }, false)
                )
            }, globalOperator=='or' ? false : true)
        })
    }
    return tasks
}
const sortTasks = (tasksRaw, project, sortsObj) => {
    const compFunc = {
        title: (direction) => {
            return (taskObj1, taskObj2) => {
                return (taskObj1.value < taskObj2.value ? -1 : (taskObj1.value > taskObj2.value ? 1 : 0)) * direction
            }
        },
        status: (direction) => {
            return (taskObj1, taskObj2) => {
                return (taskObj1.value < taskObj2.value ? -1 : (taskObj1.value > taskObj2.value ? 1 : 0)) * direction
            }
        },
        date:  (direction) => {
            return (taskObj1, taskObj2) => {
                return (taskObj1.value.start < taskObj2.value.start ? -1 : (taskObj1.value.start > taskObj2.value.start ? 1 : 0)) * direction
            }
        },
        user:  (direction) => {
            return (taskObj1, taskObj2) => {
                return (taskObj1.value < taskObj2.value ? -1 : (taskObj1.value > taskObj2.value ? 1 : 0)) * direction
            }
        },
        label: (direction) => {
            return (taskObj1, taskObj2) => {
                return (taskObj1.value < taskObj2.value ? -1 : (taskObj1.value > taskObj2.value ? 1 : 0)) * direction
            }
        },
        tag: (direction) => {
            return (taskObj1, taskObj2) => {
                return (taskObj1.value < taskObj2.value ? -1 : (taskObj1.value > taskObj2.value ? 1 : 0)) * direction
            }
        },
        check: (direction) => {
            return (taskObj1, taskObj2) => {
                return (taskObj1.value < taskObj2.value ? -1 : (taskObj1.value > taskObj2.value ? 1 : 0)) * direction
            }
        },
    }
    const minFunc = (arr) => {
        const min = Math.min(...arr)
        if (!min) {
            return arr[0]
        }
        return min
    }
    let tasks = tasksRaw;
    for (const sortObj of sortsObj.filter(sortObj=>sortObj.apply)) {
        tasks = tasks.map((task,index)=>{
            return {value: minFunc(task.properties.filter(prop=>prop.id==sortObj.propertyId)[0].values), index}
        }).sort(
            compFunc[
                project.properties.filter(prop=>prop.id==sortObj.propertyId)[0].name
            ](sortObj.direction == 'desc' ? 1 : -1)
        ).map((sortedObj) => {
            return tasks[sortedObj.index]
        })
    }
    return tasks
}

const Gantt: React.FC = () => {
    const locParams = useParams<any>();
    const queries = useQuery();
    const dispatch = useDispatch();
    const { project, openTaskId, scrollTarget, headerStates, tasksRaw, filters, filterOperator, sorts } = useSelector(
        (props: IRootState) => ({
            project: props.projects.filter((project) => project.id == locParams.projectId)[0],
            openTaskId: props.componentStates.gantt.openTaskId,
            scrollTarget: props.componentStates.gantt.scrollTarget,
            headerStates: props.componentStates.header,
            tasksRaw: props.projects.filter((project) => project.id == locParams.projectId)[0].pages.filter(page=>page.type=='task'),
            filters: props.projects.filter((project) => project.id == locParams.projectId)[0].settings.ganttFilters,
            filterOperator: props.projects.filter((project) => project.id == locParams.projectId)[0].settings.ganttFilterLigicalOperator,
            sorts: props.projects.filter((project) => project.id == locParams.projectId)[0].settings.ganttSorts,
        }),
        shallowEqual,
    );
    const tasks = sortTasks(filterTasks(tasksRaw, filters, filterOperator), project, sorts)
    // --------------------------------------------------------
    const ganttScale = project.settings.ganttScale;
    const cellXUnit = ((scale) => {
        switch (scale) {
            case 'date':
                return 60 * 60 * 24 * 1000; // [ms]
        }
    })(ganttScale);
    const cellDivideNumber = project.settings.ganttCellDivideNumber;
    const now = new Date();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    const calenderRange: Period = {
        start: new Date(getTime(now) - cellXUnit * 1), // 今の1cell前から
        end: new Date(getTime(now) + cellXUnit * 30), // 30cell後まで
    };
    const calenderRangeDiff = getTimedelta(calenderRange.start, calenderRange.end).date;
    const ganttParams = {
        ganttScale,
        cellXUnit,
        cellDivideNumber,
        calenderRange,
        calenderRangeDiff,
    };
    // --------------------------------------------------------
    const isMainScroll = useRef(false);
    const onMainScroll = (event) => {
        isMainScroll.current = true;
    };
    const onMainMouseUp = (event) => {
        const scrollOffset = event.target.scrollLeft;
        const targetDate = new Date(
            ((scrollOffset / c.cell.width) * ganttParams.cellXUnit) / ganttParams.cellDivideNumber +
                ganttParams.calenderRange.start.getTime(),
        );
        console.log('scrollOffset', scrollOffset, 'scroll', targetDate);
        dispatch({
            type: 'setComponentState',
            componentName: 'gantt',
            state: {
                scrollTarget: targetDate,
            },
        });
        isMainScroll.current = false;
    };
    // --------------------------------------------------------
    // --------------------------------------------------------
    useEffect(() => {
        document.addEventListener('mouseup', (event) => {
            if (isMainScroll.current) {
                onMainMouseUp(event);
            }
        });
    }, [project]);
    useEffect(() => {
        //scroll量の調整
        if (scrollTarget) {
            const timeDiff = scrollTarget.getTime() - calenderRange.start.getTime();
            const cellDiff = (timeDiff / ganttParams.cellXUnit) * ganttParams.cellDivideNumber;
            const scrollOffset = cellDiff * c.cell.width;
            const mainElem = document.getElementById('ganttMain');
            console.log('scrollOffset', scrollOffset);
            mainElem.scrollTo(scrollOffset, 0);
        }
    }, [scrollTarget]);
    // --------------------------------------------------------
    return (
        <GanttContainer>
            <Header
                height={c.header.height}
                rightComponent={<RightComponent />}
                rightComponentProps={{ projectId: project.id }}
            />
            <Main id="ganttMain" onScroll={onMainScroll}>
                <SelectedArea id="selectedArea" />
                <Modal
                    open={!!openTaskId}
                    onClose={() => {
                        dispatch({
                            type: 'setComponentState',
                            componentName: 'gantt',
                            state: {
                                openTaskId: 0,
                            },
                        });
                    }}
                >
                    <TaskModalWrapper>
                        <PageComponent projectId={project.id} pageId={openTaskId} headless={false} />
                    </TaskModalWrapper>
                </Modal>
                <GanttTask locParams={locParams} ganttParams={ganttParams} tasks={tasks} />
                <GanttCalender locParams={locParams} ganttParams={ganttParams} tasks={tasks} />
            </Main>
        </GanttContainer>
    );
};
const RightComponent: React.FC<any> = ({ projectId }) => {
    const { project } = useSelector(
        (props: IRootState) => ({
            project: props.projects.filter((project) => project.id == projectId)[0],
        }),
        shallowEqual,
    );
    console.log('RightComponent', project)
    return (
        <React.Fragment>
            <PropertyVisibility project={project} />
            <PropertyFilter project={project} />
            <PropertySort project={project} />
        </React.Fragment>
    );
};
const PropertyVisibility: React.FC<{ project: any }> = ({ project }) => {
    const dispatch = useDispatch();
    const [anchorProperty, setAnchorProperty] = useState(null);
    return (
        <React.Fragment>
            <Button
                aria-controls="property-menu"
                onClick={(event) => {
                    setAnchorProperty(event.target);
                }}
            >
                <VisibilityIcon />
            </Button>
            <Menu
                id="property-menu"
                anchorEl={anchorProperty}
                open={!!anchorProperty}
                onClose={() => {
                    setAnchorProperty(null);
                }}
            >
                {project.properties
                    .filter((prop) => prop.id != 0)
                    .map((prop, index) => {
                        return (
                            <MenuItem key={`rightComponent-propertyMenu-${index}`}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={prop.display}
                                            onChange={(event) => {
                                                dispatch({
                                                    type: 'editProperty',
                                                    projectId: project.id,
                                                    propertyId: prop.id,
                                                    property: { display: event.target.checked },
                                                });
                                            }}
                                            name={prop.name}
                                        />
                                    }
                                    label={prop.name}
                                />
                            </MenuItem>
                        );
                    })}
            </Menu>
        </React.Fragment>
    );
};
const PropertyFilter: React.FC<{ project: any }> = ({ project }) => {
    const dispatch = useDispatch();
    const [anchorFilter, setAnchorFilter] = useState(null);
    const onClickAdd = () => {
        dispatch({
            type: 'addGanttFilter', 
            projectId: project.id,
            filter: {},
        })
    }
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
            <Menu
                id="filter-menu"
                anchorEl={anchorFilter}
                open={!!anchorFilter}
                onClose={() => {
                    setAnchorFilter(null);
                }}
            >
                <MenuItem>
                    <List>
                        <ListItem>
                            Filter
                            <Select
                            value={project.settings.ganttFilterLigicalOperator}
                            onChange={(event) => {
                                dispatch({
                                    type: 'setGanttFilterLigicalOperator',
                                    projectId: project.id,
                                    operator: event.target.value
                                })
                            }}>
                                <MenuItem value={'or'}>Or</MenuItem>
                                <MenuItem value={'and'}>And</MenuItem>
                            </Select>
                        </ListItem>
                        <ListItem>
                        <table>
                            <tbody>
                        {project.settings.ganttFilters.map((filter, index) => {
                            return (
                                    <PropertyFilterRow key={`filter-${index}`} project={project} filter={filter} />
                            );
                        })}
                        </tbody>
                        </table>
                        </ListItem>
                        <ListItem
                            button
                            onClick={() => {
                                onClickAdd()
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
                </MenuItem>
            </Menu>
        </React.Fragment>
    );
};
const PropertyFilterRow: React.FC<{ project: any; filter: any }> = ({ project, filter }) => {
    console.log('FilterRow', filter)
    const { users } = useSelector(
        (props: IRootState) => ({
            users: props.settings.users,
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    const properties = project.properties;
    const onChangeFilter = (key, value) => {
        dispatch({
            type: 'setGanttFilter',
            projectId: project.id,
            filterId: filter.id,
            filter: {
                [key]: value,
            },
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
                return ['eq', 'gt', 'lt'];
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
                    <Select
                        value={filter.value}
                        onChange={(event) => {
                            onChangeFilter('value', event.target.value);
                        }}
                    >
                        {property.values.map((v, index) => {
                            return (
                                <MenuItem key={index} value={v.id}>
                                    {v.name}
                                </MenuItem>
                            );
                        })}
                    </Select>
                );
            case 'date':
                return (
                    <TextField
                        id="datetime-local"
                        type="datetime-local"
                        value={filter.value}
                        onChange={(event) => {
                            onChangeFilter('value', event.target.value);
                        }}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                );
            case 'user':
                return (
                    <Select
                        value={filter.value}
                        onChange={(event) => {
                            onChangeFilter('value', event.target.value);
                        }}
                    >
                        {users.map((u, index) => {
                            return (
                                <MenuItem key={index} value={u.id}>
                                    {u.name}
                                </MenuItem>
                            );
                        })}
                    </Select>
                );
            case 'check':
                return (
                    <Checkbox
                        checked={Boolean(filter.value)}
                        onChange={(event) => {
                            onChangeFilter('value', event.target.value);
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
            <Select
                value={filter.propertyId}
                onChange={(event) => {
                    onChangeFilter('propertyId', Number(event.target.value));
                }}
            >
                {properties.map((prop, index) => {
                    return (
                        <MenuItem key={`PropertyFilterRow-propsId-${index}`} value={prop.id}>
                            {prop.name}
                        </MenuItem>
                    );
                })}
            </Select>
            </td>
            <td>
            <Select
                value={filter.operator}
                onChange={(event) => {
                    onChangeFilter('operator', event.target.value);
                }}
            >
                {ops(filter.propertyId).map((op, index) => {
                    switch (op) {
                        case 'eq':
                            return (
                                <MenuItem key={`PropertyFilterRow-op-${index}`} value={op}>
                                    <DragHandle />
                                </MenuItem>
                            );
                        case 'gt':
                            return (
                                <MenuItem key={`PropertyFilterRow-op-${index}`} value={op}>
                                    <ChevronLeft />
                                </MenuItem>
                            );
                        case 'lt':
                            return (
                                <MenuItem key={`PropertyFilterRow-op-${index}`} value={op}>
                                    <ChevronRight />
                                </MenuItem>
                            );
                    }
                })}
            </Select>
            </td>
            <td>
            {valuesComponent(filter.propertyId)}
            </td>
            <td>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Checkbox checked={Boolean(filter.apply)} onChange={onApply} color="primary" size="small" style={{ padding: 0 }} />
                <span style={{ fontSize: '11px' }}>apply</span>
            </div>
            </td>
        </tr>
    );
};
const PropertySort: React.FC<{ project: any }> = ({ project }) => {
    const dispatch = useDispatch();
    const [anchorSort, setAnchorSort] = useState(null);
    const onClickAdd = () => {
        dispatch({
            type: 'addGanttSort', 
            projectId: project.id,
            sort: {},
        })
    }
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
            <Menu
                id="sort-menu"
                anchorEl={anchorSort}
                open={!!anchorSort}
                onClose={() => {
                    setAnchorSort(null);
                }}
            >
                <MenuItem>
                    <List>
                        <ListItem>
                        <table>
                            <tbody>
                        {project.settings.ganttSorts.map((sort, index) => {
                            return (
                                    <PropertySortRow key={`sort-${index}`} project={project} sort={sort} />
                            );
                        })}
                        </tbody>
                        </table>
                        </ListItem>
                        <ListItem
                            button
                            onClick={() => {
                                onClickAdd()
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
                </MenuItem>
            </Menu>
        </React.Fragment>
    );
};
const PropertySortRow: React.FC<{ project: any; sort: any }> = ({ project, sort }) => {
    console.log('SortRow', sort)
    const dispatch = useDispatch();
    const properties = project.properties;
    const onChangeSort = (key, value) => {
        dispatch({
            type: 'setGanttSort',
            projectId: project.id,
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
            <Select
                value={sort.propertyId}
                onChange={(event) => {
                    onChangeSort('propertyId', Number(event.target.value));
                }}
            >
                {properties.map((prop, index) => {
                    return (
                        <MenuItem key={`PropertySortRow-propsId-${index}`} value={prop.id}>
                            {prop.name}
                        </MenuItem>
                    );
                })}
            </Select>
            </td>
            <td>
            <Select
                value={sort.direction}
                onChange={(event) => {
                    onChangeSort('direction', event.target.value);
                }}
            >
                <MenuItem key={`PropertyFilterRow-down`} value={'desc'}>
                    <ArrowDownward />
                </MenuItem>
                <MenuItem key={`PropertyFilterRow-op-up`} value={'asc'}>
                    <ArrowUpward />
                </MenuItem>
            </Select>
            </td>
            <td>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Checkbox checked={Boolean(sort.apply)} onChange={onApply} color="primary" size="small" style={{ padding: 0 }} />
                <span style={{ fontSize: '11px' }}>apply</span>
            </div>
            </td>
        </tr>
    );
};

const GanttTaskContainer = styled.div`
    position: sticky;
    top: 0;
    left: 0;
    /*min-width: 100px; ${c.task.container.width};*/
    min-height: 100%;
    background-color: ${c.color.body};
    z-index: ${c.task.container.zIndex};
`;
const GanttTaskHeader = styled.div`
    width: calc(100%-${c.task.container.leftMargin}px);
    height: ${c.ganttHeader.height};
    background-color: ${c.color.header};
    display: flex;
    padding-left: ${c.task.container.leftMargin};
`;
const GanttTaskHeaderItem = styled.div`
    position: relative;
    overflow: hidden;
    ${c.borderCss}
`;
const GanttTaskHeaderItemSelector = styled.div`
    position: absolute;
    top: 0;
    right: 0;
    width: 5px;
    height: 100%;
    background-color: transparent;
    cursor: col-resize;
`;
const GanttTaskList = styled.div``;
const GanttTaskRow = styled.div`
    display: flex;
    width: 100%;
    height: ${c.cell.height};
`;
const GanttTaskAdd = styled.div`
    width: ${c.task.container.leftMargin};
    opacity: 0;
`;
const GanttTaskTags = styled.div`
    display: flex;
    align-items: center;
    height: ${c.cell.height};
    max-height: ${c.cell.height};
`;
const GanttTaskTag = styled.div`
    overflow: hidden;
    height: ${c.cell.height};
    max-height: ${c.cell.height};
    ${c.borderCss}
`;

const GanttTask = ({ locParams, ganttParams, tasks }) => {
    const { globalSettings, project } = useSelector(
        (props: IRootState) => ({
            globalSettings: props.settings,
            project: props.projects.filter((project) => project.id == locParams.projectId)[0],
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    console.log('GanttTask', tasks)
    // --------------------------------------------------------
    const onTaskHeaderMoving = useRef(null);
    // --------------------------------------------------------
    const insertTasks = (event) => {
        const id = parseInt(event.target.dataset.id);
        console.log('insertTasks', id);
        dispatch({
            type: 'insertTaskAbove',
            projectId: project.id,
            taskId: id,
        });
    };
    const addTasks = () => {
        dispatch({
            type: 'addTask',
            projectId: project.id,
        });
    }
    const onTaskHeaderMouseDown = (event) => {
        const id = parseInt(event.target.dataset.id);
        const rect = event.target.getBoundingClientRect();
        onTaskHeaderMoving.current = {
            id: id,
            width: project.properties.filter((prop) => prop.id == id)[0].width,
            left: rect.left,
        };
        console.log('onTaskHeaderMouseDown', onTaskHeaderMoving.current);
    };
    const onTaskHeaderMouseMove = (event) => {
        if (onTaskHeaderMoving.current) {
            const x = event.clientX;
            const dx = x - onTaskHeaderMoving.current.left;
            console.log('x', x, 'dx', dx, 'left', onTaskHeaderMoving.current.left);
            dispatch({
                type: 'editProperty',
                projectId: project.id,
                propertyId: onTaskHeaderMoving.current.id,
                property: {
                    width: onTaskHeaderMoving.current.width + dx,
                },
            });
        }
    };
    const onTaskHeaderMouseUp = (event) => {
        onTaskHeaderMoving.current = null;
    };
    const setProperty = (pageId, propertyId, values) => {
        const task = project.pages.filter((page) => page.id == pageId)[0];
        dispatch({
            type: 'setTask',
            projectId: project.id,
            pageId: pageId,
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
    const onClickTask = (id) => {
        let id_ = id;
        if (typeof id_ != 'number') {
            id_ = parseInt(id.target?.dataset.id || id);
        }
        dispatch({
            type: 'setComponentState',
            componentName: 'gantt',
            state: {
                openTaskId: id_,
            },
        });
    };
    // --------------------------------------------------------
    useEffect(() => {
        document.addEventListener('mousemove', (event) => {
            onTaskHeaderMouseMove(event);
        });
        document.addEventListener('mouseup', (event) => {
            onTaskHeaderMouseUp(event);
        });
    }, []);
    // --------------------------------------------------------
    const showProperty = (task, propertySetting) => {
        const width = project.properties.filter((prop) => prop.id == propertySetting.id)[0].width;
        switch (propertySetting.type) {
            case 'title':
                console.log('make title', task)
                const title = task.properties.filter((p) => p.id == propertySetting.id)[0].values[0] || '';
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <EditableLabel
                            value={title}
                            setValue={(v) => setProperty(task.id, propertySetting.id, [v])}
                            onDoubleClick={() => {
                                onClickTask(task.id);
                            }}
                        />
                    </GanttTaskTag>
                );
            case 'status':
                const allStatusObjList = project.properties.filter((p) => p.id == propertySetting.id)[0]?.values || [];
                const selectedStatusIds = task.properties.filter((prop) => prop.id == propertySetting.id)[0].values;
                const selectedStatusObjList = allStatusObjList.filter((statusObj)=>selectedStatusIds.indexOf(statusObj.id) != -1)
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <Select
                            labelId="demo-mutiple-name-label"
                            id="demo-mutiple-name"
                            multiple
                            value={selectedStatusObjList}
                            onChange={(event)=>{
                                dispatch({
                                    type: 'editPageProperty',
                                    projectId: project.id,
                                    pageId: task.id,
                                    propertyId: propertySetting.id,
                                    property: {
                                        values: event.target.value.map(v=>v.id),
                                    }
                                })}
                            }
                            input={<Input />}
                            renderValue={(selected: Array<any>) => (
                                <div>
                                  {selected.map((value) => (
                                    <Chip key={value.name} label={value.name}/>
                                  ))}
                                </div>
                              )}
                            style={{maxHeight: '100%', maxWidth: '100%'}}
                        >
                        {allStatusObjList.map((statusObj) => (
                            <MenuItem key={statusObj.name} value={statusObj} style={{backgroundColor: selectedStatusObjList.indexOf(statusObj) == -1 ? '' : '#6c6c6c80'}}>
                            {statusObj.name}
                            </MenuItem>
                        ))}
                        </Select>
                    </GanttTaskTag>
                );
            case 'date':
                const dateValues = task.properties.filter((p) => p.id == propertySetting.id)[0]?.values;
                if (!dateValues || !dateValues.length) {
                    return (
                        <GanttTaskTag
                            key={`property-${propertySetting.type}-${task.id}`}
                            style={{ width }}
                        />
                    );
                }
                const period = dateValues[0];
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <TextField
                            id="datetime-local-start"
                            type="datetime-local"
                            value={toISOLikeString(period.start)}
                            onChange={(event) => {
                                console.log('datetime-local', event.target.value)
                                dispatch({
                                    type: 'editPageProperty',
                                    projectId: project.id,
                                    pageId: task.id,
                                    propertyId: propertySetting.id,
                                    property: {
                                        values: [{
                                            start: (new Date(event.target.value)).getTime(),
                                            end: period.end,
                                        }]
                                    }
                                })
                            }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            style={{width: '190px'}}
                        />
                        〜
                        <TextField
                            id="datetime-local-end"
                            type="datetime-local"
                            value={toISOLikeString(period.end)}
                            onChange={(event) => {
                                dispatch({
                                    type: 'editPageProperty',
                                    projectId: project.id,
                                    pageId: task.id,
                                    propertyId: propertySetting.id,
                                    property: {
                                        values: [{
                                            start: period.start,
                                            end: (new Date(event.target.value)).getTime(),
                                        }]
                                    }
                                })
                            }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            style={{width: '190px', fontSize: '10px'}}
                        />
                    </GanttTaskTag>
                );
            case 'user':
                const allUserObjList = globalSettings.users;
                const taskUserIdList = task.properties.filter((p) => p.id == propertySetting.id)[0]?.values || [];
                const taskUserObjList = allUserObjList.filter((userObj) => taskUserIdList.indexOf(userObj.id) != -1)
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <Select
                            labelId="demo-mutiple-name-label"
                            id="demo-mutiple-name"
                            multiple
                            value={taskUserObjList}
                            onChange={(event)=>{dispatch({
                                type: 'editPageProperty',
                                projectId: project.id,
                                pageId: task.id,
                                propertyId: propertySetting.id,
                                property: {
                                    values: event.target.value.map(v=>v.id),
                                }
                            })}}
                            input={<Input />}
                            renderValue={(selected: Array<any>) => (
                                <div>
                                  {selected.map((value) => (
                                    <Chip key={value.name} label={value.name}/>
                                  ))}
                                </div>
                              )}
                            style={{maxHeight: '100%', maxWidth: '100%'}}
                        >
                        {allUserObjList.map((userObj) => (
                            <MenuItem key={userObj.name} value={userObj} style={{backgroundColor: taskUserObjList.indexOf(userObj) == -1 ? '' : '#6c6c6c80'}}>
                            {userObj.name}
                            </MenuItem>
                        ))}
                        </Select>
                    </GanttTaskTag>
                );
            case 'label':
                const labelValues = task.properties.filter((p) => p.id == propertySetting.id)[0]?.values || [''];
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <EditableLabel
                            value={labelValues}
                            setValue={(v) => setProperty(task.id, propertySetting.id, [v])}
                            onDoubleClick={() => {
                                onClickTask(task.id);
                            }}
                        />
                    </GanttTaskTag>
                );
            case 'tag':
                const tagObjs = project.properties.filter((p) => p.id == propertySetting.id)[0].values;
                const selectedTagIds = task.properties.filter((p) => p.id == propertySetting.id)[0]?.values || [];
                const selectedTagObjs = tagObjs.filter((tagObj) => selectedTagIds.indexOf(tagObj.id) != -1)
                console.log('tag', tagObjs, selectedTagIds, selectedTagObjs)
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <Select
                            labelId="demo-mutiple-name-label"
                            id="demo-mutiple-name"
                            multiple
                            value={selectedTagObjs}
                            onChange={(event)=>{
                                dispatch({
                                    type: 'editPageProperty',
                                    projectId: project.id,
                                    pageId: task.id,
                                    propertyId: propertySetting.id,
                                    property: {
                                        values: event.target.value.map(v=>v.id),
                                    }
                                })}
                            }
                            input={<Input />}
                            renderValue={(selected: Array<any>) => (
                                <div>
                                  {selected.map((value) => (
                                    <Chip key={value.name} label={value.name}/>
                                  ))}
                                </div>
                              )}
                            style={{maxHeight: '100%', maxWidth: '100%'}}
                        >
                        {tagObjs.map((tagObj) => (
                            <MenuItem key={tagObj.name} value={tagObj} style={{backgroundColor: selectedTagObjs.indexOf(tagObj) == -1 ? '' : '#6c6c6c80'}}>
                            {tagObj.name}
                            </MenuItem>
                        ))}
                        </Select>
                    </GanttTaskTag>
                );
            case 'check':
                const checkValues = task.properties.filter((p) => p.id == propertySetting.id)[0]?.values || [false];
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <Checkbox checked={checkValues[0]} onChange={(event)=>{dispatch({
                                type: 'editPageProperty',
                                projectId: project.id,
                                pageId: task.id,
                                propertyId: propertySetting.id,
                                property: {
                                    values: [event.target.checked],
                                }
                            })}} />
                    </GanttTaskTag>
                );
        }
    };
    // --------------------------------------------------------
    return (
        <GanttTaskContainer>
            <GanttTaskHeader>
                {project.properties
                    .filter((prop) => prop.display)
                    .map((prop, index) => {
                        return (
                            <GanttTaskHeaderItem
                                key={`ganttTaskHeader-${index}`}
                                style={{
                                    width: project.properties.filter((p) => p.id == prop.id)[0].width,
                                }}
                            >
                                {prop.name}
                                <GanttTaskHeaderItemSelector
                                    data-id={prop.id}
                                    onMouseDown={onTaskHeaderMouseDown}
                                    onMouseMove={onTaskHeaderMouseMove}
                                    onMouseUp={onTaskHeaderMouseUp}
                                />
                            </GanttTaskHeaderItem>
                        );
                    })}
            </GanttTaskHeader>
            <GanttTaskList>
                {tasks.map((task, index) => {
                    return (
                        <GanttTaskRow key={`task-row-${index}`} data-id={task.id} className="ganttTaskRow">
                            <GanttTaskAdd>
                                <AddIcon data-id={task.id} onClick={insertTasks} />
                            </GanttTaskAdd>
                            <GanttTaskTags>
                                {project.properties
                                    .filter((prop) => prop.display)
                                    .map((prop) => {
                                        return showProperty(task, prop);
                                    })}
                            </GanttTaskTags>
                        </GanttTaskRow>
                    );
                })}
                <GanttTaskRow key={`task-row--1`} data-id={'-1'} className="ganttTaskRow">
                    <GanttTaskAdd />
                    <GanttTaskTags>
                        <AddIcon data-id={'-1'} onClick={addTasks} />
                    </GanttTaskTags>
                </GanttTaskRow>
            </GanttTaskList>
        </GanttTaskContainer>
    );
};

const GanttCalenderContainer = styled.div`
    /*margin-left: ${c.task.container.width};*/
    min-width: 100vw;
    min-height: 100%;
    z-index: 0;
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
const GanttCalenderBodyWrapper = styled.div`
    position: relative;
    width: 100%;
    background-color: ${c.color.body};
`;

const GanttCalender = ({ locParams, ganttParams, tasks }) => {
    const { globalSettings, project } = useSelector(
        (props: IRootState) => ({
            globalSettings: props.settings,
            project: props.projects.filter((project) => project.id == locParams.projectId)[0],
            openTaskId: props.componentStates.gantt.openTaskId,
            scrollTarget: props.componentStates.gantt.scrollTarget,
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    // --------------------------------------------------------
    const calenderBodyParam = useRef<ICalenderElement>(null);
    const timebarDragInitial = useRef<ITimebarDragInitial>(null);
    const lastScroll = useRef<Pos>({ x: 0, y: 0 });
    const mousedownStart = useRef<Pos>({ x: -1, y: -1 });
    const selectedCElem = useRef<Array<ICalenderElement>>([]);
    const keydown = useRef(null);
    const setTasks = (newTasks) => {
        dispatch({
            type: 'setTasks',
            projectId: project.id,
            tasks: newTasks,
        });
    };
    // --------------------------------------------------------
    const GanttCalenderHeader = styled.div`
        background-color: ${c.color.header};
        width: ${ganttParams.calenderRangeDiff * c.cell.width * ganttParams.cellDivideNumber + c.task.container.width};
        height: ${c.ganttHeader.height};
    `;
    const GanttCalenderHeaderChild = styled.div`
        width: ${c.cell.width * ganttParams.cellDivideNumber};
        height: ${c.ganttHeader.height / 2};
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
        const start = ganttParams.calenderRange.start;
        const parents = [...Array(ganttParams.calenderRangeDiff).keys()].map((i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d.getMonth() + 1;
        });
        return [...new Set(parents)].map((i) => {
            return {
                parent: i,
                number: parents.filter((x) => x == i).length,
            };
        });
    };
    const getElementsByClassName = (className: string): Array<HTMLElement> => {
        const elements = [...document.getElementsByClassName(className)].map((elem) => {
            return elem as HTMLElement;
        });
        return elements;
    };
    const getElementByPosition = (x: number | string, y: number | string, targetType = 'wrap'): HTMLElement => {
        const elems = document.querySelectorAll(`[data-target='${targetType}']`);
        if (!elems || !elems.length) {
            return null;
        }
        const elem = [...elems].filter(
            (e: HTMLElement) => parseInt(e.dataset.y) == parseInt(`${y}`) && parseInt(e.dataset.x) == parseInt(`${x}`),
        )[0];
        if (!elem) {
            return null;
        }
        return elem as HTMLElement;
    };
    const getTimeberWidth = (start: Date | number, end: Date | number): number => {
        let block: number;
        if (start === null || end === null) {
            block = 1;
        } else {
            const start_ = new Date(start);
            const end_ = new Date(end);
            switch (ganttParams.ganttScale) {
                case 'date':
                    const days = end_.getDate() - start_.getDate();
                    const startDivideNumber = floor(start_.getHours() / (24 / ganttParams.cellDivideNumber));
                    const endDivideNumber = floor(end_.getHours() / (24 / ganttParams.cellDivideNumber));
                    block = days * ganttParams.cellDivideNumber + 1 + endDivideNumber - startDivideNumber;
                    break;
            }
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
    const onTimebarDragStart = (event) => {
        const target: HTMLElement = event.target as HTMLElement;
        // timberをクリックしたか判定
        if (target.className.match('ganttCalenderTimebarGroup')) {
            console.log('DRAGSTART', 'scrollLeft', target.scrollLeft);
            event.dataTransfer.setDragImage(new Image(), 0, 0);
            // 代表要素
            const pointedTimebar = target;
            if (selectedCElem.current.length == 0) {
                const wrap = getElementByPosition(pointedTimebar.dataset.x, pointedTimebar.dataset.y);
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
                    ...selectedCElem.current.map((timebar) => {
                        return timebar.pos.x;
                    }),
                ),
                y: Math.min(
                    ...selectedCElem.current.map((timebar) => {
                        return timebar.pos.y;
                    }),
                ),
            };
            const allSize = {
                width:
                    Math.max(
                        ...selectedCElem.current.map((timebar) => {
                            return timebar.pos.x + timebar.size.width;
                        }),
                    ) - allPos.x,
                height:
                    Math.max(
                        ...selectedCElem.current.map((timebar) => {
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
            const tasksProtectedCellCount = selectedCElem.current.map((timebar) => {
                const task = tasks.filter((t) => t.id == timebar.dataset.id)[0];
                const period = task.properties.filter((p) => p.id == 3)[0].values[0];
                const diff = (getTime(new Date(period.end)) - getTime(new Date(period.start))) / ganttParams.cellXUnit;
                return diff - Math.trunc(diff) < 1.0 / ganttParams.cellDivideNumber ? 1 : 0;
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
                        const cell = getElementByPosition(wrapCElem.cell.x + index, wrapCElem.cell.y, 'cell');
                        cell.style.backgroundColor = 'rgba(179, 179, 179, 0.5)';
                    }
                }
                console.log('DRAG whole');
            } else if (targetType == 'left') {
                for (const timebar of selectedCElem.current) {
                    const wrapElem = getElementByPosition(timebar.dataset.x, timebar.dataset.y);
                    const wrapCElem = getCalemderElementSnapshot(wrapElem);
                    // スタイル適用
                    const updatedCell = getElementByPosition(wrapCElem.cell.x, wrapCElem.cell.y, 'cell');
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
    const onTimebarDrag = (event) => {
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
                        .map((timebar) => {
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
                    tdi.all.pos.x + tdi.all.size.width + dx + c.cell.width * 0.01 < cbp.pos.x + cbp.size.width;
                const updateY =
                    tdi.all.pos.y + dy - c.cell.height * 0.1 > cbp.pos.y &&
                    tdi.all.pos.y + tdi.all.size.height + dy + c.cell.height * 0.01 < cbp.pos.y + cbp.size.height;
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
                    if (wrapCElem.cell.x != updatedWrapCElem.cell.x || wrapCElem.cell.y != updatedWrapCElem.cell.y) {
                        // 消す
                        for (const index of [...Array(cellWidth).keys()]) {
                            const cell = getElementByPosition(wrapCElem.cell.x + index, wrapCElem.cell.y, 'cell');
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
                    if (wrapCElem.cell.x != updatedWrapCElem.cell.x || wrapCElem.cell.y != updatedWrapCElem.cell.y) {
                        // スタイル戻し
                        const cell = getElementByPosition(wrapCElem.cell.x, wrapCElem.cell.y, 'cell');
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
    const onTimebarDragEnd = (event) => {
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
                corDx = topbottom(tdi.all.pos.x - cbp.pos.x + dx, cbp.size.width - tdi.all.size.width, 0);
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
            const corDy = topbottom(tdi.all.pos.y - cbp.pos.y + dy, cbp.size.height - tdi.all.size.height, 0);
            const cx = width2cellNum(corDx);
            const cy = height2cellNum(corDy);
            let dcx;
            if (tdi.targetType == 'whole') {
                dcx = topbottom(
                    cx - baseCellX,
                    width2cellNum(cbp.pos.x + cbp.size.width - (tdi.all.pos.x + tdi.all.size.width)),
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
                    width2cellNum(cbp.pos.x + cbp.size.width - (tdi.all.pos.x + tdi.all.size.width)),
                    -width2cellNum(tdi.min.size.width) + tdi.protectedCellCount,
                );
                console.log(
                    'DRAGEND right',
                    tdi.targetType,
                    'dcx default',
                    cx - baseCellX,
                    'topvalue',
                    width2cellNum(cbp.pos.x + cbp.size.width - (tdi.all.pos.x + tdi.all.size.width)),
                    'bottomvalue',
                    -width2cellNum(tdi.min.size.width) + tdi.protectedCellCount,
                );
            }
            const dcy = cy - baseCellY;
            const dp = dcx * (ganttParams.cellXUnit / ganttParams.cellDivideNumber); // [ms]
            const selectedTimebarIds = selectedCElem.current.map((timebar) => parseInt(timebar.dataset.id as string));
            console.log('DRAGEND', 'param', {
                x,
                dx,
                corDx,
                corDy,
                cx,
                dcx,
                dp,
                tdi,
            });
            const modifiedIndex = [];
            const dateModifiedTasks = tasks.map((task, index) => {
                if (selectedTimebarIds.indexOf(task.id) != -1) {
                    // 期間の編集
                    const period = task.properties.filter((p) => p.id == 3)[0].values[0];
                    const start = period.start !== null ? period.start : (new Date(period.end)).getTime();
                    const end = period.end !== null ? period.end : (new Date(period.start)).getTime();
                    let newStart: number;
                    let newEnd: number;
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
                        properties: task.properties.map((prop) => {
                            if (prop.id == 3) {
                                return {
                                    id: 3,
                                    values: [
                                        {
                                            start: newStart,
                                            end: newEnd,
                                        },
                                    ],
                                };
                            } else {
                                return { ...prop };
                            }
                        }),
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
                        const newone = {
                            ...dateModifiedTasks[modifiedIndex[modifiedCounter]],
                        };
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
    const onTimebarDoubleClick = (event) => {
        console.log('double clicked');
        const task = tasks.filter((t) => t.id == event.target.dataset.id)[0];
        dispatch({
            type: 'setComponentState',
            componentName: 'gantt',
            state: {
                openTaskId: task.id,
            },
        });
    };
    // --------------------------------------------------------
    useEffect(() => {
        //eventListenerの登録
        document.addEventListener('keydown', (event) => {
            console.log('key', event.key);
            if (event.key == 'Control') {
                keydown.current = event.key;
            }
        });
        document.addEventListener('keyup', () => {
            keydown.current = null;
        });
        document.addEventListener('mousedown', (event) => {
            const target: HTMLElement = event.target as HTMLElement;
            console.log('document.mousedown', target, target.className, mousedownStart.current, target.tagName);
            // cellのクリック
            if (target.tagName == 'DIV' && target.className?.match('ganttCalenderCell')) {
                // 範囲内のtimebarを元に戻す
                releaseSelectedCElem();
                // マウス移動の起点を作成
                if (mousedownStart.current.x == -1 && mousedownStart.current.y == -1) {
                    mousedownStart.current = {
                        x: event.clientX,
                        y: event.clientY,
                    };
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
                target.tagName == 'DIV' &&
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
        document.addEventListener('mousemove', (event) => {
            // マウス起点が作られていたら、移動したぶんだけ長方形を描画
            if (mousedownStart.current.x >= 0 && mousedownStart.current.y >= 0) {
                // 長方形描画
                const x = event.clientX;
                const y = event.clientY;
                const sx = mousedownStart.current.x;
                const sy = mousedownStart.current.y;
                const dx = x - sx;
                const dy = y - sy;
                const left = dx > 0 ? sx : x;
                const top = dy > 0 ? sy : y;
                const width = Math.abs(dx);
                const height = Math.abs(dy);
                const selectedAreaElem = document.getElementById('selectedArea');
                selectedAreaElem.style.display = 'block';
                selectedAreaElem.style.position = 'fixed';
                selectedAreaElem.style.top = `${top}px`;
                selectedAreaElem.style.left = `${left}px`;
                selectedAreaElem.style.width = `${width}px`;
                selectedAreaElem.style.height = `${height}px`;
                selectedAreaElem.style.backgroundColor = c.color.dragArea;
                // 範囲内のtimebarを反転
                const timebars = getElementsByClassName('ganttCalenderTimebarGroup').filter(
                    (e) => e.dataset.target == 'wrap',
                );
                const selected = [];
                for (const timebar of timebars) {
                    const rect = timebar.getBoundingClientRect();
                    const w = timebar.offsetWidth;
                    const h = timebar.offsetHeight;
                    // 領域内の場合
                    if (
                        (between(rect.left, x, sx) || between(rect.left + w, x, sx)) &&
                        (between(rect.top, y, sy) || between(rect.top + h, y, sy))
                    ) {
                        timebar.style.backgroundColor = c.color.multiSelected;
                        selected.push(getCalemderElementSnapshot(timebar));
                        // 領域外の場合
                    } else {
                        timebar.style.backgroundColor = '';
                    }
                }
                console.log('document.mousemove', timebars, selected);
                selectedCElem.current = selected;
            }
        });
        document.addEventListener('mouseup', (event) => {
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
        calenderBodyParam.current = getCalemderElementSnapshot(document.getElementById('GanttCalenderBody'));
        console.log('calenderBodyParam', calenderBodyParam.current);
        // スクロール量を保持
        const calenderContainer = document.getElementById('ganttCalenderContainer');
        calenderContainer.scrollTo(lastScroll.current.x, lastScroll.current.y);
    }, [calenderBodyParam.current, tasks]);
    // --------------------------------------------------------
    return (
        <GanttCalenderContainer id="ganttCalenderContainer">
            <GanttCalenderHeader>
                <GanttCalenderHeaderParentContainer>
                    {createParentGanttLabel().map((parent, index) => {
                        return (
                            <GanttCalenderHeaderParent key={`calender-header-parent-${index}`}>
                                <div
                                    style={{
                                        position: 'sticky',
                                        left: 0,
                                        width: c.cell.width * ganttParams.cellDivideNumber,
                                    }}
                                >
                                    {parent.parent}
                                </div>
                                <div
                                    style={{
                                        width: parent.number * c.cell.width * ganttParams.cellDivideNumber,
                                    }}
                                ></div>
                            </GanttCalenderHeaderParent>
                        );
                    })}
                </GanttCalenderHeaderParentContainer>
                <GanttCalenderHeaderChildContainer>
                    {[...Array(ganttParams.calenderRangeDiff).keys()].map((j) => {
                        const d = new Date(ganttParams.calenderRange.start);
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
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                        }}
                    >
                        test
                    </div>
                    {tasks.map((task, y) => {
                        const period = task.properties.filter((p) => p.id == 3)[0].values[0];
                        const width = !!period ? getTimeberWidth(period.start, period.end) - c.cell.width * 0.02 : 0;
                        const tps = !!period ? new Date(period.start !== null ? period.start : period.end) : null;
                        return (
                            <GanttCalenderRow key={`calender-row-${y}`}>
                                {[...Array(ganttParams.calenderRangeDiff * ganttParams.cellDivideNumber).keys()].map(
                                    (x) => {
                                        const s = new Date(ganttParams.calenderRange.start);
                                        s.setHours(s.getHours() + x * (24 / ganttParams.cellDivideNumber));
                                        const year = width && s.getFullYear() == tps.getFullYear();
                                        const month = width && s.getMonth() + 1 == tps.getMonth() + 1;
                                        const date = width && s.getDate() == tps.getDate();
                                        const hour =
                                            width && ceilfloor(s.getHours() / 24) == ceilfloor(tps.getHours() / 24);
                                        return (
                                            <GanttCalenderCell
                                                key={`calender-cell-${y}-${x}`}
                                                className="ganttCalenderCell"
                                                data-x={x}
                                                data-y={y}
                                                data-target="cell"
                                            >
                                                {width && year && month && date && hour ? (
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
                                    },
                                )}
                            </GanttCalenderRow>
                        );
                    })}
                </GanttCalenderBody>
            </GanttCalenderBodyWrapper>
        </GanttCalenderContainer>
    );
};

export default Gantt;
