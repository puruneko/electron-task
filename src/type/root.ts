export type ID = number;

export interface IProperty {
    id: number;
    readOnly: boolean;
    name: string;
    type: string;
    values: Array<any>;
    display: boolean;
    width: number;
    color: string;
}

export interface IProject {
    id: number;
    name: string;
    settings: {
        ganttScale: string;
        ganttCellDivideNumber: number;
    };
    properties: Array<IProperty>;
    pages: Array<IPage>;
}

export type document = {
    id: number;
    document: string;
};

export interface IPage {
    id: ID;
    type: string;
    documents: Array<document>;
    tags: Array<ID>;
    properties: any;
    settings: {
        focusedId: ID;
    };
}
