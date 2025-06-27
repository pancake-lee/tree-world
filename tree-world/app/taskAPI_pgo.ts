import { SetStateAction } from "react";
import {
    TaskCURDApi,
    Configuration,
    ApiAddTaskRequest,
    ApiAddTaskResponse,
    ApiUpdateTaskRequest,
    ApiUpdateTaskResponse,
    ApiGetTaskListResponse,
} from "../api";
import { ApiTaskInfo } from "../api";
import { convertToTree, DataRow, ColumnMeta } from "./tableData";

// --------------------------------------------------
// 调用后端接口，并且转换表格数据
// --------------------------------------------------
// dto to vo
export function DTO2VO_ApiTaskInfo(
    dto: ApiTaskInfo | undefined
): DataRow | undefined {
    if (!dto) {
        return undefined;
    }

    let metadata: Record<string, string> = {};
    try {
        metadata = dto.metadata ? JSON.parse(dto.metadata) : {};
    } catch (e) {
        metadata = {};
    }
    return {
        key: `task-${dto.iD}`,
        id: dto.iD ? dto.iD : 0,
        parentID: dto.parentID||0,
        prevID: dto.prevID||0,
        task: dto.task,
        status: dto.status,
        estimate: dto.estimate,
        start: dto.start,
        end: dto.end,
        desc: dto.desc||"",
        metadata: metadata,
        isChildLoaded: true,
    };
}

// vo to dto
export function VO2DTO_ApiTaskInfo(vo: Partial<DataRow>): ApiTaskInfo {
    return {
        iD: vo.id,
        parentID: vo.parentID,
        prevID: vo.prevID,
        task: vo.task,
        status: vo.status,
        estimate: vo.estimate,
        start: vo.start,
        end: vo.end,
        desc: vo.desc,
        metadata: JSON.stringify(vo.metadata || {}),
    };
}

// --------------------------------------------------

const configuration = new Configuration();
configuration.basePath = "http://127.0.0.1:8000";
const apiInstance = new TaskCURDApi(configuration);

// 获取任务列表
export async function getAllExpandTaskList(
    expandedRowKeys: string[],
    setData: (value: SetStateAction<DataRow[]>) => void
): Promise<DataRow[]> {
    const { status, data } = await apiInstance.taskCURDGetTaskList();
    if (status !== 200) {
        console.log(`GetTaskList failed with status: ${status}`);
        return []; 
    }
    const response = data as ApiGetTaskListResponse;
    if (!response || !response.taskList) {
        return [];
    }

    // 利用 DTO2VO_ApiTaskInfo 进行转换
    const dataRows: DataRow[] = response.taskList
        .map((dto) => DTO2VO_ApiTaskInfo(dto))
        .filter((item) => item !== undefined) as DataRow[];

    return convertToTree(dataRows);
}


// 创建任务: taskCURDAddTask
export async function createTask(
    newTask: Partial<DataRow>
): Promise<DataRow | undefined> {
    const apiAddTaskRequest: ApiAddTaskRequest = {
        task: VO2DTO_ApiTaskInfo(newTask),
    };

    const { status, data } = await apiInstance.taskCURDAddTask(apiAddTaskRequest);
    if (status !== 200) {
        console.log(`AddTask failed with status: ${status}`);
        return undefined; 
    }
    const response = data as ApiAddTaskResponse;
    return DTO2VO_ApiTaskInfo(response.task);
}

// 删除任务: taskCURDDelTaskByIDList
export async function deleteTaskByIDList(idList: number[]): Promise<boolean> {
    const { status } = await apiInstance.taskCURDDelTaskByIDList(idList);
    if (status !== 200) {
        console.log(`DeleteTask failed with status: ${status}`);
        return false; 
    }
    return true;
}

// 更新任务: taskCURDUpdateTask
export async function updateTask(
    updatedTask: Partial<DataRow> & { id: number }
): Promise<DataRow | undefined> {
    const req: ApiUpdateTaskRequest = {
        task: VO2DTO_ApiTaskInfo(updatedTask),
    };

    const { status, data } = await apiInstance.taskCURDUpdateTask(req);
    if (status !== 200) {
        console.log(`updateTask failed with status: ${status}`);
        return undefined; 
    }
    const response = data as ApiUpdateTaskResponse;
    return DTO2VO_ApiTaskInfo(response.task);
}

export async function moveTask(
    updatedTask: Partial<DataRow> & { id: number }
): Promise<boolean> {
    const req: ApiUpdateTaskRequest = {
        task: VO2DTO_ApiTaskInfo(updatedTask),
    };

    const { status, data } = await apiInstance.taskCURDUpdateTask(req);
    if (status !== 200) {
        console.log(`updateTask failed with status: ${status}`);
        return false; 
    }
    // const response = data as ApiUpdateTaskResponse;
    // return DTO2VO_ApiTaskInfo(response.task);
    return true; 
}


// 获取表格列信息
export async function getTableColumns(): Promise<ColumnMeta[]> {
    const columns: ColumnMeta[] = [
        { title: "任务", dataIndex: "task", key: "task", enableSearch: true, expandColumn: true },
        { title: "状态", dataIndex: "status", key: "status" },
        { title: "估时", dataIndex: "estimate", key: "estimate" },
        { title: "开始", dataIndex: "start", key: "start" },
        { title: "结束", dataIndex: "end", key: "end" },
    ];
    return columns;
}
