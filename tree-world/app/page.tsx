"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Drawer } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import { fetchTableMetaAndData, updateTaskField } from "./tableData";
// 将 Table 组件的子组件通过解构方式获取，避免不必要的自定义属性传递到 DOM
const { Column, HeaderCell, Cell } = Table;

// 可编辑单元格组件
type EditableCellProps = {
  rowData: any;
  dataKey: string;
  onChange: (value: any) => void;
};

const EditableCell: React.FC<EditableCellProps> = ({ rowData, dataKey, onChange }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(rowData[dataKey]);

  const handleBlur = () => {
    setEditing(false);
    if (value !== rowData[dataKey]) {
      onChange(value);
    }
  };

  return editing ? (
    <input
      style={{ width: "100%" }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      autoFocus
    />
  ) : (
    <div onClick={() => setEditing(true)}>{rowData[dataKey]}</div>
  );
};

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerData, setDrawerData] = useState<any>(null);

  useEffect(() => {
    fetchTableMetaAndData().then((res) => {
      setColumns(res.columns);
      setData(res.data);
    });
  }, []);

  // 单元格编辑处理，通过任务名、字段名更新数据
  const handleEdit = (taskName: string, dataIndex: string, newValue: any) => {
    const newData = updateTaskField(data, taskName, dataIndex, newValue);
    setData(newData);
  };

  const openDrawer = (rowData: any) => {
    setDrawerData(rowData);
    setDrawerOpen(true);
  };

  return (
    <div>
      <Table
        data={data}
        autoHeight
        rowKey="task"
      >
        {columns.map((col: any) => (
          <Column key={col.key} width={200} resizable>
            <HeaderCell>{col.title}</HeaderCell>
            <Cell>
              {(rowData: any) => (
                <EditableCell
                  rowData={rowData}
                  dataKey={col.dataIndex}
                  onChange={(value) =>
                    handleEdit(rowData.task, col.dataIndex, value)
                  }
                />
              )}
            </Cell>
          </Column>
        ))}
        <Column width={140} fixed="right">
          <HeaderCell>操作</HeaderCell>
          <Cell>
            {(rowData: any) => (
              <Button appearance="link" onClick={() => openDrawer(rowData)}>
                详情
              </Button>
            )}
          </Cell>
        </Column>
      </Table>
      
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} placement="right">
        <Drawer.Header>
          <Drawer.Title>详情</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          {drawerData && (
            <>
              <h5>描述</h5>
              <p>{drawerData.desc}</p>
              <h5>元数据</h5>
              <pre>{JSON.stringify(drawerData.metadata, null, 2)}</pre>
            </>
          )}
        </Drawer.Body>
        <Drawer.Footer>
          <Button onClick={() => setDrawerOpen(false)}>关闭</Button>
        </Drawer.Footer>
      </Drawer>
    </div>
  );
}
