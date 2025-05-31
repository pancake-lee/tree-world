"use client";

import { useEffect, useState } from "react";
import { Table, Input, Button, Space, Drawer, Form, message, ConfigProvider, theme } from "antd";
import { ColumnMeta, DataRow, fetchTableMetaAndData } from "./tableData";
import "antd/dist/reset.css";
import { SearchOutlined } from "@ant-design/icons";
import type { ColumnType } from "antd/es/table";

const COLUMN_WIDTH_KEY = "tree-table-column-widths";

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
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  const [colWidths, setColWidths] = useState<{ [key: string]: number }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(COLUMN_WIDTH_KEY);
      if (saved) return JSON.parse(saved);
    }
    return getDefaultWidths();
  });
  const [editingKey, setEditingKey] = useState<string>("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [desc, setDesc] = useState<string>("");
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [drawerEditing, setDrawerEditing] = useState(false);
  const [drawerEditDesc, setDrawerEditDesc] = useState<string>("");
  const [drawerEditMetadata, setDrawerEditMetadata] = useState<Record<string, string>>({});
  const [form] = Form.useForm();

  // --------------------------------------------------
  // 只在客户端渲染 Table，避免 SSR/CSR 不一致
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // 调用 http 接口获取列定义和数据
    fetchTableMetaAndData().then((res) => {
      setColumns(res.columns);
      setData(res.data);
    });
  }, []);

  // --------------------------------------------------
  // 列头相关
  // --------------------------------------------------
  // 持久化列宽
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
    width: colWidths[col.key as keyof typeof colWidths],
    onHeaderCell: () => ({
      width: colWidths[col.key as keyof typeof colWidths],
      onResize: handleResize(col.key),
    }),
    ...getColumnSearchProps<DataRow>(col.dataIndex as keyof DataRow, col.title as string),
  }));

  // 详情按钮列
  columnsWithResize.push({
    title: "操作",
    key: "action",
    dataIndex: "action",
    width: 140,
    onHeaderCell: () => ({
      width: 140,
    }),
    onCell: (record: DataRow) => ({
      record,
      editable: false,
      dataIndex: "action",
      title: "操作",
      editing: false,
      onClick: () => {},
      style: { cursor: "pointer" },
    }),
    render: (_: any, record: DataRow) =>
      isEditing(record) ? (
        <span>
          <a onClick={() => save(record.key)} style={{ marginRight: 8 }}>保存</a>
          <a onClick={cancel} style={{ marginRight: 8 }}>取消</a>
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
  const isEditing = (record: DataRow) => record.key === editingKey;
  const [editingRow, setEditingRow] = useState<DataRow | null>(null);

  // 单元格点击进入编辑状态
  const edit = (record: DataRow, dataIndex: string) => {
    setEditingKey(record.key);
    setEditingRow({ ...record });
    form.setFieldsValue({ ...record });
    setEditingDataIndex(dataIndex);
  };

  // 记录当前编辑的列
  const [editingDataIndex, setEditingDataIndex] = useState<string | null>(null);

  const cancel = () => {
    setEditingKey("");
    setEditingRow(null);
  };

  const save = async (key: string) => {
    try {
      const row = (await form.validateFields()) as DataRow;
      const newData = [...data];
      const updateRow = (rows: DataRow[]): boolean => {
        for (let i = 0; i < rows.length; i++) {
          if (rows[i].key === key) {
            rows[i] = { ...rows[i], ...row };
            return true;
          }
          if (rows[i].children && updateRow(rows[i].children as DataRow[])) return true;
        }
        return false;
      };
      updateRow(newData);
      setData(newData);
      setEditingKey("");
      setEditingRow(null);
      message.success("保存成功");
    } catch {
      // 校验失败
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
        if (rows[i].children && updateRow(rows[i].children as DataRow[])) return true;
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
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
      }}
    >
      <div style={{ 
        height: "100vh", 
        width: "100vw", 
        padding: 16,
        backgroundColor: "#141414",
        color: "#fff"
      }}>
        {mounted && (
          <>
            <Form form={form} component={false}>
              <Table
                columns={columnsWithResize}
                dataSource={data}
                pagination={false}
                rowKey="key"
                scroll={{ y: "80vh" }}
                components={components}
                // 移除 onRow，避免点击整行触发抽屉
              />
            </Form>
            <Drawer
              title="详情"
              placement="right"
              width={400}
              onClose={() => setDrawerOpen(false)}
              open={drawerOpen}
              extra={
                drawerEditing ? (
                  <Space>
                    <Button type="primary" onClick={handleDrawerSave}>保存</Button>
                    <Button onClick={() => setDrawerEditing(false)}>取消</Button>
                  </Space>
                ) : (
                  <Button onClick={() => setDrawerEditing(true)}>编辑</Button>
                )
              }
            >
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: "#fff" }}>描述</div>
                {drawerEditing ? (
                  <Input.TextArea
                    value={drawerEditDesc}
                    onChange={e => setDrawerEditDesc(e.target.value)}
                    rows={3}
                  />
                ) : (
                  <div style={{ whiteSpace: "pre-wrap", color: "#d9d9d9" }}>{desc || "无描述"}</div>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8, color: "#fff" }}>元数据</div>
                {drawerEditing ? (
                  <div>
                    {Object.entries(drawerEditMetadata).map(([k, v]) => (
                      <div key={k} style={{ marginBottom: 8, display: "flex", alignItems: "center" }}>
                        <span style={{ color: "#d9d9d9", minWidth: 60 }}>{k}：</span>
                        <Input
                          value={v}
                          style={{ flex: 1 }}
                          onChange={e => setDrawerEditMetadata(md => ({ ...md, [k]: e.target.value }))}
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
          </>
        )}
      </div>
    </ConfigProvider>
  );
}
