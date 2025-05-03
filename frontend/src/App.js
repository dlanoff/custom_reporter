// App.js  (split‑screen Material‑UI version)
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  MenuItem,
  Divider,
  Grid,
} from "@mui/material";
import {
  ArrowUpward,
  ArrowDownward,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  NoteAdd as NewIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function App() {
  // ─── state ────────────────────────────────────────────────────────────────
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
  const [originalName, setOriginalName] = useState("")


  // ─── helpers ──────────────────────────────────────────────────────────────
  const updateComponent = (i, cfg) => {
    const next = [...components];
    next[i].config = cfg;
    setComponents(next);
  };
  const moveComponent = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= components.length) return;
    const next = [...components];
    [next[i], next[j]] = [next[j], next[i]];
    setComponents(next);
  };
  const deleteComponent = (index) => {
    const updated = components.filter((_, i) => i !== index);
    setComponents(updated);
  };
  const resetBuilder = () => {
    setLayoutName("");
    setComponents([]);
    setEditMode(false);
    setMessage("");
  };

  // ─── fetch saved layouts ─────────────────────────────────────────────
  const loadLayouts = () => {
    fetch("http://localhost:8000/layouts")
      .then(r => r.json())
      .then(setAvailableLayouts);
  };

  useEffect(() => {
    loadLayouts();
  }, []);

  // ─── add‑block actions (text / image / table / graph) ─────────────────────
  const addTextBlock = () => {
    if (!blockText.trim()) return;
    setComponents((c) => [
      ...c,
      { type: "text", position: c.length, config: { data: blockText } },
    ]);
    setBlockText("");
  };
  const handleImageUpload = (e) => setImageFile(e.target.files[0]);
  const addImageBlock = () => {
    if (!imageFile) return;
    const reader = new FileReader();
    reader.onloadend = () =>
      setComponents((c) => [
        ...c,
        { type: "image", position: c.length, config: { data: reader.result } },
      ]);
    reader.readAsDataURL(imageFile);
    setImageFile(null);
  };
  const addTableBlock = () => {
    const headers = tableHeaders.split(",").map((h) => h.trim());
    const rows = tableRows
      .split("\n")
      .filter(Boolean)
      .map((l) => l.split(",").map((c) => c.trim()));
    if (!headers.length || !rows.length) return;
    setComponents((c) => [
      ...c,
      { type: "table", position: c.length, config: { headers, rows } },
    ]);
    setTableHeaders("");
    setTableRows("");
  };
  const addGraphBlock = () => {
    const labels = graphLabels.split(",").map((l) => l.trim());
    const values = graphValues.split(",").map((v) => parseFloat(v));
    if (!labels.length || !values.length) return;
    const data = labels.map((label, i) => ({ label, value: values[i] || 0 }));
    setComponents((c) => [
      ...c,
      { type: "graph", position: c.length, config: { type: graphType, data } },
    ]);
    setGraphLabels("");
    setGraphValues("");
  };

  // ─── persistence ──────────────────────────────────────────────────────────
  const submitLayout = async () => {
    const isNew = !editMode || layoutName !== originalName;
    const payload = {
      name: layoutName,
      components: components.map((c, i) => ({ ...c, position: i })),
    };

    const response = await fetch(
      isNew
        ? "http://localhost:8000/layouts/"
        : `http://localhost:8000/layouts/${layoutName}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    setMessage(response.ok ? "Layout saved!" : `Error: ${data.detail}`);

    if (response.ok) {
      setEditMode(true);
      setOriginalName(layoutName); // track new name
      loadLayouts()
    }
  };
  const randomizeLayout = async () => {
    const r = await fetch("http://localhost:8000/sample-layout");
    const l = await r.json();
    setLayoutName(l.name);
    setComponents(l.components);
    setEditMode(false);
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* header */}
      {layoutName && (
        <Box textAlign="center" sx={{ mb: 3 }}>
          <Typography variant="h4">Editing Layout:</Typography>
          <Typography variant="h4" color="primary">
            {layoutName}
          </Typography>
          <Button
            variant="outlined"
            href={`/view/${encodeURIComponent(layoutName)}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mt: 1 }}
          >
            View Live
          </Button>
          <Button
            variant="outlined"
            onClick={submitLayout}
            sx={{ mt: 1 }}
          >
            Save
          </Button>
        </Box>

      )}

      <Divider sx={{ mb: 3 }} />

      {/* split screen */}
      <Grid container spacing={4}>
        {/* ─── left: controls ─────────────────────────────────────────────── */}
        <Grid item xs={12} md={5} lg={4}>
          {/* Saved layouts */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3, maxHeight: 180, overflow: "auto" }}>
            <Typography variant="subtitle1">Saved Layouts</Typography>
            {availableLayouts.map((name) => (
              <Stack
                key={name}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ py: 0.5 }}
              >
                <Typography
                  sx={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={async () => {
                    const r = await fetch(`http://localhost:8000/layouts/${name}`);
                    const d = await r.json();
                    setLayoutName(d.name);
                    setComponents(d.components);
                    setEditMode(true);
                  }}
                >
                  {name}
                </Typography>
                <Box>
                  <IconButton size="small" onClick={async () => {
                    const r = await fetch(`http://localhost:8000/layouts/${name}`);
                    const d = await r.json();
                    setLayoutName(d.name);
                    setComponents(d.components);
                    setEditMode(true);
                  }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={async () => {
                    if (!window.confirm(`Delete layout "${name}"?`)) return;
                    await fetch(`http://localhost:8000/layouts/${name}`, { method: "DELETE" });
                    setAvailableLayouts((p) => p.filter((n) => n !== name));
                    if (layoutName === name) resetBuilder();
                  }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Stack>
            ))}
          </Paper>

          {/* meta + quick actions */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 3 }}>
            <TextField
              label="Layout name"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              fullWidth
            />
            <Button variant="contained" startIcon={<SaveIcon />} onClick={submitLayout}>
              Save
            </Button>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={randomizeLayout}>
              Sample
            </Button>
            <Button variant="outlined" startIcon={<NewIcon />} onClick={resetBuilder}>
              New
            </Button>
          </Stack>

          {/* add‑block controls */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add Blocks
            </Typography>

            {/* text */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                label="Text"
                value={blockText}
                onChange={(e) => setBlockText(e.target.value)}
                fullWidth
              />
              <Button variant="contained" startIcon={<AddIcon />} onClick={addTextBlock}>
                Text
              </Button>
            </Stack>

            {/* image */}
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button variant="outlined" component="label">
                Upload Image
                <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                disabled={!imageFile}
                onClick={addImageBlock}
              >
                Image
              </Button>
            </Stack>

            {/* table */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2">Table</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                label="Headers"
                value={tableHeaders}
                onChange={(e) => setTableHeaders(e.target.value)}
                fullWidth
              />
            </Stack>
            <TextField
              label="Rows (CSV, one per line)"
              multiline
              rows={3}
              value={tableRows}
              onChange={(e) => setTableRows(e.target.value)}
              fullWidth
              sx={{ mb: 1 }}
            />
            <Button variant="contained" fullWidth onClick={addTableBlock}>
              Add Table
            </Button>

            {/* graph */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2">Graph</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <TextField
                select
                label="Type"
                value={graphType}
                onChange={(e) => setGraphType(e.target.value)}
                sx={{ width: 110 }}
              >
                <MenuItem value="bar">Bar</MenuItem>
                <MenuItem value="line">Line</MenuItem>
              </TextField>
              <TextField
                label="Labels"
                value={graphLabels}
                onChange={(e) => setGraphLabels(e.target.value)}
                fullWidth
              />
              <TextField
                label="Values"
                value={graphValues}
                onChange={(e) => setGraphValues(e.target.value)}
                fullWidth
              />
            </Stack>
            <Button variant="contained" fullWidth onClick={addGraphBlock}>
              Add Graph
            </Button>
          </Paper>
        </Grid>
        <Divider
          orientation="vertical"
          flexItem
          sx={{ borderRightWidth: 3, mx: 2, bgcolor: "grey.400" }}
        />
        {/* ─── right: live preview ─────────────────────────────────────────── */}
        <Grid item xs={12} md={7} lg={8}>
          <Typography variant="h5" gutterBottom>
            Live Preview
          </Typography>

          {components.map((comp, i) => (
            <Paper
              key={i}
              variant="outlined"
              sx={{ mb: 2, p: 2, display: "flex", gap: 2 }}
            >
              {/* reorder buttons */}
              <Stack spacing={1} alignItems="center">
                <IconButton onClick={() => moveComponent(i, -1)} size="small">
                  <ArrowUpward fontSize="small" />
                </IconButton>
                <IconButton onClick={() => moveComponent(i, 1)} size="small">
                  <ArrowDownward fontSize="small" />
                </IconButton>
                <IconButton onClick={() => deleteComponent(i)} size="small" color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>

              {/* block content */}
              <Box sx={{ flexGrow: 1 }}>
                {comp.type === "text" && (
                  <TextField
                    multiline
                    fullWidth
                    value={comp.config.data}
                    onChange={(e) => updateComponent(i, { data: e.target.value })}
                  />
                )}

                {comp.type === "image" && (
                  <Box>
                    <img src={comp.config.data} alt="block" style={{ maxWidth: "100%" }} />
                    <Typography variant="caption" color="text.secondary">
                      Replace by deleting &amp; re‑adding
                    </Typography>
                  </Box>
                )}

                {comp.type === "table" && (
                  <>
                    <Table size="small" sx={{ mb: 1 }}>
                      <TableHead>
                        <TableRow>
                          {comp.config.headers.map((h) => (
                            <TableCell key={h}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {comp.config.rows.map((row, ri) => (
                          <TableRow key={ri}>
                            {row.map((cell, ci) => (
                              <TableCell key={ci}>{cell}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        label="Headers"
                        defaultValue={comp.config.headers.join(",")}
                        onChange={(e) =>
                          updateComponent(i, {
                            ...comp.config,
                            headers: e.target.value.split(",").map((s) => s.trim()),
                          })
                        }
                        fullWidth
                      />
                      <TextField
                        label="Rows"
                        defaultValue={comp.config.rows.map((r) => r.join(",")).join("\n")}
                        multiline
                        rows={3}
                        onBlur={(e) =>
                          updateComponent(i, {
                            ...comp.config,
                            rows: e.target.value
                              .split("\n")
                              .map((l) => l.split(",").map((s) => s.trim())),
                          })
                        }
                        fullWidth
                      />
                    </Stack>
                  </>
                )}

                {comp.type === "graph" && (
                  <>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <TextField
                        label="Labels"
                        defaultValue={comp.config.data.map((d) => d.label).join(",")}
                        onBlur={(e) => {
                          const labels = e.target.value.split(",").map((s) => s.trim());
                          const values = comp.config.data.map((d) => d.value);
                          updateComponent(i, {
                            ...comp.config,
                            data: labels.map((l, idx) => ({
                              label: l,
                              value: values[idx] || 0,
                            })),
                          });
                        }}
                        fullWidth
                      />
                      <TextField
                        label="Values"
                        defaultValue={comp.config.data.map((d) => d.value).join(",")}
                        onBlur={(e) => {
                          const values = e.target.value.split(",").map((v) => parseFloat(v));
                          const labels = comp.config.data.map((d) => d.label);
                          updateComponent(i, {
                            ...comp.config,
                            data: labels.map((l, idx) => ({
                              label: l,
                              value: values[idx] || 0,
                            })),
                          });
                        }}
                        fullWidth
                      />
                    </Stack>
                    <Box sx={{ width: "100%", maxWidth: 480, height: 260 }}>
                      {comp.config.type === "bar" ? (
                        <BarChart width={480} height={260} data={comp.config.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      ) : (
                        <LineChart width={480} height={260} data={comp.config.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#8884d8" />
                        </LineChart>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </Paper>
          ))}

          {message && (
            <Typography
              sx={{ mt: 2 }}
              color={message.startsWith("Error") ? "error" : "success.main"}
            >
              {message}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Container>
  );
}
