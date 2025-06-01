import {
    TaskCURDApi,
    Configuration,
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

// 修改指定任务的字段值
export function updateTaskField(
  data: DataRow[],
  taskName: string,
  fieldName: string,
  fieldValue: any
): DataRow[] {
  const updateRow = (rows: DataRow[]): DataRow[] => {
    return rows.map((row) => {
      if (row.task === taskName) {
        return {
          ...row,
          [fieldName]: fieldValue,
        };
      }
      if (row.children) {
        return {
          ...row,
          children: updateRow(row.children),
        };
      }
      return row;
    });
  };

  return updateRow(data);
}

// 新增：辅助函数，从树形数据中移除指定节点
function removeNode(data: DataRow[], key: string): { node: DataRow | null; newData: DataRow[] } {
  for (let i = 0; i < data.length; i++) {
    if (data[i].key === key) {
      const node = data[i];
      data.splice(i, 1);
      return { node, newData: data };
    }
    if (data[i].children) {
      const result = removeNode(data[i].children!, key);
      if (result.node) {
        data[i].children = result.newData;
        return { node: result.node, newData: data };
      }
    }
  }
  return { node: null, newData: data };
}

// 新增：辅助函数，在树形数据中插入节点
function insertNode(
  data: DataRow[],
  targetKey: string,
  node: DataRow,
  position: "before" | "after" | "child"
): DataRow[] {
  for (let i = 0; i < data.length; i++) {
    if (data[i].key === targetKey) {
      if (position === "before") {
        data.splice(i, 0, node);
      } else if (position === "after") {
        data.splice(i + 1, 0, node);
      } else if (position === "child") {
        data[i].children = data[i].children || [];
        (data[i].children ||= []).unshift(node);
      }
      return data;
    }
    if (data[i].children) {
      data[i].children = insertNode(data[i].children || [], targetKey, node, position);
    }
  }
  return data;
}

// 新增：更新行排序，根据拖拽位置调整节点顺序
export function updateRowOrder(
  data: DataRow[],
  sourceKey: string,
  targetKey: string,
  dropY: number, // 鼠标释放时的 Y 坐标
  targetRect: DOMRect // 目标行的矩形区域
): DataRow[] {
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
  
  // 移除源节点
  const { node, newData } = removeNode([...data], sourceKey);
  if (!node) return data;
  // 插入到目标位置
  const updatedData = insertNode(newData, targetKey, node, position);
  return updatedData;
}


// 创建任务

// 删除任务

// 更新任务
// 以id为唯一标识符，更新任务其他字段值

// 获取任务列表
// 并且根据ParentId转换成DataRow为元素的树形结构
// 其中后端接口提供的metadata字段为字符串，需要转换为字典
export async function getTaskList(): Promise<DataRow[]> {
    const configuration = new Configuration();
    configuration.basePath = 'http://127.0.0.1:8000';
    const apiInstance = new TaskCURDApi(configuration);

    const { status, data } = await apiInstance.taskCURDGetTaskList();
    if (status !== 200) {
      throw new Error(`GetTaskList failed with status: ${status}`);
    }
    // 数据明确转换为 ApiGetTaskListResponse 类型
    const response = data as ApiGetTaskListResponse;
    const flatList: any[] = response.taskList || [];
    flatList.forEach(item => {
        if (item.metadata && typeof item.metadata === 'string') {
            try {
                item.metadata = JSON.parse(item.metadata);
            } catch (e) {
                item.metadata = {};
            }
        }
        item.key = `task-${item.iD}`;
    });
    const tree: DataRow[] = [];
    const lookup: { [id: number]: DataRow } = {};
    flatList.forEach(item => {
        lookup[item.iD] = item;
        item.children = [];
    });
    flatList.forEach(item => {
        if (item.parentID && lookup[item.parentID]) {
            lookup[item.parentID]?.children?.push(item);
        } else {
            tree.push(item);
        }
    });
    return tree;
}