import React, { memo, PropsWithChildren, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { IRootState } from '../type/store';

const Common: React.FC = ({ children }) => {
    console.log('Common rerender');
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch({
            type: 'initialize',
        });
    }, []);
    const props = useSelector((props: IRootState) => ({
        project: props.projects,
    }));
    console.log('props', props);
    const Body = styled.div`
        position: fixed;
        top: 0;
        left: 0;
        margin: 0;
        padding: 0;
        border: none;
        width: 100%;
        height: 100%;
    `;
    const Contents = styled.div`
        position: absolute;
        top: 100px;
        left: 0;
        min-height: calc(100vh-100px);
        width: 100%;
    `;
    const MemolizedContents = memo(
        function contents() {
            return <Contents>{children}</Contents>;
        },
        (p, n) => {
            return false;
        },
    );
    return (
        <Body>
            <NavArea />
            <MemolizedContents />
        </Body>
    );
};

const NavArea = () => {
    console.log('Navarea rerender');
    const [isOpenNavbar, setIsOpenNavbar] = useState(false);
    const Navs = styled.div`
        width: 100%;
    `;
    const Header = styled.div`
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100px;
        background-color: lightgray;
    `;
    const Navbar = styled.div`
        display: ${isOpenNavbar ? 'block' : 'none'};
        position: absolute;
        top: 0;
        left: 0;
        width: 100px;
        height: 100%;
        background-color: gray;
        z-index: 1;
    `;
    return (
        <Navs>
            <Header>
                <button
                    onClick={event => {
                        setIsOpenNavbar(true);
                        event.preventDefault();
                    }}
                >
                    ON
                </button>
            </Header>
            <Navbar>
                <button
                    onClick={event => {
                        setIsOpenNavbar(false);
                        event.preventDefault();
                    }}
                >
                    OFF
                </button>
                <Link to="/sampleProject/gantt?scale=date">Gantt</Link>
                <Link to="/sampleProject/page/1">Page</Link>
            </Navbar>
        </Navs>
    );
};

export default Common;
