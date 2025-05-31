import type { ColumnsType } from "antd/es/table";

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

// 获取列定义和数据（后续实现 http 请求）
export async function fetchTableMetaAndData(): Promise<{
  columns: ColumnMeta[];
  data: DataRow[];
}> {
  // TODO: 调用 http 接口获取 columns 和 data
  // 目前返回模拟数据

  const columns: ColumnMeta[] = [
    { title: "任务", dataIndex: "task", key: "task", enableSearch: true },
    { title: "状态", dataIndex: "status", key: "status" },
    { title: "估时", dataIndex: "estimate", key: "estimate" },
    { title: "开始", dataIndex: "start", key: "start" },
    { title: "结束", dataIndex: "end", key: "end" },
    // 不包含desc
  ];

  // 随机生成状态和时间
  const statusList = ["未开始", "进行中", "已完成", "已延期"];
  function randomStatus() {
    return statusList[Math.floor(Math.random() * statusList.length)];
  }
  function randomEstimate() {
    return `${Math.floor(Math.random() * 8) + 1}h`;
  }
  function randomDate(offset = 0) {
    const d = new Date(
      Date.now() + offset * 86400000 + Math.floor(Math.random() * 86400000)
    );
    return d.toISOString().slice(0, 10);
  }
  function randomDesc() {
    const pool = [
      "这是一个测试任务。",
      "需要与前端协作。",
      "优先级较高。",
      "请及时完成。",
      "有风险需评估。",
      "自动生成的描述内容。",
      "涉及多个模块。",
      "请联系负责人。",
      "预计本周完成。",
      "等待资源。",
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function randomMetadata() {
    return {
      owner: ["张三", "李四", "王五", "赵六"][Math.floor(Math.random() * 4)],
      priority: ["高", "中", "低"][Math.floor(Math.random() * 3)],
      tag: ["A", "B", "C", "D"][Math.floor(Math.random() * 4)],
      note: "元数据示例",
    };
  }

  // 构造树形结构，部分节点有children
  const data: DataRow[] = [];
  let keyCount = 0;
  for (let i = 0; i < 5; i++) {
    const first: DataRow = {
      key: `task-${keyCount++}`,
      task: `项目${i + 1}`,
      status: randomStatus(),
      estimate: randomEstimate(),
      start: randomDate(i),
      end: randomDate(i + 2),
      desc: randomDesc(),
      metadata: randomMetadata(),
      children: [],
    };
    for (let j = 0; j < 3; j++) {
      const second: DataRow = {
        key: `task-${keyCount++}`,
        task: `模块${i + 1}-${j + 1}`,
        status: randomStatus(),
        estimate: randomEstimate(),
        start: randomDate(i + j),
        end: randomDate(i + j + 2),
        desc: randomDesc(),
        metadata: randomMetadata(),
        children: [],
      };
      for (let k = 0; k < 2; k++) {
        const third: DataRow = {
          key: `task-${keyCount++}`,
          task: `子任务${i + 1}-${j + 1}-${k + 1}`,
          status: randomStatus(),
          estimate: randomEstimate(),
          start: randomDate(i + j + k),
          end: randomDate(i + j + k + 1),
          desc: randomDesc(),
          metadata: randomMetadata(),
        };
        second.children!.push(third);
      }
      first.children!.push(second);
    }
    data.push(first);
  }

  // 添加一些无children的一级节点
  for (let i = 0; i < 10; i++) {
    data.push({
      key: `task-${keyCount++}`,
      task: `独立任务${i + 1}`,
      status: randomStatus(),
      estimate: randomEstimate(),
      start: randomDate(i + 5),
      end: randomDate(i + 6),
      desc: randomDesc(),
      metadata: randomMetadata(),
    });
  }

  // 添加一些二级节点（父节点为前面某个一级节点）
  for (let i = 0; i < 10; i++) {
    const parentIdx = i % 5;
    data[parentIdx].children!.push({
      key: `task-${keyCount++}`,
      task: `补充任务${parentIdx + 1}-${i + 1}`,
      status: randomStatus(),
      estimate: randomEstimate(),
      start: randomDate(i + 7),
      end: randomDate(i + 8),
      desc: randomDesc(),
      metadata: randomMetadata(),
    });
  }

  // 保证总数约50条
  while (countData(data) < 50) {
    data.push({
      key: `task-${keyCount++}`,
      task: `临时任务${keyCount}`,
      status: randomStatus(),
      estimate: randomEstimate(),
      start: randomDate(),
      end: randomDate(1),
      desc: randomDesc(),
      metadata: randomMetadata(),
    });
  }

  return { columns, data };
}

// 递归统计树形数据总数
function countData(arr: DataRow[]): number {
  let count = 0;
  for (const item of arr) {
    count++;
    if (item.children) count += countData(item.children);
  }
  return count;
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
