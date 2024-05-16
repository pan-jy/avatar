export interface ChartLetItem {
  name: string
  src?: string
  children?: ChartLetItem[]
}
export type ChartLetList = ChartLetItem[]

export async function getChartletList() {
  return (await window.electron.ipcRenderer.invoke('read-resources-dir', '/chartlet')).reverse()
}
