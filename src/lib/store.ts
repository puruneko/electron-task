/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo } from 'react';
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { logger } from './logger';
import { getTime } from './time';
import { initialState } from './dummyData';

let store;

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
            const setTasks = project => {
                const pages = project.pages.filter(page => page.type == 'page');
                return [...pages, ...action.tasks];
            };
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                pages: setTasks(project),
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
            const setPages = project => {
                const tasks = project.pages.filter(page => page.type == 'task');
                return [...action.pages, ...tasks];
            };
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                pages: setPages(project),
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
                const tasks = project.pages.filter(page => page.type == 'task');
                const newPages = project.pages
                    .filter(page => page.type == 'page')
                    .map(page => {
                        if (page.id == action.pageId) {
                            return action.page;
                        } else {
                            return page;
                        }
                    });
                return [...newPages, ...tasks];
            };
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                pages: setPage(project),
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
                return newPages;
            };
            return Object.assign(
                {},
                {
                    ...state,
                    projects: state.projects.map(project => {
                        if (project.id == action.projectId) {
                            return {
                                ...project,
                                pages: setDocument(project),
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
                const newId = Math.max(...page.documents.map(document => document.id)) + 1;
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
                const newId = Math.max(...page.documents.map(document => document.id)) + 1;
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
