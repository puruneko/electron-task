/*
import { contextBridge, ipcRenderer } from 'electron';
//import fs from 'fs';

contextBridge.exposeInMainWorld('requires', {
    // <-- ここでつけた名前でひもづく。ここでは"window.requires"
    //fs: fs,
    ipcRenderer: ipcRenderer,
});
*/

//機能しない・・・
import ipcRenderer from 'electron';
import remote from 'electron';
window.bridge = {
    ipcRenderer: ipcRenderer,
    remote: remote,
    Menu: remote.Menu,
    MenuItem: remote.MenuItem,
};
