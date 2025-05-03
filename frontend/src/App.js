import React, { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

function App() {
  const [layoutName, setLayoutName] = useState("");
  const [blockText, setBlockText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [tableHeaders, setTableHeaders] = useState("");
  const [tableRows, setTableRows] = useState("");
  const [components, setComponents] = useState([]);
  const [message, setMessage] = useState("");
  const [graphType, setGraphType] = useState("bar");
  const [graphLabels, setGraphLabels] = useState("");
  const [graphValues, setGraphValues] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [availableLayouts, setAvailableLayouts] = useState([]);

  const payload = {
    name: layoutName,
    components: components.map((c, i) => ({ ...c, position: i })),
  };

  useEffect(() => {
    fetch("http://localhost:8000/layouts")
      .then(res => res.json())
      .then(setAvailableLayouts);
  }, []);

  const updateComponent = (index, newConfig) => {
    const updated = [...components];
    updated[index].config = newConfig;
    setComponents(updated);
  };

  const moveComponent = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= components.length) return;
    const updated = [...components];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setComponents(updated);
  };


  const addTextBlock = () => {
    const newBlock = {
      type: "text",
      position: components.length,
      config: { data: blockText || "Default text block" },
    };
    setComponents([...components, newBlock]);
    setBlockText("");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
  };

  const addImageBlock = () => {
    if (!imageFile) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newBlock = {
        type: "image",
        position: components.length,
        config: { data: reader.result }, // base64 string
      };
      setComponents([...components, newBlock]);
      setImageFile(null);
    };
    reader.readAsDataURL(imageFile);
  };

  const addTableBlock = () => {
    const headers = tableHeaders.split(",").map(h => h.trim());
    const rows = tableRows
      .split("\n")
      .map(line => line.split(",").map(cell => cell.trim()));

    const newBlock = {
      type: "table",
      position: components.length,
      config: { headers, rows },
    };

    setComponents([...components, newBlock]);
    setTableHeaders("");
    setTableRows("");
  };

  const submitLayout = async () => {
    const payload = {
      name: layoutName,
      components: components.map((c, i) => ({
        ...c,
        position: i, // <-- critical: overwrite position before sending
      })),
    };

    const response = await fetch(
      `http://localhost:8000/layouts/${layoutName}`,
      {
        method: editMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    setMessage(response.ok ? "Layout saved!" : `Error: ${data.detail}`);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Report Builder</h1>
      <h4>Saved Layouts</h4>
      <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #ccc", padding: "0.5rem" }}>
        {availableLayouts.map((name, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.25rem 0" }}>
            <span
              style={{ cursor: "pointer", textDecoration: "underline" }}
              title="Click to load for editing"
              onClick={async () => {
                const res = await fetch(`http://localhost:8000/layouts/${name}`);
                const data = await res.json();
                setLayoutName(data.name);
                setComponents(data.components);
                setEditMode(true);
              }}
            >
              {name}
            </span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <span
                title="Edit"
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  const res = await fetch(`http://localhost:8000/layouts/${name}`);
                  const data = await res.json();
                  setLayoutName(data.name);
                  setComponents(data.components);
                  setEditMode(true);
                }}
              >
                ✏️
              </span>
              <span
                title="Delete"
                style={{ cursor: "pointer", color: "red" }}
                onClick={async () => {
                  if (!window.confirm(`Delete layout "${name}"?`)) return;
                  await fetch(`http://localhost:8000/layouts/${name}`, { method: "DELETE" });
                  setAvailableLayouts((prev) => prev.filter((n) => n !== name));
                  if (layoutName === name) {
                    setLayoutName("");
                    setComponents([]);
                    setEditMode(false);
                  }
                }}
              >
                ❌
              </span>
            </div>
          </div>
        ))}
      </div>
      <br /><br />

      <input
        type="text"
        placeholder="Layout name"
        value={layoutName}
        onChange={(e) => setLayoutName(e.target.value)}
      />
      <br /><br />

      <input
        type="text"
        placeholder="Text block content"
        value={blockText}
        onChange={(e) => setBlockText(e.target.value)}
      />
      <button onClick={addTextBlock}>Add Text Block</button>
      <br /><br />

      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <button onClick={addImageBlock}>Add Image Block</button>
      <br /><br />

      <h4>Add Table Block</h4>
      <input
        type="text"
        placeholder="Headers (comma-separated)"
        value={tableHeaders}
        onChange={(e) => setTableHeaders(e.target.value)}
      />
      <br />
      <textarea
        placeholder="Rows (comma-separated, one row per line)"
        value={tableRows}
        onChange={(e) => setTableRows(e.target.value)}
        rows={4}
        cols={40}
      />
      <br />
      <button onClick={addTableBlock}>Add Table Block</button>



      <h4>Add Graph Block</h4>
      <select value={graphType} onChange={(e) => setGraphType(e.target.value)}>
        <option value="bar">Bar</option>
        <option value="line">Line</option>
      </select>
      <br />
      <input
        type="text"
        placeholder="Labels (comma-separated)"
        value={graphLabels}
        onChange={(e) => setGraphLabels(e.target.value)}
      />
      <br />
      <input
        type="text"
        placeholder="Values (comma-separated)"
        value={graphValues}
        onChange={(e) => setGraphValues(e.target.value)}
      />
      <br />

      <button
        onClick={() => {
          const labels = graphLabels.split(",").map((x) => x.trim());
          const values = graphValues.split(",").map((x) => parseFloat(x));
          const data = labels.map((label, i) => ({ label, value: values[i] }));

          const newBlock = {
            type: "graph",
            position: components.length,
            config: {
              type: graphType,
              data,
            },
          };

          setComponents([...components, newBlock]);
          setGraphLabels("");
          setGraphValues("");
        }}
      >
        Add Graph Block
      </button>

      <button onClick={submitLayout}>Submit Layout</button>

      <p style={{ color: "green" }}>{message}</p>

      <h3>Preview</h3>


      {components.map((comp, i) => (
        <div key={i} style={{ border: "1px solid #ccc", padding: "0.5rem", marginBottom: "1rem", display: "flex" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: "1rem" }}>
            <button onClick={() => moveComponent(i, -1)}>↑</button>
            <button onClick={() => moveComponent(i, 1)}>↓</button>
          </div>

          <div style={{ flex: 1 }}>
            <strong>{comp.type}</strong>

            {comp.type === "text" && (
              <>
                <textarea
                  value={comp.config.data}
                  onChange={(e) => updateComponent(i, { data: e.target.value })}
                />
              </>
            )}

            {comp.type === "image" && (
              <>
                <img src={comp.config.data} alt="block" style={{ maxWidth: "200px" }} />
                <p><em>To replace, delete and re-add.</em></p>
              </>
            )}

            {comp.type === "table" && (
              <>
                <table border="1" cellPadding="5">
                  <thead>
                    <tr>{comp.config.headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {comp.config.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>Edit:</p>
                <input
                  type="text"
                  placeholder="New headers"
                  defaultValue={comp.config.headers.join(",")}
                  onChange={(e) =>
                    updateComponent(i, {
                      ...comp.config,
                      headers: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                />
                <br />
                <textarea
                  rows={3}
                  defaultValue={comp.config.rows.map((r) => r.join(",")).join("\n")}
                  onBlur={(e) =>
                    updateComponent(i, {
                      ...comp.config,
                      rows: e.target.value.split("\n").map((line) =>
                        line.split(",").map((s) => s.trim())
                      ),
                    })
                  }
                />
              </>
            )}

            {comp.type === "graph" && (
              <>
                <p>Edit:</p>
                <input
                  type="text"
                  defaultValue={comp.config.data.map((d) => d.label).join(",")}
                  onBlur={(e) => {
                    const labels = e.target.value.split(",").map((x) => x.trim());
                    const values = comp.config.data.map((d) => d.value);
                    updateComponent(i, {
                      ...comp.config,
                      data: labels.map((l, idx) => ({ label: l, value: values[idx] || 0 })),
                    });
                  }}
                />
                <input
                  type="text"
                  defaultValue={comp.config.data.map((d) => d.value).join(",")}
                  onBlur={(e) => {
                    const values = e.target.value.split(",").map((x) => parseFloat(x));
                    const labels = comp.config.data.map((d) => d.label);
                    updateComponent(i, {
                      ...comp.config,
                      data: labels.map((l, idx) => ({ label: l, value: values[idx] || 0 })),
                    });
                  }}
                />
              </>
            )}
          </div>
        </div>
      ))}


    </div>
  );
}

export default App;
