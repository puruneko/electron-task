import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import Modal from '@material-ui/core/Modal';
import { useParams } from 'react-router-dom';
import { createDispatchHook, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { TargetType } from '../type/gantt';
import {
    floor,
    ceil,
    ceilfloor,
    topbottom,
    useQuery,
    createDict,
    between,
    useEffectSkip,
    raptime,
    styledToRawcss,
} from '../lib/utils';
import { getTimedelta, getYYYYMMDD, getHHMMSS, getMMDD, getHH, getTime, toISOLikeString } from '../lib/time';
import { IRootState } from '../type/store';
import { Second, Period, Pos, CalenderPeriod, ITimebarDragInitial, ICalenderElement } from '../type/gantt';
import {
    Avatar,
    Button,
    Checkbox,
    Chip,
    Divider,
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
import commonCss from '../lib/commonCss';
import SelectList from '../components/selectList';
import DatetimePicker from '../components/datetimePicker';

const c = {
    color: {
        header: 'white',
        body: '#cccccc',
        timebar: 'rgb(84,184,137)',
        multiSelected: 'rgba(77,169,155, 0.5)',
        dragArea: 'rgba(0, 12, 181, 0.5)',
    },
    borderCss: `
        border-right: 1px solid black;
        border-bottom: 1px solid black;
    `,
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
    addCellOffset: 16,
    visibleTaskCoef: 2,
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

const GanttContainer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: auto;
`;
const HeaderWrapper = styled.div`
    position: sticky;
    left: 0;
    top: 0;
    height: ${c.header.height};
    width: 100%;
    z-index: 2;
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
const GanttHeaderWrapper = styled.div`
    height: ${c.ganttHeader.height};
    z-index: 2;
    position: sticky;
    top: ${c.header.height};
    display: flex;
    background-color: ${c.color.header};
`;
const GanttTaskHeader = styled.div`
    height: ${c.ganttHeader.height};
    background-color: ${c.color.header};
    display: inline-flex;
    padding-left: ${c.task.container.leftMargin};
    position: sticky;
    left: 0;
    top: 0;
    z-index: 2;
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
const GanttCalenderHeader = styled.div`
    background-color: ${c.color.header};
    height: ${c.ganttHeader.height};
    position: sticky;
    top: 0;
    z-index: 1;
`;
const GanttCalenderHeaderParentContainer = styled.div`
    height: ${c.ganttHeader.height / 2};
    display: flex;
`;
const GanttCalenderHeaderParent = styled.div`
    height: ${c.ganttHeader.height / 2};
    position: sticky;
    background-color: ${c.color.header};
`;
const GanttCalenderHeaderChildContainer = styled.div`
    width: 100%;
    height: ${c.ganttHeader.height / 2};
    display: flex;
`;
const GanttCalenderHeaderChild = styled.div`
    height: ${c.ganttHeader.height / 2};
`;
const GanttMain = styled.div`
    position: absolute;
    left: 0;
    min-height: calc(100% - ${c.header.height}px - ${c.ganttHeader.height}px);
    display: flex;
    z-index: 1;
`;

const Gantt: React.FC = () => {
    console.log('Main start', raptime());
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
        propertyVisibility,
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
            propertyVisibility: props.projects.filter((project) => project.id == locParams.projectId)[0].settings
                .ganttPropertyVisibility,
        }),
        shallowEqual,
    );
    const displayTasks = sortTasks(filterTasks(tasksRaw, filters, filterOperator), properties, sorts);
    console.log({ displayTasks });
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
    now.setUTCHours(0);
    now.setUTCMinutes(0);
    now.setUTCSeconds(0);
    now.setUTCMilliseconds(0);
    const [scrollTargetUTCDate, setScrollTargetUTCDate] = useState(now);
    const [cellOffset, setCellOffset] = useState({
        start: Math.floor(window.innerWidth / c.cell.width),
        end: Math.floor(window.innerWidth / c.cell.width),
    });
    const calenderRangeNow = useRef({
        start: new Date(now.getTime() - cellXUnit.current * cellOffset.start), // 今の5cell前から
        end: new Date(now.getTime() + cellXUnit.current * cellOffset.end), // 30cell後まで
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
            .filter((prop) => propertyVisibility.indexOf(prop.id) != -1)
            .reduce((pre, current) => {
                return pre + current.width + 1;
            }, 0),
    );
    const calenderHeaderWidth = (calenderRangeDiff + 31) * cellDivideNumber * c.cell.width;
    const topOffset = 0 - c.visibleTaskCoef * window.innerHeight; // - c.header.height - c.ganttHeader.height;
    const [displayRange, setLoadedRange] = useState({
        top: Math.floor(topOffset / c.cell.height),
        bottom:
            Math.floor(topOffset / c.cell.height) +
            Math.floor(((c.visibleTaskCoef * 2 + 1) * window.innerHeight) / c.cell.height),
    });
    const tailRef = useRef(null);
    const previousScroll = useRef({ left: 0, top: 0, topOffset: 0 });
    const scrollTopTimer = useRef(null);
    const scrollTopStopper = useRef(false);
    const ganttParams = {
        ganttScale,
        cellXUnit: cellXUnit.current,
        cellDivideNumber,
        calenderRange,
        calenderRangeDiff,
        taskHeaderWidth,
        displayRange,
        scrollTopStopper,
    };
    console.log('ganttParams', ganttParams);
    // --------------------------------------------------------
    const mainElemRef = useRef(null);
    // --------------------------------------------------------
    const onGnattScroll = (event) => {
        if (previousScroll.current.left != event.target.scrollLeft) {
            if (event.target.scrollLeft == 0) {
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
        }
        const topOffset =
            event.target.scrollTop - c.visibleTaskCoef * window.innerHeight - c.header.height - c.ganttHeader.height;
        if (previousScroll.current.top != event.target.scrollTop) {
            if (!scrollTopStopper.current) {
                clearTimeout(scrollTopTimer.current);
                console.log('scrollTop', event.target.scrollTop, window.innerHeight);
                scrollTopTimer.current = setTimeout(() => {
                    if (scrollTopTimer.current) {
                        console.log('scrollTopUpdate', topOffset);
                        setLoadedRange({
                            top: Math.floor(topOffset / c.cell.height),
                            bottom:
                                Math.floor(topOffset / c.cell.height) +
                                Math.floor(((c.visibleTaskCoef * 2 + 1) * window.innerHeight) / c.cell.height),
                        });
                    }
                    scrollTopStopper.current = true;
                }, 500);
            } else {
                clearTimeout(scrollTopTimer.current);
                scrollTopStopper.current = false;
            }
        }
        previousScroll.current = {
            left: event.target.scrollLeft,
            top: event.target.scrollTop,
            topOffset,
        };
        event.preventDefault();
        event.stopPropagation();
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
    const parentGanttLabel = (() => {
        const start = ganttParams.calenderRange.start;
        const parents = [...Array(ganttParams.calenderRangeDiff).keys()].map((i) => {
            const d = new Date(start);
            switch (ganttParams.ganttScale) {
                case 'month':
                    d.setUTCDate(start.getUTCDate() + i);
                    return d.getUTCMonth() + 1;
                case 'date':
                    d.setUTCHours(start.getUTCHours() + i);
                    return d.getUTCDate();
            }
        });
        return [...new Set(parents)].map((i) => {
            return {
                parent: i,
                number: parents.filter((x) => x == i).length,
            };
        });
    })();
    const childGanttLabel = (() => {
        const children = [...Array(ganttParams.calenderRangeDiff).keys()].map((j) => {
            const d = new Date(ganttParams.calenderRange.start);
            switch (ganttParams.ganttScale) {
                case 'month':
                    d.setUTCDate(d.getUTCDate() + j);
                    return d.getUTCDate();
                case 'date':
                    d.setUTCHours(d.getUTCHours() + j);
                    return d.getUTCHours();
            }
        });
        return children;
    })();
    // --------------------------------------------------------
    useEffectSkip(() => {
        console.log('useEffect main ganttScale', raptime());
        setScrollTargetUTCDate(new Date());
        const newCalenderRange = {
            start: new Date(now.getTime() - cellXUnit.current * cellOffset.start), // 今の5cell前から
            end: new Date(now.getTime() + cellXUnit.current * cellOffset.end), // 30cell後まで
        };
        setCalenderRangeNow(newCalenderRange);
    }, [ganttScale]);
    useEffectSkip(() => {
        console.log('useEffect main cellOffset', raptime());
        const newCalenderRange = {
            start: new Date(now.getTime() - cellXUnit.current * cellOffset.start), // 今の5cell前から
            end: new Date(now.getTime() + cellXUnit.current * cellOffset.end), // 30cell後まで
        };
        setCalenderRangeNow(newCalenderRange);
    }, [cellOffset]);
    useEffectSkip(() => {
        console.log('useEffect main calenderRangeNow', raptime());
        setCalenderRangeNow(calenderRangeNow.current);
    }, [calenderRangeNow]);
    useEffectSkip(() => {
        console.log('useEffect main properties', raptime());
        setTaskHeaderWidth(
            properties
                .filter((prop) => propertyVisibility.indexOf(prop.id) != -1)
                .reduce((pre, current) => {
                    return pre + current.width + 1;
                }, 0) + c.task.container.leftMargin,
        );
    }, [properties]);
    useEffect(() => {
        console.log('useEffect main []', raptime());
        //scroll量の調整
        if (scrollTargetUTCDate) {
            const timeDiff = scrollTargetUTCDate.getTime() - calenderRangeNow.current.start.getTime();
            console.log('timeDiff', raptime());
            const cellDiff = (timeDiff / cellXUnit.current) * cellDivideNumber;
            console.log('cellDiff', raptime());
            const scrollOffset = (cellDiff - 4) * c.cell.width;
            console.log('scrollOffset', raptime());
            //console.log('scrollOffset', scrollOffset);
            setTimeout(() => {
                mainElemRef.current.scrollTo({
                    left: scrollOffset,
                });
                console.log('scrollTo', raptime());
            }, 100);
        }
        /*
        // cellOffsetの調整
        if (document.getElementById('ganttCalenderContainer').clientWidth < window.innerWidth) {
            console.log('setCellOffset');
            setCellOffset({
                start: cellOffset.start + c.addCellOffset,
                end: cellOffset.end + c.addCellOffset,
            });
        }
        */
        console.log('useEffectEND main []', raptime());
    }, []);
    // --------------------------------------------------------
    console.log('Main render', raptime());
    return (
        <GanttContainer ref={mainElemRef} onScroll={onGnattScroll}>
            <style>{commonCss}</style>
            <HeaderWrapper>
                <Header
                    height={c.header.height}
                    rightComponent={<RightComponent />}
                    rightComponentProps={{ projectId: projectId }}
                />
            </HeaderWrapper>
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
                <TaskModalWrapper tabIndex={-1}>
                    <PageComponent projectId={projectId} pageId={openTaskId} headless={false} />
                </TaskModalWrapper>
            </Modal>
            <GanttHeaderWrapper
                style={{
                    width: calenderHeaderWidth,
                }}
            >
                <GanttTaskHeader>
                    {properties
                        .filter((prop) => propertyVisibility.indexOf(prop.id) != -1)
                        .map((prop, index) => {
                            return (
                                <GanttTaskHeaderItem
                                    key={`ganttTaskHeader-${index}`}
                                    className="GanttTaskHeaderItem"
                                    data-id={prop.id}
                                    style={{
                                        width: properties.filter((p) => p.id == prop.id)[0].width,
                                    }}
                                >
                                    {prop.name}
                                    <GanttTaskHeaderItemSelector
                                        data-id={prop.id}
                                        draggable={true}
                                        onDragStart={onItemSelectorDragStart}
                                        onDrag={onItemSelectorDrag}
                                        onDragEnd={onItemSelectorDragEnd}
                                    />
                                </GanttTaskHeaderItem>
                            );
                        })}
                </GanttTaskHeader>
                <GanttCalenderHeader
                    style={{
                        width: calenderHeaderWidth,
                        left: taskHeaderWidth,
                    }}
                >
                    <GanttCalenderHeaderParentContainer>
                        {parentGanttLabel.map((parent, index) => {
                            return (
                                <GanttCalenderHeaderParent
                                    key={`calender-header-parent-${index}`}
                                    style={{
                                        left: taskHeaderWidth,
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'sticky',
                                            left: taskHeaderWidth,
                                            minWidth: c.cell.width * ganttParams.cellDivideNumber,
                                        }}
                                    >
                                        {parent.parent}
                                    </div>
                                    <div
                                        style={{
                                            minWidth: parent.number * c.cell.width * ganttParams.cellDivideNumber,
                                        }}
                                    ></div>
                                </GanttCalenderHeaderParent>
                            );
                        })}
                    </GanttCalenderHeaderParentContainer>
                    <GanttCalenderHeaderChildContainer>
                        {childGanttLabel.map((x, j) => {
                            return (
                                <GanttCalenderHeaderChild
                                    key={`calender-header-child-${j}`}
                                    style={{
                                        minWidth: c.cell.width * ganttParams.cellDivideNumber,
                                    }}
                                >
                                    {x}
                                </GanttCalenderHeaderChild>
                            );
                        })}
                        <span ref={tailRef} />
                    </GanttCalenderHeaderChildContainer>
                </GanttCalenderHeader>
            </GanttHeaderWrapper>
            <GanttMain
                id="ganttMain"
                style={{
                    minWidth: taskHeaderWidth,
                }}
            >
                <GanttTask locParams={locParams} ganttParams={ganttParams} displayTasks={displayTasks} />
                <GanttCalender locParams={locParams} ganttParams={ganttParams} displayTasks={displayTasks} />
            </GanttMain>
        </GanttContainer>
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
            <PropertyVisibility projectId={projectId} properties={properties} settings={settings} />
            <PropertyFilter projectId={projectId} properties={properties} settings={settings} />
            <PropertySort projectId={projectId} properties={properties} settings={settings} />
        </div>
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
                                            checked={settings.ganttPropertyVisibility.indexOf(prop.id) != -1}
                                            onChange={(event) => {
                                                dispatch({
                                                    type: 'editGanttPropertyVisibility',
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
                            onChangeFilter('value', { start: new Date(event.target.value).getTime(), end: null });
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

const GanttTask: React.FC<{ locParams: any; ganttParams: any; displayTasks: any }> = ({
    locParams,
    ganttParams,
    displayTasks,
}) => {
    console.log('tasks start', raptime());
    const { globalSettings, projectId, pages, properties, filters, propertyVisibility } = useSelector(
        (props: IRootState) => ({
            globalSettings: props.settings,
            projectId: props.projects.filter((project) => project.id == locParams.projectId)[0].id,
            pages: props.projects.filter((project) => project.id == locParams.projectId)[0].pages,
            properties: props.projects.filter((project) => project.id == locParams.projectId)[0].properties,
            filters: props.projects.filter((project) => project.id == locParams.projectId)[0].settings.ganttFilters,
            propertyVisibility: props.projects.filter((project) => project.id == locParams.projectId)[0].settings
                .ganttPropertyVisibility,
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    const containerRef = useRef(null);
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
        console.log('setProperty', {
            pageId,
            propertyId,
            values,
            values2: task.properties.filter((prop) => prop.id == propertyId)[0].values,
        });
        if (
            task.properties
                .filter((prop) => prop.id == propertyId)[0]
                .values.map((v, index) => {
                    return v != values[index];
                })
                .indexOf(true) != -1
        ) {
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
        }
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
    const ShowProperty = ({ taskId, propParam }) => {
        switch (propParam.type) {
            case 'title':
                return (
                    <EditableLabel value={propParam.title} setValue={(v) => setProperty(taskId, propParam.id, [v])} />
                );
            case 'status':
                return (
                    <SelectList
                        selected={propParam.selectedStatusObjList}
                        selectList={propParam.allStatusObjList}
                        valueKey={'id'}
                        nameKey={'name'}
                        onValueChange={(values) => {
                            console.log('user values', values);
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
                        renderFunc={(selected: Array<any>) => {
                            const statuses = properties.filter((prop) => prop.id == 1)[0].values;
                            return (
                                <React.Fragment>
                                    {selected.map((value) => (
                                        <div
                                            key={value.name}
                                            style={{
                                                backgroundColor: statuses.filter((s) => s.id == value.id)[0].color,
                                                borderRadius: 5,
                                                padding: '0 5 0 5',
                                            }}
                                        >
                                            {value.name}
                                        </div>
                                    ))}
                                </React.Fragment>
                            );
                        }}
                    />
                );
            case 'date':
                if (!propParam.dateValues || !propParam.dateValues.length) {
                    return <></>;
                }
                return (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <DatetimePicker
                            dateValue={new Date(propParam.periodDate.start)}
                            onChangeDate={(date) => {
                                console.log('datetime-local', date);
                                dispatch({
                                    type: 'editPageProperty',
                                    projectId: projectId,
                                    pageId: taskId,
                                    propertyId: propParam.id,
                                    property: {
                                        values: [
                                            {
                                                start: date.Time(),
                                                end: propParam.periodDate.end.getTime(),
                                            },
                                        ],
                                    },
                                });
                            }}
                            style={{ inlineHeight: '15px' }}
                        />
                        <DatetimePicker
                            dateValue={new Date(propParam.periodDate.end)}
                            onChangeDate={(date) => {
                                console.log('datetime-local', date);
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
                            style={{ inlineHeight: '15px' }}
                        />
                    </div>
                );
            case 'user':
                return (
                    <SelectList
                        selected={propParam.taskUserObjList}
                        selectList={propParam.allUserObjList}
                        valueKey={'id'}
                        nameKey={'name'}
                        onValueChange={(values) => {
                            console.log('user values', values);
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
                        renderFunc={(selected: Array<any>) => {
                            const users = globalSettings.users;
                            return (
                                <React.Fragment>
                                    {selected.map((value) => (
                                        <div
                                            key={value.name}
                                            style={{
                                                backgroundColor: users.filter((s) => s.id == value.id)[0].color,
                                                borderRadius: 5,
                                                padding: '0 5 0 5',
                                            }}
                                        >
                                            {value.name}
                                        </div>
                                    ))}
                                </React.Fragment>
                            );
                        }}
                    />
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
                    <SelectList
                        selected={propParam.selectedTagObjs}
                        selectList={propParam.tagObjs}
                        valueKey={'id'}
                        nameKey={'name'}
                        onValueChange={(values) => {
                            console.log('values', values);
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
                        renderFunc={(selected: Array<any>) => {
                            const tags = properties.filter((prop) => prop.id == propParam.id)[0].values;
                            return (
                                <React.Fragment>
                                    {selected.map((value) => (
                                        <div
                                            key={value.name}
                                            style={{
                                                backgroundColor: tags.filter((s) => s.id == value.id)[0].color,
                                                borderRadius: 5,
                                                padding: '0 5 0 5',
                                            }}
                                        >
                                            {value.name}
                                        </div>
                                    ))}
                                </React.Fragment>
                            );
                        }}
                    />
                );
            case 'check':
                console.log('check!');
                return (
                    <input
                        type="checkbox"
                        checked={propParam.checkValues[0]}
                        onChange={(event) => {
                            console.log('ganttTaskContainer "none" ');
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
    };
    // --------------------------------------------------------
    const displayProps = properties.filter((prop) => propertyVisibility.indexOf(prop.id) != -1);
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
    useEffectSkip(() => {
        console.log('useEffect tasks properties', raptime());
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
    const styleCssString = styledToRawcss(
        GanttTaskContainer,
        GanttTaskList,
        GanttTaskRow,
        GanttTaskAdd,
        GanttTaskTags,
        GanttTaskTag,
    );
    console.log('tasks render', raptime(), styleCssString, ganttParams.displayRange);
    return (
        <React.Fragment>
            <style>{styleCssString}</style>
            <div
                className="GanttTaskContainer"
                id="ganttTaskContainer"
                ref={containerRef}
                style={{ height: displayTasks.length * c.cell.height }}
            >
                <div className="GanttTaskList" style={{ display: 'flex', flexDirection: 'column' }}>
                    {displayTasks.map((task, index) => {
                        const displayCond =
                            ganttParams.displayRange.top <= index && index <= ganttParams.displayRange.bottom;
                        return (
                            <div className="GanttTaskRow ganttTaskRow" key={`task-row-${index}`} data-id={task.id}>
                                <div className="GanttTaskAdd">
                                    <AddIcon data-id={task.id} onClick={insertTasks} />
                                </div>
                                <div className="GanttTaskTags">
                                    {propParams[index].map((propParam) => {
                                        return (
                                            <div
                                                key={`property-${propParam.type}-${task.id}`}
                                                className="GanttTaskTag"
                                                style={{
                                                    width: propWidth[propParam.id],
                                                }}
                                                onDoubleClick={() => {
                                                    onClickTask(task.id);
                                                }}
                                            >
                                                {displayCond ? (
                                                    <ShowProperty taskId={task.id} propParam={propParam} />
                                                ) : (
                                                    <React.Fragment />
                                                )}
                                            </div>
                                        );
                                    })}
                                    {/*propParams[index].map((propParam) => {
                                    return (
                                        <GanttTaskTag
                                            key={`property-${propParam.type}-${task.id}`}
                                            style={{
                                                width: propWidth[propParam.id],
                                            }}
                                            onDoubleClick={() => {
                                                onClickTask(task.id);
                                            }}
                                        >
                                            {<ShowProperty taskId={task.id} propParam={propParam} />}
                                        </GanttTaskTag>
                                    );
                                })*/}
                                </div>
                            </div>
                        );
                    })}
                    <div className="GanttTaskRow ganttTaskRow" key={`task-row--9999999999999999999998`} data-id={'-1'}>
                        <div className="GanttTaskAdd" />
                        <div className="GanttTaskTags">
                            <AddIcon data-id={'-1'} onClick={addTasks} />
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
};

const GanttCalender = ({ locParams, ganttParams, displayTasks }) => {
    console.log('calender start', raptime());
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
    const calenderContainerRef = useRef(null);
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
            const bodyElem = document.getElementById('GanttCalenderBody');
            const rect = bodyElem.getBoundingClientRect();
            const cx = floor((x - rect.left) / c.cell.width);
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
                    timebar.style.backgroundColor = c.color.timebar;
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
        console.log('useEffect calender []', raptime());
        //eventListenerの登録
        document.addEventListener('keydown', onKeyDown, false);
        document.addEventListener('keyup', onKeyUp, false);
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);
        /*
        // calenderBodyParamを更新
        //calenderBodyParam.current = getCalenderElementSnapshot(document.getElementById('GanttCalenderBody'));

        const elem = document.getElementById('GanttCalenderBody');
        const rect = elem.getBoundingClientRect();
        const pos = { x: rect.left, y: rect.top };
        calenderBodyParam.current = { pos };
        console.log('calenderBodyParam', calenderBodyParam.current, raptime());
        */
        console.log('useEffectEND calender []', raptime());
        return () => {
            document.removeEventListener('keydown', onKeyDown, false);
            document.removeEventListener('keyup', onKeyUp, false);
            document.removeEventListener('mousedown', onMouseDown, false);
            document.removeEventListener('mousemove', onMouseMove, false);
            document.removeEventListener('mouseup', onMouseUp, false);
        };
    }, []);
    useEffect(() => {
        ganttParams.scrollTopStopper.current = true;
    });
    /*
    useEffectSkip(() => {
        console.log('useEffect calender calenderBodyParam.current displayTasks', raptime());
        // スクロール量を保持
        //const calenderContainer = document.getElementById('ganttCalenderContainer');
        calenderContainerRef.current.scrollTo(lastScroll.current.x, lastScroll.current.y);
        console.log('useEffectEND calender calenderBodyParam.current displayTasks', raptime());
    }, [displayTasks]);
    */
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
                        (start_.getUTCHours() * 60 * 60 * 1000 + (end_.getTime() - start_.getTime())) /
                            (60 * 60 * 24 * 1000),
                    );
                    s =
                        floor(
                            (start_.getUTCHours() + start_.getUTCMinutes() / 60 - 0.01) /
                                (24 / ganttParams.cellDivideNumber),
                        ) * -1;
                    e =
                        floor(
                            (end_.getUTCHours() + end_.getUTCMinutes() / 60 - 0.01) /
                                (24 / ganttParams.cellDivideNumber),
                        ) + 1;
                    c = e + s;
                    break;
                case 'date':
                    base = floor(
                        (start_.getUTCMinutes() * 60 * 1000 + (end_.getTime() - start_.getTime())) / (60 * 60 * 1000),
                    );
                    s = floor((start_.getUTCMinutes() - 0.01) / (60 / ganttParams.cellDivideNumber)) * -1;
                    e = floor((end_.getUTCMinutes() - 0.01) / (60 / ganttParams.cellDivideNumber)) + 1;
                    c = e + s;
                    break;
            }
            block = base * ganttParams.cellDivideNumber + c;
        }
        return c.cell.width * block;
    };
    const getLeft = (start: Date) => {
        const delta = getTimedelta(ganttParams.calenderRange.start, start);
        let block;
        switch (ganttParams.ganttScale) {
            case 'month':
                block = delta.date * ganttParams.cellDivideNumber + Math.floor((delta.hours % 24) / 12);
                break;
            case 'date':
                block = delta.hours * ganttParams.cellDivideNumber + Math.floor((delta.minutes % 60) / 30);
                break;
        }
        return c.cell.width * block;
    };
    const timebarLeft = displayTasks.map((task, index) => {
        const period = task.properties.filter((p) => p.id == 2)[0].values[0];
        const width = !!period ? getTimeberWidth(period.start, period.end) - c.cell.width * 0.02 : 0;
        const tps = !!period ? new Date(period.start !== null ? period.start : period.end) : null;
        const cond =
            !!width &&
            !!tps &&
            period.start >= ganttParams.calenderRange.start.getTime() &&
            period.end <= ganttParams.calenderRange.end.getTime() &&
            ganttParams.displayRange.top <= index &&
            index <= ganttParams.displayRange.bottom;
        /*
        const left = cond
            ? getTimeberWidth(ganttParams.calenderRange.start, period.start) -
              (ganttParams.calenderRange.start.getUTCHours() != 0 ||
              ganttParams.calenderRange.start.getUTCMinutes() != 0
                  ? c.cell.width
                  : 0)
            : 0;
        */
        const left = cond ? getLeft(new Date(period.start)) : 0;
        return { display: cond ? '' : 'none', left, width };
    });
    // --------------------------------------------------------
    /*
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
    */
    const timebarHeight = c.cell.height * c.timebar.yShrinkCoef;
    const timebarSideWidth = c.cell.width * c.timebar.sideWidthCoef;
    // --------------------------------------------------------
    console.log('calender render', raptime());
    return (
        <div
            id="ganttCalenderContainer"
            style={{
                minHeight: '100%',
                zIndex: 0,
            }}
        >
            <div
                className="GanttCalenderBodyWrapper"
                style={{
                    position: 'relative',
                    width: '100%',
                    backgroundColor: c.color.body,
                    height: displayTasks.length * c.cell.height,
                }}
            >
                <div
                    className="GanttCalenderBody"
                    id="GanttCalenderBody"
                    style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {displayTasks.map((task, y) => {
                        return (
                            <div
                                className="GanttCalenderRow ganttCalenderRow"
                                style={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: ganttParams.calenderRangeDiff * ganttParams.cellDivideNumber * c.cell.width,
                                    height: c.cell.height,
                                    userSelect: 'none',
                                    backgroundImage: 'linear-gradient(90deg, rgb(255,255,255) 99%, rgb(0,0,0) 1%)',
                                    backgroundSize: `${c.cell.width * ganttParams.cellDivideNumber}px ${
                                        c.cell.height
                                    }px`,
                                }}
                                key={`calender-row-${y}`}
                                data-id={task.id}
                                data-row={y}
                                data-target="row"
                                onClick={onCellClick}
                            >
                                {
                                    <div
                                        className="GanttCalenderTimebarWrap ganttCalenderTimebarGroup"
                                        style={{
                                            position: 'absolute',
                                            height: timebarHeight,
                                            borderRadius: '7px',
                                            backgroundColor: c.color.timebar,
                                            zIndex: 1,
                                            userSelect: 'none',
                                            width: timebarLeft[y].width,
                                            left: timebarLeft[y].left,
                                            display: timebarLeft[y].display,
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
                                                height: timebarHeight,
                                                borderRadius: '7px',
                                                backgroundColor: 'transparent',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                width: timebarLeft[y].width,
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
                                                    width: timebarSideWidth,
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
                                                    width: timebarSideWidth,
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
                                }
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Gantt;
