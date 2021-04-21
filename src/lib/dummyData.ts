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
                id: 1,
                name: 'Ryutaro',
                password: 'Password123456789',
                authority: 1,
            },
            {
                id: 2,
                name: 'Kota',
                password: 'Password123456789',
                authority: 1,
            },
            {
                id: 3,
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
            },
            properties: [
                // id:不変
                // readOnly:読み取り専用。内部の値が編集できない。

                // name:代表名
                // type:プロパティの種類
                //        status: kanbanステータス。value:指定可能なステータス{id,name,statusType,color}。id:1のみ指定可能
                //        date: 日付型。value:null。id:2のみtaskのperiodがデータとして使用される
                //        user: ユーザ。value:null。id:3のみ指定可能。
                //        label: 文字型。value:null。自由に文字を入力できる
                //        tag: タグ型。value:指定可能なタグ{id,name,color}。予め入力された文字の中から複数選択する
                //        check: 論理型。value:null。true/falseの値のみとる
                // values:プロパティの種類に応じた値が指定される
                // display:表示の有無
                // color: テーマカラー
                {
                    id: 0,
                    width: 100,
                },
                {
                    id: 1,
                    readOnly: true,
                    name: 'status',
                    type: 'status',
                    values: [
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
                    display: true,
                    width: 100,
                    color: 'blue',
                },
                {
                    id: 2,
                    readOnly: true,
                    name: 'date',
                    type: 'date',
                    values: null,
                    display: true,
                    width: 100,
                    color: 'blue',
                },
                {
                    id: 3,
                    readOnly: true,
                    name: 'assign',
                    type: 'user',
                    values: null,
                    display: true,
                    width: 100,
                    color: 'blue',
                },
                {
                    id: 4,
                    readOnly: false,
                    name: 'prop1',
                    type: 'label',
                    values: null,
                    display: true,
                    width: 100,
                    color: 'red',
                },
                {
                    id: 5,
                    readOnly: false,
                    name: 'prop2',
                    type: 'tag',
                    values: [
                        {
                            id: 1,
                            name: 'tag1',
                            color: 'blue',
                        },
                        {
                            id: 2,
                            name: 'tag2',
                            color: 'green',
                        },
                        {
                            id: 3,
                            name: 'tag3',
                            color: 'red',
                        },
                    ],
                    display: true,
                    width: 100,
                    color: 'blue',
                },
                {
                    id: 6,
                    readOnly: false,
                    name: 'prop3',
                    type: 'check',
                    values: null,
                    display: true,
                    width: 100,
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
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
                    assign: [2],
                    properties: [
                        {
                            id: 4,
                            values: ['LABEL']
                        },
                        {
                            id: 5,
                            values: [1, 2],
                        },
                        {
                            id: 6,
                            values: [true]
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
                    },
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
                    },
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
                    },
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
                    },
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
                    },
                },
            ],
        },
        {
            id: 2,
            name: 'sampleProject2',
            settings: {
                ganttScale: 'date',
                ganttCellDivideNumber: 2,
            },
            properties: [
                {
                    id: 1,
                    readOnly: true,
                    name: 'status',
                    type: 'status',
                    values: [
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
                    display: true,
                    color: 'blue',
                },
                {
                    id: 2,
                    readOnly: true,
                    name: 'date',
                    type: 'date',
                    values: null,
                    display: true,
                    color: 'blue',
                },
                {
                    id: 3,
                    readOnly: true,
                    name: 'assign',
                    type: 'user',
                    values: null,
                    display: true,
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
                    },
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
                    },
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
                    },
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
                    },
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
                    },
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
                    assign: [2],
                    properties: [1],
                    settings: {
                        focusedId: 1,
                    },
                },
            ],
        },
    ],
};
