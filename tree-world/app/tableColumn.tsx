"use client";

import { SearchOutlined } from "@ant-design/icons";
import { Input, Space, Button } from "antd";
import { ColumnType } from "antd/es/table";
import { DataRow } from "./tableData";
import { SetStateAction } from "react";

export function getColDefaultWidths() {
    return {name: 200,size: 100,type: 100};
}

const minColumnWidth = 60; // 最小列宽

export function getColWidth(w: number | undefined): number {
    return w ? Math.max(minColumnWidth, w) : minColumnWidth;
}

// --------------------------------------------------
export function getColumnSearchProps<T extends object>(
    dataIndex: keyof T,
    title: string
): ColumnType<T> {
    return {
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`搜索${title}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => confirm()}
                    style={{ marginBottom: 8, display: "block" }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => confirm()}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >搜索</Button>
                    <Button
                        onClick={() => {
                            clearFilters && clearFilters();
                            confirm();
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >重置</Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => (
            <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
        ),
        onFilter: (value, record) =>
            !record[dataIndex] ? false :
                String(record[dataIndex]).toLowerCase().includes(String(value).toLowerCase()),
        filterDropdownProps: {
            onOpenChange: (visible) => {
                if (!visible) {
                    return;
                }
                setTimeout(() => {
                    const input = document.querySelector<HTMLInputElement>(
                        ".ant-table-filter-dropdown input"
                    );
                    input?.focus();
                }, 100);
            },
        },
    };
}


// --------------------------------------------------
// 在最前面增加一个空列用于做选择操作
// 当前没有应用
export function getSelectColumn(
    selectedRowKey: string,
    setSelectedRowKey: (value: SetStateAction<string>,
) => void){
    return {
        title: "",
        key: "select",
        dataIndex: "select",
        width: 15,
        onHeaderCell: () => ({ width: 36 }),
        render: (_: any, record: DataRow) => null,
        onCell: (record: DataRow) => ({
            onClick: (e: React.MouseEvent) => {
                e.stopPropagation();
                setSelectedRowKey(record.key);
            },
            style: { cursor: "pointer", background: record.key === selectedRowKey ? "#1890ff22" : undefined },
        }),
    };
}
// --------------------------------------------------
// 在最后面增加一个操作列
// 当前没有应用
  
export function getOpsColumn(
    setSelectedRowKey: (value: SetStateAction<string>,) => void,
    showDrawer: (record: DataRow) => void,
    handleDeleteClick: (record: DataRow) => void,
){
    return {
        title: "操作",
        key: "action",
        dataIndex: "action",
        width: 100,
        onHeaderCell: () => ({ width: 100 }),
        onCell: (record: DataRow) => ({
            record,
            dataIndex: "action",
            title: "操作",
            editing: false,
            onClick: (e: React.MouseEvent) => { 
                e.stopPropagation();
                // 操作列不参与单元格选中逻辑，只设置行选中
                setSelectedRowKey(record.key);
            },
            onDoubleClick: (e: React.MouseEvent) => {},
            style: { cursor: "pointer",background:undefined,border:undefined},
        }),
        render: (_: any, record: DataRow) => (
            <>
                <a onClick={() => showDrawer(record)}>详情</a>
                <a onClick={() => handleDeleteClick(record)}
                    style={{ marginRight: 8, color: 'red' }}>删除</a>
            </>
        ),
    }
};