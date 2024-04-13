
function formatDate(diffId, dateId, now, target) {
    if (dateId) {
        let dateText = document.getElementById(dateId);
        dateText.textContent = target.toLocaleString('en-US');
    }

    if (diffId) {
        let diffMilli = Math.abs(target - now);
        let diffSec   = Math.floor(diffMilli/1000);
        
        let diffMin   = Math.floor(diffSec/60);
        let diffHour  = Math.floor(diffMin/60);
        diffMin = diffMin - diffHour*60;
        let diffDay   = Math.floor(diffHour/24);
        diffHour = diffHour - diffDay*24;

        let diffText = document.getElementById(diffId);
        // xdiffText.textContent = `min=${diffMin} hour=${diffHour} day=${diffDay}`;

        let mplural = diffMin  > 1 ? 's' : '';
        let hplural = diffHour > 1 ? 's' : '';
        let dplural = diffDay  > 1 ? 's' : '';
        
        diffText.textContent =
            `${diffDay} day${dplural}, ${diffHour} hour${hplural} and ${diffMin} minute${mplural}`;
    }
}

function bootStrap() {
    const now = new Date(Date.now());
    const target1 = new Date('April 14, 2024, 07:10:00 (CEST)');
    const target2 = new Date('April 14, 2024, 10:15:00 (CEST)');
    const target3 = new Date('April 14, 2024, 21:45:00 (CEST)');

    formatDate(null, 'now', now, now);
    formatDate('diff1', 'date1', now, target1);
    formatDate('diff2', 'date2', now, target2);
    formatDate('diff3', 'date3', now, target3);
}

window.addEventListener('DOMContentLoaded', bootStrap);
