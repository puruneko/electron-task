import { getTime } from './time';

const now = new Date();

export const initialState = {
    componentStates: {
        gantt: {},
        kanban: {},
        page: {},
    },
    constants: {
        authority: [
            {
                id: 0,
                name: 'developper',
            },
            {
                id: 1,
                name: 'adminitrtator',
            },
            {
                id: 2,
                name: 'visitor',
            },
        ],
        statusType: [
            {
                id: 0,
                name: 'others',
            },
            {
                id: 1,
                name: 'backlog',
            },
            {
                id: 2,
                name: 'todo',
            },
            {
                id: 3,
                name: 'doing',
            },
            {
                id: 4,
                name: 'done',
            },
        ],
    },
    settings: {
        users: [
            {
                id: 0,
                name: 'Ryutaro',
                password: 'Password123456789',
                authority: 1,
            },
            {
                id: 1,
                name: 'Kota',
                password: 'Password123456789',
                authority: 1,
            },
            {
                id: 1,
                name: 'Ojisan',
                password: 'Password123456789',
                authority: 2,
            },
        ],
    },
    projects: [
        {
            id: 1,
            name: 'sampleProject',
            settings: {
                ganttScale: 'date',
                ganttCellDivideNumber: 2,
                pageNextId: 9,
            },
            status: [
                {
                    id: 1,
                    name: 'backlog',
                    statusType: 1,
                    color: 'gray',
                },
                {
                    id: 2,
                    name: 'scheduled',
                    statusType: 1,
                    color: 'green',
                },
                {
                    id: 3,
                    name: 'todo',
                    statusType: 2,
                    color: 'orange',
                },
                {
                    id: 4,
                    name: 'doing',
                    statusType: 3,
                    color: 'red',
                },
                {
                    id: 5,
                    name: 'done',
                    statusType: 4,
                    color: 'purple',
                },
            ],
            tags: [
                {
                    id: 1,
                    name: 'Tag1',
                    color: 'red',
                },
                {
                    id: 2,
                    name: 'Tag2',
                    color: 'blue',
                },
            ],
            pages: [
                {
                    id: 7,
                    type: 'page',
                    title: 'sample1 page',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                    },
                    statusId: 1,
                    assign: [1],
                    tags: [1],
                    settings: {
                        focusedId: 1,
                        nextId: 2 + 1,
                    },
                },
                {
                    id: 8,
                    type: 'page',
                    title: 'sample2',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 18, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                    settings: {
                        focusedId: 1,
                        nextId: 2 + 1,
                    },
                },
                {
                    id: 1,
                    type: 'task',
                    title: 'sample1',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                    },
                    statusId: 1,
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 2,
                    type: 'task',
                    title: 'sample2',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 18, 30)),
                    },
                    statusId: 2,
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 3,
                    type: 'task',
                    title: 'sample3',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate() + 1, 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate() + 1, 12, 30)),
                    },
                    statusId: 3,
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 4,
                    type: 'task',
                    title: 'sample4',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate() + 5, 12, 30)),
                    },
                    statusId: 4,
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 5,
                    type: 'task',
                    title: 'sample5',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate() + 3, 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate() + 3, 13, 30)),
                    },
                    statusId: 5,
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 6,
                    type: 'task',
                    title: 'sample6',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 18, 30)),
                    },
                    statusId: 1,
                    assign: [1],
                    tags: [1],
                },
            ],
        },
        {
            id: 2,
            name: 'sampleProject2',
            settings: {
                ganttScale: 'date',
                ganttCellDivideNumber: 2,
                pageNextId: 9,
            },
            status: [
                {
                    id: 1,
                    name: 'backlog',
                    type: 1,
                    color: 'gray',
                },
                {
                    id: 2,
                    name: 'scheduled',
                    type: 1,
                    color: 'green',
                },
                {
                    id: 3,
                    name: 'todo',
                    type: 2,
                    color: 'orange',
                },
                {
                    id: 4,
                    name: 'doing',
                    type: 3,
                    color: 'red',
                },
                {
                    id: 1,
                    name: 'done',
                    type: 4,
                    color: 'purple',
                },
            ],
            tags: [
                {
                    id: 1,
                    name: 'Tag1',
                    color: 'red',
                },
                {
                    id: 2,
                    name: 'Tag2',
                    color: 'blue',
                },
            ],
            pages: [
                {
                    id: 7,
                    type: 'page',
                    title: 'sample1 page',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                    },
                    statusId: 1,
                    assign: [1],
                    tags: [1],
                    settings: {
                        focusedId: 1,
                        nextId: 2 + 1,
                    },
                },
                {
                    id: 8,
                    type: 'page',
                    title: 'sample2',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 18, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                    settings: {
                        focusedId: 1,
                        nextId: 2 + 1,
                    },
                },
                {
                    id: 1,
                    type: 'task',
                    title: 'sample1',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                    },
                    statusId: 1,
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 2,
                    type: 'task',
                    title: 'sample2',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 18, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 3,
                    type: 'task',
                    title: 'sample3',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate() + 1, 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate() + 1, 12, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 4,
                    type: 'task',
                    title: 'sample4',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate() + 5, 12, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 5,
                    type: 'task',
                    title: 'sample5',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate() + 3, 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate() + 3, 13, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 6,
                    type: 'task',
                    title: 'sample6',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 18, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                },
            ],
        },
    ],
};
