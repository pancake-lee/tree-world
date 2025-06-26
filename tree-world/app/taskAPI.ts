import { SetStateAction } from "react";
import { ColumnMeta, DataRow } from "./tableData";

// API实现版本配置
// let API_NAME: string = "pgo"; 
let API_NAME: string = "pancake"; 

// 动态导入不同版本的API实现
let apiImpl: any = null;

async function getApiImpl() {
    if (apiImpl) return apiImpl;
    
    apiImpl = await import("./taskAPI_"+API_NAME);
    if (!apiImpl){
        console.warn(`Unsupported API : ${API_NAME}, falling back to [pgo]`);
        apiImpl = await import("./taskAPI_pgo");
    }
    
    console.log(`Using API implementation version: ${API_NAME}`);
    return apiImpl;
}

// 统一的接口函数

export async function getTableColumns(): Promise<ColumnMeta[]> {
    const impl = await getApiImpl();
    return impl.getTableColumns();
}

export async function getAllExpandTaskList(
    expandedRowKeys: string[],
    setData: (value: SetStateAction<DataRow[]>) => void,
): Promise<DataRow[]> {
    const impl = await getApiImpl();
    return impl.getAllExpandTaskList(expandedRowKeys, setData);
}

export async function createTask(newTask: Partial<DataRow>): Promise<DataRow | undefined> {
    const impl = await getApiImpl();
    return impl.createTask(newTask);
}

export async function deleteTaskByIDList(idList: number[]): Promise<boolean> {
    const impl = await getApiImpl();
    return impl.deleteTaskByIDList(idList);
}

export async function updateTask(updatedTask: Partial<DataRow> & { id: number }): Promise<DataRow | undefined> {
    const impl = await getApiImpl();
    return impl.updateTask(updatedTask);
}

// 子节点加载相关函数（仅在支持的版本中可用）
export async function getChildTasks(parentId: number): Promise<DataRow[]> {
    const impl = await getApiImpl();
    if (impl.getChildTasks) {
        return impl.getChildTasks(parentId);
    }
    console.warn('getChildTasks not supported in current API version');
    return [];
}

export async function loadChildrenIfNeeded(row: DataRow): Promise<boolean> {
    const impl = await getApiImpl();
    if (impl.loadChildrenIfNeeded) {
        return impl.loadChildrenIfNeeded(row);
    }
    console.warn('loadChildrenIfNeeded not supported in current API version');
    return false;
}

export function shouldRefreshChildren(row: DataRow): boolean {
    if (!row.isChildLoadTime) return true; // 从未加载过
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5分钟的毫秒数
    return (now - row.isChildLoadTime) > fiveMinutes;
}

// 如果需要运行时切换版本（可选功能）
export function setApiVersion(name: string) {
    if (name !== API_NAME) {
        console.log(`Switching API from ${API_NAME} to ${name}`);
        // 重置实现，下次调用时会重新加载
        API_NAME = name;
        apiImpl = null;
    }
}
