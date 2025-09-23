import React from 'react';
import Plot from 'react-plotly.js';

// Interface matching the Python plotly data structure from get_ladder
interface LadderData {
  'Minutes the from Start of the Night': number;
  'human_starname': string;
  'Starname': string;
  'First Available': number;
  'Last Available': number;
  'Exposure Time (min)': number;
  'N_shots': number;
  'Total Exp Time (min)': number;
  'Start Exposure': number;
  'Priority': number;
}

export interface LadderChartProps {
  ladder_data: LadderData[];
}

/**
 * React component that recreates the get_ladder functionality from Python
 * Creates an interactive plot illustrating the telescope observation solution
 * showing when each target is accessible and when observations are scheduled
 */
export const LadderChart: React.FC<LadderChartProps> = ({ ladder_data }) => {
  // Color mapping for priorities
  const colorDict: Record<string, string> = {
    '10': 'red',
    '9': 'tomato',
    '8': 'darkorange',
    '7': 'gold',
    '6': 'olive',
    '5': 'green',
    '4': 'cyan',
    '3': 'darkviolet',
    '2': 'magenta',
    '1': 'blue'
  };

  // Reverse the order so the plot flows from top to bottom with time
  const reversedData = [...ladder_data].reverse();

  // Create scatter plot for the base
  const scatterData = {
    x: reversedData.map(d => d['Minutes the from Start of the Night']),
    y: reversedData.map(d => d['human_starname']),
    mode: 'markers' as const,
    type: 'scatter' as const,
    marker: {
      opacity: 0 // Hide markers, we only want the shapes
    },
    hovertemplate: 
      '<b>%{y}</b><br>' +
      'Time: %{x} min<br>' +
      'First Available: %{customdata[0]}<br>' +
      'Last Available: %{customdata[1]}<br>' +
      'Exposure Time: %{customdata[2]} min<br>' +
      'N_shots: %{customdata[3]}<br>' +
      'Total Exp Time: %{customdata[4]} min<br>' +
      '<extra></extra>',
    customdata: reversedData.map(d => [
      d['First Available'],
      d['Last Available'], 
      d['Exposure Time (min)'],
      d['N_shots'],
      d['Total Exp Time (min)']
    ]),
    showlegend: false
  };

  // Create shapes for rectangles - this recreates the Python logic
  const shapes: any[] = [];
  const processed = new Set<string>();
  let rowAdjustment = 0;

  reversedData.forEach((item) => {
    const starname = item.Starname;
    
    if (!processed.has(starname)) {
      // Find all visits for this star (equivalent to Python's indices logic)
      const starVisits = reversedData
        .map((d, index) => ({ ...d, rowIndex: index }))
        .filter(d => d.Starname === starname);

      // Add rectangles for each visit of this star
      starVisits.forEach(visit => {
        const x0 = visit['Start Exposure'];
        const expTime = visit['Total Exp Time (min)'];
        const y0 = visit.rowIndex + rowAdjustment;
        const priority = visit.Priority.toString();
        const color = colorDict[priority] || 'gray';

        // Add exposure rectangle (colored by priority)
        shapes.push({
          type: 'rect',
          x0: x0,
          x1: x0 + expTime,
          y0: y0 - 0.5,
          y1: y0 + 0.5,
          fillcolor: color,
          line: { width: 0 },
          layer: 'above'
        });
      });

      // Add accessibility rectangle only once per star (matches Python logic)
      const firstVisit = starVisits[0];
      const xFirstAvailable = firstVisit['First Available'];
      const xLastAvailable = firstVisit['Last Available'];
      
      shapes.push({
        type: 'rect',
        x0: xFirstAvailable,
        x1: xLastAvailable,
        y0: firstVisit.rowIndex + rowAdjustment - 0.5,
        y1: firstVisit.rowIndex + rowAdjustment + 0.5,
        fillcolor: 'lime',
        opacity: 0.3,
        line: { width: 0 },
        layer: 'below'
      });

      processed.add(starname);
    } else {
      // Multi-visit star adjustment (matches Python's ifixer logic)
      rowAdjustment -= 1;
    }
  });

  // Create legend traces (invisible points outside plot area for legend)
  const legendTraces = [
    {
      x: [-100],
      y: [-0.5],
      mode: 'markers' as const,
      type: 'scatter' as const,
      marker: { color: 'red', size: 10 },
      name: 'Expose P1',
      showlegend: true
    },
    {
      x: [-100],
      y: [-0.5],
      mode: 'markers' as const,
      type: 'scatter' as const,
      marker: { color: 'blue', size: 10 },
      name: 'Expose P3',
      showlegend: true
    },
    {
      x: [-100],
      y: [-0.5],
      mode: 'markers' as const,
      type: 'scatter' as const,
      marker: { color: 'lime', size: 10 },
      name: 'Accessible',
      showlegend: true
    }
  ];

  // Calculate x-axis range
  const maxTime = Math.max(
    ...reversedData.map(d => d['Start Exposure'] + d['Total Exp Time (min)'])
  );

  const layout = {
    title: 'Night Plan',
    width: 800,
    height: 1000,
    xaxis: {
      title: 'Minutes from Start of Night',
      range: [0, maxTime],
      showgrid: true,
      gridcolor: 'lightgray'
    },
    yaxis: {
      title: '',
      showgrid: false,
      zeroline: false
    },
    shapes: shapes,
    hovermode: 'closest' as const,
    showlegend: true,
    legend: {
      x: 1,
      y: 1,
      bgcolor: 'rgba(255,255,255,0.8)',
      bordercolor: 'black',
      borderwidth: 1
    },
    plot_bgcolor: 'white',
    paper_bgcolor: 'white'
  };

  return (
    <Plot
      data={[scatterData, ...legendTraces]}
      layout={layout}
      config={{
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
      }}
    />
  );
};