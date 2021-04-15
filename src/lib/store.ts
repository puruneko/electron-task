/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo } from 'react';
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { logger } from './logger';
import { getTime } from './time';

let store;
const now = new Date();
const initialState = {
    componentStates: {
        gantt: {},
        kanban: {},
        page: {},
    },
    constants: {
        authority: [
            {
                id: 0,
                name: 'developper',
            },
            {
                id: 1,
                name: 'adminitrtator',
            },
            {
                id: 2,
                name: 'visitor',
            },
        ],
        statusType: [
            {
                id: 0,
                name: 'others',
            },
            {
                id: 1,
                name: 'backlog',
            },
            {
                id: 2,
                name: 'todo',
            },
            {
                id: 3,
                name: 'doing',
            },
            {
                id: 4,
                name: 'done',
            },
        ],
    },
    settings: {
        users: [
            {
                id: 0,
                name: 'Ryutaro',
                password: 'Password123456789',
                authority: 1,
            },
            {
                id: 1,
                name: 'Kota',
                password: 'Password123456789',
                authority: 1,
            },
            {
                id: 1,
                name: 'Ojisan',
                password: 'Password123456789',
                authority: 2,
            },
        ],
    },
    projects: [
        {
            id: 1,
            name: 'sampleProject',
            settings: {
                ganttScale: 'date',
                ganttCellDivideNumber: 2,
            },
            status: [
                {
                    id: 1,
                    name: 'backlog',
                    statusType: 1,
                    color: 'gray',
                },
                {
                    id: 2,
                    name: 'scheduled',
                    statusType: 1,
                    color: 'green',
                },
                {
                    id: 3,
                    name: 'todo',
                    statusType: 2,
                    color: 'orange',
                },
                {
                    id: 4,
                    name: 'doing',
                    statusType: 3,
                    color: 'red',
                },
                {
                    id: 5,
                    name: 'done',
                    statusType: 4,
                    color: 'purple',
                },
            ],
            tags: [
                {
                    id: 1,
                    name: 'Tag1',
                    color: 'red',
                },
                {
                    id: 2,
                    name: 'Tag2',
                    color: 'blue',
                },
            ],
            pages: [
                {
                    id: 1,
                    title: 'sample1 page',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                    },
                    statusId: 1,
                    assign: [1],
                    tags: [1],
                    settings: {
                        focusedId: 1,
                        nextId: 2 + 1,
                    },
                },
                {
                    id: 2,
                    title: 'sample2',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 18, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                    settings: {
                        focusedId: 1,
                        nextId: 2 + 1,
                    },
                },
            ],
            tasks: [
                {
                    id: 1,
                    title: 'sample1',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                    },
                    statusId: 1,
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 2,
                    title: 'sample2',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 18, 30)),
                    },
                    statusId: 2,
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 3,
                    title: 'sample3',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate() + 1, 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate() + 1, 12, 30)),
                    },
                    statusId: 3,
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 4,
                    title: 'sample4',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate() + 5, 12, 30)),
                    },
                    statusId: 4,
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 5,
                    title: 'sample5',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate() + 3, 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate() + 3, 13, 30)),
                    },
                    statusId: 5,
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 6,
                    title: 'sample6',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 18, 30)),
                    },
                    statusId: 1,
                    assign: [1],
                    tags: [1],
                },
            ],
        },
        {
            id: 2,
            name: 'sampleProject2',
            settings: {
                ganttScale: 'date',
                ganttCellDivideNumber: 2,
            },
            status: [
                {
                    id: 1,
                    name: 'backlog',
                    type: 1,
                    color: 'gray',
                },
                {
                    id: 2,
                    name: 'scheduled',
                    type: 1,
                    color: 'green',
                },
                {
                    id: 3,
                    name: 'todo',
                    type: 2,
                    color: 'orange',
                },
                {
                    id: 4,
                    name: 'doing',
                    type: 3,
                    color: 'red',
                },
                {
                    id: 1,
                    name: 'done',
                    type: 4,
                    color: 'purple',
                },
            ],
            tags: [
                {
                    id: 1,
                    name: 'Tag1',
                    color: 'red',
                },
                {
                    id: 2,
                    name: 'Tag2',
                    color: 'blue',
                },
            ],
            pages: [
                {
                    id: 1,
                    title: 'sample1 page',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                    },
                    statusId: 1,
                    assign: [1],
                    tags: [1],
                    settings: {
                        focusedId: 1,
                        nextId: 2 + 1,
                    },
                },
                {
                    id: 2,
                    title: 'sample2',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 18, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                    settings: {
                        focusedId: 1,
                        nextId: 2 + 1,
                    },
                },
            ],
            tasks: [
                {
                    id: 1,
                    title: 'sample1',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 12, 30)),
                    },
                    statusId: 1,
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 2,
                    title: 'sample2',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 18, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 3,
                    title: 'sample3',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate() + 1, 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate() + 1, 12, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 4,
                    title: 'sample4',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate() + 5, 12, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 5,
                    title: 'sample5',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate() + 3, 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate() + 3, 13, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                },
                {
                    id: 6,
                    title: 'sample6',
                    documents: [
                        {
                            id: 1,
                            document:
                                '## test\n\n- list1\n- list2\n\n1. numbered list1\n1. numbered list2',
                        },
                        {
                            id: 2,
                            document:
                                '## test\n\n- list3\n- list4\n\n1. numbered list3\n1. numbered list4',
                        },
                    ],
                    period: {
                        start: getTime(new Date(2021, now.getMonth(), now.getDate(), 11, 50)),
                        end: getTime(new Date(2021, now.getMonth(), now.getDate(), 18, 30)),
                    },
                    statusId: [1],
                    assign: [1],
                    tags: [1],
                },
            ],
        },
    ],
};

//export const reducer = (state = initialState, action) => {
export const reducer = (state, action) => {
    switch (action.type) {
        case 'initialize':
            logger.debug('reducer initialize', action);
            return initialState;
        case 'get':
            return state;
        case 'set':
            return Object.assign(
                {},
                {
                    ...state,
                    ...action.payload,
                },
            );
        case 'setComponentState': {
            // componentName
            // state
            return Object.assign(
                {},
                {
                    ...state,
                    componentStates: {
                        ...state.componentStates,
                        [action.componentName]: {
                            ...state.componentStates[action.componentName],
                            ...action.state,
                        },
                    },
                },
            );
        }
        case 'setTasks':
            // projectId
            // tasks
            logger.debug('reducer setTasks', action);
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                tasks: action.tasks,
                            };
                        } else {
                            return { ...project };
                        }
                    }),
                },
            );
        case 'setPages':
            // projectId
            // pages
            logger.debug('reducer setPages', action);
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                pages: action.pages,
                            };
                        } else {
                            return { ...project };
                        }
                    }),
                },
            );
        case 'setPage':
            // projectId
            // pageId
            // page
            logger.debug('reducer setPage', action);
            const setPage = project => {
                const newPages = project.pages.map(page => {
                    if (page.id == action.pageId) {
                        return action.page;
                    } else {
                        return page;
                    }
                });
                return {
                    pages: newPages,
                };
            };
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                ...setPage(project),
                            };
                        } else {
                            return { ...project };
                        }
                    }),
                },
            );
        case 'setDocument':
            // projectId
            // pageId
            // documentId
            // document
            logger.debug('reducer setDocument', action);
            const setDocument = project => {
                const newPages = project.pages.map(page => {
                    if (page.id == action.pageId) {
                        return {
                            ...page,
                            documents: page.documents.map(documentObj => {
                                if (documentObj.id == action.documentId) {
                                    return {
                                        ...documentObj,
                                        document: action.document,
                                    };
                                } else {
                                    return documentObj;
                                }
                            }),
                            settings: {
                                ...page.settings,
                                focusedId: action.documentId,
                            },
                        };
                    } else {
                        return page;
                    }
                });
                return {
                    pages: newPages,
                };
            };
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                ...setDocument(project),
                            };
                        } else {
                            return { ...project };
                        }
                    }),
                },
            );
        case 'insertDocumentAbove':
            // projectId
            // pageId
            // documentId
            // document?
            logger.debug('reducer insertDocumentAbove', action);
            const insertDocumentAbove = page => {
                const newDocuments = [];
                const newId = page.settings.nextId;
                for (const documentObj of page.documents) {
                    if (documentObj.id == action.documentId) {
                        newDocuments.push({
                            id: newId,
                            document: action.document || '',
                        });
                    }
                    newDocuments.push(documentObj);
                }
                return {
                    documents: newDocuments,
                    settings: {
                        focusedId: newId,
                        nextId: newId + 1,
                    },
                };
            };
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.ptojects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                pages: project.pages.map(page => {
                                    if (page.id == action.pageId) {
                                        return {
                                            ...page,
                                            ...insertDocumentAbove(page),
                                        };
                                    } else {
                                        return page;
                                    }
                                }),
                            };
                        } else {
                            return { ...project };
                        }
                    }),
                },
            );
        case 'insertDocumentBelow':
            // projectId
            // pageId
            // documentId
            // document?
            logger.debug('reducer insertDocumentBelow', action);
            const insertDocumentBelow = page => {
                const newDocuments = [];
                const newId = page.settings.nextId;
                for (const documentObj of page.documents) {
                    newDocuments.push(documentObj);
                    if (documentObj.id == action.documentId) {
                        newDocuments.push({
                            id: newId,
                            document: action.document || '',
                        });
                    }
                }
                return {
                    documents: newDocuments,
                    settings: {
                        focusedId: newId,
                        nextId: newId + 1,
                    },
                };
            };
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                pages: project.pages.map(page => {
                                    if (page.id == action.pageId) {
                                        return {
                                            ...page,
                                            ...insertDocumentBelow(page),
                                        };
                                    } else {
                                        return page;
                                    }
                                }),
                            };
                        } else {
                            return { ...project };
                        }
                    }),
                },
            );
        case 'deleteDocument':
            // projectId
            // pageId
            // documentId
            logger.debug('reducer deleteDocument', action);
            const deleteDocument = page => {
                const newDocuments = [];
                let nextFocusedId;
                for (const documentObj of page.documents) {
                    if (documentObj.id == action.documentId) {
                        if (page.documents.length == 1) {
                            nextFocusedId = 1;
                        } else if (newDocuments.length == 0) {
                            nextFocusedId = page.documents[1].id;
                        } else {
                            nextFocusedId = newDocuments[newDocuments.length - 1].id;
                        }
                        continue;
                    }
                    newDocuments.push(documentObj);
                }
                if (newDocuments.length == 0) {
                    newDocuments.push({
                        id: 1,
                        document: '',
                    });
                }
                return {
                    documents: newDocuments,
                    settings: {
                        ...page.settings,
                        focusedId: nextFocusedId,
                    },
                };
            };
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                pages: project.pages.map(page => {
                                    if (page.id == action.pageId) {
                                        return {
                                            ...page,
                                            ...deleteDocument(page),
                                        };
                                    } else {
                                        return page;
                                    }
                                }),
                            };
                        } else {
                            return { ...project };
                        }
                    }),
                },
            );
        case 'moveDocumentUp':
            // projectId
            // pageId
            // documentId
            logger.debug('reducer moveDocumentUp', action);
            const moveDocumentUp = page => {
                const newDocuments = [];
                const targetIndex = page.documents
                    .map(documentObj => documentObj.id)
                    .indexOf(action.documentId);
                if (targetIndex == 0 || targetIndex == -1) {
                    return {
                        documents: page.documents,
                        settings: {
                            ...page.settings,
                            focusedId: action.documentId,
                        },
                    };
                }
                for (const [index, documentObj] of page.documents.entries()) {
                    if (index == targetIndex - 1) {
                        newDocuments.push(page.documents[targetIndex]);
                    } else if (index == targetIndex) {
                        newDocuments.push(page.documents[targetIndex - 1]);
                    } else {
                        newDocuments.push(documentObj);
                    }
                }
                return {
                    documents: newDocuments,
                    settings: {
                        ...page.settings,
                        focusedId: action.documentId,
                    },
                };
            };
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                pages: project.pages.map(page => {
                                    if (page.id == action.pageId) {
                                        return {
                                            ...page,
                                            ...moveDocumentUp(page),
                                        };
                                    } else {
                                        return page;
                                    }
                                }),
                            };
                        } else {
                            return { ...project };
                        }
                    }),
                },
            );
        case 'moveDocumentDown':
            // projectId
            // pageId
            // documentId
            logger.debug('reducer moveDocumentDown', action);
            const moveDocumentDown = page => {
                const newDocuments = [];
                const targetIndex = page.documents
                    .map(documentObj => documentObj.id)
                    .indexOf(action.documentId);
                if (targetIndex == page.documents.length - 1 || targetIndex == -1) {
                    return {
                        documents: page.documents,
                        settings: {
                            ...page.settings,
                            focusedId: action.documentId,
                        },
                    };
                }
                for (const [index, documentObj] of page.documents.entries()) {
                    if (index == targetIndex + 1) {
                        newDocuments.push(page.documents[targetIndex]);
                    } else if (index == targetIndex) {
                        newDocuments.push(page.documents[targetIndex + 1]);
                    } else {
                        newDocuments.push(documentObj);
                    }
                }
                return {
                    documents: newDocuments,
                    settings: {
                        ...page.settings,
                        focusedId: action.documentId,
                    },
                };
            };
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                pages: project.pages.map(page => {
                                    if (page.id == action.pageId) {
                                        return {
                                            ...page,
                                            ...moveDocumentDown(page),
                                        };
                                    } else {
                                        return page;
                                    }
                                }),
                            };
                        } else {
                            return { ...project };
                        }
                    }),
                },
            );
        case 'moveDocumentFocusUp':
            // projectId
            // pageId
            // documentId
            logger.debug('reducer moveDocumentFocusUp', action);
            const moveDocumentFocusUp = page => {
                const targetIndex = page.documents
                    .map(documentObj => documentObj.id)
                    .indexOf(action.documentId);
                if (targetIndex == 0 || targetIndex == -1) {
                    return {
                        settings: {
                            ...page.settings,
                            focusedId: action.documentId,
                        },
                    };
                }
                return {
                    settings: {
                        ...page.settings,
                        focusedId: page.documents[targetIndex - 1].id,
                    },
                };
            };
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                pages: project.pages.map(page => {
                                    if (page.id == action.pageId) {
                                        return {
                                            ...page,
                                            ...moveDocumentFocusUp(page),
                                        };
                                    } else {
                                        return page;
                                    }
                                }),
                            };
                        } else {
                            return { ...project };
                        }
                    }),
                },
            );
        case 'moveDocumentFocusDown':
            // projectId
            // pageId
            // documentId
            logger.debug('reducer moveDocumentFocusDown', action);
            const moveDocumentFocusDown = page => {
                const targetIndex = page.documents
                    .map(documentObj => documentObj.id)
                    .indexOf(action.documentId);
                if (targetIndex == page.documents.length - 1 || targetIndex == -1) {
                    return {
                        settings: {
                            ...page.settings,
                            focusedId: action.documentId,
                        },
                    };
                }
                return {
                    settings: {
                        ...page.settings,
                        focusedId: page.documents[targetIndex + 1].id,
                    },
                };
            };
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                pages: project.pages.map(page => {
                                    if (page.id == action.pageId) {
                                        return {
                                            ...page,
                                            ...moveDocumentFocusDown(page),
                                        };
                                    } else {
                                        return page;
                                    }
                                }),
                            };
                        } else {
                            return { ...project };
                        }
                    }),
                },
            );
        default:
            return {
                ...state,
            };
    }
};

const initStore = (preloadedState = initialState) => {
    return createStore(reducer);
    //return createStore(reducer, preloadedState, composeWithDevTools(applyMiddleware()));
};

export const initializeStore = preloadedState => {
    let _store = store ?? initStore(preloadedState);

    // After navigating to a page with an initial Redux state, merge that state
    // with the current state in the store, and create a new store
    if (preloadedState && store) {
        _store = initStore({
            ...store.getState(),
            ...preloadedState,
        });
        // Reset the current store
        store = undefined;
    }

    // For SSG and SSR always create a new store
    if (typeof window === 'undefined') return _store;
    // Create the store once in the client
    if (!store) store = _store;

    return _store;
};

export const useStore = initialState => {
    logger.debug('useStore');
    //const store = useMemo(() => initializeStore(initialState), [initialState]);
    const store = initializeStore(initializeStore);
    //const store = createStore(reducer);
    return store;
};
