import { reducerWithInitialState } from 'typescript-fsa-reducers';
import { changeTaskAction } from '../actions/TaskActions';
import { ITask } from '../states/ITask';

// Stateの初期値
const initTask: ITask = {
    count: 0,
    name: '',
};

const TaskReducer = reducerWithInitialState<ITask>(initTask)
    // Action ごとに`.case`をメソッドチェーンでつなぐ
    // 1番目の引数は、アクション、2番めが処理の関数
    // 処理の関数の引数は、1番目が変更前の State、2番めが Action の値
    // 必ず、Stateと同じ型(ここでは、ITask)のオブジェクトを return する必要がある。
    // payload はここでは、Actionで指定した`Partial<ITask>`の型のオブジェクト。
    .case(changeTaskAction, (state, payload) => ({
        ...state,
        ...payload,
    }))
    // 上は、下記と同じ意味
    // const task = Object.assign({}, state, payload);
    // return task;
    .build();

export default TaskReducer;
