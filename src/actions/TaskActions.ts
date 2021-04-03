import { actionCreatorFactory } from 'typescript-fsa';
import { ITask } from '../states/ITask';

// action creator を作成する
// 引数は、アクションのグループごとに一意
// ファイル単位で、1つの creator があれば良い
const actionCreator = actionCreatorFactory('task-action');

// アクションの定義
// 引数は（同じ creator から生成される）アクションごとに一意
export const changeTaskAction = actionCreator<Partial<ITask>>('change-task');
