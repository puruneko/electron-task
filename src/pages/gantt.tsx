import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
    ArrowDownward,
    ArrowUpward,
    CellWifi,
    CheckBox,
    ChevronLeft,
    ChevronRight,
    DragHandle,
    Sort,
} from '@material-ui/icons';
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
    padding: 10px;
    width: 70vw;
    height: 90vh;
    max-width: 70vw;
    max-height: 90vh;
    background-color: white;
`;

const filterTasks = (tasksRaw, filters, globalOperator) => {
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
const sortTasks = (tasksRaw, project, sortsObj) => {
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
                compFunc[project.properties.filter((prop) => prop.id == sortObj.propertyId)[0].name](
                    sortObj.direction == 'desc' ? 1 : -1,
                ),
            )
            .map((sortedObj) => {
                return tasks[sortedObj.index];
            });
    }
    return tasks;
};

const Gantt: React.FC = () => {
    const locParams = useParams<any>();
    const queries = useQuery();
    const dispatch = useDispatch();
    const {
        project,
        openTaskId,
        tasksRaw,
        filters,
        filterOperator,
        sorts,
        ganttScale,
        ganttCellDivideNumber,
    } = useSelector(
        (props: IRootState) => ({
            project: props.projects.filter((project) => project.id == locParams.projectId)[0],
            tasksRaw: props.projects
                .filter((project) => project.id == locParams.projectId)[0]
                .pages.filter((page) => page.type == 'task'),
            openTaskId: props.componentStates.gantt.openTaskId,
            ganttScale: props.projects.filter((project) => project.id == locParams.projectId)[0].settings.ganttScale,
            ganttCellDivideNumber: props.projects.filter((project) => project.id == locParams.projectId)[0].settings
                .ganttCellDivideNumber,
            filters: props.projects.filter((project) => project.id == locParams.projectId)[0].settings.ganttFilters,
            filterOperator: props.projects.filter((project) => project.id == locParams.projectId)[0].settings
                .ganttFilterLigicalOperator,
            sorts: props.projects.filter((project) => project.id == locParams.projectId)[0].settings.ganttSorts,
        }),
        shallowEqual,
    );
    const displayTasks = sortTasks(filterTasks(tasksRaw, filters, filterOperator), project, sorts);
    // --------------------------------------------------------
    const cellXUnit = useRef(0);
    cellXUnit.current = ((scale) => {
        switch (scale) {
            case 'month': // 単位は[day]
                return 60 * 60 * 24 * 1000; // [ms]
            case 'date': // 単位は[hour]
                return 60 * 60 * 1000; // [ms]
        }
    })(ganttScale); //再描画後に更新するため
    const now = new Date();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    const [scrollTargetDate, setScrollTargetDate] = useState(now);
    const [cellOffset, setCellOffset] = useState({ start: 10, end: 5 });
    const calenderRangeNow = useRef({
        start: new Date(getTime(now) - cellXUnit.current * cellOffset.start), // 今の5cell前から
        end: new Date(getTime(now) + cellXUnit.current * cellOffset.end), // 30cell後まで
    });
    const [calenderRange, setCalenderRange] = useState(calenderRangeNow.current);
    const setCalenderRangeNow = (c) => {
        calenderRangeNow.current = c;
        setCalenderRange(c);
    };
    const calenderRangeDiff = ((scale) => {
        switch (scale) {
            case 'month':
                return getTimedelta(calenderRange.start, calenderRange.end).date;
            case 'date':
                return getTimedelta(calenderRange.start, calenderRange.end).hours;
        }
    })(ganttScale);
    const ganttParams = {
        ganttScale,
        cellXUnit: cellXUnit.current,
        ganttCellDivideNumber,
        calenderRange,
        calenderRangeDiff,
    };
    console.log('ganttParams', ganttParams);
    // --------------------------------------------------------
    const isMainScroll = useRef<NodeJS.Timeout>(null);
    const previousScroll = useRef({ left: 0, top: 0 });
    const onMainScroll = (event) => {
        if (previousScroll.current.left != event.target.scrollLeft && event.target.scrollLeft == 0) {
            setCellOffset({
                ...cellOffset,
                start: cellOffset.start + 10,
            });
        } else if (event.target.scrollRight == 0) {
            setCellOffset({
                ...cellOffset,
                end: cellOffset.end + 10,
            });
        }
        previousScroll.current = {
            left: event.target.scrollLeft,
            top: event.target.scrollTop,
        };
        /*
        clearTimeout(isMainScroll.current);
        isMainScroll.current = setTimeout(() => {
            const scrollWidth = event.target.scrollLeft;
            const cellDiff = scrollWidth / c.cell.width;
            const timeDiff = (cellDiff / ganttCellDivideNumber) * cellXUnit.current;
            const targetDate = new Date(calenderRangeNow.current.start.getTime() + timeDiff);
            console.log('onMainMouseUp', { scrollWidth, targetDate, cellXUnit: cellXUnit.current });
            setScrollTargetDate(targetDate);
        }, 1000);
        */
    };
    // --------------------------------------------------------
    // --------------------------------------------------------
    useEffect(() => {
        setScrollTargetDate(new Date());
        const newCalenderRange = {
            start: new Date(getTime(now) - cellXUnit.current * cellOffset.start), // 今の5cell前から
            end: new Date(getTime(now) + cellXUnit.current * cellOffset.end), // 30cell後まで
        };
        setCalenderRangeNow(newCalenderRange);
    }, [ganttScale]);
    useEffect(() => {
        const newCalenderRange = {
            start: new Date(getTime(now) - cellXUnit.current * cellOffset.start), // 今の5cell前から
            end: new Date(getTime(now) + cellXUnit.current * cellOffset.end), // 30cell後まで
        };
        setCalenderRangeNow(newCalenderRange);
    }, [cellOffset]);
    useEffect(() => {
        setCalenderRangeNow(calenderRangeNow.current);
    }, [calenderRangeNow]);

    useEffect(() => {
        //scroll量の調整
        if (scrollTargetDate) {
            const timeDiff = scrollTargetDate.getTime() - calenderRangeNow.current.start.getTime();
            const cellDiff = (timeDiff / cellXUnit.current) * ganttCellDivideNumber;
            const scrollOffset = cellDiff * c.cell.width;
            const mainElem = document.getElementById('ganttMain');
            console.log('scrollOffset', scrollOffset);
            mainElem.scrollTo({
                left: scrollOffset,
            });
        }
        // cellOffsetの調整
        if (document.getElementById('ganttCalenderContainer').clientWidth < window.innerWidth) {
            setCellOffset({
                start: cellOffset.start + 5,
                end: cellOffset.end + 5,
            });
        }
    }, []);
    // --------------------------------------------------------
    // --------------------------------------------------------
    return (
        <GanttContainer>
            <div>
                <Header
                    height={c.header.height}
                    rightComponent={<RightComponent />}
                    rightComponentProps={{ projectId: project.id }}
                />
            </div>
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
            <Main id="ganttMain" onScroll={onMainScroll}>
                <GanttTask locParams={locParams} ganttParams={ganttParams} displayTasks={displayTasks} />
                <GanttCalender locParams={locParams} ganttParams={ganttParams} displayTasks={displayTasks} />
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
    console.log('RightComponent', project);
    return (
        <div>
            <PropertyVisibility project={project} />
            <PropertyFilter project={project} />
            <PropertySort project={project} />
            <ScaleChange project={project} />
        </div>
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
                                        operator: event.target.value,
                                    });
                                }}
                            >
                                <MenuItem value={'or'}>Or</MenuItem>
                                <MenuItem value={'and'}>And</MenuItem>
                            </Select>
                        </ListItem>
                        <ListItem>
                            <table>
                                <tbody>
                                    {project.settings.ganttFilters.map((filter, index) => {
                                        return (
                                            <PropertyFilterRow
                                                key={`filter-${index}`}
                                                project={project}
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
                </MenuItem>
            </Menu>
        </React.Fragment>
    );
};
const PropertyFilterRow: React.FC<{ project: any; filter: any }> = ({ project, filter }) => {
    console.log('FilterRow', filter);
    const { users } = useSelector(
        (props: IRootState) => ({
            users: props.settings.users,
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    const properties = project.properties;
    const onChangeFilter = (key, value) => {
        const newFilter = key == 'propertyId' ? { [key]: value, value: '' } : { [key]: value };
        dispatch({
            type: 'setGanttFilter',
            projectId: project.id,
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
                            case 'ge':
                                return (
                                    <MenuItem key={`PropertyFilterRow-op-${index}`} value={op}>
                                        <ChevronLeft />
                                    </MenuItem>
                                );
                            case 'le':
                                return (
                                    <MenuItem key={`PropertyFilterRow-op-${index}`} value={op}>
                                        <ChevronRight />
                                    </MenuItem>
                                );
                        }
                    })}
                </Select>
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
const PropertySort: React.FC<{ project: any }> = ({ project }) => {
    const dispatch = useDispatch();
    const [anchorSort, setAnchorSort] = useState(null);
    const onClickAdd = () => {
        dispatch({
            type: 'addGanttSort',
            projectId: project.id,
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
                                        return <PropertySortRow key={`sort-${index}`} project={project} sort={sort} />;
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
                </MenuItem>
            </Menu>
        </React.Fragment>
    );
};
const PropertySortRow: React.FC<{ project: any; sort: any }> = ({ project, sort }) => {
    console.log('SortRow', sort);
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
const ScaleChange: React.FC<{ project: any }> = ({ project }) => {
    const { scales } = useSelector(
        (props: IRootState) => ({
            scales: props.constants.scale,
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    return (
        <Select
            value={project.settings.ganttScale}
            onChange={(event) => {
                dispatch({
                    type: 'setGanttScale',
                    projectId: project.id,
                    scale: event.target.value,
                });
            }}
        >
            {scales.map((scale, index) => {
                return (
                    <MenuItem key={`scaleChange-${index}`} value={scale}>
                        {scale}
                    </MenuItem>
                );
            })}
        </Select>
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

const GanttTask = ({ locParams, ganttParams, displayTasks }) => {
    const { globalSettings, project, filters } = useSelector(
        (props: IRootState) => ({
            globalSettings: props.settings,
            project: props.projects.filter((project) => project.id == locParams.projectId)[0],
            filters: props.projects.filter((project) => project.id == locParams.projectId)[0].settings.ganttFilters,
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    console.log('GanttTask', displayTasks);
    // --------------------------------------------------------
    const onTaskHeaderMoving = useRef(null);
    // --------------------------------------------------------
    const insertTasks = (event) => {
        const id = Number(event.target.dataset.id);
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
            task: {
                properties: filters.map((filter) => {
                    return {
                        id: filter.propertyId,
                        values: [filter.value],
                    };
                }),
            },
        });
    };
    const onTaskHeaderMouseDown = (event) => {
        const id = Number(event.target.dataset.id);
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
            id_ = Number(id.target?.dataset.id || id);
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
                const selectedStatusObjList = allStatusObjList.filter(
                    (statusObj) => selectedStatusIds.indexOf(statusObj.id) != -1,
                );
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <Select
                            labelId="demo-mutiple-name-label"
                            id="demo-mutiple-name"
                            multiple
                            value={selectedStatusObjList}
                            onChange={(event) => {
                                const values: Array<any> = [...(event.target.value as Array<any>)];
                                dispatch({
                                    type: 'editPageProperty',
                                    projectId: project.id,
                                    pageId: task.id,
                                    propertyId: propertySetting.id,
                                    property: {
                                        values: values.map((v) => v.id),
                                    },
                                });
                            }}
                            input={<Input />}
                            renderValue={(selected: Array<any>) => (
                                <div>
                                    {selected.map((value) => (
                                        <Chip key={value.name} label={value.name} />
                                    ))}
                                </div>
                            )}
                            style={{ maxHeight: '100%', maxWidth: '100%' }}
                        >
                            {allStatusObjList.map((statusObj) => (
                                <MenuItem
                                    key={statusObj.name}
                                    value={statusObj}
                                    style={{
                                        backgroundColor:
                                            selectedStatusObjList.indexOf(statusObj) == -1 ? '' : '#6c6c6c80',
                                    }}
                                >
                                    {statusObj.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </GanttTaskTag>
                );
            case 'date':
                const dateValues = task.properties.filter((p) => p.id == propertySetting.id)[0]?.values;
                if (!dateValues || !dateValues.length) {
                    return <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }} />;
                }
                const period = dateValues[0];
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <TextField
                            id="datetime-local-start"
                            type="datetime-local"
                            value={toISOLikeString(period.start)}
                            onChange={(event) => {
                                console.log('datetime-local', event.target.value);
                                dispatch({
                                    type: 'editPageProperty',
                                    projectId: project.id,
                                    pageId: task.id,
                                    propertyId: propertySetting.id,
                                    property: {
                                        values: [
                                            {
                                                start: new Date(event.target.value).getTime(),
                                                end: period.end,
                                            },
                                        ],
                                    },
                                });
                            }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            style={{ width: '190px' }}
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
                                        values: [
                                            {
                                                start: period.start,
                                                end: new Date(event.target.value).getTime(),
                                            },
                                        ],
                                    },
                                });
                            }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            style={{ width: '190px', fontSize: '10px' }}
                        />
                    </GanttTaskTag>
                );
            case 'user':
                const allUserObjList = globalSettings.users;
                const taskUserIdList = task.properties.filter((p) => p.id == propertySetting.id)[0]?.values || [];
                const taskUserObjList = allUserObjList.filter((userObj) => taskUserIdList.indexOf(userObj.id) != -1);
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <Select
                            labelId="demo-mutiple-name-label"
                            id="demo-mutiple-name"
                            multiple
                            value={taskUserObjList}
                            onChange={(event) => {
                                const values: Array<any> = [...(event.target.value as Array<any>)];
                                dispatch({
                                    type: 'editPageProperty',
                                    projectId: project.id,
                                    pageId: task.id,
                                    propertyId: propertySetting.id,
                                    property: {
                                        values: values.map((v) => v.id),
                                    },
                                });
                            }}
                            input={<Input />}
                            renderValue={(selected: Array<any>) => (
                                <div>
                                    {selected.map((value) => (
                                        <Chip key={value.name} label={value.name} />
                                    ))}
                                </div>
                            )}
                            style={{ maxHeight: '100%', maxWidth: '100%' }}
                        >
                            {allUserObjList.map((userObj) => (
                                <MenuItem
                                    key={userObj.name}
                                    value={userObj}
                                    style={{
                                        backgroundColor: taskUserObjList.indexOf(userObj) == -1 ? '' : '#6c6c6c80',
                                    }}
                                >
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
                const selectedTagObjs = tagObjs.filter((tagObj) => selectedTagIds.indexOf(tagObj.id) != -1);
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <Select
                            labelId="demo-mutiple-name-label"
                            id="demo-mutiple-name"
                            multiple
                            value={selectedTagObjs}
                            onChange={(event) => {
                                const values: Array<any> = [...(event.target.value as Array<any>)];
                                dispatch({
                                    type: 'editPageProperty',
                                    projectId: project.id,
                                    pageId: task.id,
                                    propertyId: propertySetting.id,
                                    property: {
                                        values: values.map((v) => v.id),
                                    },
                                });
                            }}
                            input={<Input />}
                            renderValue={(selected: Array<any>) => (
                                <div>
                                    {selected.map((value) => (
                                        <Chip key={value.name} label={value.name} />
                                    ))}
                                </div>
                            )}
                            style={{ maxHeight: '100%', maxWidth: '100%' }}
                        >
                            {tagObjs.map((tagObj) => (
                                <MenuItem
                                    key={tagObj.name}
                                    value={tagObj}
                                    style={{
                                        backgroundColor: selectedTagObjs.indexOf(tagObj) == -1 ? '' : '#6c6c6c80',
                                    }}
                                >
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
                        <Checkbox
                            checked={checkValues[0]}
                            onChange={(event) => {
                                dispatch({
                                    type: 'editPageProperty',
                                    projectId: project.id,
                                    pageId: task.id,
                                    propertyId: propertySetting.id,
                                    property: {
                                        values: [event.target.checked],
                                    },
                                });
                            }}
                        />
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
                {displayTasks.map((task, index) => {
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
    min-height: 100%;
    z-index: 0;
`;
const GanttCalenderHeaderParentContainer = styled.div`
    height: ${c.ganttHeader.height / 2};
    display: flex;
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

const GanttCalender = ({ locParams, ganttParams, displayTasks }) => {
    const { project, rawTasks } = useSelector(
        (props: IRootState) => ({
            project: props.projects.filter((project) => project.id == locParams.projectId)[0],
            rawTasks: props.projects
                .filter((project) => project.id == locParams.projectId)[0]
                .pages.filter((page) => page.type == 'task'),
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    // --------------------------------------------------------
    const calenderBodyParam = useRef<ICalenderElement>(null);
    const timebarDragInitial = useRef(null);
    const lastScroll = useRef<Pos>({ x: 0, y: 0 });
    const mousedownStart = useRef<Pos>({ x: -1, y: -1 });
    const selectedCElems = useRef([]);
    const keydown = useRef(null);
    const setTasks = (newTasks) => {
        dispatch({
            type: 'setTasks',
            projectId: project.id,
            tasks: newTasks,
        });
    };
    // --------------------------------------------------------
    const getElementsByClassName = (className: string): Array<HTMLElement> => {
        const elements = [...document.getElementsByClassName(className)].map((elem) => {
            return elem as HTMLElement;
        });
        return elements;
    };
    const getElementByPosition = (row: number | string, type = 'wrap'): HTMLElement => {
        return document.querySelector(`.ganttCalenderTimebarGroup[data-type='${type}'][data-row='${Number(row)}']`);
    };
    const getElementById = (id: number | string, type = 'wrap'): HTMLElement => {
        return document.querySelector(`.ganttCalenderTimebarGroup[data-type='${type}'][data-id='${Number(id)}']`);
    };
    const width2cWidth = (width: number): number => {
        return floor(width / c.cell.width);
    };
    const getCalenderElementSnapshot = (elem: HTMLElement) => {
        // スクロールが0の状態のときのパラメータ
        const scroll = getScroll();
        const rect = elem.getBoundingClientRect();
        const pos = { x: rect.left + scroll.x, y: rect.top + scroll.y };
        const size = { width: elem.offsetWidth, height: elem.offsetHeight };
        const cSize = {
            width: width2cWidth(size.width),
            height: 1,
        };
        const cell = {
            x: floor(pos.x / c.cell.width),
            y: floor(pos.y / c.cell.height),
        };
        return {
            id: Number(elem.dataset.id) || undefined,
            type: elem.dataset.type || undefined,
            pos,
            size,
            cSize,
            cell,
            row: Number(elem.dataset.row),
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
    /*
    const getNewTasks = (dr, dp) => {
        const tdi = timebarDragInitial.current;
        const modifiedIndex = [];
        const dateModifiedTasks = rawTasks.map((task, index) => {
            const selectedTimebarIds = selectedCElem.current.map((timebar) => Number(timebar.dataset.id));
            if (selectedTimebarIds.indexOf(task.id) != -1) {
                // 期間の編集
                const period = task.properties.filter((p) => p.id == 2)[0].values[0];
                const start = period.start !== null ? period.start : new Date(period.end).getTime();
                const end = period.end !== null ? period.end : new Date(period.start).getTime();
                let newStart: number;
                let newEnd: number;
                if (tdi.type == 'whole') {
                    newStart = start + dp;
                    newEnd = end + dp;
                } else if (tdi.type == 'left') {
                    newStart = start + dp;
                    newEnd = end;
                } else if (tdi.type == 'right') {
                    newStart = start;
                    newEnd = end + dp;
                }
                modifiedIndex.push(index);
                //
                return {
                    ...task,
                    properties: task.properties.map((prop) => {
                        if (prop.id == 2) {
                            return {
                                ...prop,
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
        if (tdi.type == 'whole' && dr != 0) {
            newTasks = [];
            let counter = 0;
            const taskIds = rawTasks.map((task) => task.id);
            const exchangedId = Number(
                (document.querySelector(`[data-target="row"][data-row="${tdi.pointed.row + dr}"]`) as HTMLElement)
                    .dataset.id,
            );
            const diy = taskIds.indexOf(exchangedId) - taskIds.indexOf(tdi.id);
            const unmovedTasks = dateModifiedTasks.filter((t, i) => modifiedIndex.indexOf(i) == -1);
            const targetIndex = modifiedIndex.map((i) => i + diy);
            console.log('sort param', { taskIds, exchangedId, diy, unmovedTasks, targetIndex });
            for (let i = 0; i < dateModifiedTasks.length; i++) {
                if (targetIndex.indexOf(i) != -1) {
                    newTasks.push(dateModifiedTasks[i - diy]);
                } else {
                    newTasks.push(unmovedTasks[counter]);
                    counter++;
                }
            }
        } else {
            newTasks = [...dateModifiedTasks];
        }
        return newTasks;
    };
    */
    const onTimebarDragStart = (event) => {
        const target: HTMLElement = event.target as HTMLElement;
        // timberをクリックしたか判定
        if (target.className.match('ganttCalenderTimebarGroup')) {
            const scroll = getScroll();
            const x = event.clientX + scroll.x;
            const y = event.clientY + scroll.y;
            const pointedTimebar = target;
            const selectedCElem = getCalenderElementSnapshot(pointedTimebar);
            // selectedCElemの調整
            if (selectedCElems.current.length == 0) {
                const wrap = getElementByPosition(pointedTimebar.dataset.row);
                selectedCElems.current = [selectedCElem];
                console.log('onTimebarDragStart', {
                    selectedCElem: selectedCElems.current,
                    timebarDragInitial: timebarDragInitial.current,
                });
            }
            // ドラッグ初期値の計算
            const offset = {
                x: x - selectedCElem.pos.x,
                y: y - selectedCElem.pos.y,
            };
            timebarDragInitial.current = {
                selected: {
                    ...selectedCElem,
                    offset,
                },
                pointed: {
                    cell: {
                        x: floor(x / c.cell.width),
                        y: floor(y / c.cell.height),
                    },
                },
            };
            console.log('onTimebarDragStart', {
                selectedCElem: selectedCElems.current,
                timebarDragInitial: timebarDragInitial.current,
            });
        }
    };
    const onTimebarDrag = (event) => {
        event.preventDefault();
        event.stopPropagation();
        console.log('onTimebarDrag');
        if (isDragging()) {
            //
        }
    };
    const onTimebarDragEnd = (event) => {
        const target: HTMLElement = event.target as HTMLElement;
        console.log('DRAGEND', target.className);
        if (isDragging()) {
            const tdi = timebarDragInitial.current;
            // 期間更新
            const scroll = getScroll();
            const x = event.clientX + scroll.x;
            const y = event.clientY + scroll.y;
            const judgeCell = {
                x: floor((x - tdi.selected.offset.x) / c.cell.width),
                y: floor(y / c.cell.height),
            };
            const dcell = {
                x: judgeCell.x - tdi.selected.cell.x,
                y: judgeCell.y - tdi.pointed.cell.y,
            };
            const modifiedTasks = []; // 編集されたタスク
            const modifiedIds = []; //編集されたタスクの挿入先のID
            const selectedIds = selectedCElems.current.map((elem) => elem.id); //選択されている要素のID
            const unselectedTasks = rawTasks.filter((task) => selectedIds.indexOf(task.id) == -1);
            for (let i = 0; i < displayTasks.length; i++) {
                const task = displayTasks[i];
                // 選択されていない要素
                if (selectedIds.indexOf(task.id) != -1) {
                    const period = task.properties.filter((prop) => prop.id == 2)[0].values[0];
                    const newPeriod = {
                        start: period.start + (dcell.x * ganttParams.cellXUnit) / ganttParams.ganttCellDivideNumber,
                        end: period.end + (dcell.x * ganttParams.cellXUnit) / ganttParams.ganttCellDivideNumber,
                    };
                    modifiedIds.push(displayTasks[i + dcell.y].id);
                    modifiedTasks.push({
                        ...task,
                        properties: task.properties.map((prop) => {
                            if (prop.id == 2) {
                                return {
                                    ...prop,
                                    values: [newPeriod],
                                };
                            } else {
                                return { ...prop };
                            }
                        }),
                    });
                }
            }
            console.log({ selectedIds, modifiedTasks, modifiedIds, unselectedTasks });
            let index = 0; // 選択されていない要素の現在の配列番号を記憶する
            let modifiedIndex = 0; // 選択されている要素の現在の配列番号を記憶する
            const newTasks = [];
            for (let i = 0; i < rawTasks.length; i++) {
                if (modifiedIds.indexOf(rawTasks[i].id) != -1) {
                    newTasks.push(modifiedTasks[modifiedIndex]);
                    modifiedIndex++;
                } else {
                    newTasks.push(unselectedTasks[index]);
                    index++;
                }
            }
            // タスク更新
            setTasks(newTasks);
            // 初期化
            timebarDragInitial.current = null;
            releaseSelectedCElem();
            // スクロール量の引き継ぎ
            lastScroll.current = scroll;
        }
    };
    const releaseSelectedCElem = (dataReset = true) => {
        console.log('release', dataReset);
        for (const timebar of selectedCElems.current) {
            timebar.ref.style.backgroundColor = '';
        }
        selectedCElems.current = null;
        if (dataReset) {
            selectedCElems.current = [];
        }
    };
    // --------------------------------------------------------
    const onTimebarDoubleClick = (event) => {
        console.log('double clicked');
        const task = displayTasks.filter((t) => t.id == event.target.dataset.id)[0];
        dispatch({
            type: 'setComponentState',
            componentName: 'gantt',
            state: {
                openTaskId: task.id,
            },
        });
    };
    const onCellClick = (event) => {
        const id = Number(event.target.dataset.id);
        const task = displayTasks.filter((task) => task.id == id)[0];
        const period = task.properties.filter((prop) => prop.id == 2)[0].values[0];
        if (!period || !period.start) {
            const x = event.clientX;
            const cx = floor((x - calenderBodyParam.current.pos.x) / c.cell.width);
            const start =
                ganttParams.calenderRange.start.getTime() +
                (cx / ganttParams.ganttCellDivideNumber) * ganttParams.cellXUnit;
            console.log('onCellClick', { id, task, period, cx, start });
            dispatch({
                type: 'editPageProperty',
                projectId: project.id,
                pageId: task.id,
                propertyId: 2,
                property: {
                    values: [
                        {
                            start: start,
                            end: start + ganttParams.cellXUnit / ganttParams.ganttCellDivideNumber,
                        },
                    ],
                },
            });
        }
    };
    // --------------------------------------------------------
    useEffect(() => {
        /*
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
                selectedCElem.current.push(getCalenderElementSnapshot(wrapElem));
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
                        selected.push(getCalenderElementSnapshot(timebar));
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
        */
    }, []);
    useEffect(() => {
        // calenderBodyParamを更新
        calenderBodyParam.current = getCalenderElementSnapshot(document.getElementById('GanttCalenderBody'));
        console.log('calenderBodyParam', calenderBodyParam.current);
        // スクロール量を保持
        const calenderContainer = document.getElementById('ganttCalenderContainer');
        calenderContainer.scrollTo(lastScroll.current.x, lastScroll.current.y);
    }, [calenderBodyParam.current, displayTasks]);
    // --------------------------------------------------------
    const createParentGanttLabel = () => {
        const start = ganttParams.calenderRange.start;
        const parents = [...Array(ganttParams.calenderRangeDiff).keys()].map((i) => {
            const d = new Date(start);
            switch (ganttParams.ganttScale) {
                case 'month':
                    d.setDate(start.getDate() + i);
                    return d.getMonth() + 1;
                case 'date':
                    d.setHours(start.getHours() + i);
                    return d.getDate();
            }
        });
        return [...new Set(parents)].map((i) => {
            return {
                parent: i,
                number: parents.filter((x) => x == i).length,
            };
        });
    };
    const createChildGanttLabel = () => {
        const children = [...Array(ganttParams.calenderRangeDiff).keys()].map((j) => {
            const d = new Date(ganttParams.calenderRange.start);
            switch (ganttParams.ganttScale) {
                case 'month':
                    d.setDate(d.getDate() + j);
                    return d.getDate();
                case 'date':
                    d.setHours(d.getHours() + j);
                    return d.getHours();
            }
        });
        return children;
    };
    const getTimeberWidth = (start: Date | number, end: Date | number): number => {
        let block: number;
        if (start === null || end === null) {
            block = 1;
        } else {
            const start_ = new Date(start);
            const end_ = new Date(end);
            let base;
            let s, e, c;
            switch (ganttParams.ganttScale) {
                case 'month':
                    base = floor(
                        (start_.getHours() * 60 * 60 * 1000 + (end_.getTime() - start_.getTime())) /
                            (60 * 60 * 24 * 1000),
                    );
                    s =
                        floor(
                            (start_.getHours() + start_.getMinutes() / 60 - 0.01) /
                                (24 / ganttParams.ganttCellDivideNumber),
                        ) * -1;
                    e =
                        floor(
                            (end_.getHours() + end_.getMinutes() / 60 - 0.01) /
                                (24 / ganttParams.ganttCellDivideNumber),
                        ) + 1;
                    c = e + s;
                    break;
                case 'date':
                    base = floor(
                        (start_.getMinutes() * 60 * 1000 + (end_.getTime() - start_.getTime())) / (60 * 60 * 1000),
                    );
                    s = floor((start_.getMinutes() - 0.01) / (60 / ganttParams.ganttCellDivideNumber)) * -1;
                    e = floor((end_.getMinutes() - 0.01) / (60 / ganttParams.ganttCellDivideNumber)) + 1;
                    c = e + s;
                    break;
            }
            block = base * ganttParams.ganttCellDivideNumber + c;
        }
        return c.cell.width * block;
    };
    // --------------------------------------------------------
    const GanttCalenderHeader = styled.div`
        background-color: ${c.color.header};
        width: ${ganttParams.calenderRangeDiff * (c.cell.width * ganttParams.ganttCellDivideNumber)};
        height: ${c.ganttHeader.height};
    `;
    const GanttCalenderHeaderChild = styled.div`
        width: ${c.cell.width * ganttParams.ganttCellDivideNumber};
        height: ${c.ganttHeader.height / 2};
    `;
    const GanttCalenderBody = styled.div`
        position: relative;
        width: 100%;
        display: flex;
        flex-direction: column;
    `;
    const GanttCalenderRow = styled.div`
        position: relative;
        display: flex;
        align-items: center;
        width: 100%;
        height: ${c.cell.height};
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
    const GanttCalenderCellDot = styled.div`
        width: 1px;
        height: 100%;
        background-image: linear-gradient(0deg, rgba(0, 0, 0) 50%, rgba(255, 255, 255, 0) 50% 100%);
        background-size: 100% 10px;
    `;
    const GanttCalenderCellDotSub = styled.div`
        width: 1px;
        height: 100%;
        background-image: linear-gradient(0deg, rgba(0, 0, 0) 10%, rgba(255, 255, 255, 0) 10% 100%);
        background-size: 100% 10px;
    `;
    const GanttCalenderTimebarWrap = styled.div`
        position: absolute;
        /*left: ${c.cell.width * c.timebar.marginXCoef};*/
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
                                        width: c.cell.width * ganttParams.ganttCellDivideNumber,
                                    }}
                                >
                                    {parent.parent}
                                </div>
                                <div
                                    style={{
                                        width: parent.number * c.cell.width * ganttParams.ganttCellDivideNumber,
                                    }}
                                ></div>
                            </GanttCalenderHeaderParent>
                        );
                    })}
                </GanttCalenderHeaderParentContainer>
                <GanttCalenderHeaderChildContainer>
                    {createChildGanttLabel().map((x, j) => {
                        return (
                            <GanttCalenderHeaderChild key={`calender-header-child-${j}`}>{x}</GanttCalenderHeaderChild>
                        );
                    })}
                </GanttCalenderHeaderChildContainer>
            </GanttCalenderHeader>
            <GanttCalenderBodyWrapper>
                <GanttCalenderBody id="GanttCalenderBody">
                    {displayTasks.map((task, y) => {
                        const period = task.properties.filter((p) => p.id == 2)[0].values[0];
                        const left =
                            getTimeberWidth(ganttParams.calenderRange.start, period.start) -
                            (ganttParams.calenderRange.start.getHours() != 0 ||
                            ganttParams.calenderRange.start.getMinutes() != 0
                                ? c.cell.width
                                : 0);
                        const width = !!period ? getTimeberWidth(period.start, period.end) - c.cell.width * 0.02 : 0;
                        const tps = !!period ? new Date(period.start !== null ? period.start : period.end) : null;
                        const cond = !!width && !!tps;
                        return (
                            <GanttCalenderRow
                                key={`calender-row-${y}`}
                                className="ganttCalenderRow"
                                data-id={task.id}
                                data-row={y}
                                data-target="row"
                                onClick={onCellClick}
                            >
                                {cond ? (
                                    <GanttCalenderTimebarWrap
                                        className="ganttCalenderTimebarGroup"
                                        key={`timebar-${y}`}
                                        data-id={task.id}
                                        data-row={y}
                                        data-type="wrap"
                                        style={{
                                            width,
                                            left,
                                        }}
                                    >
                                        {task.properties.filter((prop) => prop.id == 0)[0].values[0]}
                                        <GanttCalenderTimebar
                                            className="ganttCalenderTimebarGroup"
                                            draggable="true"
                                            data-id={task.id}
                                            data-row={y}
                                            data-type="whole"
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
                                                data-row={y}
                                                data-type="left"
                                                onDragStart={onTimebarDragStart}
                                                onDrag={onTimebarDrag}
                                                onDragEnd={onTimebarDragEnd}
                                            />
                                            <GanttCalenderTimebarSide
                                                className="ganttCalenderTimebarGroup"
                                                draggable="true"
                                                data-id={task.id}
                                                data-row={y}
                                                data-type="right"
                                                onDragStart={onTimebarDragStart}
                                                onDrag={onTimebarDrag}
                                                onDragEnd={onTimebarDragEnd}
                                            />
                                        </GanttCalenderTimebar>
                                    </GanttCalenderTimebarWrap>
                                ) : (
                                    <></>
                                )}
                                {[...Array(ganttParams.calenderRangeDiff).keys()].map((i) => {
                                    return (
                                        <div
                                            key={`border-${y}-${i}`}
                                            data-id={task.id}
                                            data-row={y}
                                            style={{
                                                width: c.cell.width - 1,
                                                height: c.cell.height,
                                                backgroundColor: 'transparent',
                                                borderBottom: '1px solid gray',
                                                borderRight: '1px solid gray',
                                            }}
                                        />
                                    );
                                })}
                            </GanttCalenderRow>
                        );
                    })}
                </GanttCalenderBody>
            </GanttCalenderBodyWrapper>
        </GanttCalenderContainer>
    );
};

export default Gantt;
