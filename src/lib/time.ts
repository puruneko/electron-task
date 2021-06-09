export interface ITimedelta {
    year: number;
    month: number;
    date: number;
    hours: number;
    minutes: number;
    seconds: number;
}
export const getTime = (d: Date): number => {
    return d.getTime() - d.getTimezoneOffset() * 60 * 1000;
};

export const getTimedelta = (start: Date, end: Date): ITimedelta => {
    const m = end.getTime() - start.getTime();
    const year = end.getUTCFullYear() - start.getUTCFullYear();
    const month = end.getUTCMonth() - start.getUTCMonth() + year * 12;
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
            s.setUTCHours(s.getUTCHours() < 12 ? 0 : 12);
            const e = new Date(end);
            e.setUTCHours(e.getUTCHours() < 12 ? 12 : 24);
            b = getTimedelta(s, e).hours / 24;
            b = (e.getTime() - s.getTime()) / (60 * 60 * 24 * 1000);
            break;
    }
    const blocks = Math.floor(b) + (b - Math.floor(b) >= 0.5 ? 0.5 : 0);
    return blocks == 0 ? 0.5 : blocks;
};

export const getYYYYMMDD = (d: Date | number, sep = '/'): string => {
    const d_ = new Date(d);
    return `${d_.getUTCFullYear()}${sep}${d_.getUTCMonth()}${sep}${d_.getUTCDate()}`;
};
export const getHHMMSS = (d: Date | number, sep = ':'): string => {
    const d_ = new Date(d);
    return `${d_.getUTCHours()}${sep}${d_.getUTCMinutes()}${sep}${d_.getUTCSeconds()}`;
};
export const getMMDD = (d: Date | number, sep = '/'): string => {
    const d_ = new Date(d);
    return `${d_.getUTCMonth()}${sep}${d_.getUTCDate()}`;
};
export const getHH = (d: Date | number): string => {
    const d_ = new Date(d);
    return `${d_.getUTCHours()}`;
};
