import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import marked from 'marked';
import highlightjs from 'highlight.js';
import { floor, ceil, ceilfloor, topbottom, useQuery, createDict, styledToRawcss } from '../lib/utils';
import { getTimedelta, getYYYYMMDD, getHHMMSS, getMMDD, getHH, getTime } from '../lib/time';
import { IPage } from '../type/root';
import { IRootState } from '../type/store';
import Header from './header';

marked.setOptions({
    highlight: function (code, lang) {
        return highlightjs.highlightAuto(code, [lang]).value;
    }, // シンタックスハイライトに使用する関数の設定
    pedantic: false, // trueの場合はmarkdown.plに準拠する gfmを使用する場合はfalseで大丈夫
    gfm: true, // GitHub Flavored Markdownを使用
    breaks: true, // falseにすると改行入力は末尾の半角スペース2つになる
    sanitize: true, // trueにすると特殊文字をエスケープする
    silent: false, // trueにするとパースに失敗してもExceptionを投げなくなる
});

type Props = {
    projectId?: number; //page view挿入用
    pageId?: number; //page view挿入用
    headless?: boolean;
};

const c = {
    scroll: {
        margin: 15,
    },
};

const Documents = styled.div`
    margin: 20x;
    padding: 20px;
    width: 90%;
`;

const PageComponentContainer = styled.div`
    margin: 0;
    padding: 0;
    border: none;
    width: 100%;
    height: 100%;
    max-height: 100%;
    overflow-y: auto;
`;
const PageHeader = styled.div`
    width: 100%;
    height: 50px;
`;

const PageComponent: React.FC<Props> = ({ projectId, pageId, headless = true }) => {
    const params = useParams<any>();
    const queries = useQuery();
    const pageProperty = {
        projectId: params.projectId || projectId,
        pageId: params.pageId || pageId,
    };
    const dispatch = useDispatch();
    const { page, gFocusedId } = useSelector(
        (props: IRootState) => ({
            page: props.projects
                .filter((project) => project.id == pageProperty.projectId)[0]
                .pages.filter((page) => page.id == pageProperty.pageId)[0],
            gFocusedId: props.projects
                .filter((project) => project.id == pageProperty.projectId)[0]
                .pages.filter((page) => page.id == pageProperty.pageId)[0].settings.focusedId,
        }),
        shallowEqual,
    );
    const [localPageState, setLocalPageState] = useState(page);
    const localPage = useRef(localPageState);
    const setLocalPage = (lp) => {
        localPage.current = lp;
        setLocalPageState(lp);
    };
    const [cellEditorMode, setCellEditorMode] = useState(-1);
    const [focusedIdState, setFocusedIdState] = useState(gFocusedId);
    const focusedId = useRef(focusedIdState);
    const setFocusedId = (id) => {
        focusedId.current = id;
        setFocusedIdState(id);
    };
    console.log('PageComponent', 'params', params, 'queries', queries, 'page', page);
    // --------------------------------------------------------
    const dispatchTimer = useRef(null);
    const pseudDispatch = (action) => {
        console.log('pseudDispatch', { current: localPage.current, localPageState });
        let newPage;
        switch (action.type) {
            case 'insertDocumentAbove':
                newPage = ((page) => {
                    const newDocuments = [];
                    const newId = Math.max(...page.documents.map((document) => document.id)) + 1;
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
                })(localPage.current);
                break;
            case 'insertDocumentBelow':
                newPage = ((page) => {
                    const newDocuments = [];
                    const newId = Math.max(...page.documents.map((document) => document.id)) + 1;
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
                })(localPage.current);
                break;
            case 'deleteDocument':
                newPage = ((page) => {
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
                })(localPage.current);
                break;
            case 'moveDocumentUp':
                newPage = ((page) => {
                    const newDocuments = [];
                    const targetIndex = page.documents.map((documentObj) => documentObj.id).indexOf(action.documentId);
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
                })(localPage.current);
                break;
            case 'moveDocumentDown':
                newPage = ((page) => {
                    const newDocuments = [];
                    const targetIndex = page.documents.map((documentObj) => documentObj.id).indexOf(action.documentId);
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
                })(localPage.current);
                break;
            case 'setDocumentFocus':
                newPage = ((page) => {
                    return {
                        settings: {
                            ...page.settings,
                            focusedId: action.documentId,
                        },
                    };
                })(localPage.current);
                break;
            case 'moveDocumentFocusUp':
                newPage = ((page) => {
                    const targetIndex = page.documents.map((documentObj) => documentObj.id).indexOf(action.documentId);
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
                })(localPage.current);
                break;
            case 'moveDocumentFocusDown':
                newPage = ((page) => {
                    const targetIndex = page.documents.map((documentObj) => documentObj.id).indexOf(action.documentId);
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
                })(localPage.current);
                break;
        }
        console.log('newPage', { ...localPage.current, ...newPage });
        setLocalPage({ ...localPage.current, ...newPage });
        clearTimeout(dispatchTimer.current);
        dispatchTimer.current = setTimeout(() => {
            dispatch({
                type: 'setPageOrTask',
                projectId: pageProperty.projectId,
                pageOrTaskId: pageProperty.pageId,
                pageOrTask: localPage.current,
            });
        }, 200);
    };
    // --------------------------------------------------------
    const keyStack = useRef('');
    const isKeyCombination = (event, first, second = null) => {
        const key = event.key.toLowerCase();
        const first_ = first.toLowerCase();
        const second_ = second !== null ? second.toLowerCase() : null;
        if (second_ === null) {
            return key == first_;
        } else if (key == second_) {
            if (first_ == 'control' || first_ == 'alt' || first_ == 'shift') {
                return (
                    (first_ == 'control' && event.ctrlKey) ||
                    (first_ == 'alt' && event.altKey) ||
                    (first_ == 'shift' && event.shiftKey)
                );
            } else {
                return keyStack.current == first_;
            }
        } else {
            return false;
        }
    };
    const onKeyDown = useCallback(
        (event) => {
            // コマンド実行
            console.log(
                'onKeyDown',
                event.key,
                keyStack.current,
                { ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey },
                focusedId.current,
            );
            if (isKeyCombination(event, 'Enter')) {
                setCellEditorMode(focusedId.current);
            } else if (isKeyCombination(event, 'a')) {
                pseudDispatch({
                    type: 'insertDocumentAbove',
                    projectId: pageProperty.projectId,
                    pageId: pageProperty.pageId,
                    documentId: focusedId.current,
                });
                keyStack.current = null;
            } else if (isKeyCombination(event, 'b')) {
                pseudDispatch({
                    type: 'insertDocumentBelow',
                    projectId: pageProperty.projectId,
                    pageId: pageProperty.pageId,
                    documentId: focusedId.current,
                });
                keyStack.current = null;
            } else if (isKeyCombination(event, 'd', 'd')) {
                pseudDispatch({
                    type: 'deleteDocument',
                    projectId: pageProperty.projectId,
                    pageId: pageProperty.pageId,
                    documentId: focusedId.current,
                });
                keyStack.current = null;
            } else if (isKeyCombination(event, 'Alt', 'ArrowUp')) {
                pseudDispatch({
                    type: 'moveDocumentUp',
                    projectId: pageProperty.projectId,
                    pageId: pageProperty.pageId,
                    documentId: focusedId.current,
                });
                keyStack.current = null;
            } else if (isKeyCombination(event, 'Alt', 'ArrowDown')) {
                pseudDispatch({
                    type: 'moveDocumentDown',
                    projectId: pageProperty.projectId,
                    pageId: pageProperty.pageId,
                    documentId: focusedId.current,
                });
                keyStack.current = null;
            } else if (isKeyCombination(event, 'ArrowUp')) {
                pseudDispatch({
                    type: 'moveDocumentFocusUp',
                    projectId: pageProperty.projectId,
                    pageId: pageProperty.pageId,
                    documentId: focusedId.current,
                });
                keyStack.current = null;
            } else if (isKeyCombination(event, 'ArrowDown')) {
                pseudDispatch({
                    type: 'moveDocumentFocusDown',
                    projectId: pageProperty.projectId,
                    pageId: pageProperty.pageId,
                    documentId: focusedId.current,
                });
                keyStack.current = null;
            } else {
                keyStack.current = event.key.toLowerCase();
            }
            event.preventDefault();
        },
        [focusedId.current],
    );
    // --------------------------------------------------------
    useEffect(() => {
        document.addEventListener(
            'mousedown',
            (event) => {
                console.log('focus!', document.activeElement);
            },
            false,
        );
        document.addEventListener('keydown', onKeyDown, false);

        return () => {
            document.removeEventListener('keydown', onKeyDown, false);
        };
    }, []);
    useEffect(() => {
        setLocalPage(page);
    }, [page]);
    useEffect(() => {
        //focus
        console.log('gFocusedId update', localPageState.settings.focusedId, localPage.current.settings.focusedId);
        setFocusedId(localPageState.settings.focusedId);
        //scroll
        const topOffset = containerRef.current.getBoundingClientRect().top;
        const targetElem = document.getElementById(`documentCell-${localPageState.settings.focusedId}`);
        const top = targetElem.getBoundingClientRect().top - topOffset;
        const height = targetElem.clientHeight;
        const bottom = top + height;
        const scrollTop = containerRef.current.scrollTop;
        const cHeight = containerRef.current.clientHeight;
        let dy = 0;
        //下部が隠れている場合
        if (bottom > cHeight) {
            //Cellの高さがwindowより小さい場合
            if (height < cHeight) {
                // 下部が見えるようにスクロール
                dy = bottom - cHeight + c.scroll.margin;
            } else {
                // 上部が画面の一番上に表示されるようにスクロール
                dy = top + c.scroll.margin;
            }
        } else if (top < 0) {
            //上部が隠れている場合
            //Cellの高さがwindowより小さい場合
            if (height < cHeight) {
                // 上部が見えるようにスクロール
                dy = top - c.scroll.margin;
            } else {
                // 上部が画面の一番上に表示されるようにスクロール
                dy = top - c.scroll.margin;
            }
        }
        if (dy != 0) {
            containerRef.current.scrollTo({
                top: scrollTop + dy,
            });
        }
    }, [localPageState]);
    // --------------------------------------------------------
    const containerRef = useRef(null);
    const styleCssString = styledToRawcss(PageComponentContainer, Documents, PageComponentContainer);
    return (
        <React.Fragment>
            <style>{styleCssString}</style>
            <div className="PageComponentContainer" ref={containerRef}>
                <PageHeader
                    style={{
                        display: headless ? 'none' : 'block',
                    }}
                >
                    <h1>{page.properties.filter((prop) => prop.id == 1)[0].values[0]}</h1>
                </PageHeader>
                <div className="Documents">
                    {localPageState.documents.map((documentObj, index) => {
                        return (
                            <DocumentCell
                                key={`documentCell-${index}`}
                                pageProperty={pageProperty}
                                localPage={localPageState}
                                docId={documentObj.id}
                                focusedId={focusedIdState}
                                cellEditorMode={cellEditorMode}
                                setCellEditorMode={setCellEditorMode}
                            />
                        );
                    })}
                </div>
            </div>
        </React.Fragment>
    );
};

const DocumentCellContainer = styled.div`
    position: relative;
    margin-top: 5px;
    margin-bottom: 5px;
    width: 100%;
    min-height: 50px;
    height: auto;
`;
const DocumentDisplay = styled.div`
    width: 100%;
    min-height: 50px;
    padding-left: 10px;
    border: solid lightgray;
    border-width: 0 0 0 4px;
    border-radius: 0;
`;

const DocumentCell = ({ pageProperty, localPage, docId, focusedId, cellEditorMode, setCellEditorMode }) => {
    /*
    const { documentObj } = useSelector(
        (props: IRootState) => ({
            documentObj: props.projects
                .filter((project) => project.id == pageProperty.projectId)[0]
                .pages.filter((page) => page.id == pageProperty.pageId)[0]
                .documents.filter((documentObj) => documentObj.id == docId)[0],
        }),
        shallowEqual,
    );
    */
    const documentObj = localPage.documents.filter((documentObj) => documentObj.id == docId)[0];
    const dispatch = useDispatch();
    const keyStack = useRef('');
    // --------------------------------------------------------
    const onClick = () => {
        // 疑似フォーカスの移動
        //setFocus(true);
        dispatch({
            type: 'setDocumentFocus',
            projectId: pageProperty.projectId,
            pageId: pageProperty.pageId,
            documentId: docId,
        });
    };
    const onDoubleClick = () => {
        // エディタ表示
        setCellEditorMode(docId);
    };
    const isKeyCombination = (event, first, second = null) => {
        const key = event.key.toLowerCase();
        const first_ = first.toLowerCase();
        const second_ = second !== null ? second.toLowerCase() : null;
        if (second_ === null) {
            return key == first_;
        } else if (key == second_) {
            if (first_ == 'control' || first_ == 'alt' || first_ == 'shift') {
                return (
                    (first_ == 'control' && event.ctrlKey) ||
                    (first_ == 'alt' && event.altKey) ||
                    (first_ == 'shift' && event.shiftKey)
                );
            } else {
                return keyStack.current == first_;
            }
        } else {
            return false;
        }
    };
    const onKeyDown = (event) => {
        const elem = document.getElementById(`documentCell-${docId}`);
        if (elem === elem.ownerDocument.activeElement) {
            // コマンド実行
            console.log(
                'DocumentCell onKeyDown',
                event.key,
                keyStack.current,
                { ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey },
                docId,
            );
            if (isKeyCombination(event, 'Enter')) {
                setCellEditorMode(true);
            } else {
                keyStack.current = event.key.toLowerCase();
            }
            event.preventDefault();
        }
    };
    // --------------------------------------------------------
    /*
    useEffect(() => {
        console.log('focus?', focus, cellEditorMode);
        // 排他ロック解除でモードが表示モードの場合、フォーカス当てる
        if (focus && cellEditorMode === docId) {
            console.log('focus! cellEditorMode', cellEditorMode);
            const elem = document.getElementById(`documentCell-${docId}`);
            elem.focus();
        }
    }, [cellEditorMode, focus]);
    */
    // --------------------------------------------------------
    const styleCssString = styledToRawcss(DocumentCellContainer, DocumentDisplay);
    return (
        <React.Fragment>
            <style>{styleCssString}</style>
            <div
                className="DocumentCellContainer"
                id={`documentCell-${docId}`}
                onClick={onClick}
                onDoubleClick={onDoubleClick}
                onKeyDown={onKeyDown}
                style={{ border: docId == focusedId ? '5px solid black' : '1px solid black' }}
            >
                <span>
                    docId:{docId}/focusedId:{focusedId}
                </span>
                <div
                    className="DocumentDisplay"
                    style={{
                        visibility: cellEditorMode != docId ? 'visible' : 'hidden',
                        display: cellEditorMode != docId ? 'block' : 'none',
                    }}
                    dangerouslySetInnerHTML={{
                        __html: marked(documentObj.document /*textRef.current[docId]*/),
                    }}
                />
                <DocumentEditor
                    pageProperty={pageProperty}
                    docId={docId}
                    documentObj={documentObj}
                    cellEditorMode={cellEditorMode}
                    setCellEditorMode={setCellEditorMode}
                />
            </div>
        </React.Fragment>
    );
};

const DocumentEditor = ({ pageProperty, docId, documentObj, cellEditorMode, setCellEditorMode }) => {
    /*
    const { documentObj } = useSelector(
        (props: IRootState) => ({
            documentObj: props.projects
                .filter((project) => project.id == pageProperty.projectId)[0]
                .pages.filter((page) => page.id == pageProperty.pageId)[0]
                .documents.filter((documentObj) => documentObj.id == docId)[0],
        }),
        shallowEqual,
    );
    */
    const getRowNumber = (doc) => {
        return (doc.match(/\n/g) || []).length + 2;
    };
    const [text, setText] = useState(documentObj.document);
    const [rows, setRows] = useState(getRowNumber(documentObj.document));
    const ctrlDown = useRef(false);
    const dispatch = useDispatch();
    // --------------------------------------------------------
    const onEditorChange = (event) => {
        const newText = event.target.value;
        setText(newText);
        setRows(getRowNumber(newText));
        /*textRef.current[docId] = newText;*/
        event.stopPropagation();
    };
    const onEditorKeyDown = (event) => {
        if (event.key == 'Control') {
            ctrlDown.current = true;
        } else if (ctrlDown.current && event.key == 'Enter') {
            //セルの保存処理
            // テキスト保存
            dispatch({
                type: 'setDocument',
                projectId: pageProperty.projectId,
                pageId: pageProperty.pageId,
                documentId: docId,
                document: text,
            });
            // displayに戻す
            setCellEditorMode(-1);
        } else if (event.key == 'Tab') {
            const obj = event.target;
            //tab入力
            const cursorPosition = obj.selectionStart;
            const cursorLeft = obj.value.substr(0, cursorPosition);
            const cursorRight = obj.value.substr(cursorPosition, obj.value.length);

            // テキストエリアの中身を、
            // 「取得しておいたカーソルの左側」+「タブ」+「取得しておいたカーソルの右側」
            // という状態にする。
            obj.value = cursorLeft + '\t' + cursorRight;

            // カーソルの位置を入力したタブの後ろにする
            obj.selectionEnd = cursorPosition + 1;
            //
            event.preventDefault();
        } else {
            ctrlDown.current = false;
        }
        event.stopPropagation();
    };
    const onEditorKeyUp = (event) => {
        ctrlDown.current = false;
        event.stopPropagation();
    };
    // --------------------------------------------------------
    useEffect(() => {
        if (cellEditorMode === docId) {
            console.log('focus! on textarea', docId);
            const elem = document.getElementById(`documentEditor-${docId}`);
            elem.focus();
        }
    }, [cellEditorMode]);
    useEffect(() => {
        setText(documentObj.document);
        setRows(getRowNumber(documentObj.document));
    }, [docId]);
    // --------------------------------------------------------
    console.log('DocumentEditor', { docId, document: documentObj.document, text });
    return (
        <textarea
            id={`documentEditor-${docId}`}
            value={text}
            rows={rows}
            style={{
                visibility: cellEditorMode == docId ? 'visible' : 'hidden',
                display: cellEditorMode == docId ? 'block' : 'none',
                /*
                position: 'absolute',
                top: 0,
                left: 0,
                */
                width: '100%',
                tabSize: 4,
            }}
            onChange={(event) => {
                onEditorChange(event);
            }}
            onKeyDownCapture={(event) => {
                onEditorKeyDown(event);
            }}
            onKeyUpCapture={(event) => {
                onEditorKeyUp(event);
            }}
        />
    );
};

export default PageComponent;
