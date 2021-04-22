import React, { memo, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Router, { Link, useParams, withRouter } from 'react-router-dom';
import styled from 'styled-components';
import { IRootState } from '../type/store';
import Header from './header';

const headerHeight = 64;

const Body = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    margin: 0;
    padding: 0;
    border: none;
    width: 100vw;
    height: 100vh;
`;
const Contents = styled.div`
    position: absolute;
    /*top: ${headerHeight}px;*/
    left: 0;
    height: 100%;
    width: 100%;
`;
const Common: React.FC = ({ history, children }) => {
    const locParams = useParams<any>();
    console.log('Common rerender', children, locParams, window.location);
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch({
            type: 'initialize',
        });
        // アプリ立ち上げ初回のみルートにリダイレクト
        if (window.location.pathname.match(/[/]?index.html$/)) {
            history.push('/');
        }
    }, []);
    return (
        <Body>
            {/*<Header height={64} rightComponent />*/}
            <Contents>{children}</Contents>
        </Body>
    );
};

export default withRouter(Common);
