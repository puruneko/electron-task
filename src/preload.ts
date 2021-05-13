/*
import { contextBridge, ipcRenderer } from 'electron';
//import fs from 'fs';

contextBridge.exposeInMainWorld('requires', {
    // <-- ここでつけた名前でひもづく。ここでは"window.requires"
    //fs: fs,
    ipcRenderer: ipcRenderer,
});
*/
import ipcRenderer from 'electron';
window.ipcRenderer = ipcRenderer;
import remote from 'electron';
window.remote = remote;
