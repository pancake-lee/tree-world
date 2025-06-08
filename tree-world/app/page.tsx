"use client";

// 避免 SSR/CSR 不一致
// 使用暗色主题
// 通过fetchTableMetaAndData获取列定义和数据
// 支持列宽拖拽调整，支持列拖拽调整排序
// 支持列搜索过滤，根据ColumnMeta.enableSearch字段来开启
// 每个单元格支持编辑，调用updateTaskField保存字段的值
// 支持详情抽屉，展示表格列之外的数据，同样支持编辑

import { useEffect, useState } from "react";
import {
    Table,
    Input,
    Button,
    Space,
    Drawer,
    Form,
    message,
    ConfigProvider,
    theme,
    Modal,
    TableProps,
} from "antd";
import {
    ColumnMeta,
    DataRow,
    getRowByKey,
    getParentByKey,
    getSiblingsByKey,
    updateRowOrder,
    getTableColumns,
    getTaskList,
    updateTask,
    deleteTaskByIDList,
    createTask,
} from "./tableData";
import "antd/dist/reset.css";
import { SearchOutlined,CaretRightOutlined } from "@ant-design/icons";
import type { ColumnType } from "antd/es/table";

const COLUMN_WIDTH_KEY = "tree-table-column-widths";
const EXPANDED_KEYS_KEY = "tree-table-expanded-keys";
const minColumnWidth = 60; // 最小列宽

function getColWidth(w: number | undefined): number {
    return w ? Math.max(minColumnWidth, w) : minColumnWidth;
}

function getColumnSearchProps<T extends object>(
    dataIndex: keyof T,
    title: string
): ColumnType<T> {
    return {
        filterDropdown: ({
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
        }) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`搜索${title}`}
                    value={selectedKeys[0]}
                    onChange={(e) =>
                        setSelectedKeys(e.target.value ? [e.target.value] : [])
                    }
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
                    >
                        搜索
                    </Button>
                    <Button
                        onClick={() => {
                            clearFilters && clearFilters();
                            confirm();
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >
                        重置
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => (
            <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
        ),
        onFilter: (value, record) =>
            record[dataIndex]
                ? String(record[dataIndex])
                    .toLowerCase()
                    .includes(String(value).toLowerCase())
                : false,
        filterDropdownProps: {
            onOpenChange: (visible) => {
                if (visible) {
                    setTimeout(() => {
                        const input = document.querySelector<HTMLInputElement>(
                            ".ant-table-filter-dropdown input"
                        );
                        input?.focus();
                    }, 100);
                }
            },
        },
    };
}

function getDefaultWidths() {
    return {
        name: 200,
        size: 100,
        type: 100,
    };
}

export default function Home() {
    // 只在客户端渲染 Table，避免 SSR/CSR 不一致
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const [data, setData] = useState<DataRow[]>([]);
    const [columns, setColumns] = useState<ColumnMeta[]>([]);

    useEffect(() => {
        // 调用 http 接口获取列定义和数据
        getTableColumns().then((res) => {
            setColumns(res);
        });
        getTaskList().then((res) => {
            setData(res);
        });
    }, []);

    // --------------------------------------------------
    // 列头相关
    // --------------------------------------------------
    // 持久化列宽
    const [colWidths, setColWidths] = useState<{ [key: string]: number }>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(COLUMN_WIDTH_KEY);
            if (saved) return JSON.parse(saved);
        }
        return getDefaultWidths();
    });
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(COLUMN_WIDTH_KEY, JSON.stringify(colWidths));
        }
    }, [colWidths]);

    // 设置列宽
    const getColumnsResizeProps = (col: ColumnMeta) => ({
        width: getColWidth(colWidths[col.key as keyof typeof colWidths]),
        onResize: (_: any, { size }: { size: { width: number } }) => {
            setColWidths((prev) => ({
                ...prev,
                [col.key]: size.width,
            }));
        }
    });

    // 拖拽列头排序
    const getColumnsDragProps = (col: ColumnMeta) => ({
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
            e.dataTransfer.setData("text/plain", col.key);
        },
        onDragOver: (e: React.DragEvent) => {
            e.preventDefault();
        },
        onDrop: (e: React.DragEvent) => {
            e.preventDefault();
            const draggedKey = e.dataTransfer.getData("text/plain");
            if (!draggedKey || draggedKey === col.key) {
                return; // 没有拖拽或拖拽到自己，忽略   
            }
            const fromIndex = columns.findIndex((c) => c.key === draggedKey);
            const toIndex = columns.findIndex((c) => c.key === col.key);
            const newCols = [...columns];
            const [moved] = newCols.splice(fromIndex, 1);
            newCols.splice(toIndex, 0, moved);
            setColumns(newCols);
        },
    });

    // --------------------------------------------------
    // 单元格相关
    // --------------------------------------------------
    // 单元格点击进入编辑状态
    const [editingKey, setEditingKey] = useState<string>("");
    const [editingDataIndex, setEditingDataIndex] = useState<string | null>(null);
    const [form] = Form.useForm();
    const setEditing = (record: DataRow, dataIndex: string) => {
        if (isEditingCol(record, dataIndex)) {
            return;// 已在编辑状态
        }
        setEditingKey(record.key);
        form.setFieldsValue({ ...record });
        setEditingDataIndex(dataIndex);
    };

    const isEditing = (record: DataRow) => record.key === editingKey;
    const isEditingCol = (record: DataRow, dataIndex: string) =>
        isEditing(record) && editingDataIndex === dataIndex
    const cancel = () => { setEditingKey(""); };
    const save = async (key: string) => {
        const row = (await form.validateFields()) as DataRow;
        const curRow = getRowByKey(data, key);
        const newRow = await updateTask({ ...row, id: curRow!.id });
        Object.assign(curRow!, newRow);

        // 因为ui更新表格数据不会更新3个id字段，不会变更位置
        // 所以可以直接更新ui一行数据
        setData(data);
        setEditingKey("");
    };


    // --------------------------------------------------
    // 配置列，包括列头和单元格，上面定义了很多属性，都将设置到列配置中
    // --------------------------------------------------

    // 在最前面插入一个空白选中列，任务列（如name/task）仍为树展开列
    // 选中行的 key 状态
    const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
    // 单元格选中状态管理
    const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
    const [selectedCellDataIndex, setSelectedCellDataIndex] = useState<string | null>(null);
    
    // 展开状态管理 - 添加持久化
    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(EXPANDED_KEYS_KEY);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    return [];
                }
            }
        }
        return [];
    });

    // 持久化展开状态
    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(EXPANDED_KEYS_KEY, JSON.stringify(expandedRowKeys));
        }
    }, [expandedRowKeys]);

    const selectColumn = {
        title: "",
        key: "select",
        dataIndex: "select",
        width: 36,
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
    // --------------------------------------------------
    // 键盘快捷键支持
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // Esc 键退出编辑状态（优先级最高）
            if (e.key === "Escape") {
                e.preventDefault();
                if (editingKey) {
                    cancel();
                }
                return;
            }

            if (!selectedRowKey) return;
            
            // F2 键进入选中单元格的编辑状态
            if (e.key === "F2") {
                e.preventDefault();
                if (selectedCellKey && selectedCellDataIndex) {
                    const selectedRow = getRowByKey(data, selectedCellKey);
                    if (selectedRow) {
                        setEditing(selectedRow, selectedCellDataIndex);
                    }
                } else {
                    // 如果没有选中单元格，默认编辑第一个可编辑列
                    const selectedRow = getRowByKey(data, selectedRowKey);
                    if (selectedRow && columns.length > 0) {
                        const firstEditableCol = columns[0];
                        setEditing(selectedRow, firstEditableCol.dataIndex);
                        setSelectedCellKey(selectedRowKey);
                        setSelectedCellDataIndex(firstEditableCol.dataIndex);
                    }
                }
                return;
            }

            // 如果正在编辑，不处理其他快捷键
            if (editingKey||editingKey!="") return;
            
            if (e.key === "F3") { // edge是页内搜索
            // if (e.key === "F2" && e.ctrlKey) {
                e.preventDefault(); // 阻止默认行为
                const selectedRow = getRowByKey(data, selectedRowKey);
                if (!selectedRow) return;
                showDrawer(selectedRow);
                return
            }

            // 空格键展开/折叠选中节点
            if (e.key === " ") {
                e.preventDefault();
                const selectedRow = getRowByKey(data, selectedRowKey);
                if (selectedRow&&selectedRow.children&&selectedRow.children.length > 0) {
                    // 切换展开/折叠状态
                    if (expandedRowKeys.includes(selectedRowKey)) {
                        setExpandedRowKeys(prev => prev.filter(key => key !== selectedRowKey));
                        console.log("折叠节点:", selectedRowKey);
                    } else {
                        setExpandedRowKeys(prev => [...prev, selectedRowKey]);
                        console.log("展开节点:", selectedRowKey);
                    }
                }
                return;
            }

            // 方向键导航
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
                const newSelected = handleArrowKeyNavigation(
                    selectedRowKey,expandedRowKeys,
                    e.key as "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight");
                if (newSelected=="") return; 
                setSelectedRowKey(newSelected);
                if (selectedCellDataIndex) {
                    setSelectedCellKey(newSelected);
                }
                return;
            }
            
            // Enter 键创建兄弟节点
            if (e.key === "Enter") {
                e.preventDefault();
                await handleCreateTaskAfter(selectedRowKey);
            }
            // Tab 键创建子任务
            if (e.key === "Tab") {
                e.preventDefault();
                await handleCreateTaskChild(selectedRowKey);
            }
            // Delete 键删除选中节点
            if (e.key === "Delete") {
                e.preventDefault();
                const selectedRow = getRowByKey(data, selectedRowKey);
                if (selectedRow) {
                    handleDeleteClick(selectedRow);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedRowKey, selectedCellKey, selectedCellDataIndex, data, columns, editingKey,expandedRowKeys]);

    // 方向键导航处理
    const handleArrowKeyNavigation = (
        curSelectedRowKey: string, curExpandedRowKeys: string[],
        direction: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight",
    ):string => {
        // 这里需要递归处理“最后一个兄弟节点”按“下”后向上找“父的下一个兄弟”
        // 递归时，用setSelectedRowKey不能真正更新状态，所以改成curSelectedRowKey入参
        // 同理，expandedRowKeys为了变更后控制递归逻辑，需要传入

        if (curSelectedRowKey === null) return curSelectedRowKey;
        const curRow = getRowByKey(data,curSelectedRowKey);
        if (curRow === null) return curSelectedRowKey;
        const siblings = getSiblingsByKey(data, curSelectedRowKey);
        const indexInSiblings = siblings.findIndex(row => row.key === curSelectedRowKey);
        if (indexInSiblings === -1) return curSelectedRowKey;

        if (direction === "ArrowUp" || direction === "ArrowDown") {
            // 上下方向键：移动到上一行或下一行
            let newRowKey;
            let newRowIndex;
            if (direction === "ArrowUp") {
                newRowIndex = indexInSiblings - 1;
            } else {
                newRowIndex = indexInSiblings + 1;
            }

            if (newRowIndex<0){
                const parentRow = getParentByKey(data, curSelectedRowKey);
                if (!parentRow) return curSelectedRowKey;
                newRowKey = parentRow.key;

            }else if (newRowIndex >= siblings.length) {
                // 检查当前行是否展开且有子节点
                if (curExpandedRowKeys.includes(curSelectedRowKey) &&
                    curRow.children &&
                    curRow.children.length > 0) {
                        newRowKey = curRow.children[0].key;
                } else{
                    // 先设置为父，然后递归调用“父节点的下一个兄弟节点”
                    const parentRow = getParentByKey(data, curSelectedRowKey);
                    if (!parentRow) return "";// 递归到最外层，没有下一个兄弟，就不修改了
                    newRowKey = parentRow.key;

                    const newRow = getRowByKey(data, newRowKey);
                    if (!newRow) return curSelectedRowKey;

                    // 递归调用，继续查找下一个兄弟节点
                    // 要把父节点当作折叠，修改curExpandedRowKeys
                    const newExpandedRowKeys = curExpandedRowKeys.filter(key => key !== newRow.key);
                    return handleArrowKeyNavigation(newRow.key,newExpandedRowKeys, direction); 
                }
            }else{
                // TODO 向上时，判断上一个兄弟节点是否展开，定位到最后一个子节点
                // 然后递归判断该节点是否展开
                if (direction === "ArrowUp"){

                    newRowKey = siblings[newRowIndex].key;
                    const newRow = getRowByKey(data, newRowKey);
                    if (!newRow) return curSelectedRowKey;

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
                if (direction === "ArrowDown" &&
                    curExpandedRowKeys.includes(curSelectedRowKey) &&
                    curRow.children &&
                    curRow.children.length > 0) {
                    newRowKey = curRow.children[0].key;
                }else{
                    newRowKey = siblings[newRowIndex].key;
                }
            }
            const newRow = getRowByKey(data, newRowKey);
            if (!newRow) return curSelectedRowKey;
            return newRow.key;

        }
        // } else if (direction === "ArrowLeft" || direction === "ArrowRight") {
        // 左右方向键：移动到左侧或右侧列
        if (columns.length <= 0){
            // 如果没有列定义，直接返回当前行
            return curSelectedRowKey;
        }
        if (!selectedCellDataIndex) {
            // 如果没有选中单元格，选中第一列或最后一列
            if (direction === "ArrowLeft") {
                setSelectedCellDataIndex(columns[0].dataIndex);
            } else {
                setSelectedCellDataIndex(columns[columns.length - 1].dataIndex);
            }
            return curSelectedRowKey;
        }
        
        const currentColIndex = columns.findIndex(col => col.dataIndex === selectedCellDataIndex);
        if (currentColIndex === -1) return curSelectedRowKey;
        
        let newColIndex;
        if (direction === "ArrowLeft") {
            newColIndex = Math.max(0, currentColIndex - 1);
        } else {
            newColIndex = Math.min(columns.length - 1, currentColIndex + 1);
        }
        
        const newCol = columns[newColIndex];
        setSelectedCellDataIndex(newCol.dataIndex);
        return curSelectedRowKey;
    };

    // --------------------------------------------------
    // 创建兄弟节点
    const handleCreateTaskAfter = async (currentKey: string) => {
        const currentRow = getRowByKey(data, currentKey);
        if (!currentRow) return;

            // 创建新任务，设置为当前节点的下一个兄弟
            const newTask = await createTask({
                task: "新任务",
                parentID: currentRow.parentID || 0, // 当前节点的父节点ID
                prevID: currentRow.id, // 插入在当前节点后
            });
            if (!newTask) {
                message.error("创建任务失败");
                return;
            }

            // 重新获取数据以刷新表格
            const newData = await getTaskList();
            setData(newData);
            
            // 选中新创建的节点
            const newRow = getRowByKey(newData, newTask!.key);
            if (newRow) {
                setSelectedRowKey(newRow.key);
            }
    };

    // --------------------------------------------------
    // 创建子任务
    const handleCreateTaskChild = async (currentKey: string) => {
        const currentRow = getRowByKey(data, currentKey);
        if (!currentRow) return;

        // 创建新任务，设置为当前节点的子节点
        const newTask = await createTask({
            task: "新任务",
            parentID: currentRow.id, // 当前节点作为父节点
            prevID: 0, // 作为第一个子节点
        });

        // 重新获取数据以刷新表格
        const newData = await getTaskList();
        setData(newData);
        
        // 展开父节点（当前选中节点）
        if (!expandedRowKeys.includes(currentKey)) {
            setExpandedRowKeys(prev => [...prev, currentKey]);
        }
        
        // 选中新创建的节点
        const newRow = getRowByKey(newData, newTask!.key);
        if (newRow) {
            setSelectedRowKey(newRow.key);
        }
    };

    // --------------------------------------------------
    // 数据列配置
    const columnsConfig = [
        selectColumn,
        ...columns.map((col: ColumnMeta) => ({
            ...col,
            width: getColWidth(colWidths[col.key as keyof typeof colWidths]),
            onHeaderCell: () => ({
                ...getColumnsResizeProps(col),
                ...getColumnsDragProps(col),
            }),
            ...(!col.enableSearch ? {} : getColumnSearchProps<DataRow>(col.dataIndex as keyof DataRow, col.title as string)),
            onCell: (record: DataRow) => ({
                record,
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditingCol(record, col.dataIndex),
                onClick: (e: React.MouseEvent) => {
                    e.stopPropagation();
                    // 如果点击的是已选中的单元格，则进入编辑状态
                    if (selectedCellKey === record.key && selectedCellDataIndex === col.dataIndex) {
                        setEditing(record, col.dataIndex);
                    } else {
                        // 否则只是选中单元格
                        setSelectedCellKey(record.key);
                        setSelectedCellDataIndex(col.dataIndex);
                        // 保持行选中状态
                        setSelectedRowKey(record.key);
                    }
                },
                onDoubleClick: (e: React.MouseEvent) => {
                    e.stopPropagation();
                    // 双击直接进入编辑状态
                    setSelectedCellKey(record.key);
                    setSelectedCellDataIndex(col.dataIndex);
                    setSelectedRowKey(record.key);
                    setEditing(record, col.dataIndex);
                },
                style: { 
                    cursor: "pointer",
                    // 单元格选中高亮
                    background: selectedCellKey === record.key && selectedCellDataIndex === col.dataIndex 
                        ? "#1890ff44" 
                        : undefined,
                    border: selectedCellKey === record.key && selectedCellDataIndex === col.dataIndex 
                        ? "2px solid #1890ff" 
                        : undefined,
                },
            }),
            render: (text: any, record: DataRow) =>
                !isEditingCol(record, col.dataIndex) ? (text) : (
                    <Form.Item
                        name={col.dataIndex}
                        style={{ margin: 0 }}
                        rules={[{ required: false }]}
                    >
                        <Input
                            autoFocus
                            onPressEnter={() => save(record.key)}
                            onBlur={() => save(record.key)}
                        />
                    </Form.Item>
                ),
        }))
    ];

    // --------------------------------------------------
    // 增加列头之间的分割线，支持拖拽，最后调用“之前设置的”onResize方法
    const components = {
        header: {
            cell: (props: any) => {
                const { onResize, width, ...restProps } = props;
                if (!width) return <th {...restProps} />;
                return (
                    <th
                        {...restProps}
                        style={{
                            ...restProps.style,
                            width,
                            minWidth: 60,
                            position: "relative",
                        }}
                    >
                        {restProps.children}
                        <div
                            style={{
                                position: "absolute",
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: 6,
                                cursor: "col-resize",
                                userSelect: "none",
                                zIndex: 1,
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                const startX = e.clientX;
                                const startWidth = width;
                                const onMouseMove = (moveEvent: MouseEvent) => {
                                    const newWidth = Math.max(
                                        60,
                                        startWidth + (moveEvent.clientX - startX)
                                    );
                                    onResize?.(null, { size: { width: newWidth } });
                                };
                                const onMouseUp = () => {
                                    window.removeEventListener("mousemove", onMouseMove);
                                    window.removeEventListener("mouseup", onMouseUp);
                                };
                                window.addEventListener("mousemove", onMouseMove);
                                window.addEventListener("mouseup", onMouseUp);
                            }}
                        />
                    </th>
                );
            },
        },
    };

    // --------------------------------------------------
    // 表格内容，支持：行选择，拖拽排序
    // --------------------------------------------------
    const [dragOverInfo, setDragOverInfo] = useState<{
        key: string;
        position: "before" | "after" | "child";
    } | null>(null);

    // 查找第一个有 expandColumn 属性的列，否则返回 1（通常为任务列/树展开列）
    let expandColIdx = columnsConfig.findIndex((col: any) => col.expandColumn)
    if (expandColIdx === -1) {
        expandColIdx = 1; // 默认第二列为树展开列
    }

    const tableContent = (
        <Table
            columns={columnsConfig}
            expandable={{ 
                expandIconColumnIndex: expandColIdx,
                expandedRowKeys: expandedRowKeys,
                onExpand: (expanded, record) => {
                    if (expanded) {
                        setExpandedRowKeys(prev => [...prev, record.key]);
                    } else {
                        setExpandedRowKeys(prev => prev.filter(key => key !== record.key));
                    }
                },
                // 配置子节点字段名，这样表格会自动隐藏没有子节点的展开按钮
                childrenColumnName: 'children',
                // 自定义展开图标显示逻辑
                expandIcon: ({ expanded, onExpand, record }) => {
                    // 检查是否有子节点
                    const hasChildren = record.children && record.children.length > 0;
                    if (!hasChildren) {
                        // 没有子节点时返回空的占位元素
                        return <span style={{ width: 14, height: 14, display: 'inline-block' }} />;
                    }
                    // 有子节点时显示默认的展开图标
                    return (
                         <CaretRightOutlined
                            style={{
                            transform: expanded ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.3s',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onExpand(record, e);
                            }}
                        />
                        // <span
                        //     style={{
                        //         cursor: 'pointer',
                        //         userSelect: 'none',
                        //         width: 14,
                        //         height: 14,
                        //         display: 'inline-block',
                        //         textAlign: 'center',
                        //         lineHeight: '12px',
                        //         fontSize: 14,
                        //         color: '#1890ff',
                        //         border: '1px solid #1890ff',
                        //     }}
                        //     onClick={(e) => {
                        //         e.stopPropagation();
                        //         onExpand(record, e);
                        //     }}
                        // >
                        //     {expanded ? '−' : '+'}
                        // </span>
                    );
                }
            }}
            dataSource={data}
            // rowSelection={{...rowSelection}} // 这个选择框不好用
            pagination={false}
            rowKey="key"
            scroll={{ x: "max-content", y: "89vh" }}
            style={{ width: "max-content" }}
            components={components}
            rowClassName={(record: DataRow) => {
                if (record.key === selectedRowKey) return "selected-row";
                if (dragOverInfo && record.key === dragOverInfo.key) {
                    if (dragOverInfo.position === "before") return "drag-before";
                    if (dragOverInfo.position === "after") return "drag-after";
                    if (dragOverInfo.position === "child") return "drag-child";
                }
                return "";
            }}
            onRow={(record: DataRow) => ({
                onClick: () => setSelectedRowKey(record.key),
                draggable: true,
                onDragStart: (e: React.DragEvent) => {
                    e.dataTransfer.setData("text/plain", record.key);
                },
                onDragOver: (e: React.DragEvent) => {
                    e.preventDefault();
                    const targetRect = (
                        e.currentTarget as HTMLElement
                    ).getBoundingClientRect();
                    const dropY = e.clientY;
                    const topThreshold = targetRect.top + targetRect.height / 4;
                    const bottomThreshold = targetRect.bottom - targetRect.height / 4;
                    let pos: "before" | "after" | "child" = "child";
                    if (dropY < topThreshold) pos = "before";
                    else if (dropY > bottomThreshold) pos = "after";
                    console.log(pos);
                    setDragOverInfo({ key: record.key, position: pos });
                },
                onDragLeave: () => {
                    setDragOverInfo(null);
                },
                onDrop: async (e: React.DragEvent) => {
                    e.preventDefault();
                    const sourceKey = e.dataTransfer.getData("text/plain");
                    const targetKey = record.key;
                    if (sourceKey && sourceKey !== targetKey) {
                        const targetRect = (
                            e.currentTarget as HTMLElement
                        ).getBoundingClientRect();
                        const dropY = e.clientY;
                        const newData = await updateRowOrder(
                            data,
                            sourceKey,
                            targetKey,
                            dropY,
                            targetRect
                        );
                        setData(newData);
                    }
                    setDragOverInfo(null);
                },
            })}
        />
    );

    // --------------------------------------------------
    // 抽屉相关
    // --------------------------------------------------
    // 详情按钮展示描述和metadata（详情按钮触发，不影响表格编辑状态）
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerEditing, setDrawerEditing] = useState(false);
    const [drawerEditingKey, setDrawerEditingKey] = useState<string>("");
    // 展示用的
    const [desc, setDesc] = useState<string>("");
    const [metadata, setMetadata] = useState<Record<string, string>>({});
    // 编辑用的
    const [drawerEditDesc, setDrawerEditDesc] = useState<string>("");
    const [drawerEditMetadata, setDrawerEditMetadata] =
        useState<Record<string, string>>({});

    const showDrawer = (record: DataRow) => {
        setDesc(record.desc || "");
        setDrawerEditDesc(record.desc || "");
        setMetadata(record.metadata || {});
        setDrawerEditMetadata({ ...(record.metadata || {}) });
        setDrawerEditing(false);
        setDrawerOpen(true);
        setDrawerEditingKey(record.key);
    };
    // 抽屉编辑
    const handleDrawerSave = async () => {
        const curRow = getRowByKey(data, drawerEditingKey);
        const newRow = await updateTask({
            ...curRow, id: curRow!.id,
            desc: drawerEditDesc,
            metadata: { ...drawerEditMetadata },
        });
        Object.assign(curRow!, newRow);

        setData(data);
        setDesc(drawerEditDesc);
        setMetadata({ ...drawerEditMetadata });
        setDrawerEditing(false);
    };

    // --------------------------------------------------
    // 删除相关
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetKey, setDeleteTargetKey] = useState<string>("");

    // 删除按钮点击
    const handleDeleteClick = (record: DataRow) => {
        setDeleteTargetKey(record.key);
        setDeleteModalOpen(true);
    };

    // 找到删除节点后应该选中的节点
    const findNextSelectedNode = (deletedRow: DataRow): string | null => {
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
    };

    // 确认删除
    const handleDeleteConfirm = async () => {
        const curRow = getRowByKey(data, deleteTargetKey);
        if (!curRow) return;
    
        // 在删除前确定下一个要选中的节点
        const nextSelectedKey = findNextSelectedNode(curRow);
        
        await deleteTaskByIDList([curRow.id]);
        setDeleteModalOpen(false);
        setDeleteTargetKey("");
        
        // 刷新数据
        const newData = await getTaskList();
        setData(newData);
        
        // 选中最靠近的节点
        if (nextSelectedKey && getRowByKey(newData, nextSelectedKey)) {
            setSelectedRowKey(nextSelectedKey);
        } else {
            // 如果计算的节点不存在，清空选中状态
            setSelectedRowKey(null);
        }
    };
    // 取消删除
    const handleDeleteCancel = () => {
        setDeleteModalOpen(false);
        setDeleteTargetKey("");
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
    }, [deleteModalOpen]);

    // --------------------------------------------------
    // 增加详情和删除按钮列
    const opsCol ={
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
    // columnsConfig.push(opsCol);

    // --------------------------------------------------
    // 抽屉页面内容
    const drawerContent = (
        <Drawer
            title="详情"
            placement="right"
            width={400}
            onClose={() => setDrawerOpen(false)}
            open={drawerOpen}
            extra={
                drawerEditing ? (
                    <Space>
                        <Button type="primary" onClick={handleDrawerSave}>
                            保存
                        </Button>
                        <Button onClick={() => setDrawerEditing(false)}>取消</Button>
                    </Space>
                ) : (
                    <Button onClick={() => setDrawerEditing(true)}>编辑</Button>
                )
            }
        >
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: "#fff" }}>
                    描述
                </div>
                {drawerEditing ? (
                    <Input.TextArea
                        value={drawerEditDesc}
                        onChange={(e) => setDrawerEditDesc(e.target.value)}
                        rows={3}
                    />
                ) : (
                    <div style={{ whiteSpace: "pre-wrap", color: "#d9d9d9" }}>
                        {desc || "无描述"}
                    </div>
                )}
            </div>
            <div>
                <div style={{ fontWeight: 600, marginBottom: 8, color: "#fff" }}>
                    元数据
                </div>
                {drawerEditing ? (
                    <div>
                        {Object.entries(drawerEditMetadata).map(([k, v]) => (
                            <div
                                key={k}
                                style={{
                                    marginBottom: 8,
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <span style={{ color: "#d9d9d9", minWidth: 60 }}>{k}：</span>
                                <Input
                                    value={v}
                                    style={{ flex: 1 }}
                                    onChange={(e) =>
                                        setDrawerEditMetadata((md) => ({
                                            ...md,
                                            [k]: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        ))}
                    </div>
                ) : metadata && Object.keys(metadata).length > 0 ? (
                    <div>
                        {Object.entries(metadata).map(([k, v]) => (
                            <div key={k} style={{ marginBottom: 4 }}>
                                <span style={{ color: "#d9d9d9" }}>{k}：</span>
                                <span style={{ color: "#fff" }}>{v}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ color: "#d9d9d9" }}>无元数据</div>
                )}
            </div>
        </Drawer>
    );

    // --------------------------------------------------
    // 删除确认弹窗
    const deleteModal = (
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

    // --------------------------------------------------
    // 最后页面内容的组织
    // --------------------------------------------------
    const addTheme = (e: React.JSX.Element) => {
        return (
            <ConfigProvider
                theme={{
                    algorithm: theme.darkAlgorithm,
                }}
            >
                {e}
            </ConfigProvider>
        );
    };

    // --------------------------------------------------
    const addDragStyles = (e: React.JSX.Element) => {
        return (
            <>
                <style>{`
        /* 为拖拽至上部时显示上边指示线 */
        tr.drag-before td {
          position: relative;
        }
        tr.drag-before td::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: #1890ff;
        }
        /* 为拖拽至下部时显示下边指示线 */
        tr.drag-after td {
          position: relative;
        }
        tr.drag-after td::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: #1890ff;
        }
        /* 中间区域显示行背景高亮 */
        tr.drag-child {
          background-color: rgba(24,144,255,0.2);
        }
        /* 选中行高亮 */
        tr.selected-row td {
          background: #1890ff22 !important;
        }
        /* 单元格选中状态的特殊样式 */
        .ant-table-tbody > tr > td {
          transition: all 0.2s ease;
        }
      `}</style>
                {e}
            </>
        );
    };

    return addTheme(
        addDragStyles(
            <div
                style={{
                    height: "100vh",
                    width: "100vw",
                    padding: 16,
                    backgroundColor: "#141414",
                    color: "#fff",
                }}
            >
                {mounted && (
                    <>
                        <Form form={form} component={false}>
                            {tableContent}
                        </Form>
                        {drawerContent}
                        {deleteModal}
                    </>
                )}
            </div>
        )
    );
}
