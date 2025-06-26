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
    ConfigProvider,
    theme,
} from "antd";
import {
    ColumnMeta,
    DataRow,
    getRowByKey,
    updateRowOrder,
} from "./tableData";

import {
    getTableColumns,
    getAllExpandTaskList,
    updateTask,
    loadChildrenIfNeeded,
} from "./taskAPI";

import {
    getColDefaultWidths,
    getColWidth,
    getColumnSearchProps,
} from "./tableColumn";

import "antd/dist/reset.css";
import { CaretRightOutlined } from "@ant-design/icons";
import { handleShotCutForColSelect, handleShotCutForCreateTaskAfter, handleShotCutForCreateTaskChild, handleShotCutForDel, handleShotCutForDrawer, handleShotCutForEditing, handleShotCutForExpand, handleShotCutForRowSelect } from "./tableShortcut";
import { useDeleteModal } from "./tableDel";

const COLUMN_WIDTH_KEY = "tree-table-column-widths";
const EXPANDED_KEYS_KEY = "tree-table-expanded-keys";

export default function Home() {
    // 只在客户端渲染 Table，避免 SSR/CSR 不一致
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // 展开状态管理 - 添加持久化
    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

    // 从 localStorage 加载展开状态
    useEffect(() => {
        const saved = localStorage.getItem(EXPANDED_KEYS_KEY);
        if (saved) {
            try {
                setExpandedRowKeys(JSON.parse(saved));
            } catch {
                // 忽略解析错误
            }
        }
    }, []);

    // 持久化展开状态
    useEffect(() => {
        if (expandedRowKeys.length > 0 || typeof window !== 'undefined') {
            localStorage.setItem(EXPANDED_KEYS_KEY, JSON.stringify(expandedRowKeys));
        }
    }, [expandedRowKeys]);

    // --------------------------------------------------
    // 初始化数据
    const [data, setData] = useState<DataRow[]>([]);
    const [columns, setColumns] = useState<ColumnMeta[]>([]);

    useEffect(() => {
        // 调用 http 接口获取列定义和数据
        getTableColumns().then((res) => {
            setColumns(res);
        });
        // 等待 expandedRowKeys 从 localStorage 加载完成后再获取数据
        if (mounted) {
            getAllExpandTaskList(expandedRowKeys, setData).then((res) => {
                setData(res);
            });
        }
    }, [mounted, expandedRowKeys]);

    // --------------------------------------------------
    // 列头相关
    // --------------------------------------------------
    // 持久化列宽
    const [colWidths, setColWidths] = useState<{ [key: string]: number }>(getColDefaultWidths());
    
    // 从 localStorage 加载列宽
    useEffect(() => {
        const saved = localStorage.getItem(COLUMN_WIDTH_KEY);
        if (saved) {
            try {
                setColWidths(JSON.parse(saved));
            } catch {
                // 忽略解析错误，使用默认值
            }
        }
    }, []);
    
    useEffect(() => {
        localStorage.setItem(COLUMN_WIDTH_KEY, JSON.stringify(colWidths));
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
    // TODO 持久化
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
    const [editingRowKey, setEditingRowKey] = useState<string>("");
    const [editingColIdx, setEditingColIdx] = useState<string>("");
    const [form] = Form.useForm();

    const isEditing = (record: DataRow) => record.key === editingRowKey;
    const isEditingCol = (record: DataRow, dataIndex: string) =>
        isEditing(record) && editingColIdx === dataIndex

    const setEditing = (record: DataRow, dataIndex: string) => {
        if (isEditingCol(record, dataIndex)) {
            return;// 已在编辑状态
        }
        setEditingRowKey(record.key);
        form.setFieldsValue({ ...record });
        setEditingColIdx(dataIndex);
    };

    const save = async (key: string) => {
        const row = (await form.validateFields()) as DataRow;
        const curRow = getRowByKey(data, key);
        if (!curRow) return;
        const newRow = await updateTask({ ...row, id: curRow.id });
        // 不变更位置，可以只更新本行，而不用刷新全部
        Object.assign(curRow!, newRow);
        setData(data);        
        setEditingRowKey("");
    };


    // --------------------------------------------------
    // 配置列，包括列头和单元格，上面定义了很多属性，都将设置到列配置中
    // --------------------------------------------------
    // 单元格选中状态管理
    const [selectedRowKey, setSelectedRowKey] = useState<string>("");
    const [selectedColIdx, setSelectedColIdx] = useState<string>("");
    
    // --------------------------------------------------
    const {handleDeleteClick,getDeleteModalContent}= useDeleteModal(data, setData, setSelectedRowKey);

    // --------------------------------------------------
    // 键盘快捷键支持
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (!selectedRowKey||!selectedColIdx||
                !columns||columns.length==0) return;
            const selectedRow = getRowByKey(data, selectedRowKey);
            if (!selectedRow) return;

            if (handleShotCutForEditing(e, selectedRow, 
                selectedColIdx, setEditing,
                editingRowKey, setEditingRowKey)) {
                return;
            }

            // 如果正在编辑，不处理其他快捷键
            if (editingRowKey||editingRowKey!="") return;
            
            if (handleShotCutForDrawer(e, selectedRow, showDrawer)) {
                return;
            }
            if (handleShotCutForExpand(e, selectedRow, 
                expandedRowKeys,setExpandedRowKeys)) {
                return;
            }

            if (handleShotCutForRowSelect(e, 
                data, expandedRowKeys,
                selectedRowKey, setSelectedRowKey)) {
                return;
            }
            if (handleShotCutForColSelect(e, 
                columns, selectedColIdx, setSelectedColIdx)) {
                return;
            }
            if (await handleShotCutForCreateTaskAfter(e, 
                expandedRowKeys,
                selectedRow, setData, 
                setSelectedRowKey)){
                return;
            }
          
            if (await handleShotCutForCreateTaskChild(e, selectedRow,
                setData, setSelectedRowKey,
                expandedRowKeys, setExpandedRowKeys)){
                return;
            }
            if (handleShotCutForDel(e, selectedRow,handleDeleteClick)){
                return;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedRowKey, selectedRowKey, selectedColIdx, data, columns, editingRowKey,expandedRowKeys]);

    // --------------------------------------------------
    // 数据列配置
    const columnsConfig = [
        // selectColumn,
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
                // dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditingCol(record, col.dataIndex).toString(),
                onClick: (e: React.MouseEvent) => {
                    e.stopPropagation();
                    // 如果点击的是已选中的单元格，则进入编辑状态
                    if (selectedRowKey === record.key && selectedColIdx === col.dataIndex) {
                        setEditing(record, col.dataIndex);
                    } else {
                        // 否则只是选中单元格
                        setSelectedRowKey(record.key);
                        setSelectedColIdx(col.dataIndex);
                    }
                },
                onDoubleClick: (e: React.MouseEvent) => {
                    e.stopPropagation();
                    // 双击直接进入编辑状态
                    setSelectedRowKey(record.key);
                    setSelectedColIdx(col.dataIndex);
                    setEditing(record, col.dataIndex);
                },
                style: { 
                    cursor: "pointer",
                    // 单元格选中高亮
                    background: selectedRowKey === record.key && selectedColIdx === col.dataIndex 
                        ? "#1890ff44" 
                        : undefined,
                    border: selectedRowKey === record.key && selectedColIdx === col.dataIndex 
                        ? "2px solid #1890ff" 
                        : undefined,
                },
            }),
            render: (text: any, record: DataRow) =>
                !isEditingCol(record, col.dataIndex) ? (text) : (
                    <Form.Item
                        name={col.dataIndex}
                        style={{ 
                            margin: -5,
                            display: 'inline-block',
                        }}
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
                onExpand: async (expanded, record) => {
                    if (expanded) {
                        // 展开时尝试加载record的子节点，的子节点
                        record.children?.forEach(async (child) => {
                            const hasNewChildren = await loadChildrenIfNeeded(child);
                            if (hasNewChildren) {
                                // 如果加载了新的子节点，刷新数据状态
                                setData([...data]); // 触发重新渲染
                                console.log(`Loaded children for ${child.taskName}`);
                            }
                        });
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
                        return <span style={{ width: 14, height: 14, display: 'inline-block', marginRight: '3px' }} />;
                    }
                    // 有子节点时显示默认的展开图标
                    return (
                         <CaretRightOutlined
                            style={{
                            transform: expanded ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.3s',
                            marginRight: '5px'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onExpand(record, e);
                            }}
                        />
                    );
                }
            }}
            dataSource={data}
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
                            expandedRowKeys,
                            data,
                            setData,
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
    // 增加详情和删除按钮列
    // columnsConfig.push(getOpsColumn(setSelectedRowKey, showDrawer, handleDeleteClick));

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
                        {/* 快捷键说明 */}
                        <div
                            style={{
                                marginBottom: 16,
                                padding: "8px 12px",
                                backgroundColor: "#1f1f1f",
                                border: "1px solid #434343",
                                borderRadius: "4px",
                                fontSize: "12px",
                                color: "#d9d9d9",
                                lineHeight: "20px"
                            }}
                        >
                            <strong style={{ color: "#fff", marginRight: 16 }}>快捷键说明：</strong>
                            <span style={{ marginRight: 16 }}>
                                <strong style={{ color: "#40a9ff" }}>方向键</strong> 移动光标
                            </span>
                            <span style={{ marginRight: 16 }}>
                                <strong style={{ color: "#40a9ff" }}>空格</strong> 展开/折叠
                            </span>
                            <span style={{ marginRight: 16 }}>
                                <strong style={{ color: "#40a9ff" }}>F2</strong> 编辑
                            </span>
                            <span style={{ marginRight: 16 }}>
                                <strong style={{ color: "#40a9ff" }}>Esc</strong> 取消/返回
                            </span>
                            <span style={{ marginRight: 16 }}>
                                <strong style={{ color: "#40a9ff" }}>F3</strong> 详情
                            </span>
                            <span style={{ marginRight: 16 }}>
                                <strong style={{ color: "#40a9ff" }}>Enter</strong> 创建同级节点
                            </span>
                            <span style={{ marginRight: 16 }}>
                                <strong style={{ color: "#40a9ff" }}>Tab</strong> 创建子节点
                            </span>
                            <span style={{ marginRight: 16 }}>
                                <strong style={{ color: "#40a9ff" }}>Delete</strong> 删除节点
                            </span>
                        </div>
                        
                        <Form form={form} component={false}>
                            {tableContent}
                        </Form>
                        {drawerContent}
                        {getDeleteModalContent()}
                    </>
                )}
            </div>
        )
    );
}
