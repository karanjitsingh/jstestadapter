export default class TimeSpan {
	public static StringToMS(timespan: string): number {
		let time = timespan.split(':');
		return (parseInt(time[0]) * 60 * 60
				+ parseInt(time[1]) * 60
				+ parseFloat(time[2])) * 1000;
	}

	public static MSToString(milliseconds: number) {
		let total = milliseconds/1000;
		let s = total % 60;
		let m = 
	}
}