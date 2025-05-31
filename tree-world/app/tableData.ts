import type { ColumnsType } from "antd/es/table";

// 列定义结构（仅包含列名，后端返回）
export type ColumnMeta = {
  title: string;
  dataIndex: string;
  key: string;
};

// 行数据结构（后端返回）
export type DataRow = {
  key: string;
  [key: string]: any;
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
    { title: "任务", dataIndex: "task", key: "task" },
    { title: "状态", dataIndex: "status", key: "status" },
    { title: "估时", dataIndex: "estimate", key: "estimate" },
    { title: "开始", dataIndex: "start", key: "start" },
    { title: "结束", dataIndex: "end", key: "end" },
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
      Date.now() +
        offset * 86400000 +
        Math.floor(Math.random() * 86400000)
    );
    return d.toISOString().slice(0, 10);
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
