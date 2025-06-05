import {
    TaskCURDApi,
    Configuration,
    ApiAddTaskRequest,
    ApiAddTaskResponse,
    ApiUpdateTaskRequest,
    ApiUpdateTaskResponse,
    ApiGetTaskListResponse,
} from "../api";

// 列定义结构
export type ColumnMeta = {
    title: string;
    dataIndex: string;
    key: string;
    enableSearch?: boolean; // 是否启用搜索
    expandColumn?: boolean; // 是否为展开列
};

// 行数据结构
export type DataRow = {
    key: string;

    id: number; // 添加 iD 字段
    parentID : number; // 父节点ID
    prevID: number; // 前一个节点ID

    [key: string]: any;
    children?: DataRow[];
};

export async function getTableColumns(): Promise<ColumnMeta[]> {
    const columns: ColumnMeta[] = [
        { title: "任务", dataIndex: "task", key: "task",
            enableSearch: true, expandColumn: true },
        { title: "状态", dataIndex: "status", key: "status" },
        { title: "估时", dataIndex: "estimate", key: "estimate" },
        { title: "开始", dataIndex: "start", key: "start" },
        { title: "结束", dataIndex: "end", key: "end" },
    ];
    return columns;
}

export function getRowByKey(data: DataRow[], key: string): DataRow | null {
    for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
            return data[i];
        }
        if (data[i].children) {
            const childRow = getRowByKey(data[i].children!, key);
            if (childRow) {
                return childRow;
            }
        }
    }
    return null;
}

// 更新行排序，根据拖拽位置调整节点顺序
export async function updateRowOrder(
    data: DataRow[],
    sourceKey: string,
    targetKey: string,
    dropY: number, // 鼠标释放时的 Y 坐标
    targetRect: DOMRect // 目标行的矩形区域
): Promise<DataRow[]> {
    const srcRow = getRowByKey(data, sourceKey);
    if (!srcRow) {
        console.warn(`Row with key ${sourceKey} not found.`);
        return data; // 如果找不到源行，直接返回原数据
    }
    const dstRow = getRowByKey(data, targetKey);
    if (!dstRow) {
        console.warn(`Row with key ${targetKey} not found.`);
        return data; // 如果找不到目标行，直接返回原数据
    }

    // 根据目标区域的高度划分1/4区域
    const topThreshold = targetRect.top + targetRect.height / 4;
    const bottomThreshold = targetRect.bottom - targetRect.height / 4;
    if (dropY < topThreshold) {
        // src移动到dst上面
        srcRow.parentID = dstRow.parentID;
        srcRow.prevID = dstRow.prevID;
        dstRow.prevID = srcRow.id;

        // 互换的情况是，last(1) - dst(2)(p1) - src(3)(p2)
        // 按上面代码，last(1) - src(3)(p1) dst(2)(p3) 

        await updateTask(dstRow);
    } else if (dropY > bottomThreshold) {
        // src移动到dst下面
        srcRow.parentID = dstRow.parentID;
        srcRow.prevID = dstRow.id;
    } else {
        // src移动到dst里面面
        srcRow.parentID = dstRow.id;
        srcRow.prevID = -1;
    }

    await updateTask(srcRow);

    return getTaskList(); // 刷新任务列表
}

// --------------------------------------------------
// 调用后端接口，并且转换表格数据
// --------------------------------------------------
// dto to vo
import { ApiTaskInfo } from "../api"; // 添加 ApiTaskInfo 的引入

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
        metadata,
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
        .map((dto) => DTO2VO_ApiTaskInfo(dto))
        .filter((item) => item !== undefined) as DataRow[];

    // 将扁平化的 dataRows 转换为树形结构
    const tree: DataRow[] = [];
    const lookup: { [id: number]: DataRow } = {};
    dataRows.forEach((item) => {
        lookup[item.id] = item;
        item.children = [];
    });
    dataRows.forEach((item) => {
        if (item.parentID && lookup[item.parentID]) {
            lookup[item.parentID].children?.push(item);
        } else {
            tree.push(item);
        }
    });
    // 递归排序，规则：
    // - 若节点的 prevID 缺失或为-1时，视为0；
    // - prevID为0的节点排在最前面，都为0的节点按字符串排序；
    // - prevID大于0的节点，查询id==prevID的节点，按链表的形式排序
    function sortTree(nodes: DataRow[]): DataRow[] {
        nodes.forEach((node) => {
            if (node.children && node.children.length > 0) {
                node.children = sortTree(node.children);
            }
        });
            
        return sortByLinkedList(nodes)
    }
    return sortTree(tree);
}

function sortByLinkedList(nodes: DataRow[]): DataRow[] {
  // 构造链表排序：依据 prevID 链接，若 prevID<=0 则视为头节点
  const included = new Set<number>();
  let sortedNodes: DataRow[] = [];

  // 取出所有头节点，并按任务名称排序
  const heads = nodes.filter(n => n.prevID <= 0);
  nodes.forEach(current => {
    if (!nodes.find(n => n.id === current!.prevID) && 
        !heads.find(h => h.id === current!.id)) {
        // 找不到 prevID 对应的节点，说明是头节点
        // 发生在头节点移动走了的时候
        heads.push(current);
    }
  })
  heads.sort((a, b) => (a.task || "").localeCompare(b.task || ""));

  // 对每个头节点构造链表
  for (const head of heads) {
    const chain: DataRow[] = [];
    let current: DataRow | undefined = head;
    while (current) {
      chain.push(current);
      included.add(current.id);
      // 找到下一个节点：在 nodes 中查找 prevID 等于 current.id 且未包含的节点
      const next = nodes.find(n => n.prevID === current!.id && !included.has(n.id));
      current = next;
    }
    sortedNodes = sortedNodes.concat(chain);
  }

  // 对于未被包含的节点，按任务名称排序后追加
  const remaining = nodes.filter(n => !included.has(n.id));
  remaining.sort((a, b) => (a.task || "").localeCompare(b.task || ""));
  return sortedNodes.concat(remaining);
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
        throw new Error(`AddTask failed with status: ${status}`);
    }
    const response = data as ApiAddTaskResponse;
    return DTO2VO_ApiTaskInfo(response.task);
}

// 删除任务: taskCURDDelTaskByIDList
export async function deleteTaskByIDList(idList: number[]): Promise<void> {
    const { status } = await apiInstance.taskCURDDelTaskByIDList(idList);
    if (status !== 200) {
        throw new Error(`DeleteTask failed with status: ${status}`);
    }
    return;
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
        console.log("update api failed");
        throw new Error(`UpdateTask failed with status: ${status}`);
    }
    const response = data as ApiUpdateTaskResponse;
    console.log("update api success : ", response.task);
    return DTO2VO_ApiTaskInfo(response.task);
}
