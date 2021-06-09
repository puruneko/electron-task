import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { createDispatchHook, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { createDict, isClosestElement } from '../lib/utils';
import commonCss from '../lib/commonCss';

const SelectList = ({
    selected,
    selectList,
    valueKey = 'value',
    nameKey = 'name',
    onValueChange = (values) => {
        console.log('values', values);
    },
    renderFunc = undefined,
    style = {},
}) => {
    const renderFunc_ = renderFunc
        ? renderFunc
        : (values) => {
              return (
                  <div style={{ display: 'flex' }}>
                      {values.map((v) => {
                          return (
                              <div
                                  key={v[nameKey]}
                                  style={{
                                      backgroundColor: 'lightgray',
                                      borderRadius: 5,
                                      paddingLeft: 5,
                                      paddingRight: 5,
                                  }}
                              >
                                  {v[nameKey]}
                              </div>
                          );
                      })}
                  </div>
              );
          };
    const [localValue, setLocalValue] = useState(selected);
    const localValueRef = useRef(null);
    const [openParam, setOpenParam] = useState(null);
    const openParamRef = useRef(null);
    const containerRef = useRef(null);
    const onClickOpen = (event) => {
        console.log('onCLickOpen', event.clientX, event.clientY);
        const rect = event.target.getBoundingClientRect();
        if (!openParam) {
            setOpenParam({
                top: event.clientY,
                left: event.clientX,
            });
            openParamRef.current = {
                top: event.clientY,
                left: event.clientX,
            };
        }
    };
    const onClickChange = (event) => {
        const value = event.target.dataset.value;
        const name = event.target.dataset.name;
        let lvs;
        if (localValue.map((lv) => String(lv[valueKey])).indexOf(value) == -1) {
            lvs = [
                ...localValue,
                {
                    [valueKey]: selectList.filter((sl) => String(sl[valueKey]) == value)[0][valueKey],
                    [nameKey]: selectList.filter((sl) => String(sl[valueKey]) == value)[0][nameKey],
                },
            ];
        } else {
            lvs = localValue.filter((lv) => String(lv[valueKey]) != value);
        }
        setLocalValue(lvs);
        localValueRef.current = lvs;
    };
    const onMousedown = (event) => {
        if (!isClosestElement(containerRef.current, event.target) && !!openParamRef.current) {
            setOpenParam(null);
            openParamRef.current = null;
            onValueChange(localValueRef.current);
        }
    };
    useEffect(() => {
        document.addEventListener('mousedown', onMousedown, false);
        return () => {
            document.removeEventListener('mousedown', onMousedown, false);
        };
    }, []);
    useEffect(() => {
        if (selected.length === undefined) {
            setLocalValue([selected]);
            localValueRef.current = [selected];
        } else {
            setLocalValue(selected);
            localValueRef.current = selected;
        }
    }, [selected]);
    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                minHeight: 10,
                minWidth: 10,
                backgroundColor: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'grab',
                ...style,
            }}
            onClick={onClickOpen}
        >
            <style>
                {`
                .selectListItem:hover {
                    background-color: lightgray;
                }
            `}
            </style>
            {renderFunc_(
                selectList.filter(
                    (vl) => localValue.map((lv) => String(lv[valueKey])).indexOf(String(vl[valueKey])) != -1,
                ),
            )}
            <div
                style={{
                    display: !!openParam ? 'flex' : 'none',
                    position: 'fixed',
                    top: !!openParam ? openParam.top : 0,
                    left: !!openParam ? openParam.left : 0,
                    flexDirection: 'column',
                    backgroundColor: 'white',
                    border: '1px solid black',
                    borderRadius: 5,
                    minWidth: 30,
                    padding: 2,
                    zIndex: 1,
                }}
            >
                {selectList.map((l, i) => {
                    return (
                        <div
                            key={`select-${l[valueKey]}-${l[nameKey]}`}
                            className="selectListItem"
                            data-value={l[valueKey]}
                            data-name={l[nameKey]}
                            style={{
                                alignSelf: 'stretch',
                                textAlign: 'center',
                                paddingLeft: 5,
                                paddingRight: 5,
                                borderTop: i != 0 ? '1px solid black' : '',
                                backgroundColor:
                                    localValue.map((lv) => String(lv[valueKey])).indexOf(String(l[valueKey])) != -1
                                        ? 'lightgray'
                                        : '',
                            }}
                            onClick={onClickChange}
                        >
                            {l[nameKey]}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SelectList;
