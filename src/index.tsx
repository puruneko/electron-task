import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createBrowserHistory } from 'history';
import { Router, Route, Redirect } from 'react-router-dom';

import Store from './store';
import Top from './pages/top';
import Timeline from './pages/timeline';

const container = document.getElementById('container');
const history = createBrowserHistory();

if (!location.hash.length) {
    location.hash = '/';
}

ReactDOM.render(
    <Provider store={Store}>
        <Router history={history}>
            <Route exact path="/" component={Top} />
            <Route exact path="/timeline" component={Timeline} />
            <Redirect to="/" />
        </Router>
    </Provider>,
    container,
);
