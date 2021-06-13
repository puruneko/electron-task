import React, { useState } from 'react';
import styled from 'styled-components';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
    AppBar,
    Button,
    Collapse,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Toolbar,
    Typography,
} from '@material-ui/core';
import MenuIcon from '@material-ui/icons/Menu';

import { IRootState } from '../type/store';
import { createDict, raptime } from '../lib/utils';
import { ExpandLess, ExpandMore } from '@material-ui/icons';

const Container = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background-color: lightgray;
`;

type Props = {
    height?: number;
    rightComponent?: React.ReactElement<any, any>;
    rightComponentProps?: any;
};

const Header: React.FC<Props> = ({ height = 64, rightComponent = <></>, rightComponentProps = {} }) => {
    console.log('header start', raptime());
    const { projects, headerStates } = useSelector(
        (props: IRootState) => ({
            projects: props.projects,
            headerStates: props.componentStates?.header,
        }),
        shallowEqual,
    );
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isPageCollapse, setIsPageCollapse] = useState(
        projects
            ? createDict(
                  projects.map((project) => {
                      return project.id;
                  }),
                  (id) => {
                      return false;
                  },
              )
            : {},
    );
    const onDrawerOpen = () => {
        setIsDrawerOpen(true);
    };
    const onDrawerClose = () => {
        setIsDrawerOpen(false);
    };
    console.log('header render', raptime());
    return (
        <Container>
            <AppBar position="static" style={{ flexGrow: 1, height: `${height}px`, maxHeight: `${height}px` }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" aria-label="menu" onClick={onDrawerOpen}>
                        <MenuIcon />
                    </IconButton>
                    <Link to="/lab">
                        <a>Lab</a>
                    </Link>
                    <Typography variant="h6" style={{ flexGrow: 1 }}>
                        {headerStates ? headerStates.title : ''}
                    </Typography>
                    {React.cloneElement(rightComponent, rightComponentProps)}
                    <Button color="inherit">Login</Button>
                </Toolbar>
            </AppBar>
            <Drawer anchor={'left'} open={isDrawerOpen} onClose={onDrawerClose} style={{ zIndex: 100 }}>
                {!!projects &&
                    projects.map((project, index) => {
                        return (
                            <List key={project.id}>
                                <ListItem button>
                                    <ListItemText primary={project.name} />
                                </ListItem>
                                <ListItem>
                                    <Link to={`/${project.id}/gantt?scale=${project.settings.ganttScale}`}>Gantt</Link>
                                </ListItem>
                                <ListItem>
                                    <Link to={`/${project.id}/kanban`}>Kanban</Link>
                                </ListItem>
                                <ListItem
                                    button
                                    onClick={() => {
                                        setIsPageCollapse({
                                            ...isPageCollapse,
                                            [project.id]: !isPageCollapse[project.id],
                                        });
                                    }}
                                >
                                    <ListItemText primary={'Pages'} />
                                    {isPageCollapse[project.id] ? <ExpandLess /> : <ExpandMore />}
                                </ListItem>
                                <Collapse in={isPageCollapse[project.id]} timeout="auto" unmountOnExit>
                                    <List style={{ marginLeft: '10px' }}>
                                        {project.pages
                                            .filter((page) => page.type == 'page')
                                            .map((page, index2) => {
                                                const title = page.properties.filter((p) => p.id == 0)[0].values[0];
                                                return (
                                                    <ListItem key={`navbar-page-${index}-${index2}`}>
                                                        <Link to={`/${project.id}/page/${page.id}`}>{title}</Link>
                                                    </ListItem>
                                                );
                                            })}
                                    </List>
                                </Collapse>
                                <Divider />
                            </List>
                        );
                    })}
            </Drawer>
        </Container>
    );
};

export default Header;
