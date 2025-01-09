class S2Grid {
  constructor(map, options = {}) {
    this.map = map;
    this.level = options.level || 2; // Default S2 level
    this.latitudeMax = 90;
    this.latitudeMin = -this.latitudeMax;
    this.longitudeMax = 180;
    this.longitudeMin = -this.longitudeMax;
    this.options = {
      color: options.color || 'rgba(255, 0, 0, 1)', // Default grid color
      redraw: options.redraw || 'move', // Default to redraw on move
    };
    this.sourceId = 's2-grid';
    this.gridLayerId = 's2-grid-layer';
    this.initialize();
  }

  initialize() {
    // Add a GeoJSON source for the grid
    this.map.addSource(this.sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }, // Placeholder data
    });

    // Add a layer to render the grid
    this.map.addLayer({
      id: this.gridLayerId,
      source: this.sourceId,
      type: 'fill',
      layout: {},
      paint: {
        'fill-color': 'transparent', // Transparent fill
        'fill-opacity': 1,
        'fill-outline-color': this.options.color,
      },
    });

    // Redraw the grid on map movements or zoom changes
    this.map.on(this.options.redraw, () => this.updateGrid());
    this.updateGrid(); // Initial draw
  }

  updateGrid() {
    const bounds = this.map.getBounds();
    const newGrid = this.generateGrid(
      bounds.getSouth(),
      bounds.getWest(),
      bounds.getNorth(),
      bounds.getEast()
    );

    const source = this.map.getSource(this.sourceId);
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: newGrid,
      });
    }
  }

  generateCell(lat, lng) {
    const latLng = S2.L.LatLng(lat, lng);
    console.log(latLng)
    s2_cell = S2.S2Cell.FromLatLng(latLng, this.level);
    return s2_cell
  }

  generateGrid(minLat, minLng, maxLat, maxLng) {
    const cells = [];
    const step = 1 / Math.pow(2, this.level); // Approximate step size based on level

    for (let lat = minLat; lat <= maxLat; lat += step) {
      for (let lng = minLng; lng <= maxLng; lng += step) {
        const cell = this.generateCell(lat, lng);
        cells.push(cell);
      }
    }

    return cells.map((cell) => {
      const vertices = this.getCellVertices(cell);
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [vertices],
        },
        properties: {
          id: cell.id,
        },
      };
    });
  }

  /**
   * Get the vertices of an S2 cell as [lat, lng] coordinates.
   * @param {Object} cell S2Cell object.
   * @returns {Array} Array of [lng, lat] pairs.
   */
  getCellVertices(cell) {
    const vertices = [];
    for (let i = 0; i < 4; i++) {
      const xyz = S2.FaceUVToXYZ(cell.face, cell.getVertexUV(i));
      const latLng = S2.XYZToLatLng(xyz);
      vertices.push([latLng.lat, latLng.lng]);
    }
    // Close the polygon by repeating the first vertex
    vertices.push(vertices[0]);
    return vertices;
  }
}

export default S2Grid;
