import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useParams } from 'react-router-dom';
import { createDispatchHook, shallowEqual, useDispatch, useSelector } from 'react-redux';

type Props = {
    value: string;
    setValue: any;
    onDoubleClick: any;
};

const EditableLabel: React.FC<Props> = ({ value, setValue, onDoubleClick }) => {
    const [localValue, setLocalValue] = useState(value);
    const onChange = (event) => {
        setLocalValue(event.target.value);
    };
    const onBlur = () => {
        setValue(localValue);
    };
    const onKeyDown = (event) => {
        if (event.key == 'Enter') {
            setValue(localValue);
        }
    };
    return (
        <input
            type="text"
            value={localValue}
            onDoubleClick={onDoubleClick}
            onChange={onChange}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            style={{ backgroundColor: 'inherit', border: 'none', width: '100%', height: '100%', fontSize: 'inherit' }}
        />
    );
};

export default EditableLabel;
