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
    const Container = styled.div`
        margin: 0;
        padding: 0;
        border: none;
        width: 100%;
        height: 100%;
        overflow-y: scroll;
    `;
    const Header = styled.div`
        display: ${headless ? 'none' : 'block'};
        width: 100%;
        height: 50px;
    `;
    const Documents = styled.div`
        margin: 20x;
        padding: 20px;
        width: 100%;
    `;
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
    return (
        <Container>
            <Header>
                <h1>{page.title}</h1>
            </Header>
            <Documents>
                {page.documents.map((documentObj, index) => {
                    return (
                        <DocumentCell
                            key={`documentEditor-${documentObj.id}`}
                            pageProperty={pageProperty}
                            textRef={editorString}
                            docId={documentObj.id}
                        />
                    );
                })}
            </Documents>
        </Container>
    );
};

const DocumentCell = ({ pageProperty, textRef, docId }) => {
    const [cellEditorMode, setCellEditorMode] = useState(false);
    // --------------------------------------------------------
    const onDisplayDoubleClick = () => {
        setCellEditorMode(true);
    };
    // --------------------------------------------------------
    const DocumentCell = styled.div`
        position: relative;
        margin-top: 20px;
        margin-bottom: 20px;
        width: 100%;
        min-height: 50px;
        height: auto;
    `;
    const DocumentDisplay = styled.div`
        width: 100%;
    `;
    // --------------------------------------------------------
    return (
        <DocumentCell>
            <DocumentDisplay
                style={{
                    visibility: !cellEditorMode ? 'visible' : 'hidden',
                    display: !cellEditorMode ? 'block' : 'none',
                }}
                onDoubleClick={onDisplayDoubleClick}
                dangerouslySetInnerHTML={{ __html: marked(textRef.current[docId]) }}
            />
            <DocumentEditor
                pageProperty={pageProperty}
                textRef={textRef}
                docId={docId}
                cellEditorMode={cellEditorMode}
                setCellEditorMode={setCellEditorMode}
            />
        </DocumentCell>
    );
};

const DocumentEditor = ({ pageProperty, textRef, docId, cellEditorMode, setCellEditorMode }) => {
    const [text, setText] = useState(textRef.current[docId]);
    const [rows, setRows] = useState((textRef.current[docId].match(/\n/g) || []).length + 1);
    const ctrlDown = useRef(false);
    const dispatch = useDispatch();
    // --------------------------------------------------------
    const onEditorChange = event => {
        const newText = event.target.value;
        setText(newText);
        setRows((newText.match(/\n/g) || []).length + 1);
        textRef.current[docId] = newText;
    };
    const onEditorKeyDown = event => {
        if (event.key == 'Control') {
            ctrlDown.current = true;
        } else if (event.key == 'Enter' && ctrlDown.current) {
            setCellEditorMode(false);
            dispatch({
                type: 'setDocument',
                projectName: pageProperty.projectName,
                pageId: pageProperty.pageId,
                documentId: docId,
                document: text,
            });
        }
    };
    const onEditorKeyUp = () => {
        ctrlDown.current = false;
    };
    // --------------------------------------------------------
    useEffect(() => {
        if (cellEditorMode) {
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
                visibility: cellEditorMode ? 'visible' : 'hidden',
                display: cellEditorMode ? 'block' : 'none',
                /*
                position: 'absolute',
                top: 0,
                left: 0,
                */
                width: '100%',
            }}
            onChange={event => {
                onEditorChange(event);
            }}
            onKeyDown={event => {
                onEditorKeyDown(event);
            }}
            onKeyUp={event => {
                onEditorKeyUp;
            }}
        />
    );
};

export default memo(PageComponent);
