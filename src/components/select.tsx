import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

type Props = {
    options: any;
    values: any;
    setter: any;
    multi?: boolean;
    height?: number;
};

const Select: React.FC<Props> = ({ options, values, setter, multi = false, height = 20 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const callback = useCallback((event) => {
        if (!event.target.className.match('Select')) {
            setIsOpen(false);
            console.log('callback');
        }
    }, []);
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', callback, false);
            return () => {
                document.removeEventListener('mousedown', callback, false);
            };
        }
    }, [isOpen]);
    return (
        <div style={{ display: 'flex', height, width: 50, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex' }}>
                {values.map((v, index) => {
                    const name = options.filter((op) => op.value == v)[0].name;
                    return (
                        <div
                            key={index}
                            onClick={() => {
                                setIsOpen(true);
                            }}
                            style={{
                                height,
                                backgroundColor: 'skyblue',
                                borderRadius: 5,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: '0 5 0 5',
                            }}
                        >
                            {name}
                        </div>
                    );
                })}
            </div>
            <button
                onClick={() => {
                    setIsOpen(true);
                }}
            >
                ▼
            </button>
            {isOpen ? (
                <select
                    className="Select"
                    multiple={multi}
                    onChange={(event) => {
                        const s = [...event.target.options].filter((op) => op.selected).map((op) => op.value);
                        setter(s);
                        console.log(s);
                    }}
                    style={{ position: 'absolute', top: 20, left: 0 }}
                >
                    {options.map((op) => {
                        return (
                            <option key={op.value} className="Select" value={op.value} style={{ minWidth: 50 }}>
                                {op.name}
                            </option>
                        );
                    })}
                </select>
            ) : (
                <></>
            )}
        </div>
    );
};
