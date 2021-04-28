import { getTime } from './time';

const now = new Date();

export const initialState = {
    componentStates: {
        gantt: {
            scrollTarget: null,
        },
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
                ganttScale: 'date', // mounth
                ganttCellDivideNumber: 2,
                ganttFilterLigicalOperator: 'or',
                ganttFilters: [
                    {
                        id: 1,
                        propertyId: 2,
                        operator: 'eq',
                        value: 2,
                        apply: true,
                    },
                ],
                ganttSorts: [
                    {
                        id: 1,
                        propertyId: 2,
                        direction: 'asc',
                        apply: true,
                    },
                ],
            },
            properties: [
                // id:不変
                // readOnly:読み取り専用。内部の値(propertyの設定値)が編集できない。
                // name:代表名
                // type:プロパティの種類
                //        title:
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
                    id: 1,
                    readOnly: false,
                    name: 'title',
                    type: 'title',
                    values: null,
                    display: true,
                    width: 100,
                    color: '',
                },
                {
                    id: 2,
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
                    id: 3,
                    readOnly: true,
                    name: 'date',
                    type: 'date',
                    values: null,
                    display: true,
                    width: 100,
                    color: 'blue',
                },
                {
                    id: 4,
                    readOnly: true,
                    name: 'assign',
                    type: 'user',
                    values: null,
                    display: true,
                    width: 100,
                    color: 'blue',
                },
                {
                    id: 10,
                    readOnly: false,
                    name: 'prop1',
                    type: 'label',
                    values: null,
                    display: true,
                    width: 100,
                    color: 'red',
                },
                {
                    id: 11,
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
                    id: 12,
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
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample page 1'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
                },
                {
                    id: 8,
                    type: 'page',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample page 2'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
                },
                {
                    id: 1,
                    type: 'task',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample1'],
                        },
                        {
                            id: 2,
                            values: [2],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
                },
                {
                    id: 2,
                    type: 'task',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample2'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
                },
                {
                    id: 3,
                    type: 'task',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample3'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                },
                {
                    id: 4,
                    type: 'task',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample4'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
                },
                {
                    id: 5,
                    type: 'task',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample5'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
                },
                {
                    id: 6,
                    type: 'task',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample6'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
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
                // id:不変
                // readOnly:読み取り専用。内部の値(propertyの設定値)が編集できない。
                // name:代表名
                // type:プロパティの種類
                //        title:
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
                    id: 1,
                    readOnly: false,
                    name: 'title',
                    type: 'title',
                    values: null,
                    display: true,
                    width: 100,
                    color: '',
                },
                {
                    id: 2,
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
                    id: 3,
                    readOnly: true,
                    name: 'date',
                    type: 'date',
                    values: null,
                    display: true,
                    width: 100,
                    color: 'blue',
                },
                {
                    id: 4,
                    readOnly: true,
                    name: 'assign',
                    type: 'user',
                    values: null,
                    display: true,
                    width: 100,
                    color: 'blue',
                },
                {
                    id: 10,
                    readOnly: false,
                    name: 'prop1',
                    type: 'label',
                    values: null,
                    display: true,
                    width: 100,
                    color: 'red',
                },
                {
                    id: 11,
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
                    id: 12,
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
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample page 1'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
                },
                {
                    id: 8,
                    type: 'page',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample page 2'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
                },
                {
                    id: 1,
                    type: 'task',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample1'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
                },
                {
                    id: 2,
                    type: 'task',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample2'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
                },
                {
                    id: 3,
                    type: 'task',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample3'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                },
                {
                    id: 4,
                    type: 'task',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample4'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
                },
                {
                    id: 5,
                    type: 'task',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample5'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
                },
                {
                    id: 6,
                    type: 'task',
                    documents: [
                        {
                            id: 1,
                            document: '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document: '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    properties: [
                        {
                            id: 1,
                            values: ['sample6'],
                        },
                        {
                            id: 2,
                            values: [1],
                        },
                        {
                            id: 3,
                            values: [
                                {
                                    start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                                    end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                                },
                            ],
                        },
                        {
                            id: 4,
                            values: [2],
                        },
                        {
                            id: 10,
                            values: ['LABEL'],
                        },
                        {
                            id: 11,
                            values: [1, 2],
                        },
                        {
                            id: 12,
                            values: [true],
                        },
                    ],
                    settings: {
                        focusedId: 1,
                    },
                },
            ],
        },
    ],
};
