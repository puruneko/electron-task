import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import Modal from '@material-ui/core/Modal';
import { useParams } from 'react-router-dom';
import { createDispatchHook, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { TargetType } from '../type/gantt';
import { floor, ceil, ceilfloor, topbottom, useQuery, createDict, between, useEffectSkip } from '../lib/utils';
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
    Select as SelectMui,
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
import 'date-fns';
import DateFnsUtils from '@date-io/date-fns';
import { DateTimePicker, KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import { Multiselect } from 'multiselect-react-dropdown';

const gtime = new Date();
const c = {
    color: {
        header: 'white',
        body: '#cccccc',
        timebar: 'rgb(84,184,137)',
        multiSelected: 'rgba(77,169,155, 0.5)',
        dragArea: 'rgba(0, 12, 181, 0.5)',
    },
    borderCss: {
        borderRight: '1px solid black',
        borderBottom: '1px solid black',
    },
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

const Gantt: React.FC = () => {
    const locParams = useParams<any>();
    const queries = useQuery();
    const dispatch = useDispatch();
    const {
        projectId,
        properties,
        openTaskId,
        tasksRaw,
        filters,
        filterOperator,
        sorts,
        ganttScale,
        cellDivideNumber,
    } = useSelector(
        (props: IRootState) => ({
            projectId: props.projects.filter((project) => project.id == locParams.projectId)[0].id,
            properties: props.projects.filter((project) => project.id == locParams.projectId)[0].properties,
            tasksRaw: props.projects
                .filter((project) => project.id == locParams.projectId)[0]
                .pages.filter((page) => page.type == 'task'),
            openTaskId: props.componentStates.gantt.openTaskId,
            ganttScale: props.projects.filter((project) => project.id == locParams.projectId)[0].settings.ganttScale,
            cellDivideNumber: props.projects.filter((project) => project.id == locParams.projectId)[0].settings
                .ganttCellDivideNumber,
            filters: props.projects.filter((project) => project.id == locParams.projectId)[0].settings.ganttFilters,
            filterOperator: props.projects.filter((project) => project.id == locParams.projectId)[0].settings
                .ganttFilterLigicalOperator,
            sorts: props.projects.filter((project) => project.id == locParams.projectId)[0].settings.ganttSorts,
        }),
        shallowEqual,
    );
    const displayTasks = sortTasks(filterTasks(tasksRaw, filters, filterOperator), properties, sorts);
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
    const [cellOffset, setCellOffset] = useState({ start: 10, end: 10 });
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
    const [taskHeaderWidth, setTaskHeaderWidth] = useState(
        properties
            .filter((prop) => prop.display)
            .reduce((pre, current) => {
                return pre + current.width + 1;
            }, 0),
    );
    const calenderHeaderWidth = calenderRangeDiff * cellDivideNumber * c.cell.width;
    const ganttParams = {
        ganttScale,
        cellXUnit: cellXUnit.current,
        cellDivideNumber,
        calenderRange,
        calenderRangeDiff,
        taskHeaderWidth,
    };
    console.log('ganttParams', ganttParams);
    // --------------------------------------------------------
    const tailRef = useRef(null);
    const previousScroll = useRef({ left: 0, top: 0 });
    const onGnattScroll = (event) => {
        if (previousScroll.current.left != event.target.scrollLeft && event.target.scrollLeft == 0) {
            setCellOffset({
                ...cellOffset,
                start: cellOffset.start + 10,
            });
        } else if (tailRef.current.getBoundingClientRect().left < event.target.offsetWidth) {
            setCellOffset({
                ...cellOffset,
                end: cellOffset.end + 10,
            });
        }
        previousScroll.current = {
            left: event.target.scrollLeft,
            top: event.target.scrollTop,
        };
    };
    // --------------------------------------------------------
    const itemSelectorDragParam = useRef(null);
    const onItemSelectorDragStart = (event) => {
        const ref = document.querySelector(`.GanttTaskHeaderItem[data-id='${event.target.dataset.id}']`) as HTMLElement;
        itemSelectorDragParam.current = {
            ref,
            width: ref.style.width,
            x: event.clientX,
        };
    };
    const onItemSelectorDrag = (event) => {
        const x = event.clientX;
        const y = event.clinetY;
        if (itemSelectorDragParam.current && x != 0 && y != 0) {
            const dx = x - itemSelectorDragParam.current.x;
            itemSelectorDragParam.current.ref.style.width =
                Number(itemSelectorDragParam.current.width.replace('px', '')) + dx;
        }
    };
    const onItemSelectorDragEnd = (event) => {
        dispatch({
            type: 'editProperty',
            projectId: projectId,
            propertyId: Number(event.target.dataset.id),
            property: {
                width: Number(itemSelectorDragParam.current.ref.style.width.replace('px', '')),
            },
        });
        itemSelectorDragParam.current = null;
    };
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
            const cellDiff = (timeDiff / cellXUnit.current) * cellDivideNumber;
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
    useEffect(() => {
        setTaskHeaderWidth(
            properties
                .filter((prop) => prop.display)
                .reduce((pre, current) => {
                    return pre + current.width + 1;
                }, 0),
        );
    }, [properties]);
    // --------------------------------------------------------
    return (
        <div
            className="GanttContainer"
            onScroll={onGnattScroll}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflowY: 'auto',
                overflowX: 'auto',
            }}
        >
            <div
                className="HeaderWrapper"
                style={{ position: 'sticky', left: 0, top: 0, height: c.header.height, width: '100%', zIndex: 1 }}
            >
                <Header
                    height={c.header.height}
                    rightComponent={<RightComponent />}
                    rightComponentProps={{ projectId: projectId }}
                />
            </div>
            <div
                className="SelectedArea"
                id="selectedArea"
                style={{ display: 'none', position: 'fixed', top: 0, left: 0, width: 0, height: 0, zIndex: 100 }}
            />
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
                <div
                    className="TaskModalWrapper"
                    style={{
                        position: 'absolute',
                        top: '5%',
                        left: '15%',
                        padding: '10px',
                        width: '70vw',
                        height: '90vh',
                        maxWidth: '70vw',
                        maxHeight: '90vh',
                        backgroundColor: 'white',
                    }}
                >
                    <PageComponent projectId={projectId} pageId={openTaskId} headless={false} />
                </div>
            </Modal>
            <div
                className="GanttHeaderWrapper"
                style={{
                    width: calenderHeaderWidth,
                    height: c.ganttHeader.height,
                    zIndex: 2,
                    position: 'sticky',
                    top: 0,
                    display: 'flex',
                    backgroundColor: c.color.header,
                }}
            >
                <div
                    className="GanttTaskHeader"
                    style={{
                        height: c.ganttHeader.height,
                        backgroundColor: c.color.header,
                        display: 'inline-flex',
                        paddingLeft: c.task.container.leftMargin,
                        position: 'sticky',
                        left: 0,
                        top: 0,
                        zIndex: 2,
                    }}
                >
                    {properties
                        .filter((prop) => prop.display)
                        .map((prop, index) => {
                            return (
                                <div
                                    className="GanttTaskHeaderItem"
                                    key={`ganttTaskHeader-${index}`}
                                    data-id={prop.id}
                                    style={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        ...c.borderCss,
                                        width: properties.filter((p) => p.id == prop.id)[0].width,
                                    }}
                                >
                                    {prop.name}
                                    <div
                                        className="GanttTaskHeaderItemSelector"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            width: '5px',
                                            height: '100%',
                                            backgroundColor: 'transparent',
                                            cursor: 'col-resize',
                                        }}
                                        data-id={prop.id}
                                        draggable={true}
                                        onDragStart={onItemSelectorDragStart}
                                        onDrag={onItemSelectorDrag}
                                        onDragEnd={onItemSelectorDragEnd}
                                    />
                                </div>
                            );
                        })}
                </div>
                <div
                    className="GanttCalenderHeader"
                    style={{
                        backgroundColor: c.color.header,
                        width: calenderHeaderWidth,
                        height: c.ganttHeader.height,
                        position: 'sticky',
                        left: taskHeaderWidth,
                        top: 0,
                        zIndex: 1,
                    }}
                >
                    <div
                        className="GanttCalenderHeaderParentContainer"
                        style={{ height: c.ganttHeader.height / 2, display: 'flex' }}
                    >
                        {createParentGanttLabel().map((parent, index) => {
                            return (
                                <div
                                    className="GanttCalenderHeaderParent"
                                    key={`calender-header-parent-${index}`}
                                    style={{
                                        height: c.ganttHeader.height / 2,
                                        position: 'sticky',
                                        left: taskHeaderWidth,
                                        backgroundColor: c.color.header,
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'sticky',
                                            left: taskHeaderWidth + c.task.container.leftMargin,
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
                                </div>
                            );
                        })}
                    </div>
                    <div
                        className="GanttCalenderHeaderChildContainer"
                        style={{ width: '100%', height: c.ganttHeader.height / 2, display: 'flex' }}
                    >
                        {createChildGanttLabel().map((x, j) => {
                            return (
                                <div
                                    className="GanttCalenderHeaderChild"
                                    key={`calender-header-child-${j}`}
                                    style={{
                                        width: c.cell.width * ganttParams.cellDivideNumber,
                                        height: c.ganttHeader.height / 2,
                                    }}
                                >
                                    {x}
                                </div>
                            );
                        })}
                        <span ref={tailRef} />
                    </div>
                </div>
            </div>
            <div
                className="Main"
                id="ganttMain"
                style={{
                    position: 'absolute',
                    left: 0,
                    minWidth: taskHeaderWidth,
                    minHeight: `calc(100% - ${c.header.height}px - ${c.ganttHeader.height}px`,
                    display: 'flex',
                    zIndex: 1,
                }}
            >
                <GanttTask locParams={locParams} ganttParams={ganttParams} displayTasks={displayTasks} />
                <GanttCalender locParams={locParams} ganttParams={ganttParams} displayTasks={displayTasks} />
            </div>
        </div>
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
            <PropertyVisibility projectId={projectId} properties={properties} />
            <PropertyFilter projectId={projectId} properties={properties} settings={settings} />
            <PropertySort projectId={projectId} properties={properties} settings={settings} />
            <ScaleChange projectId={projectId} settings={settings} />
        </div>
    );
};
const PropertyVisibility: React.FC<{ projectId: any; properties: any }> = ({ projectId, properties }) => {
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
                {properties
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
                                                    projectId: projectId,
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
const PropertyFilter: React.FC<{ projectId: any; properties: any; settings: any }> = ({
    projectId,
    properties,
    settings,
}) => {
    const dispatch = useDispatch();
    const [anchorFilter, setAnchorFilter] = useState(null);
    const onClickAdd = () => {
        dispatch({
            type: 'addGanttFilter',
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
                            <SelectMui
                                value={settings.ganttFilterLigicalOperator}
                                onChange={(event) => {
                                    dispatch({
                                        type: 'setGanttFilterLigicalOperator',
                                        projectId: projectId,
                                        operator: event.target.value,
                                    });
                                }}
                            >
                                <MenuItem value={'or'}>Or</MenuItem>
                                <MenuItem value={'and'}>And</MenuItem>
                            </SelectMui>
                        </ListItem>
                        <ListItem>
                            <table>
                                <tbody>
                                    {settings.ganttFilters.map((filter, index) => {
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
                </MenuItem>
            </Menu>
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
            type: 'setGanttFilter',
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
                                <MenuItem key={index} value={v.id}>
                                    {v.name}
                                </MenuItem>
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
                                <MenuItem key={index} value={u.id}>
                                    {u.name}
                                </MenuItem>
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
                            <MenuItem key={`PropertyFilterRow-propsId-${index}`} value={prop.id}>
                                {prop.name}
                            </MenuItem>
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
            type: 'addGanttSort',
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
                                    {settings.ganttSorts.map((sort, index) => {
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
                </MenuItem>
            </Menu>
        </React.Fragment>
    );
};
const PropertySortRow: React.FC<{ projectId: any; properties: any; sort: any }> = ({ projectId, properties, sort }) => {
    console.log('SortRow', sort);
    const dispatch = useDispatch();
    const onChangeSort = (key, value) => {
        dispatch({
            type: 'setGanttSort',
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
                            <MenuItem key={`PropertySortRow-propsId-${index}`} value={prop.id}>
                                {prop.name}
                            </MenuItem>
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
                    <MenuItem key={`PropertyFilterRow-down`} value={'desc'}>
                        <ArrowDownward />
                    </MenuItem>
                    <MenuItem key={`PropertyFilterRow-op-up`} value={'asc'}>
                        <ArrowUpward />
                    </MenuItem>
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
const ScaleChange: React.FC<{ projectId: any; settings: any }> = ({ projectId, settings }) => {
    const { scales } = useSelector(
        (props: IRootState) => ({
            scales: props.constants.scale,
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    return (
        <SelectMui
            value={settings.ganttScale}
            onChange={(event) => {
                dispatch({
                    type: 'setGanttScale',
                    projectId: projectId,
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
        </SelectMui>
    );
};

const GanttTaskContainer = styled.div`
    position: sticky;
    left: 0;
    top: ${c.ganttHeader.height};
    min-height: 100%;
    background-color: ${c.color.body};
    z-index: 1;
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
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

const GanttTask = ({ locParams, ganttParams, displayTasks }) => {
    const { globalSettings, projectId, pages, properties, filters } = useSelector(
        (props: IRootState) => ({
            globalSettings: props.settings,
            projectId: props.projects.filter((project) => project.id == locParams.projectId)[0].id,
            pages: props.projects.filter((project) => project.id == locParams.projectId)[0].pages,
            properties: props.projects.filter((project) => project.id == locParams.projectId)[0].properties,
            filters: props.projects.filter((project) => project.id == locParams.projectId)[0].settings.ganttFilters,
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    console.log('GanttTask', displayTasks);
    // --------------------------------------------------------
    // --------------------------------------------------------
    const insertTasks = (event) => {
        const id = Number(event.target.dataset.id);
        console.log('insertTasks', id);
        dispatch({
            type: 'insertTaskAbove',
            projectId: projectId,
            taskId: id,
        });
    };
    const addTasks = () => {
        dispatch({
            type: 'addTask',
            projectId: projectId,
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
    const setProperty = (pageId, propertyId, values) => {
        const task = pages.filter((page) => page.id == pageId)[0];
        dispatch({
            type: 'setTask',
            projectId: projectId,
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
    // --------------------------------------------------------
    const [dummyCheck, setDummyCheck] = useState(
        displayTasks.map((task) => {
            return {
                ...task.properties.filter((t) => t.id == 6)[0],
                id: task.id,
            };
        }),
    );
    const showProperty_ = useCallback((task, propertySetting) => {
        const width = properties.filter((prop) => prop.id == propertySetting.id)[0].width;
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
                const allStatusObjList = properties.filter((p) => p.id == propertySetting.id)[0]?.values || [];
                const selectedStatusIds = task.properties.filter((prop) => prop.id == propertySetting.id)[0].values;
                const selectedStatusObjList = allStatusObjList.filter(
                    (statusObj) => selectedStatusIds.indexOf(statusObj.id) != -1,
                );
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <SelectMui
                            labelId="demo-mutiple-name-label"
                            id="demo-mutiple-name"
                            multiple
                            value={selectedStatusObjList}
                            onChange={(event) => {
                                const values: Array<any> = [...(event.target.value as Array<any>)];
                                dispatch({
                                    type: 'editPageProperty',
                                    projectId: projectId,
                                    pageId: task.id,
                                    propertyId: propertySetting.id,
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
                        </SelectMui>
                    </GanttTaskTag>
                );
            case 'date':
                const dateValues = task.properties.filter((p) => p.id == propertySetting.id)[0]?.values;
                if (!dateValues || !dateValues.length) {
                    return <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }} />;
                }
                const periodDate = {
                    start: new Date(dateValues[0].start),
                    end: new Date(dateValues[0].end),
                };
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <MuiPickersUtilsProvider utils={DateFnsUtils}>
                            <div style={{ display: 'flex' }}>
                                <div style={{ width: '135px', minWidth: '135px' }}>
                                    <DateTimePicker
                                        value={periodDate.start}
                                        ampm={false}
                                        onChange={(date) => {
                                            console.log('datetime-local', date);
                                            dispatch({
                                                type: 'editPageProperty',
                                                projectId: projectId,
                                                pageId: task.id,
                                                propertyId: propertySetting.id,
                                                property: {
                                                    values: [
                                                        {
                                                            start: date.getTime(),
                                                            end: periodDate.end.getTime(),
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
                                        value={periodDate.end}
                                        ampm={false}
                                        onChange={(date) => {
                                            dispatch({
                                                type: 'editPageProperty',
                                                projectId: projectId,
                                                pageId: task.id,
                                                propertyId: propertySetting.id,
                                                property: {
                                                    values: [
                                                        {
                                                            start: periodDate.start.getTime(),
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
                    </GanttTaskTag>
                );
            case 'user':
                const allUserObjList = globalSettings.users;
                const taskUserIdList = task.properties.filter((p) => p.id == propertySetting.id)[0]?.values || [];
                const taskUserObjList = allUserObjList.filter((userObj) => taskUserIdList.indexOf(userObj.id) != -1);
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <SelectMui
                            labelId="demo-mutiple-name-label"
                            id="demo-mutiple-name"
                            multiple
                            value={taskUserObjList}
                            onChange={(event) => {
                                const values: Array<any> = [...(event.target.value as Array<any>)];
                                dispatch({
                                    type: 'editPageProperty',
                                    projectId: projectId,
                                    pageId: task.id,
                                    propertyId: propertySetting.id,
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
                        </SelectMui>
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
                const tagObjs = properties.filter((p) => p.id == propertySetting.id)[0].values;
                const selectedTagIds = task.properties.filter((p) => p.id == propertySetting.id)[0]?.values || [];
                const selectedTagObjs = tagObjs.filter((tagObj) => selectedTagIds.indexOf(tagObj.id) != -1);
                return (
                    <GanttTaskTag key={`property-${propertySetting.type}-${task.id}`} style={{ width }}>
                        <SelectMui
                            labelId="demo-mutiple-name-label"
                            id="demo-mutiple-name"
                            multiple
                            value={selectedTagObjs}
                            onChange={(event) => {
                                const values: Array<any> = [...(event.target.value as Array<any>)];
                                dispatch({
                                    type: 'editPageProperty',
                                    projectId: projectId,
                                    pageId: task.id,
                                    propertyId: propertySetting.id,
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
                        </SelectMui>
                    </GanttTaskTag>
                );
            case 'check':
                //const checkValues = task.properties.filter((p) => p.id == propertySetting.id)[0]?.values || [false];
                const checkValues = dummyCheck.filter((d) => d.id == task.id)[0]?.values || [false];
                return (
                    <GanttTaskTag
                        key={`property-${propertySetting.type}-${task.id}`}
                        style={{ width, justifyContent: 'center' }}
                    >
                        <input
                            type="checkbox"
                            checked={checkValues[0]}
                            onChange={(event) => {
                                setDummyCheck(
                                    dummyCheck.map((d) => {
                                        if (d.id == task.id) {
                                            return {
                                                ...d,
                                                values: [event.target.checked],
                                            };
                                        } else {
                                            return { ...d };
                                        }
                                    }),
                                );
                                setTimeout(() => {
                                    dispatch({
                                        type: 'editPageProperty',
                                        projectId: projectId,
                                        pageId: task.id,
                                        propertyId: propertySetting.id,
                                        property: {
                                            values: [event.target.checked],
                                        },
                                    });
                                }, 10);
                            }}
                        />
                    </GanttTaskTag>
                );
        }
    }, []);
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
    // --------------------------------------------------------
    const displayProps = properties.filter((prop) => prop.display);
    const propParams = displayTasks.map((task) => {
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
    const [propWidth, setPropWidth] = useState(
        createDict(
            displayProps.map((prop) => {
                return prop.id;
            }),
            (id) => {
                return displayProps.filter((prop) => prop.id == id)[0].width;
            },
        ),
    );
    useEffect(() => {
        setPropWidth(
            createDict(
                displayProps.map((prop) => {
                    return prop.id;
                }),
                (id) => {
                    return displayProps.filter((prop) => prop.id == id)[0].width;
                },
            ),
        );
    }, [properties]);
    console.log('tasks', new Date().getTime() - gtime.getTime());
    return (
        <div
            className="GanttTaskContainer"
            style={{
                position: 'sticky',
                left: 0,
                top: c.ganttHeader.height,
                minHeight: '100%',
                backgroundColor: c.color.body,
                zIndex: 1,
            }}
        >
            <div>
                {displayTasks.map((task, index) => {
                    return (
                        <div
                            className="GanttTaskRow ganttTaskRow"
                            style={{ display: 'flex', width: '100%', height: c.cell.height }}
                            key={`task-row-${index}`}
                            data-id={task.id}
                        >
                            <div className="GanttTaskAdd" style={{ width: c.task.container.leftMargin, opacity: 0 }}>
                                <AddIcon data-id={task.id} onClick={insertTasks} />
                            </div>
                            <div
                                className="GanttTaskTags"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: c.cell.height,
                                    maxHeight: c.cell.height,
                                }}
                            >
                                {propParams[index].map((propParam) => {
                                    return (
                                        <div
                                            className="GanttTaskTag"
                                            key={`property-${propParam.type}-${task.id}`}
                                            style={{
                                                overflow: 'hidden',
                                                height: c.cell.height,
                                                maxHeight: c.cell.height,
                                                ...c.borderCss,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-start',
                                                width: propWidth[propParam.id],
                                            }}
                                        >
                                            {showProperty(task.id, propParam)}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
                <div
                    className="GanttTaskRow ganttTaskRow"
                    key={`task-row--1`}
                    data-id={'-1'}
                    style={{ display: 'flex', width: '100%', height: c.cell.height }}
                >
                    <GanttTaskAdd />
                    <div
                        className="GanttTaskTags"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            height: c.cell.height,
                            maxHeight: c.cell.height,
                        }}
                    >
                        <AddIcon data-id={'-1'} onClick={addTasks} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const GanttCalender = ({ locParams, ganttParams, displayTasks }) => {
    const { projectId, rawTasks } = useSelector(
        (props: IRootState) => ({
            projectId: props.projects.filter((project) => project.id == locParams.projectId)[0].id,
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
            projectId: projectId,
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
    const getCalenderElementSnapshot = (elem: HTMLElement) => {
        // スクロールが0の状態のときのパラメータ
        const scroll = getScroll();
        const rect = elem.getBoundingClientRect();
        const pos = { x: rect.left + scroll.x, y: rect.top + scroll.y };
        const size = { width: elem.offsetWidth, height: elem.offsetHeight };
        const cSize = {
            width: floor(size.width / c.cell.width),
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
                selectedCElems.current = [selectedCElem];
            }
            // イメージの生成
            //event.dataTransfar.setDragImage();
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
        if (isDragging()) {
            console.log('onTimebarDrag');
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
                y: tdi.selected.type == 'whole' ? judgeCell.y - tdi.pointed.cell.y : 0,
            };
            // 期間の変更
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
                        start:
                            tdi.selected.type == 'right'
                                ? period.start
                                : period.start + (dcell.x * ganttParams.cellXUnit) / ganttParams.cellDivideNumber,
                        end:
                            tdi.selected.type == 'left'
                                ? period.end
                                : period.end + (dcell.x * ganttParams.cellXUnit) / ganttParams.cellDivideNumber,
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
            // タスクの入れ替え
            const newTasks = [];
            let index = 0; // 選択されていない要素の現在の配列番号を記憶する
            let modifiedIndex = 0; // 選択されている要素の現在の配列番号を記憶する
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
                ganttParams.calenderRange.start.getTime() + (cx / ganttParams.cellDivideNumber) * ganttParams.cellXUnit;
            console.log('onCellClick', { id, task, period, cx, start });
            dispatch({
                type: 'editPageProperty',
                projectId: projectId,
                pageId: task.id,
                propertyId: 2,
                property: {
                    values: [
                        {
                            start: start,
                            end: start + ganttParams.cellXUnit / ganttParams.cellDivideNumber,
                        },
                    ],
                },
            });
        }
    };
    // --------------------------------------------------------
    const onKeyDown = useCallback((event) => {
        console.log('key', event.key);
        if (event.key == 'Control') {
            keydown.current = event.key;
        }
    }, []);
    const onKeyUp = useCallback((event) => {
        keydown.current = null;
    }, []);
    const onMouseDown = useCallback((event) => {
        const target: HTMLElement = event.target as HTMLElement;
        console.log('document.mousedown', target, target.className, mousedownStart.current, target.tagName);
        // cellのクリック
        if (target.className?.match('ganttCalenderRow') || target.className?.match('ganttCalenderCell')) {
            const scroll = getScroll();
            const x = event.clientX + scroll.x;
            const y = event.clientY + scroll.y;
            // 範囲内のtimebarを元に戻す
            releaseSelectedCElem();
            // マウス移動の起点を作成
            if (mousedownStart.current.x == -1 && mousedownStart.current.y == -1) {
                mousedownStart.current = {
                    x,
                    y,
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
            const wrapElem = getElementByPosition(target.dataset.y);
            wrapElem.style.backgroundColor = c.color.multiSelected;
            selectedCElems.current.push(getCalenderElementSnapshot(wrapElem));
        }
    }, []);
    const onMouseMove = useCallback((event) => {
        // マウス起点が作られていたら、移動したぶんだけ長方形を描画
        if (mousedownStart.current.x >= 0 && mousedownStart.current.y >= 0) {
            // 長方形描画
            const scroll = getScroll();
            const x = event.clientX + scroll.x;
            const y = event.clientY + scroll.y;
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
                (e) => e.dataset.type == 'wrap',
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
            selectedCElems.current = selected;
        }
    }, []);
    const onMouseUp = useCallback((event) => {
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
    }, []);
    useEffect(() => {
        //eventListenerの登録
        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);
        return () => {
            document.removeEventListener('keydown', onKeyDown, false);
            document.removeEventListener('keyup', onKeyUp, false);
            document.removeEventListener('mousedown', onMouseDown, false);
            document.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('mouseup', onMouseUp, false);
        };
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
                            (start_.getHours() + start_.getMinutes() / 60 - 0.01) / (24 / ganttParams.cellDivideNumber),
                        ) * -1;
                    e =
                        floor((end_.getHours() + end_.getMinutes() / 60 - 0.01) / (24 / ganttParams.cellDivideNumber)) +
                        1;
                    c = e + s;
                    break;
                case 'date':
                    base = floor(
                        (start_.getMinutes() * 60 * 1000 + (end_.getTime() - start_.getTime())) / (60 * 60 * 1000),
                    );
                    s = floor((start_.getMinutes() - 0.01) / (60 / ganttParams.cellDivideNumber)) * -1;
                    e = floor((end_.getMinutes() - 0.01) / (60 / ganttParams.cellDivideNumber)) + 1;
                    c = e + s;
                    break;
            }
            block = base * ganttParams.cellDivideNumber + c;
        }
        return c.cell.width * block;
    };
    // --------------------------------------------------------
    const GanttCalenderContainer = styled.div`
        min-height: 100%;
        z-index: 0;
    `;
    const GanttCalenderBodyWrapper = styled.div`
        position: relative;
        width: 100%;
        background-color: ${c.color.body};
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
        user-select: none;
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
        background-color: ${c.color.timebar};
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
    console.log('calender', new Date().getTime() - gtime.getTime());
    return (
        <div id="ganttCalenderContainer" style={{ minHeight: '100%', zIndex: 0 }}>
            <div
                className="GanttCalenderBodyWrapper"
                style={{ position: 'relative', width: '100%', backgroundColor: c.color.body }}
            >
                <div
                    className="GanttCalenderBody"
                    id="GanttCalenderBody"
                    style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column' }}
                >
                    {displayTasks.map((task, y) => {
                        const period = task.properties.filter((p) => p.id == 2)[0].values[0];
                        const width = !!period ? getTimeberWidth(period.start, period.end) - c.cell.width * 0.02 : 0;
                        const tps = !!period ? new Date(period.start !== null ? period.start : period.end) : null;
                        const cond =
                            !!width &&
                            !!tps &&
                            period.start >= ganttParams.calenderRange.start.getTime() &&
                            period.end <= ganttParams.calenderRange.end.getTime();
                        const left = cond
                            ? getTimeberWidth(ganttParams.calenderRange.start, period.start) -
                              (ganttParams.calenderRange.start.getHours() != 0 ||
                              ganttParams.calenderRange.start.getMinutes() != 0
                                  ? c.cell.width
                                  : 0)
                            : 0;
                        return (
                            <div
                                className="GanttCalenderRow ganttCalenderRow"
                                style={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    height: c.cell.height,
                                    userSelect: 'none',
                                }}
                                key={`calender-row-${y}`}
                                data-id={task.id}
                                data-row={y}
                                data-target="row"
                                onClick={onCellClick}
                            >
                                {[...Array(ganttParams.calenderRangeDiff * ganttParams.cellDivideNumber).keys()].map(
                                    (i) => {
                                        return (
                                            <div
                                                key={`border-${y}-${i}`}
                                                className="ganttCalenderCell"
                                                data-id={task.id}
                                                data-row={y}
                                                style={{
                                                    width: c.cell.width - 1,
                                                    height: c.cell.height,
                                                    backgroundColor: 'transparent',
                                                    borderBottom: '1px solid gray',
                                                    borderRight: `1px solid ${i % 2 == 0 ? 'lightgray' : 'gray'}`,
                                                }}
                                            />
                                        );
                                    },
                                )}
                                {cond ? (
                                    <div
                                        className="GanttCalenderTimebarWrap ganttCalenderTimebarGroup"
                                        style={{
                                            position: 'absolute',
                                            height: c.cell.height * c.timebar.yShrinkCoef,
                                            borderRadius: '7px',
                                            backgroundColor: c.color.timebar,
                                            zIndex: 1,
                                            userSelect: 'none',
                                            width,
                                            left,
                                        }}
                                        key={`timebar-${y}`}
                                        data-id={task.id}
                                        data-row={y}
                                        data-type="wrap"
                                    >
                                        {task.properties.filter((prop) => prop.id == 0)[0].values[0]}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                height: c.cell.height * c.timebar.yShrinkCoef,
                                                borderRadius: '7px',
                                                backgroundColor: 'transparent',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                width,
                                            }}
                                            className="GanttCalenderTimebar ganttCalenderTimebarGroup"
                                            draggable="true"
                                            data-id={task.id}
                                            data-row={y}
                                            data-type="whole"
                                            onDoubleClick={onTimebarDoubleClick}
                                            onDragStart={onTimebarDragStart}
                                            onDrag={onTimebarDrag}
                                            onDragEnd={onTimebarDragEnd}
                                        >
                                            <div
                                                style={{
                                                    height: '100%',
                                                    width: c.cell.width * c.timebar.sideWidthCoef,
                                                    borderRadius: '7px',
                                                    backgroundColor: 'transparent',
                                                    cursor: 'col-resize',
                                                }}
                                                className="GanttCalenderTimebarSide ganttCalenderTimebarGroup"
                                                draggable="true"
                                                data-id={task.id}
                                                data-row={y}
                                                data-type="left"
                                                onDragStart={onTimebarDragStart}
                                                onDrag={onTimebarDrag}
                                                onDragEnd={onTimebarDragEnd}
                                            />
                                            <div
                                                style={{
                                                    height: '100%',
                                                    width: c.cell.width * c.timebar.sideWidthCoef,
                                                    borderRadius: '7px',
                                                    backgroundColor: 'transparent',
                                                    cursor: 'col-resize',
                                                }}
                                                className="GanttCalenderTimebarSide ganttCalenderTimebarGroup"
                                                draggable="true"
                                                data-id={task.id}
                                                data-row={y}
                                                data-type="right"
                                                onDragStart={onTimebarDragStart}
                                                onDrag={onTimebarDrag}
                                                onDragEnd={onTimebarDragEnd}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <></>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Gantt;
