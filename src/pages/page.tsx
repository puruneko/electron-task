import React, { memo, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { floor, ceil, ceilfloor, topbottom, useQuery } from '../lib/utils';
import { getTimedelta, getYYYYMMDD, getHHMMSS, getMMDD, getHH, getTime } from '../lib/time';
import { IPage } from '../type/root';
import { IRootState } from '../type/store';
import PageComponent from '../components/page';

const Page: React.FC = () => {
    const params = useParams<any>();
    const queries = useQuery();
    console.log('Page: window.location', window.location, 'params', params, 'queries', queries);
    return (
        <div>
            <PageComponent pageId={params.pageId} />
        </div>
    );
};

export default Page;
