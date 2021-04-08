export interface ITimedelta {
    year: number;
    month: number;
    date: number;
    hours: number;
    minutes: number;
    seconds: number;
}

export const getTimedelta = (start: Date, end: Date): ITimedelta => {
    const m = end.getTime() - start.getTime();
    const year = end.getFullYear() - start.getFullYear();
    const month = end.getMonth() - start.getMonth() + year * 12;
    const date = Math.floor(m / (60 * 60 * 24 * 1000));
    const hours = Math.floor(m / (60 * 60 * 1000));
    const minutes = Math.floor(m / (60 * 1000));
    const seconds = Math.floor(m / 1000);
    return {
        year,
        month,
        date,
        hours,
        minutes,
        seconds,
    };
};

export const getTimeBlocks = (start: Date, end: Date, period: string): number => {
    let b: number;
    switch (period) {
        case 'date':
            const s = new Date(start);
            s.setHours(s.getHours() < 12 ? 0 : 12);
            const e = new Date(end);
            e.setHours(e.getHours() < 12 ? 12 : 24);
            b = getTimedelta(s, e).hours / 24;
            b = (e.getTime() - s.getTime()) / (60 * 60 * 24 * 1000);
            break;
    }
    const blocks = Math.floor(b) + (b - Math.floor(b) >= 0.5 ? 0.5 : 0);
    return blocks == 0 ? 0.5 : blocks;
};

export const getYYYYMMDD = (d: Date, sep = '/'): string => {
    return `${d.getFullYear()}${sep}${d.getMonth()}${sep}${d.getDate()}`;
};
export const getHHMMSS = (d: Date, sep = ':'): string => {
    return `${d.getHours()}${sep}${d.getMinutes()}${sep}${d.getSeconds()}`;
};
export const getMMDD = (d: Date, sep = '/'): string => {
    return `${d.getMonth()}${sep}${d.getDate()}`;
};
export const getHH = (d: Date, sep = ':'): string => {
    return `${d.getHours()}`;
};
