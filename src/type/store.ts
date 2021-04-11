import { IProject } from './root';

export interface IRootState {
    constants: Array<any>;
    settings: Array<any>;
    projects: {
        [projectName: string]: IProject;
    };
}
