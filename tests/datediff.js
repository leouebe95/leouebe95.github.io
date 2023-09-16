
function formatDate(diffId, dateId, now, target) {
    if (dateId) {
        let dateText = document.getElementById(dateId);
        dateText.textContent = target.toLocaleString('en-US');
    }

    if (diffId) {
        let diffMilli = Math.abs(target - now);
        let diffSec   = Math.ceil(diffMilli/1000);
        
        let diffMin   = Math.ceil(diffSec/60);
        let diffHour  = Math.floor(diffMin/60);
        diffMin = diffMin - diffHour*60;
        let diffDay   = Math.floor(diffHour/24);
        diffHour = diffHour - diffDay*24;

        let diffText = document.getElementById(diffId);
        // xdiffText.textContent = `min=${diffMin} hour=${diffHour} day=${diffDay}`;
    
        diffText.textContent = `${diffDay} days, ${diffHour} hours and ${diffMin} minutes`;   }
}

function bootStrap() {
    const now = new Date(Date.now());
    const target1 = new Date('September 19, 2023, 07:15:00 (CEST)');
    const target2 = new Date('September 19, 2023, 10:20:00 (CEST)');
    const target3 = new Date('September 19, 2023, 21:50:00 (CEST)');

    formatDate(null, 'now', now, now);
    formatDate('diff1', 'date1', now, target1);
    formatDate('diff2', 'date2', now, target2);
    formatDate('diff3', 'date3', now, target3);
}

window.addEventListener('DOMContentLoaded', bootStrap);
