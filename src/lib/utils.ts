import React, { memo, useCallback, useEffect, useMemo, useRef, useState, DependencyList } from 'react';
import { useLocation } from 'react-router-dom';

export const floor = Math.floor;
export const ceil = Math.ceil;

export const ceilfloor = (x: number, top = 1, bottom = 0, th = 0.5): number => {
    return x >= th ? top : bottom;
};

export const topbottom = (target: number, top: number, bottom: number): number => {
    let top_ = top;
    let bottom_ = bottom;
    if (top < bottom) {
        bottom_ = top;
        top_ = bottom;
    }
    return Math.min(Math.max(target, bottom_), top_);
};

export const useQuery = (): { [key: string]: string } => {
    const queries = new URLSearchParams(useLocation().search);
    const pairs = {};
    for (const [key, value] of queries.entries()) {
        pairs[key] = value;
    }
    return pairs;
};

export const createDict = (keyArray: Array<string | number>, valueFunc: (key: string | number) => any): any => {
    return keyArray.reduce((aft, key) => ({ ...aft, [key]: valueFunc(key) }), {});
};

export const between = (target: number, start: number, end: number) => {
    const s = start < end ? start : end;
    const e = start < end ? end : start;
    return s <= target && target <= e;
};

export const useEffectSkip = (effect: any, deps: DependencyList, times = 1) => {
    const [_times, setTimes] = useState(0);
    useEffect(() => {
        if (_times >= times) {
            return effect();
        } else {
            setTimes(_times + 1);
        }
    }, deps);
};

export const isSameElement = (elem1, elem2) => {
    if (!elem1 || !elem2) {
        return false;
    }
    return elem1.childNodes == elem2.childNodes && elem1.outerHTML == elem2.outerHTML;
};

export const isClosestElement = (basis, target) => {
    if (!basis || !target) {
        return false;
    }
    let res = isSameElement(basis, target);
    if (!res) {
        if (basis.childNodes?.length) {
            for (let i = 0; i < basis.childNodes.length; i++) {
                const c = basis.childNodes[i];
                res = res || isClosestElement(c, target);
            }
        }
    }
    return res;
};

let raptimeCache = new Date();
export const raptime = () => {
    const diff = new Date().getTime() - raptimeCache.getTime();
    raptimeCache = new Date();
    return diff;
};

export const styledToRawcss = (...componentList) => {
    return componentList
        .map((component) => {
            return {
                name: String(component.styledComponentId).split('__')[1].split('-')[0],
                css: component.componentStyle.rules.join(''),
            };
        })
        .map((style) => {
            return `.${style.name}{${style.css}}`;
        })
        .join('\n');
};
