const { app, BrowserWindow, Menu } = require('electron')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

const template = [
  {
    label: 'Devices',
    submenu: []
  }
]

var term,
    protocol,
    socketURL,
    socket,
    pid,
    charWidth,
    charHeight;

var terminalContainer = document.getElementById('terminal-container'),
    optionElements = {
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 1000
    },
    colsElement = 80,
    rowsElement = 24;

function setTerminalSize () {
  var cols = parseInt(colsElement, 10),
      rows = parseInt(rowsElement, 10),
      width = (cols * charWidth).toString() + 'px',
      height = (rows * charHeight).toString() + 'px';

  terminalContainer.style.width = width;
  terminalContainer.style.height = height;
  //term.resize(cols, rows);
  term.fit();
}

createTerminal();

var socket = io.connect('http://localhost:5001');
var selectedRoom = '';
var initialized = false;
socket.on('connect', function(data){
    term._initialized = true;
    socket.emit('authentication', {apertureClientId: 'Demo', type: 'user'});
    if(initialized === false){
      initialized = true;
      socketInit();
    }
});

function socketInit(){
  socket.on('authenticated', function(data){
    var textbox = document.getElementById('connected');
    textbox.value = 'Connected';
    connect();
    socket.emit('get rooms')
  });
  socket.on('terminal data', function(data){
      term.write(data);
  });
  socket.on('room list', function(data){
    var arrayLength = data.length;
    var x = document.getElementById("rooms");
    var option = document.createElement("option");
    option.text = 'select a room';
    x.add(option);
    for (var i = 0; i < arrayLength; i++) {
      var x = document.getElementById("rooms");
      var option = document.createElement("option");
      option.text = data[i];
      x.add(option);
    }
  });
  term.on('data',function(data){
      socket.emit('terminal data',data);
  });
  term.on('resize', function(size){
      var cols = size.cols,
          rows = size.rows
      socket.emit('resize', {'room': selectedRoom, 'cols': cols, 'rows': rows});
  });
}
function getRooms(){
  socket.emit('get rooms')
}
function connect(){
  var sel = document.getElementById('rooms');
  if(sel.selectedIndex > -1){
    selectedRoom = sel.options[sel.selectedIndex].text
    if(selectedRoom !== 'select a room'){
      socket.emit('join room', selectedRoom
      );
      term.fit();
    }
  }
}
function createTerminal() {
  // Clean terminal
  while (terminalContainer.children.length) {
    terminalContainer.removeChild(terminalContainer.children[0]);
  }
  term = new Terminal({
    cursorBlink: optionElements.cursorBlink,
    scrollback: parseInt(optionElements.scrollback, 10),
    tabStopWidth: parseInt(optionElements.tabstopwidth, 10)
  });


  term.open(terminalContainer);
  term.fit();

  var initialGeometry = term.proposeGeometry(),
      cols = initialGeometry.cols,
      rows = initialGeometry.rows;

  colsElement.value = cols;
  rowsElement.value = rows;

  charWidth = Math.ceil(term.element.offsetWidth / cols);
  charHeight = Math.ceil(term.element.offsetHeight / rows);


}


function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 980,
    height: 512,
    webPreferences: {
      nodeIntegration: true
    }
  })

  var menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu);

  // and load the index.html of the app.
  win.loadFile('index.html')

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.