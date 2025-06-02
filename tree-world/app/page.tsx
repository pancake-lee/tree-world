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
} from "antd";
import {
  ColumnMeta,
  DataRow,
  updateRowOrder,
  getTableColumns,
  getTaskList,
  updateTask,
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
  const handleResize =
    (dataIndex: string) =>
    (_: any, { size }: { size: { width: number } }) => {
      setColWidths((prev) => ({
        ...prev,
        [dataIndex]: size.width,
      }));
    };

  // 动态设置列宽和拖拽
  const columnsWithResize = columns.map((col: ColumnMeta) => ({
    ...col,
    width: getColWidth(colWidths[col.key as keyof typeof colWidths]),
    onHeaderCell: () => ({
      width: getColWidth(colWidths[col.key as keyof typeof colWidths]),
      onResize: handleResize(col.key),
      // 添加拖拽属性和事件处理：拖拽列头排序
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        // 设置 dataTransfer 保存列 key
        e.dataTransfer.setData("text/plain", col.key);
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        // 从 dataTransfer 获取拖拽的列 key
        const draggedKey = e.dataTransfer.getData("text/plain");
        if (draggedKey && draggedKey !== col.key) {
          const fromIndex = columns.findIndex((c) => c.key === draggedKey);
          const toIndex = columns.findIndex((c) => c.key === col.key);
          const newCols = [...columns];
          const [moved] = newCols.splice(fromIndex, 1);
          newCols.splice(toIndex, 0, moved);
          setColumns(newCols);
        }
      },
    }),
    ...(col.enableSearch
      ? getColumnSearchProps<DataRow>(
          col.dataIndex as keyof DataRow,
          col.title as string
        )
      : {}),
    onCell: (record: DataRow) => ({
      record,
      dataIndex: col.dataIndex,
      title: col.title,
      editing: isEditing(record) && editingDataIndex === col.dataIndex,
      onClick: () => {
        if (!isEditing(record) || editingDataIndex !== col.dataIndex) {
          edit(record, col.dataIndex);
        }
      },
      style: { cursor: "pointer" },
    }),
    render: (text: any, record: DataRow) =>
      isEditing(record) && editingDataIndex === col.dataIndex ? (
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
      ) : (
        text
      ),
  }));

  // 详情按钮列
  // 修改详情按钮列 onCell，移除 editable 和 editing 属性，避免将非布尔值属性传递到 DOM
  const isEditing = (record: DataRow) => record.key === editingKey;
  columnsWithResize.push({
    title: "操作",
    key: "action",
    dataIndex: "action",
    width: 60,
    onHeaderCell: () => ({
      width: 60,
    }),
    onCell: (record: DataRow) => ({
      record,
      dataIndex: "action",
      title: "操作",
      editing: false,
      onClick: () => {},
      style: { cursor: "pointer" },
    }),
    render: (_: any, record: DataRow) =>
      isEditing(record) ? (
        <span>
          <a onClick={() => save(record.key)} style={{ marginRight: 8 }}>
            保存
          </a>
          <a onClick={cancel} style={{ marginRight: 8 }}>
            取消
          </a>
          <a onClick={() => showDrawer(record)}>详情</a>
        </span>
      ) : (
        <>
          <a onClick={() => showDrawer(record)}>详情</a>
        </>
      ),
  });

  // --------------------------------------------------
  // 单元格相关
  // --------------------------------------------------
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
  // 单元格相关
  // --------------------------------------------------
  // 详情按钮展示描述和metadata（详情按钮触发，不影响表格编辑状态）
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [desc, setDesc] = useState<string>("");
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [drawerEditing, setDrawerEditing] = useState(false);
  const [drawerEditDesc, setDrawerEditDesc] = useState<string>("");

  const [drawerEditMetadata, setDrawerEditMetadata] = useState<
    Record<string, string>
  >({});
  const showDrawer = (record: DataRow) => {
    setDesc(record.desc || "");
    setDrawerEditDesc(record.desc || "");
    setMetadata(record.metadata || {});
    setDrawerEditMetadata({ ...(record.metadata || {}) });
    // 不设置 setEditingKey，不影响表格编辑状态
    setDrawerEditing(false);
    setDrawerOpen(true);
  };

  // 表格编辑
  // 单元格点击进入编辑状态
  const [editingDataIndex, setEditingDataIndex] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string>("");
  const [form] = Form.useForm();
  const edit = (record: DataRow, dataIndex: string) => {
    setEditingKey(record.key);
    form.setFieldsValue({ ...record });
    setEditingDataIndex(dataIndex);
  };

  const cancel = () => {
    setEditingKey("");
  };

  const save = async (key: string) => {
    try {
      const row = (await form.validateFields()) as DataRow;
      const newData = [...data];
      const updateRow = async (rows: DataRow[]): Promise<boolean> => {
        for (let i = 0; i < rows.length; i++) {
          if (rows[i].key === key) {
            const newRow = await updateTask({...row,iD: rows[i].iD});
            rows[i] = { ...rows[i], ...newRow };
            return true;
          }
          if (
            rows[i].children &&
            (await updateRow(rows[i].children as DataRow[]))
          )
            return true;
        }
        return false;
      };
      await updateRow(newData);
      setData(newData);
      setEditingKey("");
      message.success("保存成功");
    } catch {
        console.log("update failed");
    }
  };

  // --------------------------------------------------
  // 抽屉相关
  // --------------------------------------------------
  // 抽屉编辑
  const handleDrawerSave = () => {
    // 更新data
    const newData = [...data];
    const updateRow = (rows: DataRow[]): boolean => {
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].key === editingKey) {
          rows[i] = {
            ...rows[i],
            desc: drawerEditDesc,
            metadata: { ...drawerEditMetadata },
          };
          return true;
        }
        if (rows[i].children && updateRow(rows[i].children as DataRow[]))
          return true;
      }
      return false;
    };
    updateRow(newData);
    setData(newData);
    setDesc(drawerEditDesc);
    setMetadata({ ...drawerEditMetadata });
    setDrawerEditing(false);
    message.success("保存成功");
  };

  // --------------------------------------------------
  // 添加拖拽期间状态，记录目标行及其区域位置
  const [dragOverInfo, setDragOverInfo] = useState<{
    key: string;
    position: "before" | "after" | "child";
  } | null>(null);
  const tableContent = (
    <Table
      columns={columnsWithResize}
      dataSource={data}
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
          </>
        )}
      </div>
    )
  );
}
