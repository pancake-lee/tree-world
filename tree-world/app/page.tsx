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
    updateRowOrder,
    getTableColumns,
    getTaskList,
    updateTask,
    deleteTaskByIDList,
} from "./tableData";
import "antd/dist/reset.css";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnType } from "antd/es/table";

const COLUMN_WIDTH_KEY = "tree-table-column-widths";
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
    const isEditingCol = (record: DataRow,dataIndex: string) => 
        isEditing(record) && editingDataIndex === dataIndex
    const cancel = () => {setEditingKey("");};
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
    const columnsConfig = columns.map((col: ColumnMeta) => ({
        ...col,
        width: getColWidth(colWidths[col.key as keyof typeof colWidths]),
        onHeaderCell: () => ({
            ...getColumnsResizeProps(col),
            ...getColumnsDragProps(col),
        }),
        ...(!col.enableSearch ? {} : // 根据列属性开启搜索
            getColumnSearchProps<DataRow>(
                col.dataIndex as keyof DataRow,
                col.title as string
            )),
        onCell: (record: DataRow) => ({
            record,
            dataIndex: col.dataIndex,
            title: col.title,
            editing: isEditingCol(record, col.dataIndex),
            onClick: () => {
                setEditing(record, col.dataIndex);// 点击单元格进入编辑状态
            },
            style: { cursor: "pointer" },
        }),
        render: (text: any, record: DataRow) =>
            // 如果不是编辑状态，渲染文本，否则渲染输入框
            !isEditingCol(record, col.dataIndex) ? (text):
            (
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
    }));

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
    // rowSelection objects indicates the need for row selection
    type TableRowSelection<T extends object = object> = TableProps<T>['rowSelection'];
    const rowSelection: TableRowSelection<DataRow> = {
    onChange: (selectedRowKeys, selectedRows) => {
        console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
    },
    onSelect: (record, selected, selectedRows) => {
        console.log(record, selected, selectedRows);
    },
    onSelectAll: (selected, selectedRows, changeRows) => {
        console.log(selected, selectedRows, changeRows);
    },
    };

    const [dragOverInfo, setDragOverInfo] = useState<{
        key: string;
        position: "before" | "after" | "child";
    } | null>(null);
    const tableContent = (
        <Table
            columns={columnsConfig}
            dataSource={data}
            rowSelection={{...rowSelection}}
            pagination={false}
            rowKey="key"
            scroll={{ x: "max-content", y: "89vh" }}
            style={{ width: "max-content" }}
            components={components}
            rowClassName={(record: DataRow) => {
                if (dragOverInfo && record.key === dragOverInfo.key) {
                    if (dragOverInfo.position === "before") return "drag-before";
                    if (dragOverInfo.position === "after") return "drag-after";
                    if (dragOverInfo.position === "child") return "drag-child";
                }
                return "";
            }}
            onRow={(record: DataRow) => ({
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
    const handleDrawerSave =async () => {
        const curRow = getRowByKey(data, drawerEditingKey); 
        const newRow = await updateTask({ ...curRow, id: curRow!.id,
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
    // 确认删除
    const handleDeleteConfirm = async () => {
        const curRow = getRowByKey(data, deleteTargetKey);
        if (!curRow) return;
        try {
            await deleteTaskByIDList([curRow.id]);
            setDeleteModalOpen(false);
            setDeleteTargetKey("");
            // 刷新数据
            const newData = await getTaskList();
            setData(newData);
            message.success("删除成功");
        } catch (e) {
            message.error("删除失败");
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
    columnsConfig.push({
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
            onClick: () => {},
            style: { cursor: "pointer" },
        }),
        render: (_: any, record: DataRow) =>
            // 本行任意列在编辑状态时，显示保存和取消按钮
            isEditing(record) ? (
                <span>
                    <a onClick={() => showDrawer(record)}
                        style={{ marginRight: 8 }}>详情</a>
                    <a onClick={() => handleDeleteClick(record)} 
                        style={{ marginRight: 8, color: 'red' }}>删除</a>
                    <a onClick={() => save(record.key)} 
                        style={{ marginRight: 8 }}>保存</a>
                    <a onClick={cancel} 
                        style={{ marginRight: 8 }}>取消</a>
                </span>
            ) : (
                <>
                    <a onClick={() => showDrawer(record)}>详情</a>
                    <a onClick={() => handleDeleteClick(record)} 
                        style={{ marginRight: 8, color: 'red' }}>删除</a>
                </>
            ),
    });

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
            <div>删除后数据不可恢复，是否继续？<br/>（可按 Del 确认，Esc 取消）</div>
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
