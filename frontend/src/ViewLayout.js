import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid, Tooltip
} from "recharts";

function BlockRenderer({ block }) {
  switch (block.type) {
    case "text":
      return <p>{block.config.data}</p>;
    case "image":
      return <img src={block.config.data} alt="report" style={{ maxWidth: "300px" }} />;
    case "table":
      return (
        <table border="1" cellPadding="5">
          <thead>
            <tr>{block.config.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {block.config.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case "graph":
      const chartData = block.config.data;
      return (
        <div style={{ width: 300, height: 200 }}>
          {block.config.type === "bar" && (
            <BarChart width={300} height={200} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          )}
          {block.config.type === "line" && (
            <LineChart width={300} height={200} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          )}
        </div>
      );
    default:
      return <pre>{JSON.stringify(block.config)}</pre>;
  }
}

export default function ViewLayout() {
  const { layoutName } = useParams();
  const [layout, setLayout] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`http://localhost:8000/layouts/${layoutName}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then(setLayout)
      .catch(() => setErr("Layout not found"));
  }, [layoutName]);

  if (err) return <h2>{err}</h2>;
  if (!layout) return <h2>Loading…</h2>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>{layout.name}</h1>
      {layout.components.map((b, i) => (
        <div key={i} style={{ marginBottom: "1rem" }}>
          <BlockRenderer block={b} />
        </div>
      ))}
    </div>
  );
}
