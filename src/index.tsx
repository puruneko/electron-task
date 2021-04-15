import React, { memo, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter, Redirect, Route, Router, Switch } from 'react-router-dom';

import Common from './components/common';
import Top from './pages/top';
import Gantt from './pages/gantt';
import Kanban from './pages/kanban';
import Page from './pages/page';

import { useStore } from './lib/store';

const container = document.getElementById('container');
const store = useStore({});
console.log('default location', window.location);

ReactDOM.render(
    <Provider store={store}>
        <BrowserRouter forceRefresh={false}>
            <Common>
                <Route exact path="/" component={Top} />
                <Route key={'gantt'} path="/:projectId/gantt" component={Gantt} />
                <Route key={'kanban'} path="/:projectId/kanban" component={Kanban} />
                <Route key={'page'} path="/:projectId/page/:pageId" component={Page} />
            </Common>
        </BrowserRouter>
    </Provider>,
    container,
);
