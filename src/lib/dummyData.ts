import { getTime } from './time';

const now = new Date();

const projectProperties = [
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
        id: 0,
        readOnly: false,
        name: 'title',
        type: 'title',
        values: null,
        display: true,
        width: 100,
        color: '',
    },
    {
        id: 1,
        readOnly: true,
        name: 'status',
        type: 'status',
        values: [
            {
                id: 0,
                name: 'backlog',
                statusType: 0,
                color: 'gray',
            },
            {
                id: 1,
                name: 'scheduled',
                statusType: 0,
                color: 'green',
            },
            {
                id: 2,
                name: 'todo',
                statusType: 1,
                color: 'orange',
            },
            {
                id: 3,
                name: 'doing',
                statusType: 2,
                color: 'red',
            },
            {
                id: 4,
                name: 'done',
                statusType: 3,
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
                id: 0,
                name: 'tag1',
                color: 'blue',
            },
            {
                id: 1,
                name: 'tag2',
                color: 'green',
            },
            {
                id: 2,
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
];

// ------------------------------------------------------------initialState
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
        scale: [
            //'year',
            'month',
            'date',
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
                authority: 0,
            },
            {
                id: 1,
                name: 'Kota',
                password: 'Password123456789',
                authority: 1,
            },
            {
                id: 2,
                name: 'Ojisan',
                password: 'Password123456789',
                authority: 2,
            },
        ],
    },
    projects: [...Array(2).keys()].map((projectId) => {
        return {
            id: projectId,
            name: `sampleProject${projectId}`,
            settings: {
                ganttScale: 'month', // mounth/date
                ganttCellDivideNumber: 2,
                ganttFilterLigicalOperator: 'or',
                ganttFilters: [
                    {
                        id: 0,
                        propertyId: 1,
                        operator: 'eq',
                        value: 1,
                        apply: false,
                    },
                ],
                ganttSorts: [
                    {
                        id: 0,
                        propertyId: 1,
                        direction: 'asc',
                        apply: true,
                    },
                ],
            },
            properties: projectProperties,
            pages: [...Array(200).keys()].map((id) => {
                const type = Math.floor(Math.random() * 2) % 2 == 0 ? 'page' : 'task';
                const now1 = new Date(now);
                now1.setDate(Math.floor(Math.random() * 29) + 1);
                now1.setHours(Math.floor(Math.random() * 23) + 1);
                now1.setMinutes(Math.floor(Math.random() * 59) + 1);
                const now2 = new Date(
                    now1.getTime() + (Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 3) + 1000 * 60 * 60),
                );
                return {
                    id: id,
                    type,
                    documents: [
                        {
                            id: 0,
                            document: `## test\n\n- list${id}\n- list${id}\n\n1. numbered list${id}\n1. numbered list${id}`,
                        },
                        {
                            id: 1,
                            document: `## test\n\n- list${id}\n- list${id}\n\n1. numbered list${id}\n1. numbered list${id}`,
                        },
                    ],
                    properties: [
                        {
                            // title
                            id: 0,
                            values: [`sample ${type} ${id}`],
                        },
                        {
                            // status
                            id: 1,
                            values: [Math.floor(Math.random() * 4)],
                        },
                        {
                            // period
                            id: 2,
                            values: [
                                {
                                    start: getTime(
                                        new Date(
                                            2021,
                                            now1.getMonth(),
                                            now1.getDate(),
                                            now1.getHours(),
                                            now1.getMinutes(),
                                        ),
                                    ),
                                    end: getTime(
                                        new Date(
                                            2021,
                                            now2.getMonth(),
                                            now2.getDate(),
                                            now2.getHours(),
                                            now2.getMinutes(),
                                        ),
                                    ),
                                },
                            ],
                        },
                        {
                            // assign
                            id: 3,
                            values: [Math.floor(Math.random() * 2)],
                        },
                        {
                            id: 4,
                            values: ['LABEL'],
                        },
                        {
                            id: 5,
                            values: [...Array(Math.floor(Math.random() * 4)).keys()].map((_) => {
                                return Math.floor(Math.random() * 2);
                            }),
                        },
                        {
                            id: 6,
                            values: [id % 2 == 0],
                        },
                    ],
                    settings: {
                        focusedId: 0,
                    },
                };
            }),
        };
    }),
};
