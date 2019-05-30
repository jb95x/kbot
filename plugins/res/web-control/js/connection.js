var encrypt = new JSEncrypt();
var ansi_up = new AnsiUp;
const socket = io('/Konsole');

socket.on('notification', onNotification);
socket.on('fullUpdate', onFullUpdate);
socket.on('newlog', updateLogs);
socket.on('newname', updateName);
socket.on('newstatus', updateStatus);
socket.on('newgame', updateGame);
socket.on('newavatar', updateAvatar);
socket.on('musicupdate', updateMusic);
socket.on('updatecompletions', updateCompletions);

function updateLogs(log) {
    document.getElementById('output').innerHTML += '<br>' + ansi_up.ansi_to_html(log.text);
    document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
}

function updateName(name) {
    document.getElementById('name').innerHTML = name;
}

function updateStatus(status) {
    document.getElementById('status').innerHTML = '<b>Status:</b> ' + status;
}

function updateGame(game) {
    document.getElementById('game').innerHTML = '<b>Game:</b> ' + game;
}

function updateAvatar(avatar) {
    document.getElementById('avatar').src = avatar;
}

function updateMusic(data) {
    updateMusicQueues(data);
}

function updateCompletions(newcompletions) {
    setupCompletions(newcompletions);
}

function onFullUpdate(packet) {
    let data = JSON.parse(packet);
    encrypt.setPublicKey(data.publicKey);
    document.getElementById('avatar').src = data.avatar;
    document.getElementById('name').innerHTML = data.name;
    document.getElementById('status').innerHTML = '<b>Status:</b> ' + data.status;
    document.getElementById('game').innerHTML = '<b>Game:</b> ' + data.game;
    document.getElementById('output').innerHTML = data.logs.map((x) => ansi_up.ansi_to_html(x.text)).join('<br>');
    document.getElementById('output').scrollTop = document.getElementById('output').scrollHeight;
    setupCompletions(data.completions);
    updateMusicQueues(data.serverData);
}

function sendCommand() {
    let commandField = document.getElementById("command");
    let passwordField = document.getElementById("password");
    if (commandField.value != "" && passwordField.value != "") {
        let data = encrypt.encrypt(JSON.stringify({ password: passwordField.value, command: commandField.value, timestamp: Date.now() }));
        socket.emit('exec', data);
        document.getElementById('progress-bar').style.display = 'block';
    }
}

function onNotification(packet) {
    Materialize.toast(packet.text, 3000, 'rounded');
    document.getElementById('progress-bar').style.display = 'none';
}

function onEnter(e) {
    if (e.keyCode == 13 || e.which == 13) sendCommand();
}

document.getElementById('progress-bar').style.display = 'none';

setInterval(() => {
    if (document.getElementById("refresh-music").checked) socket.emit('musicupdate')
}, 500);
