import {
    TaskCURDApi,
    Configuration,
    ApiAddTaskRequest,
    ApiAddTaskResponse, 
    ApiUpdateTaskRequest,
    ApiUpdateTaskResponse, 
    ApiGetTaskListResponse
} from '../api';

// 列定义结构（仅包含列名，后端返回）
export type ColumnMeta = {
  title: string;
  dataIndex: string;
  key: string;
  enableSearch?: boolean; // 是否启用搜索
};

// 行数据结构（后端返回）
export type DataRow = {
  iD : number; // 添加 iD 字段
  key: string;
  [key: string]: any;
  desc: string;
  metadata: Record<string, string>;
  children?: DataRow[];
};

export async function getTableColumns(): Promise<ColumnMeta[]> {
  const columns: ColumnMeta[] = [
    { title: "任务", dataIndex: "task", key: "task", enableSearch: true },
    { title: "状态", dataIndex: "status", key: "status" },
    { title: "估时", dataIndex: "estimate", key: "estimate" },
    { title: "开始", dataIndex: "start", key: "start" },
    { title: "结束", dataIndex: "end", key: "end" },
  ];
  return  columns ;
}

// 新增：辅助函数，从树形数据中移除指定节点
// 改写 removeNode 为异步函数，调用 deleteTaskByIDList 删除后端数据，成功后再更新表格数据
async function removeNode(data: DataRow[], key: string
): Promise<{ delNode: DataRow | null; newData: DataRow[] }> {
    for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
            try {
                await deleteTaskByIDList([data[i].iD]);
                const node = data[i];
                data.splice(i, 1);
                return { delNode: node, newData: data };
            } catch (e) {
                // 删除后端数据失败，返回原有数据，不做任何修改
                return { delNode: null, newData: data };
            }
        }
        if (data[i].children) {
            const result = await removeNode(data[i].children!, key);
            if (result.delNode) {
                data[i].children = result.newData;
                return { delNode: result.delNode, newData: data };
            }
        }
    }
    return { delNode: null, newData: data };
}

// 改写后的辅助函数，在树形数据中插入节点，调用 createTask 同步后端数据，返回更新后的 data 以及创建的 node
export async function insertNode(
  data: DataRow[],
  targetKey: string,
  node: DataRow,
  position: "before" | "after" | "child"
): Promise<{addNode: DataRow| null; newData: DataRow[] }> {
  for (let i = 0; i < data.length; i++) {
    if (data[i].key === targetKey) {
      // 根据插入位置更新 node 的 parentID
      if (position === "child") {
        node.parentID = data[i].iD;
      } else {
        node.parentID = data[i].parentID;
      }
      // 调用 createTask 同步后端数据，并检查调用结果
      let newNode: DataRow;
      try {
        const createdNode = await createTask(node);
        if (!createdNode) {
          // createTask 返回 undefined，表示失败：不改变表格数据
          return {addNode:null, newData: data };
        }
        newNode = createdNode;
      } catch (error) {
        // createTask 调用失败，不更新本地数据
        return {addNode:null, newData: data };
      }
      if (position === "before") {
        data.splice(i, 0, newNode);
      } else if (position === "after") {
        data.splice(i + 1, 0, newNode);
      } else if (position === "child") {
        data[i].children = data[i].children || [];
        (data[i].children ||= []).unshift(newNode);
      }
      return {  addNode: newNode ,newData: data};
    }
    if (data[i].children) {
      const result = await insertNode(data[i].children!, targetKey, node, position);
      if (result.addNode) {
        data[i].children = result.newData;
        return { newData: data, addNode: result.addNode };
      }
    }
  }
  return {addNode:null, newData: data };
}

// 新增：更新行排序，根据拖拽位置调整节点顺序
export async function updateRowOrder(
    data: DataRow[],
    sourceKey: string,
    targetKey: string,
    dropY: number, // 鼠标释放时的 Y 坐标
    targetRect: DOMRect // 目标行的矩形区域
): Promise<DataRow[]> {
    // 根据目标区域的高度划分1/4区域
    const topThreshold = targetRect.top + targetRect.height / 4;
    const bottomThreshold = targetRect.bottom - targetRect.height / 4;
    let position: "before" | "after" | "child";
    if (dropY < topThreshold) {
        position = "before";
    } else if (dropY > bottomThreshold) {
        position = "after";
    } else {
        position = "child";
    }
  
    // 调用异步 removeNode 进行后端删除与本地数据更新
    const tmpData = [...data];
    const { delNode: dNode,newData: dData } = await removeNode(tmpData, sourceKey);
    if (!dNode) return data;
    const { addNode: aNode,newData: aData } = await insertNode(dData, targetKey, dNode, position);
    if (!aNode) return data;
    return aData;
}

// --------------------------------------------------
// 调用后端接口，并且转换表格数据
// --------------------------------------------------
// dto to vo
import { ApiTaskInfo } from '../api'; // 添加 ApiTaskInfo 的引入

export function DTO2VO_ApiTaskInfo(dto: ApiTaskInfo|undefined): DataRow |undefined{
    if (!dto){
        return undefined
    }

    let metadata: Record<string, string> = {};
    try {
        metadata = dto.metadata?JSON.parse(dto.metadata):{};
    } catch (e) {
        metadata = {};
    }
    return {
        key: `task-${dto.iD}`,
        iD: dto.iD? dto.iD : 0, 
        parentID: dto.parentID,
        task: dto.task,
        status: dto.status,
        estimate: dto.estimate,
        start: dto.start,
        end: dto.end,
        desc: dto.desc?dto.desc:'',
        metadata,
    };
}

// vo to dto
export function VO2DTO_ApiTaskInfo(vo: Partial<DataRow>): ApiTaskInfo {
    return {
        iD: vo.iD,
        parentID: vo.parentID,
        task: vo.task,
        status: vo.status,
        estimate: vo.estimate,
        start: vo.start,
        end: vo.end,
        desc: vo.desc,
        metadata: JSON.stringify(vo.metadata || {}),
    };
}



const configuration = new Configuration();
configuration.basePath = 'http://127.0.0.1:8000';
const apiInstance = new TaskCURDApi(configuration);

// 获取任务列表
// 并且根据ParentId转换成DataRow为元素的树形结构
// 其中后端接口提供的metadata字段为字符串，需要转换为字典
export async function getTaskList(): Promise<DataRow[]> {
    const { status, data } = await apiInstance.taskCURDGetTaskList();
    if (status !== 200) {
      throw new Error(`GetTaskList failed with status: ${status}`);
    }
    const response = data as ApiGetTaskListResponse;
    if (!response || !response.taskList) {
        return [];
    }

    // 利用 DTO2VO_ApiTaskInfo 进行转换
    const dataRows: DataRow[] = response.taskList
      .map(dto => DTO2VO_ApiTaskInfo(dto))
      .filter(item => item !== undefined) as DataRow[];
      
      // 将扁平化的 dataRows 转换为树形结构
    const tree: DataRow[] = [];
    const lookup: { [id: number]: DataRow } = {};
    dataRows.forEach(item => {
        lookup[item.iD] = item;
        item.children = [];
    });
    dataRows.forEach(item => {
        if (item.parentID && lookup[item.parentID]) {
            lookup[item.parentID].children?.push(item);
        } else {
            tree.push(item);
        }
    });
    return tree;
}

// 创建任务: taskCURDAddTask
export async function createTask(newTask: Partial<DataRow>): Promise<DataRow|undefined>{

    const apiAddTaskRequest: ApiAddTaskRequest = {
        task: VO2DTO_ApiTaskInfo(newTask)
        }

    const { status, data } = await apiInstance.taskCURDAddTask(apiAddTaskRequest);
    if (status !== 200) {
      throw new Error(`AddTask failed with status: ${status}`);
    }
    const response = data as ApiAddTaskResponse;
    return DTO2VO_ApiTaskInfo(response.task);
}

// 删除任务: taskCURDDelTaskByIDList
export async function deleteTaskByIDList(idList: number[]): Promise<void> {
    const { status } = await apiInstance.taskCURDDelTaskByIDList( idList );
    if (status !== 200) {
      throw new Error(`DeleteTask failed with status: ${status}`);
    }
    return;
}

// 更新任务: taskCURDUpdateTask
export async function updateTask(updatedTask: Partial<DataRow> & { iD: number }): Promise<DataRow|undefined> {

    const req: ApiUpdateTaskRequest = {
        task: VO2DTO_ApiTaskInfo(updatedTask)
        }

    const { status, data } = await apiInstance.taskCURDUpdateTask(req);
    if (status !== 200) {
        console.log("update api failed");
        throw new Error(`UpdateTask failed with status: ${status}`);
    }
    const response = data as ApiUpdateTaskResponse;
    console.log("update api success : ", response.task);
    return DTO2VO_ApiTaskInfo(response.task);
}
