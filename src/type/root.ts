export type ID = number;

export interface IProject {
    id: number;
    name: string;
    settings: {
        ganttScale: string;
        ganttCellDivideNumber: number;
    };
    status: Array<any>;
    tags: Array<any>;
    tasks: Array<ITask>;
    pages: Array<IPage>;
}

export type document = {
    id: number;
    document: string;
};

export interface ITask {
    id: ID;
    title: string;
    type: string;
    documents: Array<string>;
    period: {
        start: Date;
        end: Date;
    };
    status: ID;
    assign: Array<ID>;
    tags: Array<ID>;
}

export interface IPage {
    id: ID;
    title: string;
    type: string;
    documents: Array<document>;
    period: {
        start: Date;
        end: Date;
    };
    status: ID;
    assign: Array<ID>;
    tags: Array<ID>;
    settings: {
        focusedId: ID;
        nextId: ID;
    };
}
