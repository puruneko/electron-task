import { IProject } from './root';

export interface IRootState {
    componentStates: any;
    constants: Array<any>;
    settings: Array<any>;
    projects: Array<IProject>;
}
