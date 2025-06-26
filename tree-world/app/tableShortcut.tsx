"use client";

import { SetStateAction } from "react";
import { 
    ColumnMeta, 
    DataRow, 
    getParentByKey, 
    getRowByKey, 
    getSiblingsByKey, 
} from "./tableData";
import {
    createTask, 
    getAllExpandTaskList,
} from "./taskAPI";

import { message } from "antd";

// 封装是按功能的，要返回boolean值，表示是否处理了快捷键
// 后面有可能多个功能使用相同快捷键，只是判断条件不同

// F2/Esc 进入/退出编辑状态
export function handleShotCutForEditing(e: KeyboardEvent,
    selectedRow: DataRow,
    selectedColIdx: string,
    setEditing: (record: DataRow, dataIndex: string) => void,
    editingRowKey: string,
    setEditingRowKey: (value: SetStateAction<string>) => void,
): boolean {
    if (e.key === "Escape") {
        e.preventDefault();
        if (editingRowKey) {
            setEditingRowKey("");
        }
        return true;
    }

    if (e.key === "F2") {
        e.preventDefault();
        setEditing(selectedRow, selectedColIdx);
        return true;
    }

    return false;
}

export function handleShotCutForDrawer(e: KeyboardEvent,
    selectedRow: DataRow,
    showDrawer: (record: DataRow) => void,
): boolean {
    if (e.key === "F3") { // edge是页内搜索
        // if (e.key === "F2" && e.ctrlKey) {
        e.preventDefault();
        showDrawer(selectedRow);
        return true;
    }
    return false;
}

// 空格键展开/折叠选中节点
export function handleShotCutForExpand(e: KeyboardEvent,
    selectedRow: DataRow,
    expandedRowKeys: string[],
    setExpandedRowKeys: (value: SetStateAction<string[]>) => void,
): boolean {
    if (e.key === " ") {
        e.preventDefault();
        if (!selectedRow.children || selectedRow.children.length <= 0) {
            return true;
        }
        // 切换展开/折叠状态
        if (expandedRowKeys.includes(selectedRow.key)) {
            setExpandedRowKeys(prev => prev.filter(key => key !== selectedRow.key));
        } else {
            setExpandedRowKeys(prev => [...prev, selectedRow.key]);
        }
        return true;
    }
    return false;
}

export function handleShotCutForDel(e: KeyboardEvent,
    selectedRow: DataRow,
    handleDeleteClick: (record: DataRow) => void, // 作为参数传入
): boolean {
    if (e.key === "Delete") {
        e.preventDefault();
        handleDeleteClick(selectedRow);
        return true;
    }
    return false;
}
export async function handleShotCutForCreateTaskAfter(e: KeyboardEvent,
    expandedRowKeys: string[],
    selectedRow: DataRow,
    setData: (value: SetStateAction<DataRow[]>) => void,
    setSelectedRowKey: (value: SetStateAction<string>) => void,
): Promise<boolean> {
    if (e.key !== "Enter") {
        return false;
    }
    e.preventDefault();

    // 创建新任务，设置为当前节点的下一个兄弟
    const newTask = await createTask({
        task: "新任务",
        parentID: selectedRow.parentID || 0, // 当前节点的父节点ID
        prevID: selectedRow.id, // 插入在当前节点后
    });
    if (!newTask) {
        message.error("创建任务失败");
        return true;
    }

    // 重新获取数据以刷新表格
    const newData = await getAllExpandTaskList(expandedRowKeys,setData);
    setData(newData);

    // 选中新创建的节点
    const newRow = getRowByKey(newData, newTask!.key);
    if (newRow) {
        setSelectedRowKey(newRow.key);
    }
    return true;
};

export async function handleShotCutForCreateTaskChild(e: KeyboardEvent,
    selectedRow: DataRow,
    setData: (value: SetStateAction<DataRow[]>) => void,
    setSelectedRowKey: (value: SetStateAction<string>) => void,
    expandedRowKeys: string[],
    setExpandedRowKeys: (value: SetStateAction<string[]>) => void,
): Promise<boolean> {
    if (e.key !== "Tab") {
        return false;
    }
    e.preventDefault();

    // 创建新任务，设置为当前节点的子节点
    const newTask = await createTask({
        task: "新任务",
        parentID: selectedRow.id, // 当前节点作为父节点
        prevID: 0, // 作为第一个子节点
    });

    // 重新获取数据以刷新表格
    const newData = await getAllExpandTaskList(expandedRowKeys,setData);
    setData(newData);

    // 展开父节点（当前选中节点）
    if (!expandedRowKeys.includes(selectedRow.key)) {
        setExpandedRowKeys(prev => [...prev, selectedRow.key]);
    }

    // 选中新创建的节点
    const newRow = getRowByKey(newData, newTask!.key);
    if (newRow) {
        setSelectedRowKey(newRow.key);
    }
    return true;
}

// --------------------------------------------------
export function handleShotCutForRowSelect(e: KeyboardEvent,
    data: DataRow[],
    expandedRowKeys: string[],
    selectedRowKey: string,
    setSelectedRowKey: (value: SetStateAction<string>) => void,
): boolean {
    switch (e.key) {
        case "ArrowUp": {
            e.preventDefault();
            const newSelected = handleArrowKeyUp(data, selectedRowKey, expandedRowKeys);
            if (newSelected == "") return true;
            setSelectedRowKey(newSelected);
            return true;
        }
        case "ArrowDown": {
            e.preventDefault();
            const newSelected = handleArrowKeyDown(data, selectedRowKey, expandedRowKeys);
            if (newSelected == "") return true;
            setSelectedRowKey(newSelected);
            return true;
        }
    }
    return false;
}

export function handleShotCutForColSelect(e: KeyboardEvent,
    columns: ColumnMeta[],
    selectedColIdx: string,
    setSelectedColIdx: (value: SetStateAction<string>) => void,
): boolean {
    switch (e.key) {
        case "ArrowLeft":
            e.preventDefault();
            handleArrowKeyLeft(columns, selectedColIdx, setSelectedColIdx);
            return true;
        case "ArrowRight":
            e.preventDefault();
            handleArrowKeyRight(columns, selectedColIdx, setSelectedColIdx);
            return true;
    }
    return false;
}

// 对于上，需要递归处理“上一个节点”展开时的情况
function handleArrowKeyUp(data: DataRow[],
    curSelectedRowKey: string, curExpandedRowKeys: string[],
): string {
    const siblings = getSiblingsByKey(data, curSelectedRowKey);
    const indexInSiblings = siblings.findIndex(row => row.key === curSelectedRowKey);
    if (indexInSiblings === -1) return curSelectedRowKey;

    const newRowIndex = indexInSiblings - 1;

    if (newRowIndex >= 0) {
        const newRow = siblings[newRowIndex];
        const getLastRowWithExpanded = (
            newRow: DataRow): DataRow => {
            if (curExpandedRowKeys.includes(newRow.key) &&
                newRow.children &&
                newRow.children.length > 0) {
                // 如果上一个兄弟节点展开，定位到最后一个子节点
                newRow = newRow.children[newRow.children.length - 1];
                return getLastRowWithExpanded(newRow);
            }
            return newRow;
        }
        return getLastRowWithExpanded(newRow).key;
    }
    const parentRow = getParentByKey(data, curSelectedRowKey);
    if (!parentRow) return curSelectedRowKey;
    return parentRow.key;
}

// 对于下，需要递归处理“最后一个节点”跳到“父节点的下一个节点”
function handleArrowKeyDown(data: DataRow[], curSelectedRowKey: string,
    curExpandedRowKeys: string[],
): string {
    if (curSelectedRowKey === null) return curSelectedRowKey;
    const curRow = getRowByKey(data, curSelectedRowKey);
    if (curRow === null) return curSelectedRowKey;

    // 检查当前行是否展开且有子节点
    if (curExpandedRowKeys.includes(curSelectedRowKey) &&
        curRow.children &&
        curRow.children.length > 0) {
        return curRow.children[0].key;
    }

    const siblings = getSiblingsByKey(data, curSelectedRowKey);
    const indexInSiblings = siblings.findIndex(row => row.key === curSelectedRowKey);
    if (indexInSiblings === -1) return curSelectedRowKey;

    const newRowIndex = indexInSiblings + 1;
    if (newRowIndex < siblings.length) {
        return siblings[newRowIndex].key;
    }

    // 先设置为父，并当作折叠了，然后递归调用“父节点的下一个兄弟节点”
    const parentRow = getParentByKey(data, curSelectedRowKey);
    if (!parentRow) return "";// 递归到最外层，没有下一个兄弟，就不修改了
    const newExpandedRowKeys = curExpandedRowKeys.filter(
        key => key !== parentRow.key);
    return handleArrowKeyDown(data, parentRow.key, newExpandedRowKeys);
}

function handleArrowKeyLeft(columns: ColumnMeta[], selectedColIdx: string,
    setSelectedColIdx: (value: SetStateAction<string>) => void,
) {
    const currentColIndex = columns.findIndex(col => col.dataIndex === selectedColIdx);
    if (currentColIndex === -1) return;
    const newColIndex = Math.max(0, currentColIndex - 1);
    setSelectedColIdx(columns[newColIndex].dataIndex);
    return;
}

function handleArrowKeyRight(columns: ColumnMeta[], selectedColIdx: string,
    setSelectedColIdx: (value: SetStateAction<string>) => void,
) {
    const currentColIndex = columns.findIndex(col => col.dataIndex === selectedColIdx);
    if (currentColIndex === -1) return;
    const newColIndex = Math.min(columns.length - 1, currentColIndex + 1);
    setSelectedColIdx(columns[newColIndex].dataIndex);
    return;
}