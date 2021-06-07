import React, { memo, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Router, { Link, useParams, withRouter } from 'react-router-dom';
import styled from 'styled-components';
import { raptime } from '../lib/utils';
import { IRootState } from '../type/store';
import Header from './header';

const headerHeight = 64;

const Body = styled.div`
    margin: 0;
    padding: 0;
    border: none;
    width: 100%;
    height: 100%;
`;
const Contents = styled.div`
    position: absolute;
    /*top: ${headerHeight}px;*/
    left: 0;
    width: 100%;
    height: 100%;
`;
const Common: React.FC<{ history: any }> = ({ history, children }) => {
    const locParams = useParams<any>();
    console.log('Common rerender', raptime(), children, locParams, window.location);
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
