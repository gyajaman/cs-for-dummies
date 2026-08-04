// Deterministic layered ("Sugiyama-style") layout for the prerequisite DAG.
// No layout library: longest-path ranking (Kahn's algorithm) assigns each
// node to a column. Rows are organized as fixed swim lanes, one per track,
// stacked in TRACK_ORDER and stacked in the same vertical range in every
// column — so a track's nodes always live in the same horizontal band
// wherever they fall on the x-axis, instead of drifting column to column.
// Within a track's band, barycenter sweeps still reorder nodes to reduce
// edge crossings against the adjacent columns. Positions are the geometric
// center of each node's card.

const CARD_WIDTH = 220;
const CARD_HEIGHT = 64;
const RANK_SPACING = 300; // column-to-column (x) spacing
const NODE_SPACING = 104; // row-to-row (y) spacing within a column
const BAND_GAP_ROWS = 1.1; // extra vertical gap between track lanes, in row units
const BARYCENTER_SWEEPS = 8;
const TRACK_ORDER = ["math", "c", "ds", "algo"];

export function computeLayout(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const children = new Map(nodes.map((n) => [n.id, []]));
  for (const n of nodes) {
    for (const p of n.prereqs) {
      if (!children.has(p)) {
        throw new Error(`layout: node ${n.id} references unknown prereq ${p}`);
      }
      children.get(p).push(n.id);
    }
  }

  const rank = rankByLongestPath(nodes, children);
  const maxRank = Math.max(0, ...nodes.map((n) => rank.get(n.id)));

  const layers = Array.from({ length: maxRank + 1 }, () => []);
  for (const n of nodes) layers[rank.get(n.id)].push(n.id);

  // Deterministic initial order: by track (fixed lane order), then id.
  for (const layer of layers) {
    layer.sort((a, b) => {
      const ta = TRACK_ORDER.indexOf(byId.get(a).track);
      const tb = TRACK_ORDER.indexOf(byId.get(b).track);
      return ta === tb ? a.localeCompare(b) : ta - tb;
    });
  }

  const { bandStart, bandHeight, totalRows } = computeBands(layers, byId);
  const rowOf = (layer, id) => rowWithinLayer(layer, id, byId, bandStart, bandHeight);

  reduceCrossings(layers, byId, children, rank, rowOf);

  const positions = new Map();
  layers.forEach((layer, li) => {
    for (const id of layer) {
      positions.set(id, {
        x: li * RANK_SPACING + CARD_WIDTH / 2,
        y: rowOf(layer, id) * NODE_SPACING + CARD_HEIGHT / 2,
        rank: li,
      });
    }
  });

  return {
    positions,
    width: maxRank * RANK_SPACING + CARD_WIDTH,
    height: (totalRows - 1) * NODE_SPACING + CARD_HEIGHT,
    cardWidth: CARD_WIDTH,
    cardHeight: CARD_HEIGHT,
  };
}

function computeBands(layers, byId) {
  const bandHeight = Object.fromEntries(TRACK_ORDER.map((t) => [t, 1]));
  for (const layer of layers) {
    const counts = {};
    for (const id of layer) {
      const t = byId.get(id).track;
      counts[t] = (counts[t] || 0) + 1;
    }
    for (const t of TRACK_ORDER) bandHeight[t] = Math.max(bandHeight[t], counts[t] || 0);
  }

  const bandStart = {};
  let cursor = 0;
  for (const t of TRACK_ORDER) {
    bandStart[t] = cursor;
    cursor += bandHeight[t] + BAND_GAP_ROWS;
  }
  cursor -= BAND_GAP_ROWS; // no trailing gap after the last band

  return { bandStart, bandHeight, totalRows: cursor };
}

// A node's row is its band's start, plus a centering offset when this
// column has fewer nodes in the track than the band is tall, plus its
// index within the column's same-track nodes (which barycenter sweeps
// reorder).
function rowWithinLayer(layer, id, byId, bandStart, bandHeight) {
  const track = byId.get(id).track;
  const sameTrack = layer.filter((x) => byId.get(x).track === track);
  const index = sameTrack.indexOf(id);
  const offset = (bandHeight[track] - sameTrack.length) / 2;
  return bandStart[track] + offset + index;
}

function rankByLongestPath(nodes, children) {
  const rank = new Map(nodes.map((n) => [n.id, 0]));
  const remaining = new Map(nodes.map((n) => [n.id, n.prereqs.length]));
  let frontier = nodes
    .filter((n) => n.prereqs.length === 0)
    .map((n) => n.id)
    .sort();
  let processed = 0;

  while (frontier.length) {
    frontier.sort();
    const next = [];
    for (const id of frontier) {
      processed++;
      for (const child of children.get(id)) {
        rank.set(child, Math.max(rank.get(child), rank.get(id) + 1));
        remaining.set(child, remaining.get(child) - 1);
        if (remaining.get(child) === 0) next.push(child);
      }
    }
    frontier = next;
  }

  if (processed !== nodes.length) {
    throw new Error(
      "layout: graph.json has a cycle (validate_graph.py should have caught this first)"
    );
  }

  return rank;
}

function reduceCrossings(layers, byId, children, rank, rowOf) {
  const rowMapOf = (layer) => {
    const m = new Map();
    for (const id of layer) m.set(id, rowOf(layer, id));
    return m;
  };

  const sweep = (downward) => {
    const rowMaps = layers.map(rowMapOf);
    const indices = downward
      ? layers.map((_, i) => i).slice(1)
      : layers
          .map((_, i) => i)
          .slice(0, -1)
          .reverse();

    for (const li of indices) {
      const neighborRank = downward ? li - 1 : li + 1;
      const neighborRows = rowMaps[neighborRank];
      const scored = layers[li].map((id) => {
        const neighborIds = downward ? byId.get(id).prereqs : children.get(id);
        const relevant = neighborIds.filter((nb) => rank.get(nb) === neighborRank);
        const barycenter = relevant.length
          ? relevant.reduce((sum, nb) => sum + neighborRows.get(nb), 0) / relevant.length
          : rowMaps[li].get(id);
        return { id, barycenter, track: TRACK_ORDER.indexOf(byId.get(id).track) };
      });
      scored.sort((a, b) => a.track - b.track || a.barycenter - b.barycenter || a.id.localeCompare(b.id));
      layers[li] = scored.map((s) => s.id);
      rowMaps[li] = rowMapOf(layers[li]);
    }
  };

  for (let i = 0; i < BARYCENTER_SWEEPS; i++) sweep(i % 2 === 0);
}
