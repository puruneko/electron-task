import { IProject } from './root';

export interface IRootState {
    componentStates: any;
    constants: any;
    settings: any;
    projects: Array<IProject>;
}
