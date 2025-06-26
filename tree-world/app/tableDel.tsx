"use client";

import { Modal } from "antd";
import { SetStateAction, useEffect, useState } from "react";
import { 
    DataRow, 
    getParentByKey, 
    getRowByKey, 
    getSiblingsByKey, 
} from "./tableData";

import { 
    deleteTaskByIDList, 
    getAllExpandTaskList, 
} from "./taskAPI";

// 自定义 Hook 封装删除功能
export function useDeleteModal(
    data: DataRow[],
    setData: (value: SetStateAction<DataRow[]>) => void,
    setSelectedRowKey: (value: SetStateAction<string>) => void,
) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetKey, setDeleteTargetKey] = useState<string>("");

    // 删除按钮点击
    const handleDeleteClick = (record: DataRow) => {
        setDeleteTargetKey(record.key);
        setDeleteModalOpen(true);
    };

    // 取消删除
    const handleDeleteCancel = () => {
        setDeleteModalOpen(false);
        setDeleteTargetKey("");
    };

    // 确认删除
    const handleDeleteConfirm = async () => {
        const curRow = getRowByKey(data, deleteTargetKey);
        if (!curRow) return;

        // 在删除前确定下一个要选中的节点
        const nextSelectedKey = findNextSelectedNode(data, curRow);

        const ok = await deleteTaskByIDList([curRow.id]);
        if (!ok) {
            console.error("删除任务失败");
            return;
        }

        setDeleteModalOpen(false);
        setDeleteTargetKey("");

        // 直接从data中删除节点
        const newData = removeNodeFromData(data, deleteTargetKey);
        setData(newData);

        // 选中最靠近的节点
        if (nextSelectedKey && getRowByKey(newData, nextSelectedKey)) {
            setSelectedRowKey(nextSelectedKey);
        } else {
            // 如果计算的节点不存在，清空选中状态
            setSelectedRowKey("");
        }
    };

    // 快捷键支持
    useEffect(() => {
        if (!deleteModalOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Delete") {
                handleDeleteConfirm();
            } else if (e.key === "Escape") {
                handleDeleteCancel();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [deleteModalOpen, data, setData, setSelectedRowKey]);

    // 删除弹窗组件
    const getDeleteModalContent = () => (
        <Modal
            open={deleteModalOpen}
            title="是否确认删除"
            onOk={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
            okText="确认"
            cancelText="取消"
            maskClosable={false}
            keyboard={false}
        >
            <div>删除后数据不可恢复，是否继续？<br />（可按 Del 确认，Esc 取消）</div>
        </Modal>
    );

    return {
        handleDeleteClick,
        getDeleteModalContent
    };
}

// 找到删除节点后应该选中的节点
function findNextSelectedNode(data: DataRow[], deletedRow: DataRow): string | null {
    const siblings = getSiblingsByKey(data, deletedRow.key);

    const deletedIndex = siblings.findIndex(row => row.key === deletedRow.key);

    // 优先选择后一个兄弟节点
    if (deletedIndex < siblings.length - 1) {
        return siblings[deletedIndex + 1].key;
    }

    // 如果没有后一个兄弟节点，选择前一个兄弟节点
    if (deletedIndex > 0) {
        return siblings[deletedIndex - 1].key;
    }

    // 如果没有兄弟节点，选择父节点
    const parentRow = getParentByKey(data, deletedRow.key);
    if (!parentRow) {
        return null; // 根节点没有父节点
    }
    return parentRow.key;
}

// 从数据中递归删除指定节点
function removeNodeFromData(data: DataRow[], targetKey: string): DataRow[] {
    return data.reduce((acc: DataRow[], row) => {
        if (row.key === targetKey) {
            // 跳过要删除的节点
            return acc;
        }
        
        // 如果有子节点，递归处理子节点
        const newRow = {
            ...row,
            children: row.children ? removeNodeFromData(row.children, targetKey) : []
        };
        
        acc.push(newRow);
        return acc;
    }, []);
}
