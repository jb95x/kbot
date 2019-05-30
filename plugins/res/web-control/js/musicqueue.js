function updateMusicQueues(serverData) {
    if (document.getElementById("refresh-music").checked) {
        var parentRef = '';
        Object.keys(serverData).forEach((server) => {
            if (serverData[server].queue && serverData[server].queue.length != 0) {
                let timePassed = '';
                timePassed = secToTimestamp(serverData[server].timepassed);
                parentRef += '<div class="card-panel z-depth-1"><p> <b>Server:</b> ' + server + ' (' + serverData[server].queue.length + ' Songs in Queue) <br>';
                parentRef += '<b> Now Playing: </b>' + serverData[server].queue[0].name + ' - (' + timePassed + '/' + serverData[server].queue[0].duration + ') - Requested by ' + serverData[server].queue[0].author + '<br>';
                parentRef += (serverData[server].queue[0].web ? '<b> Link: </b>' + serverData[server].queue[0].src : '') + '</p>';
                if (serverData[server].queue.length > 1) {
                    parentRef += '<textarea style="height: 30vh" readonly>';
                    serverData[server].queue.forEach((entry, number) => {
                        if (number != 0) {
                            parentRef += number + '. ' + entry.name + ' - ' + entry.duration + ' - Requested by ' + entry.author + '\n';
                            parentRef += (entry.web ? '\t' + 'Link: ' + entry.src + '\n' : '');
                        }
                    });

                    parentRef += '</textarea>'
                }
                parentRef += '</div>';
            }
        });
        document.getElementById('queues').innerHTML = parentRef;
    }
}

function secToTimestamp(data) {
    let timeStamp = '';

    let base = new Date(data * 1000);
    let seconds = base.getSeconds();
    let minutes = base.getMinutes();
    let hours = base.getHours();
    let days = base.getDate() - 1;

    timeStamp += days > 0 ? (days.toString().length < 2 ? '0' + days + ':' : days + ':') : (hours > 0 ? '00:' : '');
    timeStamp += hours > 0 ? (hours.toString().length < 2 ? '0' + hours + ':' : hours + ':') : (minutes > 0 || days > 0 ? '00:' : '');
    timeStamp += minutes > 0 ? (minutes.toString().length < 2 ? '0' + minutes + ':' : minutes + ':') : ((seconds > 0 || hours > 0) || days > 0 ? '00:' : '');
    timeStamp += seconds > 0 ? (seconds.toString().length < 2 ? '0' + seconds : seconds) : '00';

    return timeStamp;
}