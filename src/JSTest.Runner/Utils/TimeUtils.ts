// tslint:disable-next-line: variable-name
export const TimeSpan = {
    StringToMS: (timespan: string) => {
        const time = timespan.split(':');
        return (parseInt(time[0]) * 60 * 60
                + parseInt(time[1]) * 60
                + parseFloat(time[2])) * 1000;
    },

    MSToString: (milliseconds: number) => {
        let duration = milliseconds / 1000;

        const s = duration % 60;
        duration = (duration - s) / 60;
        const m = duration % 60;
        duration = (duration - m) / 60;
        const h = duration % 60;

        let ss = (String(s).length === 1 ? `0${s}` : `${s}`);
        const regex = ss.match(/([0-9]*(?:\.[0-9]{0,6})?)/);
        if (regex) {
            ss = regex[1];
        }

        return (h < 10 ? '0' + h : h) + ':' +
                        (m < 10 ? '0' + m : m) + ':' +
                        ss;

    }
};

// tslint:disable-next-line: variable-name
export const GetTimeStamp = (dateJoin: string, timeJoin: string) => {
    const date = new Date();

    let h: string | number = date.getHours();
    let m: string | number = date.getMinutes();
    let s: string | number = date.getSeconds();

    h = h < 10 ? '0' + h : h; 
    m = m < 10 ? '0' + m : m; 
    s = s < 10 ? '0' + s : s; 

    return [
        [date.getFullYear(), date.getMonth() + 1, date.getDate() + 1].join(dateJoin),
        [h, m, date.getSeconds(), date.getMilliseconds()].join(timeJoin)
    ];
};