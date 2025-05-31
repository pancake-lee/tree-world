"use client";

import { useEffect, useState } from "react";
import { Table, Input, Button, Space, Drawer } from "antd";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [desc, setDesc] = useState<string>("");
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  useEffect(() => {
    // 调用 http 接口获取列定义和数据
    fetchTableMetaAndData().then((res) => {
      setColumns(res.columns);
      setData(res.data);
    });
  }, []);

  // 持久化列宽
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(COLUMN_WIDTH_KEY, JSON.stringify(colWidths));
    }
  }, [colWidths]);

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

  // 只在客户端渲染 Table，避免 SSR/CSR 不一致
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 选中行展示描述和metadata
  const onRow = (record: DataRow) => ({
    onClick: () => {
      setDesc(record.desc || "");
      setMetadata(record.metadata || {});
      setDrawerOpen(true);
    }
  });

  return (
    <div style={{ height: "100vh", width: "100vw", padding: 16 }}>
      {mounted && (
        <>
          <Table
            columns={columnsWithResize}
            dataSource={data}
            pagination={false}
            rowKey="key"
            scroll={{ y: "80vh" }}
            components={components}
            onRow={onRow}
          />
          <Drawer
            title="详情"
            placement="right"
            width={400}
            onClose={() => setDrawerOpen(false)}
            open={drawerOpen}
          >
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>描述</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{desc || "无描述"}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>元数据</div>
              {metadata && Object.keys(metadata).length > 0 ? (
                <div>
                  {Object.entries(metadata).map(([k, v]) => (
                    <div key={k} style={{ marginBottom: 4 }}>
                      <span style={{ color: "#888" }}>{k}：</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div>无元数据</div>
              )}
            </div>
          </Drawer>
        </>
      )}
    </div>
  );
}
