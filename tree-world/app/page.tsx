"use client";

import { useEffect, useState } from "react";
import { Table, Input, Button, Space } from "antd";
import type { ColumnsType, ColumnType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";

type DataRow = {
  key: string;
  name: string;
  size: string;
  type: string;
  children?: DataRow[];
};

// 生成500条树形数据：10*10*5
function generateData(): DataRow[] {
  const data: DataRow[] = [];
  let count = 0;
  for (let i = 0; i < 10; i++) {
    const first: DataRow = {
      key: `node-${i}`,
      name: `一级节点${i + 1}`,
      size: `${Math.floor(Math.random() * 100) + 1}KB`,
      type: "folder",
      children: [],
    };
    for (let j = 0; j < 10; j++) {
      const second: DataRow = {
        key: `node-${i}-${j}`,
        name: `二级节点${i + 1}-${j + 1}`,
        size: `${Math.floor(Math.random() * 100) + 1}KB`,
        type: "folder",
        children: [],
      };
      for (let k = 0; k < 5; k++) {
        second.children!.push({
          key: `node-${i}-${j}-${k}`,
          name: `三级节点${i + 1}-${j + 1}-${k + 1}`,
          size: `${Math.floor(Math.random() * 100) + 1}KB`,
          type: "file",
        });
        count++;
      }
      first.children!.push(second);
      count++;
    }
    data.push(first);
    count++;
  }
  // count === 10 + 100 + 500 = 610，但 Table 只展示叶子和分支节点
  return data;
}

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
  const [colWidths, setColWidths] = useState<{ [key: string]: number }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(COLUMN_WIDTH_KEY);
      if (saved) return JSON.parse(saved);
    }
    return getDefaultWidths();
  });

  useEffect(() => {
    setData(generateData());
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

  // 列定义，带可调整宽度
  const columns: ColumnsType<DataRow> = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      width: colWidths.name,
      sorter: (a, b) => a.name.localeCompare(b.name),
      ...getColumnSearchProps<DataRow>("name", "名称"),
      onHeaderCell: () => ({
        width: colWidths.name,
        onResize: handleResize("name"),
      }),
    },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
      width: colWidths.size,
      sorter: (a, b) => {
        const getNum = (s: string) => parseInt(s.replace("KB", ""), 10);
        return getNum(a.size) - getNum(b.size);
      },
      filters: [
        { text: "<50KB", value: "lt50" },
        { text: "≥50KB", value: "gte50" },
      ],
      onFilter: (value, record) => {
        const num = parseInt(record.size.replace("KB", ""), 10);
        if (value === "lt50") return num < 50;
        if (value === "gte50") return num >= 50;
        return true;
      },
      ...getColumnSearchProps<DataRow>("size", "大小"),
      onHeaderCell: () => ({
        width: colWidths.size,
        onResize: handleResize("size"),
      }),
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: colWidths.type,
      sorter: (a, b) => a.type.localeCompare(b.type),
      filters: [
        { text: "文件夹", value: "folder" },
        { text: "文件", value: "file" },
      ],
      onFilter: (value, record) => record.type === value,
      ...getColumnSearchProps<DataRow>("type", "类型"),
      onHeaderCell: () => ({
        width: colWidths.type,
        onResize: handleResize("type"),
      }),
    },
  ];

  // 需要为 Table 组件传递 components 以支持拖拽调整列宽
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
                // 用 clientX 替代 screenX，避免受显示缩放影响
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

  return (
    <div style={{ height: "100vh", width: "100vw", padding: 16 }}>
      {mounted && (
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          rowKey="key"
          scroll={{ y: "80vh" }}
          components={components}
        />
      )}
    </div>
  );
}
