/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 * 
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
import { contextBridge,ipcRenderer } from 'electron';

// contextBridge.exposeInMainWorld('EthereumHelper', {
//   ParseAddresses(arg1:string, arg2:number){
//     return ipcRenderer.invoke('EthereumHelper:ParseAddresses', arg1, arg2);
//   }
// })

contextBridge.exposeInMainWorld('SqliteHelper', {
  Run(sql: string, ...params: any){
    return ipcRenderer.invoke('SqliteHelper:Run', sql, ...params);
  },
  Save(table: string, params: Map<string, any>){
    return ipcRenderer.invoke('SqliteHelper:Save', table, params);
  },
  GetAll(sql: string, ...params: any){
    return ipcRenderer.invoke('SqliteHelper:GetAll', sql, ...params);
  },
  GetFirst(sql: string, ...params: any){
    return ipcRenderer.invoke('SqliteHelper:GetFirst', sql, ...params);
  }
})