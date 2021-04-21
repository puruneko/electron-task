import { IProject } from './root';

export interface IRootState {
    componentStates: any;
    constants: Array<any>;
    settings: any;
    projects: Array<IProject>;
}
