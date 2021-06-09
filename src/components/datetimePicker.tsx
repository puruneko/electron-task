import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { createDispatchHook, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useEffectSkip } from '../lib/utils';

const DatetimePicker = ({ dateValue, onChangeDate, style = {} }) => {
    const isValidDate = !Number.isNaN(dateValue.getTime());
    const offsetedDate = dateValue; /*isValidDate
        ? new Date(dateValue.getTime() + dateValue.getTimezoneOffset() * 1000 * 60)
        : undefined;*/
    const [date, setDate] = useState(isValidDate ? offsetedDate.toISOString().split('T')[0] : '');
    const [time, setTime] = useState(
        isValidDate ? offsetedDate.toISOString().split('T')[1].split(':').slice(0, 2).join(':') : '',
    );
    const focusRef = useRef([false, false, false, false, false, false]);
    const [focus, setFocus] = useState(focusRef.current);
    const setFocus_ = (no, bool) => {
        focusRef.current = focusRef.current.map((f, index) => {
            if (index == no) {
                return bool;
            } else {
                return f;
            }
        });
        setFocus(focusRef.current);
    };
    useEffectSkip(() => {
        console.log('DatetimPicker useEffect', focusRef.current);
        if (
            focusRef.current.reduce((p, c) => {
                return p || c;
            }, false) === false
        ) {
            onChangeDate(new Date(`${date}T${time}`));
        }
    }, [focus]);
    return (
        <form style={{ display: 'flex', padding: 0, margin: 0, ...style }}>
            <input
                type="date"
                className="picker-icon-0margin"
                value={date}
                onChange={(event) => {
                    console.log('date', event.target.value);
                    setDate(event.target.value);
                }}
                style={{ width: 105, padding: 0, margin: 0, border: 'none', backgroundColor: 'inherit' }}
                onFocus={() => {
                    setFocus_(0, true);
                }}
                onBlur={() => {
                    setTimeout(() => {
                        setFocus_(0, false);
                    }, 100);
                }}
                tabIndex={0}
            />
            <input
                type="time"
                className="picker-icon-0margin"
                value={time}
                onChange={(event) => {
                    console.log('time', event.target.value);
                    setTime(event.target.value);
                }}
                style={{ width: 60, padding: 0, margin: '0 0 0 5', border: 'none', backgroundColor: 'inherit' }}
                onFocus={() => {
                    setFocus_(5, true);
                }}
                onBlur={() => {
                    setTimeout(() => {
                        setFocus_(5, false);
                    }, 100);
                }}
                tabIndex={5}
            />
        </form>
    );
};

export default DatetimePicker;
