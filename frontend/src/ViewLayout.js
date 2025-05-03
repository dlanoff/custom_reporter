import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid, Tooltip
} from "recharts";

function BlockRenderer({ block }) {
  const baseStyle = { maxWidth: "100%", margin: "0 auto", textAlign: "center" };

  switch (block.type) {
    case "text":
      return <p style={{ ...baseStyle, fontSize: "1.1rem", lineHeight: 1.5 }}>{block.config.data}</p>;
    case "image":
      return (
        <div style={baseStyle}>
          <img
            src={block.config.data}
            alt="report"
            style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8 }}
          />
        </div>
      );
    case "table":
      return (
        <div style={baseStyle}>
          <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", margin: "0 auto" }}>
            <thead style={{ background: "#f0f0f0" }}>
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
        </div>
      );
    case "graph":
      const chartData = block.config.data;
      return (
        <div style={{ ...baseStyle, width: 400, height: 250 }}>
          {block.config.type === "bar" ? (
            <BarChart width={400} height={250} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          ) : (
            <LineChart width={400} height={250} data={chartData}>
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
      return <pre style={baseStyle}>{JSON.stringify(block.config)}</pre>;
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

  if (err) return <h2 style={{ textAlign: "center", marginTop: "2rem" }}>{err}</h2>;
  if (!layout) return <h2 style={{ textAlign: "center", marginTop: "2rem" }}>Loading…</h2>;

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
      <h1 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "2rem" }}>{layout.name}</h1>
      {layout.components.map((b, i) => (
        <div key={i} style={{ marginBottom: "2rem" }}>
          <BlockRenderer block={b} />
        </div>
      ))}
    </div>
  );
}
