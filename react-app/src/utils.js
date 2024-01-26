const _getPeriod = (hours) => {
	let hour;
  let period;

  period = hours >= 12 ? 'PM' : 'AM';
  
  if (hours >= 12) {
  	if (hours === 12) {
    	hour = 12;
    } else {
    	hour = hours % 12;
    }
  } else {
 		hour = hours;
  }
  
  return [hour, period];
}
  
export const prettyDate = (datetime) => {
  const dateString = new Date(datetime).toString(); // Tue Jan 16 2024 23:39:20 GMT-0600 (Central Standard Time)
  const dateStringParts = dateString.split(' ');
  const day = dateStringParts[0];
  const timeParts = dateStringParts[4].split(':');
  const hourPeriodParts = _getPeriod(parseInt(timeParts[0]));
  return `${day} ${hourPeriodParts[0]}:${timeParts[1]} ${hourPeriodParts[1]} ${dateStringParts[1]} ${dateStringParts[2]}, ${dateStringParts[3]}`;
}
