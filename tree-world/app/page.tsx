"use client";

import { useEffect, useState } from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
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

const columns: ColumnsType<DataRow> = [
  {
    title: "名称",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "大小",
    dataIndex: "size",
    key: "size",
    width: 100,
  },
  {
    title: "类型",
    dataIndex: "type",
    key: "type",
    width: 100,
  },
];

export default function Home() {
  const [data, setData] = useState<DataRow[]>([]);

  useEffect(() => {
    setData(generateData());
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw", padding: 16 }}>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        rowKey="key"
        scroll={{ y: "80vh" }}
      />
    </div>
  );
}