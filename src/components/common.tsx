import React, { memo, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { IRootState } from '../type/store';

const headerHeight = 50;

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
        width: 100vw;
        height: 100vh;
    `;
    const Contents = styled.div`
        position: absolute;
        top: ${headerHeight}px;
        left: 0;
        height: 100%;
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
    const { projects } = useSelector(
        (props: IRootState) => ({
            projects: props.projects,
        }),
        shallowEqual,
    );
    const [isOpenNavbar, setIsOpenNavbar] = useState(false);
    const Navs = styled.div`
        width: 100%;
    `;
    const Header = styled.div`
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: ${headerHeight}px;
        background-color: lightgray;
    `;
    const Navbar = styled.div`
        display: ${isOpenNavbar ? 'block' : 'none'};
        position: absolute;
        top: 0;
        left: 0;
        width: 200px;
        height: 100%;
        background-color: rgba(143, 143, 143, 0.8);
        z-index: 10;
    `;
    return (
        <Navs>
            <Header>
                <button
                    onClick={(event) => {
                        setIsOpenNavbar(true);
                        event.preventDefault();
                    }}
                >
                    ON
                </button>
            </Header>
            <Navbar>
                <button
                    onClick={(event) => {
                        setIsOpenNavbar(false);
                        event.preventDefault();
                    }}
                >
                    OFF
                </button>
                {!!projects &&
                    projects.map((project, index) => {
                        return (
                            <div key={`navbar-project-${index}`}>
                                {project.name}
                                <div>
                                    <Link to={`/${project.id}/gantt?scale=${project.settings.ganttScale}`}>Gantt</Link>
                                </div>
                                <div>
                                    <Link to={`/${project.id}/kanban`}>Kanban</Link>
                                </div>
                                <div>
                                    Page
                                    {project.pages
                                        .filter((page) => page.type == 'page')
                                        .map((page, index2) => {
                                            return (
                                                <div key={`navbar-page-${index}-${index2}`}>
                                                    <Link to={`/${project.id}/page/${page.id}`}>{page.title}</Link>
                                                </div>
                                            );
                                        })}
                                </div>
                                <hr />
                            </div>
                        );
                    })}
            </Navbar>
        </Navs>
    );
};

export default Common;
