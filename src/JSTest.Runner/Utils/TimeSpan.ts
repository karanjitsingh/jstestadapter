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