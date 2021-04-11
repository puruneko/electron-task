import React, { memo, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { BrowserRouter, Redirect, Route, Router, Switch } from 'react-router-dom';

import Top from './pages/top';
import Gantt from './pages/gantt';
import Common from './components/common';
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
                <Route key={'gantt'} path="/:projectName/gantt" component={Gantt} />
                <Route key={'page'} path="/:projectName/page/:pageId" component={Page} />
            </Common>
        </BrowserRouter>
    </Provider>,
    container,
);
