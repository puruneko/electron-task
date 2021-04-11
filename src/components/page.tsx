import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import marked from 'marked';
import highlightjs from 'highlight.js';
import { floor, ceil, ceilfloor, topbottom, useQuery, createDict } from '../lib/utils';
import { getTimedelta, getYYYYMMDD, getHHMMSS, getMMDD, getHH, getTime } from '../lib/time';
import { IPage } from '../type/root';
import { IRootState } from '../type/store';

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
    projectName?: string; //page view挿入用
    pageId?: number; //page view挿入用
    headless?: boolean;
};

const PageComponentContainer = styled.div`
    margin: 0;
    padding: 0;
    border: none;
    width: 100%;
    height: 100%;
    overflow-y: scroll;
`;
const Header = styled.div`
    width: 100%;
    height: 50px;
`;
const Documents = styled.div`
    margin: 20x;
    padding: 20px;
    width: 100%;
`;

const PageComponent: React.FC<Props> = ({ projectName, pageId, headless = true }) => {
    const params = useParams<any>();
    const queries = useQuery();
    const pageProperty = {
        projectName: params.projectName || projectName,
        pageId: params.pageId || pageId,
    };
    const dispatch = useDispatch();
    const { project, page } = useSelector(
        (props: IRootState) => ({
            project: props.projects[pageProperty.projectName],
            page: props.projects[pageProperty.projectName].pages.filter(
                page => page.id == pageProperty.pageId,
            )[0],
        }),
        shallowEqual,
    );
    console.log('PageComponent', 'params', params, 'queries', queries, 'page', page);
    // --------------------------------------------------------
    const editorString = useRef(
        createDict(
            page.documents.map(document => {
                return document.id;
            }),
            id => {
                return page.documents.filter(documentObj => documentObj.id == id)[0].document;
            },
        ),
    );
    // --------------------------------------------------------
    useEffect(() => {
        console.log('focusedId', page.settings.focusedId);
        const elem = document.getElementById(`documentCell-${page.settings.focusedId}`);
        if (elem) {
            elem.focus();
        }
    }, []);
    // --------------------------------------------------------
    return (
        <PageComponentContainer>
            <Header
                style={{
                    display: headless ? 'none' : 'block',
                }}
            >
                <h1>{page.title}</h1>
            </Header>
            <Documents>
                {page.documents.map((documentObj, index) => {
                    return (
                        <DocumentCell
                            key={`documentCell-${index}`}
                            pageProperty={pageProperty}
                            textRef={editorString}
                            docId={documentObj.id}
                        />
                    );
                })}
            </Documents>
        </PageComponentContainer>
    );
};

const DocumentCellContainer = styled.div`
    position: relative;
    margin-top: 20px;
    margin-bottom: 20px;
    width: 100%;
    min-height: 50px;
    height: auto;
`;
const DocumentDisplay = styled.div`
    width: 100%;
    min-height: 50px;
    border: 1px solid black;
    border-radius: 10px;
`;

const DocumentCell = ({ pageProperty, textRef, docId }) => {
    const { documentObj } = useSelector(
        (props: IRootState) => ({
            documentObj: props.projects[pageProperty.projectName].pages
                .filter(page => page.id == pageProperty.pageId)[0]
                .documents.filter(documentObj => documentObj.id == docId)[0],
        }),
        shallowEqual,
    );
    const dispatch = useDispatch();
    const [cellEditorMode, setCellEditorMode] = useState<number | boolean>(docId);
    const focus = useState(false);
    const keyStack = useRef('');
    // --------------------------------------------------------
    const onClick = () => {
        // 疑似フォーカスの移動
        focus[1](true);
    };
    const onDoubleClick = () => {
        // エディタ表示
        setCellEditorMode(true);
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
    const onKeyDown = event => {
        const elem = document.getElementById(`documentCell-${docId}`);
        if (elem === elem.ownerDocument.activeElement) {
            // コマンド実行
            console.log(
                'onKeyDown',
                event.key,
                keyStack.current,
                { ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey },
                docId,
            );
            if (isKeyCombination(event, 'Enter')) {
                setCellEditorMode(true);
            } else if (isKeyCombination(event, 'a')) {
                dispatch({
                    type: 'insertDocumentAbove',
                    projectName: pageProperty.projectName,
                    pageId: pageProperty.pageId,
                    documentId: docId,
                });
            } else if (isKeyCombination(event, 'b')) {
                dispatch({
                    type: 'insertDocumentBelow',
                    projectName: pageProperty.projectName,
                    pageId: pageProperty.pageId,
                    documentId: docId,
                });
            } else if (isKeyCombination(event, 'd', 'd')) {
                dispatch({
                    type: 'deleteDocument',
                    projectName: pageProperty.projectName,
                    pageId: pageProperty.pageId,
                    documentId: docId,
                });
            } else if (isKeyCombination(event, 'Alt', 'ArrowUp')) {
                dispatch({
                    type: 'moveDocumentUp',
                    projectName: pageProperty.projectName,
                    pageId: pageProperty.pageId,
                    documentId: docId,
                });
            } else if (isKeyCombination(event, 'Alt', 'ArrowDown')) {
                dispatch({
                    type: 'moveDocumentDown',
                    projectName: pageProperty.projectName,
                    pageId: pageProperty.pageId,
                    documentId: docId,
                });
            } else if (isKeyCombination(event, 'ArrowUp')) {
                dispatch({
                    type: 'moveDocumentFocusUp',
                    projectName: pageProperty.projectName,
                    pageId: pageProperty.pageId,
                    documentId: docId,
                });
            } else if (isKeyCombination(event, 'ArrowDown')) {
                dispatch({
                    type: 'moveDocumentFocusDown',
                    projectName: pageProperty.projectName,
                    pageId: pageProperty.pageId,
                    documentId: docId,
                });
            } else {
                keyStack.current = event.key.toLowerCase();
            }
            event.preventDefault();
        }
    };
    const onFocus = event => {
        console.log('onFocus', docId);
        focus[1](true);
    };
    const onBlur = event => {
        console.log('onBlur', docId);
        focus[1](false);
    };
    // --------------------------------------------------------
    // --------------------------------------------------------
    useEffect(() => {
        console.log('focus?', focus, cellEditorMode);
        if (focus[0] && cellEditorMode === docId) {
            console.log('focus!', cellEditorMode);
            const elem = document.getElementById(`documentCell-${docId}`);
            elem.focus();
        }
    }, [cellEditorMode]);
    // --------------------------------------------------------
    return (
        <DocumentCellContainer
            id={`documentCell-${docId}`}
            tabIndex={-1}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
        >
            <DocumentDisplay
                style={{
                    visibility: cellEditorMode === docId ? 'visible' : 'hidden',
                    display: cellEditorMode === docId ? 'block' : 'none',
                }}
                dangerouslySetInnerHTML={{
                    __html: marked(documentObj.document /*textRef.current[docId]*/),
                }}
            />
            <DocumentEditor
                pageProperty={pageProperty}
                textRef={textRef}
                docId={docId}
                cellEditorMode={cellEditorMode}
                setCellEditorMode={setCellEditorMode}
            />
        </DocumentCellContainer>
    );
};

const DocumentEditor = ({ pageProperty, textRef, docId, cellEditorMode, setCellEditorMode }) => {
    const { documentObj } = useSelector(
        (props: IRootState) => ({
            documentObj: props.projects[pageProperty.projectName].pages
                .filter(page => page.id == pageProperty.pageId)[0]
                .documents.filter(documentObj => documentObj.id == docId)[0],
        }),
        shallowEqual,
    );
    /*
    const [text, setText] = useState(textRef.current[docId]);
    const [rows, setRows] = useState((textRef.current[docId].match(/\n/g) || []).length + 1);
    */
    const [text, setText] = useState(documentObj.document);
    const [rows, setRows] = useState((documentObj.document.match(/\n/g) || []).length + 1);
    const ctrlDown = useRef(false);
    const dispatch = useDispatch();
    // --------------------------------------------------------
    const onEditorChange = event => {
        const newText = event.target.value;
        setText(newText);
        setRows((newText.match(/\n/g) || []).length + 1);
        /*textRef.current[docId] = newText;*/
        event.stopPropagation();
    };
    const onEditorKeyDown = event => {
        if (event.key == 'Control') {
            ctrlDown.current = true;
        } else if (event.key == 'Enter' && ctrlDown.current) {
            //セルの保存処理
            // テキスト保存
            dispatch({
                type: 'setDocument',
                projectName: pageProperty.projectName,
                pageId: pageProperty.pageId,
                documentId: docId,
                document: text,
            });
            // displayに戻す
            setCellEditorMode(docId);
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
    const onEditorKeyUp = event => {
        ctrlDown.current = false;
        event.stopPropagation();
    };
    // --------------------------------------------------------
    useEffect(() => {
        if (cellEditorMode === true) {
            console.log('focus! on textarea', docId);
            const elem = document.getElementById(`documentEditor-${docId}`);
            elem.focus();
        }
    }, [cellEditorMode]);
    // --------------------------------------------------------
    return (
        <textarea
            id={`documentEditor-${docId}`}
            value={text}
            rows={rows}
            style={{
                visibility: cellEditorMode === true ? 'visible' : 'hidden',
                display: cellEditorMode === true ? 'block' : 'none',
                /*
                position: 'absolute',
                top: 0,
                left: 0,
                */
                width: '100%',
                tabSize: 4,
            }}
            onChange={event => {
                onEditorChange(event);
            }}
            onKeyDownCapture={event => {
                onEditorKeyDown(event);
            }}
            onKeyUpCapture={event => {
                onEditorKeyUp(event);
            }}
        />
    );
};

export default memo(PageComponent);
