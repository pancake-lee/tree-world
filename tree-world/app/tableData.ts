import { SetStateAction } from "react";
import { getAllExpandTaskList, updateTask,moveTask } from "./taskAPI";

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

    isChildLoadTime?: number; // 上次加载子节点的时间戳
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

export function getParentByKey(data: DataRow[], key: string): DataRow | null {
    const row = getRowByKey(data, key);
    if (!row) return null;
    const parentId = row.parentID;

    const getParent = (rows: DataRow[], parentId :number):DataRow|null => {
        for (let i = 0; i < rows.length; i++) {
            if (rows[i].id == parentId) {
                return rows[i];
            }
            if (rows[i].children) {
                const childRow = getParent(rows[i].children!, parentId );
                if (childRow) {
                    return childRow;
                }
            }
        }
        return null;
    }
    return getParent(data, parentId);
}
export function getSiblingsByKey (data: DataRow[], key: string):DataRow[] {
    const row = getRowByKey(data, key);
    if (!row) return [];
    const parentId = row.parentID;

    const getSiblings = (rows: DataRow[]):DataRow[] => {
            if (!rows || rows.length === 0) return [];
            if (rows[0].parentID == parentId){
                return rows
            }
            for (const r of rows) {
                if (r.children && r.children.length > 0) {
                    const siblings = getSiblings(r.children);
                    if (siblings.length > 0) return siblings;
                }
            }
            return [];
        }
    return getSiblings(data); 
}


// 更新行排序，根据拖拽位置调整节点顺序
export async function updateRowOrder(
    expandedRowKeys: string[],
    data: DataRow[],
    setData: (value: SetStateAction<DataRow[]>) => void,
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

        await moveTask(dstRow);
    } else if (dropY > bottomThreshold) {
        // src移动到dst下面
        srcRow.parentID = dstRow.parentID;
        srcRow.prevID = dstRow.id;
    } else {
        // src移动到dst里面面
        srcRow.parentID = dstRow.id;
        srcRow.prevID = -1;
    }

    await moveTask(srcRow);

    return getAllExpandTaskList(expandedRowKeys,setData); // 刷新任务列表
}

export function convertToTree(dataRows: DataRow[]): DataRow[] {
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
