import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './Footer';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Animation variants
const panelVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Optimized color palette for maximum distinction
const colorPalette = {
  vibrant: [
    '#1E3A8A', '#B91C1C', '#15803D', '#B45309', '#6B21A8',
    '#BE185D', '#0F766E', '#C2410C', '#4B5563', '#0891B2',
    '#A21CAF', '#4D7C0F', '#BE123C', '#0284C7', '#65A30D',
    '#7C3AED', '#EA580C', '#047857', '#6D28D9', '#D97706',
  ],
  pastel: [
    '#BFDBFE', '#FECACA', '#BBF7D0', '#FEE08B', '#D8B4FE',
    '#F9A8D4', '#99F6E4', '#FED7AA', '#E2E8F0', '#A5F3FC',
    '#F5D0FE', '#D9F99D', '#FDA4AF', '#BAE6FD', '#ECFCCB',
    '#DDD6FE', '#FFEDD5', '#A7F3D0', '#C7D2FE', '#FEF3C7',
  ],
  gradient: (index, count) => {
    const startHue = (index * 137.5) % 360;
    const endHue = ((index + 1) * 137.5) % 360;
    return `linear-gradient(135deg, hsla(${startHue}, 85%, 40%, 0.95) 0%, hsla(${endHue}, 75%, 60%, 0.85) 100%)`;
  },
};

// Dynamic color generator
const generateDynamicColors = (count, chartType, theme = 'vibrant') => {
  const colors = [];
  const isArcChart = chartType === 'pie' || chartType === 'doughnut';
  const baseColors = theme === 'vibrant' ? colorPalette.vibrant : colorPalette.pastel;

  for (let i = 0; i < count; i++) {
    if (theme === 'gradient' && isArcChart) {
      colors.push(colorPalette.gradient(i, count));
    } else if (i < baseColors.length) {
      colors.push(baseColors[i]);
    } else {
      const hue = (i * 137.5) % 360;
      const saturation = 70 + (i % 4) * 10;
      const lightness = 40 + (i % 3) * 15;
      colors.push(`hsla(${hue}, ${saturation}%, ${lightness}%, 0.95)`);
    }
  }
  return colors;
};

function Analytics() {
  const { uploadId } = useParams();
  const [uploadData, setUploadData] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [filters, setFilters] = useState({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [headerRowError, setHeaderRowError] = useState('');
  const [selectedHeaderRow, setSelectedHeaderRow] = useState('0');
  const [isCustomRowInputVisible, setIsCustomRowInputVisible] = useState(false);
  const [customRowInput, setCustomRowInput] = useState('');
  const [colorTheme, setColorTheme] = useState('vibrant');
  const [statsScope, setStatsScope] = useState('entire');
  const chartRef = useRef(null);
  const token = localStorage.getItem('token');

  // Fetch upload data
  useEffect(() => {
    const fetchUploadData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`http://127.0.0.1:5000/api/uploads/${uploadId}`, {
          headers: { Authorization: token },
        });
        setUploadData(data);
        setXAxis('');
        setYAxis('');
      } catch (err) {
        console.error('Failed to fetch upload data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUploadData();
  }, [uploadId, token]);

  // Auto-select X/Y axis
  useEffect(() => {
    if (uploadData?.data && headerRowIndex !== null && (!xAxis || !yAxis)) {
      const headers = uploadData.data[headerRowIndex] || [];
      const dataRows = uploadData.data.slice(headerRowIndex + 1);
      if (headers.length > 0) {
        const firstTextCol =
          headers.find((_, i) => dataRows.some(row => isNaN(parseFloat(row[i])) && row[i] !== null && row[i] !== '')) ||
          headers[0];
        const firstNumCol =
          headers.find((_, i) => dataRows.every(row => !isNaN(parseFloat(row[i])) && row[i] !== null && row[i] !== '')) ||
          headers[1] ||
          headers[0];
        setXAxis(firstTextCol);
        setYAxis(firstNumCol);
      }
    }
  }, [uploadData, headerRowIndex, xAxis, yAxis]);

  // Memoized headers
  const headers = useMemo(() => {
    return uploadData?.data && Array.isArray(uploadData.data) && uploadData.data.length > headerRowIndex
      ? uploadData.data[headerRowIndex]
      : [];
  }, [uploadData, headerRowIndex]);

  // Detect column types
  const columnTypes = useMemo(() => {
    if (!uploadData?.data || headerRowIndex >= uploadData.data.length) return {};
    const types = {};
    const dataRows = uploadData.data.slice(headerRowIndex + 1);
    const numericThreshold = 0.9;
    headers.forEach((header, i) => {
      const validRows = dataRows.filter(row => row[i] !== null && row[i] !== '');
      if (validRows.length === 0) {
        types[header] = 'text';
        return;
      }
      const numericCount = validRows.reduce((count, row) => {
        return count + (!isNaN(parseFloat(row[i])) && isFinite(parseFloat(row[i])) ? 1 : 0);
      }, 0);
      const numericRatio = numericCount / validRows.length;
      types[header] = numericRatio >= numericThreshold ? 'number' : 'text';
    });
    return types;
  }, [uploadData, headers, headerRowIndex]);

  // Debounced global search
  const debouncedSetGlobalSearch = debounce((value) => {
    setGlobalSearch(value);
    setCurrentPage(1);
  }, 300);

  // Filter data
  const filteredData = useMemo(() => {
    if (!uploadData?.data || headerRowIndex >= uploadData.data.length) return [];
    let dataRows = uploadData.data.slice(headerRowIndex + 1);

    if (globalSearch) {
      dataRows = dataRows.filter(row =>
        row.some(cell => String(cell).toLowerCase().includes(globalSearch.toLowerCase()))
      );
    }

    if (Object.keys(filters).length > 0) {
      Object.keys(filters).forEach(column => {
        const colIndex = headers.indexOf(column);
        if (colIndex !== -1) {
          const { value, max } = filters[column];
          if (columnTypes[column] === 'text' && value) {
            dataRows = dataRows.filter(row => String(row[colIndex]).toLowerCase().includes(value.toLowerCase()));
          } else if (columnTypes[column] === 'number' && (value || max)) {
            dataRows = dataRows.filter(row => {
              const cellValue = parseFloat(row[colIndex]);
              const min = value ? parseFloat(value) : -Infinity;
              const maxVal = max ? parseFloat(max) : Infinity;
              return !isNaN(cellValue) && isFinite(cellValue) && cellValue >= min && cellValue <= maxVal;
            });
          }
        }
      });
    }

    return dataRows;
  }, [uploadData, globalSearch, filters, headers, columnTypes, headerRowIndex]);

  // Paginated data
  const paginatedData = useMemo(() => {
    if (rowsPerPage === 'all') {
      return filteredData;
    }
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, rowsPerPage]);

  // Total pages
  const totalPages = useMemo(() => {
    if (rowsPerPage === 'all') {
      return 1;
    }
    return Math.ceil(filteredData.length / rowsPerPage);
  }, [filteredData, rowsPerPage]);

  // Aggregate data for charts
  const aggregateData = useMemo(() => {
    if (!xAxis || !yAxis || paginatedData.length === 0 || headers.length === 0) return null;
    const xIndex = headers.indexOf(xAxis);
    const yIndex = headers.indexOf(yAxis);
    if (xIndex === -1 || yIndex === -1) return null;

    if (columnTypes[yAxis] === 'text') {
      const groups = {};
      paginatedData.forEach(row => {
        const xVal = String(row[xIndex]).trim() || 'Unknown';
        const yVal = String(row[yIndex]).trim() || 'Unknown';
        if (!groups[xVal]) groups[xVal] = {};
        groups[xVal][yVal] = (groups[xVal][yVal] || 0) + 1;
      });
      return groups;
    } else {
      const groups = {};
      paginatedData.forEach(row => {
        const xVal = String(row[xIndex]).trim() || 'Unknown';
        const yVal = parseFloat(row[yIndex]);
        if (!isNaN(yVal)) {
          if (!groups[xVal]) groups[xVal] = { sum: 0, count: 0 };
          groups[xVal].sum += yVal;
          groups[xVal].count += 1;
        }
      });
      return groups;
    }
  }, [paginatedData, xAxis, yAxis, headers, columnTypes]);

  // Chart data
  const chartData = useMemo(() => {
    if (!xAxis || !yAxis || paginatedData.length === 0 || headers.length === 0 || !aggregateData) {
      return {
        labels: ['No Data'],
        datasets: [{ label: 'No Data', data: [1], backgroundColor: 'rgba(200,200,200,0.2)' }],
      };
    }

    const xValues = Object.keys(aggregateData);
    const isArcChart = chartType === 'pie' || chartType === 'doughnut';
    const isYText = columnTypes[yAxis] === 'text';

    if (isYText) {
      const allYValues = new Set();
      Object.values(aggregateData).forEach(group => {
        Object.keys(group).forEach(yVal => allYValues.add(yVal));
      });
      const yValues = Array.from(allYValues);

      const datasets = yValues.map((yVal, i) => {
        const data = xValues.map(xVal => aggregateData[xVal][yVal] || 0);
        const colors = generateDynamicColors(yValues.length, chartType, colorTheme);
        return {
          label: yVal,
          data,
          backgroundColor: colors[i],
          borderColor: colors[i].replace('0.95', '1'),
          borderWidth: isArcChart ? 2 : chartType === 'line' ? 3 : 1,
          borderRadius: chartType === 'bar' ? 8 : 0,
          tension: chartType === 'line' || chartType === 'area' ? 0.4 : 0,
          fill: chartType === 'area' ? true : false,
          pointBackgroundColor: '#fff',
          pointBorderColor: colorPalette.vibrant[i % colorPalette.vibrant.length],
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8,
        };
      });

      return { labels: xValues, datasets };
    } else {
      const data = xValues.map(xVal => {
        const group = aggregateData[xVal];
        return group.count > 0 ? group.sum / group.count : 0;
      });

      const colors = generateDynamicColors(isArcChart ? xValues.length : 1, chartType, colorTheme);
      return {
        labels: xValues,
        datasets: [
          {
            label: `${yAxis} (Avg)`,
            data,
            backgroundColor: isArcChart ? colors : colors[0],
            borderColor: isArcChart ? colors.map(c => c.replace('0.95', '1')) : colors[0].replace('0.95', '1'),
            borderWidth: isArcChart ? 2 : chartType === 'line' ? 3 : 1,
            borderRadius: chartType === 'bar' ? 8 : 0,
            tension: chartType === 'line' || chartType === 'area' ? 0.4 : 0,
            fill: chartType === 'area' ? true : false,
            pointBackgroundColor: '#fff',
            pointBorderColor: colorPalette.vibrant[0],
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8,
          },
        ],
      };
    }
  }, [paginatedData, xAxis, yAxis, chartType, headers, columnTypes, aggregateData, colorTheme]);

  // Chart options
  const chartOptions = useMemo(() => {
    const isYText = columnTypes[yAxis] === 'text';
    const isArcChart = chartType === 'pie' || chartType === 'doughnut';
    const maxDataValue = chartData.datasets[0]?.data
      ? Math.max(...chartData.datasets.flatMap(ds => ds.data.filter(val => !isNaN(val) && isFinite(val))))
      : 10;
    const dynamicMax = maxDataValue > 0 ? maxDataValue + maxDataValue * 0.1 : 10;

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#fff',
            font: { size: 16, family: 'Inter', weight: 500 },
            padding: 20,
            usePointStyle: true,
            boxWidth: 10,
          },
        },
        title: {
          display: true,
          text: isYText
            ? `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart – ${yAxis} Distribution by ${xAxis} (${rowsPerPage === 'all' ? 'All Rows' : 'Current Page'})`
            : `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart – ${yAxis} (Avg) by ${xAxis} (${rowsPerPage === 'all' ? 'All Rows' : 'Current Page'})`,
          color: '#fff',
          font: { size: 24, family: 'Inter', weight: 600 },
          padding: { top: 10, bottom: 20 },
        },
        tooltip: {
          enabled: true,
          mode: isArcChart ? 'nearest' : 'index',
          intersect: isArcChart,
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleFont: { size: 14, family: 'Inter', weight: 600 },
          bodyFont: { size: 12, family: 'Inter' },
          padding: 12,
          cornerRadius: 8,
          boxPadding: 6,
          borderColor: colorPalette.vibrant[0],
          borderWidth: 1,
          position: 'nearest',
          caretSize: 6,
          caretPadding: 10,
          callbacks: {
            label: function (context) {
              const label = context.label || 'Unknown';
              const value = isArcChart ? context.parsed : context.parsed.y;
              if (isYText) {
                return `${label}: ${value} occurrence${value === 1 ? '' : 's'}`;
              }
              return `${label}: ${value.toFixed(2)}`;
            },
            title: function (context) {
              if (context[0]) {
                return isArcChart ? context[0].label : `${xAxis}: ${context[0].label}`;
              }
              return 'Unknown';
            },
          },
        },
      },
      scales: {
        y: {
          display: !isArcChart,
          beginAtZero: true,
          min: 0,
          max: dynamicMax,
          ticks: {
            color: '#d1d5db',
            font: { size: 12, family: 'Inter' },
            stepSize: isYText ? 1 : undefined,
          },
          grid: { color: 'rgba(255, 255, 255, 0.1)', borderDash: [5, 5] },
          title: {
            display: isYText && !isArcChart,
            text: 'Count',
            color: '#fff',
            font: { size: 14, family: 'Inter', weight: 500 },
          },
        },
        x: {
          display: !isArcChart,
          ticks: {
            color: '#d1d5db',
            font: { size: 12, family: 'Inter' },
            display: !isArcChart && (filteredData.length <= 20 || (rowsPerPage !== 'all' && rowsPerPage <= 20)),
          },
          grid: { display: false },
        },
      },
      interaction: {
        mode: isArcChart ? 'nearest' : 'index',
        intersect: isArcChart,
        axis: isArcChart ? undefined : 'x',
      },
      elements: {
        arc: {
          borderWidth: isArcChart ? 2 : 1,
          hoverBorderWidth: isArcChart ? 3 : 1,
          hoverOffset: isArcChart ? 12 : 0,
        },
      },
      animation: { duration: 1200, easing: 'easeOutQuart' },
      hover: { mode: isArcChart ? 'nearest' : 'index', intersect: isArcChart },
    };
  }, [chartData, chartType, xAxis, yAxis, columnTypes, filteredData, rowsPerPage]);

  // Descriptive stats
  const stats = useMemo(() => {
    if (!uploadData?.data || !yAxis || columnTypes[yAxis] === 'text') {
      return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
    }
    const yIndex = headers.indexOf(yAxis);
    const data = statsScope === 'entire' ? filteredData : paginatedData;
    const values = data.map(row => parseFloat(row[yIndex])).filter(val => !isNaN(val));
    if (values.length === 0) return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)];
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    return { min, max, mean, median, stdDev };
  }, [uploadData, yAxis, headers, columnTypes, filteredData, paginatedData, statsScope]);

  // AI-style summary
  const aiSummary = useMemo(() => {
    if (!xAxis || !yAxis || !paginatedData.length || !aggregateData) return '';
    const data = statsScope === 'entire' ? filteredData : paginatedData;
    if (columnTypes[yAxis] === 'text') {
      const valueCounts = {};
      data.forEach(row => {
        const xVal = String(row[headers.indexOf(xAxis)]).trim() || 'Unknown';
        const yVal = String(row[headers.indexOf(yAxis)]).trim() || 'Unknown';
        if (!valueCounts[yVal]) valueCounts[yVal] = 0;
        valueCounts[yVal] += 1;
      });
      const maxYValue = Object.keys(valueCounts).reduce(
        (max, val) => (valueCounts[val] > valueCounts[max] ? val : max),
        Object.keys(valueCounts)[0] || ''
      );
      return `🧠 Most frequent ${yAxis} value is "${maxYValue}" with ${valueCounts[maxYValue] || 0} occurrence${valueCounts[maxYValue] === 1 ? '' : 's'} in ${statsScope === 'entire' ? 'entire dataset' : 'current page'}.`;
    } else {
      const groups = {};
      data.forEach(row => {
        const xVal = String(row[headers.indexOf(xAxis)]).trim() || 'Unknown';
        const yVal = parseFloat(row[headers.indexOf(yAxis)]);
        if (!isNaN(yVal)) {
          if (!groups[xVal]) groups[xVal] = { sum: 0, count: 0 };
          groups[xVal].sum += yVal;
          groups[xVal].count += 1;
        }
      });
      let maxAvg = -Infinity;
      let maxXValue = '';
      Object.entries(groups).forEach(([xVal, data]) => {
        if (data.count > 0) {
          const avg = data.sum / data.count;
          if (avg > maxAvg) {
            maxAvg = avg;
            maxXValue = xVal;
          }
        }
      });
      return `🧠 Highest average ${yAxis} is ${maxAvg.toFixed(2)} for ${maxXValue} in ${statsScope === 'entire' ? 'entire dataset' : 'current page'}.`;
    }
  }, [stats, xAxis, yAxis, headers, columnTypes, filteredData, paginatedData, statsScope, aggregateData]);

  // Download chart
  const downloadChart = () => {
    if (chartRef.current) {
      const link = document.createElement('a');
      link.download = `chart-${chartType}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  // Export filtered data as CSV
  const exportCSV = () => {
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `filtered-data-${uploadId}.csv`;
    link.click();
  };

  // Handle filter changes
  const handleFilterChange = debounce((column, field, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (!newFilters[column]) newFilters[column] = {};
      newFilters[column][field] = value;
      if ((columnTypes[column] === 'text' && !value) || (columnTypes[column] === 'number' && !value && !newFilters[column].max)) {
        delete newFilters[column];
      }
      return newFilters;
    });
  }, 150);

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // Apply filters and close modal
  const applyFilters = () => {
    setCurrentPage(1);
    setIsFilterModalOpen(false);
  };

  // Close modal on outside click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsFilterModalOpen(false);
    }
  };

  // Handle header row selection
  const handleHeaderRowChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setIsCustomRowInputVisible(true);
      setCustomRowInput('');
      setHeaderRowError('');
    } else if (value === '') {
      setHeaderRowIndex(0);
      setSelectedHeaderRow('0');
      setHeaderRowError('');
      setXAxis('');
      setYAxis('');
      setIsCustomRowInputVisible(false);
      setCustomRowInput('');
    } else {
      const newIndex = Number(value);
      setHeaderRowIndex(newIndex);
      setSelectedHeaderRow(value);
      setHeaderRowError('');
      setXAxis('');
      setYAxis('');
      setIsCustomRowInputVisible(false);
      setCustomRowInput('');
    }
  };

  // Handle custom row input
  const handleCustomRowInput = (e) => {
    const value = e.target.value;
    setCustomRowInput(value);

    if (value === '') {
      setHeaderRowError('');
      return;
    }

    const rowIndex = parseInt(value, 10) - 1; // Convert to 0-based index
    if (isNaN(rowIndex) || rowIndex < 0) {
      setHeaderRowError('Please enter a number 1 or higher.');
      return;
    }
    if (uploadData?.data && rowIndex >= uploadData.data.length) {
      setHeaderRowError(`Row number must be between 1 and ${uploadData.data.length}.`);
      return;
    }

    setHeaderRowError('');
    setHeaderRowIndex(rowIndex);
    setSelectedHeaderRow(rowIndex.toString());
    setXAxis('');
    setYAxis('');
  };

  // Handle custom input blur or Enter key
  const handleCustomRowSubmit = () => {
    if (!headerRowError && customRowInput !== '') {
      setIsCustomRowInputVisible(false);
    }
  };

  // Render chart
  const renderChart = () => {
    const Component = { bar: Bar, line: Line, pie: Pie, doughnut: Doughnut, area: Line }[chartType] || Bar;
    return (
      <motion.div
        className="relative h-[500px] p-4 bg-gray-900/30 backdrop-blur-xl rounded-xl border border-gray-700/50 shadow-2xl"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(59, 130, 246, 0.2)' }}
      >
        <Component ref={chartRef} data={chartData} options={chartOptions} />
        <motion.button
          onClick={downloadChart}
          className="absolute top-4 right-4 bg-blue-600/80 backdrop-blur-sm text-white p-2 rounded-full hover:bg-blue-700/90 transition-all shadow-md hover:shadow-lg cursor-pointer"
          title="Download Chart"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
        </motion.button>
      </motion.div>
    );
  };

  // Filter count
  const filterCount = Object.keys(filters).filter(column => {
    const { value, max } = filters[column];
    return (columnTypes[column] === 'text' && value) || (columnTypes[column] === 'number' && (value || max));
  }).length;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white font-sans">
      {loading && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <div className="animate-spin h-12 w-12 border-4 border-blue-400 border-t-transparent rounded-full"></div>
        </div>
      )}
      <motion.div
        className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur-2xl p-6 border-b border-gray-700 shadow-xl"
        initial="hidden"
        animate="visible"
        variants={panelVariants}
      >
        <h2 className="text-4xl font-bold text-center mb-6 tracking-tight">
          📊 Analytics Dashboard – {uploadData?.fileName || 'Loading...'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-4">
          <select
            value={xAxis}
            onChange={(e) => setXAxis(e.target.value)}
            className="rounded-lg p-3 bg-gray-800/90 text-white border border-gray-600 focus:ring-2 ring-blue-400 outline-none transition-all hover:bg-gray-700 cursor-pointer"
          >
            <option value="">Select X Axis</option>
            {headers.map((h, i) => (
              <option key={i} value={h}>{h}</option>
            ))}
          </select>
          <select
            value={yAxis}
            onChange={(e) => setYAxis(e.target.value)}
            className="rounded-lg p-3 bg-gray-800/90 text-white border border-gray-600 focus:ring-2 ring-blue-400 outline-none transition-all hover:bg-gray-700 cursor-pointer"
          >
            <option value="">Select Y Axis</option>
            {headers.map((h, i) => (
              <option key={i} value={h}>{h}</option>
            ))}
          </select>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="rounded-lg p-3 bg-gray-800/90 text-white border border-gray-600 focus:ring-2 ring-blue-400 outline-none transition-all hover:bg-gray-700 cursor-pointer"
          >
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="pie">Pie</option>
            <option value="doughnut">Doughnut</option>
            <option value="area">Area</option>
          </select>
          <select
            value={colorTheme}
            onChange={(e) => setColorTheme(e.target.value)}
            className="rounded-lg p-3 bg-gray-800/90 text-white border border-gray-600 focus:ring-2 ring-blue-400 outline-none transition-all hover:bg-gray-700 cursor-pointer"
          >
            <option value="vibrant">Vibrant Colors</option>
            <option value="pastel">Pastel Colors</option>
            <option value="gradient">Gradient Colors</option>
          </select>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="relative bg-blue-600 px-4 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v3.586a1 1 0 01-.293.707l-2 2A1 1 0 0110 21v-5.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z"></path>
            </svg>
            Filters
            {filterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col w-48">
            <select
              value={selectedHeaderRow}
              onChange={handleHeaderRowChange}
              className={`rounded-lg p-3 bg-gray-800/90 text-white border ${headerRowError ? 'border-red-500' : 'border-gray-600'} focus:ring-2 ring-blue-400 outline-none transition-all hover:bg-gray-700 cursor-pointer`}
            >
              <option value="">Select Header Row</option>
              {uploadData?.data && Array.from({ length: Math.min(uploadData.data.length, 10) }, (_, i) => (
                <option key={i} value={i}>Row {i + 1}</option>
              ))}
              {headerRowIndex >= 10 && <option value={headerRowIndex}>Row {headerRowIndex + 1}</option>}
              <option value="custom">Custom...</option>
            </select>
            {isCustomRowInputVisible && (
              <input
                type="number"
                value={customRowInput}
                onChange={handleCustomRowInput}
                onBlur={handleCustomRowSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomRowSubmit()}
                placeholder="Enter row number"
                min="1"
                className={`mt-2 rounded-lg p-2 bg-gray-800/90 text-white border ${headerRowError ? 'border-red-500' : 'border-gray-600'} focus:ring-2 ring-blue-400 outline-none transition-all`}
              />
            )}
            {headerRowError && (
              <p className="text-red-500 text-xs mt-1">{headerRowError}</p>
            )}
          </div>
          <input
            type="text"
            onChange={(e) => debouncedSetGlobalSearch(e.target.value)}
            placeholder="🔍 Search all columns..."
            className="flex-grow rounded-lg p-3 bg-gray-800/90 text-white border border-gray-600 focus:ring-2 ring-blue-400 outline-none transition-all cursor-text"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Rows:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                const value = e.target.value === 'all' ? 'all' : Number(e.target.value);
                setRowsPerPage(value);
                setCurrentPage(1);
              }}
              className="rounded-lg p-3 bg-gray-800/90 text-white border border-gray-600 focus:ring-2 ring-blue-400 outline-none transition-all hover:bg-gray-700 cursor-pointer"
            >
              {[10, 20, 50, 100, 200, 500, 1000, 'all'].map(num => (
                <option key={num} value={num}>{num === 'all' ? 'All Rows' : `${num} rows`}</option>
              ))}
            </select>
          </div>
          <button
            onClick={exportCSV}
            className="bg-green-600 px-4 py-3 rounded-lg hover:bg-green-700 transition-all cursor-pointer flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Export CSV
          </button>
        </div>
      </motion.div>
      <AnimatePresence>
        {isFilterModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            onClick={handleOverlayClick}
          >
            <div
              className="bg-gray-900/95 backdrop-blur-xl p-6 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto border border-gray-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-semibold mb-4">Apply Filters</h3>
              {headers.map((header, i) => (
                <div key={i} className="mb-4">
                  <label className="block text-sm font-medium mb-2">{header}</label>
                  {columnTypes[header] === 'text' ? (
                    <input
                      type="text"
                      value={filters[header]?.value || ''}
                      onChange={(e) => handleFilterChange(header, 'value', e.target.value)}
                      placeholder={`Filter ${header}...`}
                      className="w-full rounded-lg p-2 bg-gray-800/90 text-white border border-gray-600 focus:ring-2 ring-blue-400 outline-none cursor-text"
                    />
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={filters[header]?.value || ''}
                        onChange={(e) => handleFilterChange(header, 'value', e.target.value)}
                        placeholder="Min"
                        className="w-1/2 rounded-lg p-2 bg-gray-800/90 text-white border border-gray-600 focus:ring-2 ring-blue-400 outline-none cursor-text"
                      />
                      <input
                        type="number"
                        value={filters[header]?.max || ''}
                        onChange={(e) => handleFilterChange(header, 'max', e.target.value)}
                        placeholder="Max"
                        className="w-1/2 rounded-lg p-2 bg-gray-800/90 text-white border border-gray-600 focus:ring-2 ring-blue-400 outline-none cursor-text"
                      />
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-end gap-2">
                <button
                  onClick={clearFilters}
                  className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-all cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={applyFilters}
                  className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-all cursor-pointer"
                >
                  Apply
                </button>
                <button
                  onClick={() => setIsFilterModalOpen(false)}
                  className="bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-700 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-grow pt-6 px-6">
        {loading ? null : uploadData ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-gray-600 shadow-2xl">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={panelVariants}
              className="overflow-auto max-h-[300px] rounded border border-gray-700 bg-gray-900/80 shadow-inner mb-6"
            >
              <table className="min-w-full text-sm text-white">
                <thead className="bg-gray-800/90 sticky top-0 z-10">
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index} className="px-4 py-2 text-xs border border-gray-600 font-semibold whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-800/50 transition-colors">
                      {Array.isArray(row) &&
                        row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2 border border-gray-700">
                            {typeof cell === 'number' ? cell.toFixed(2) : cell || '-'}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || rowsPerPage === 'all'}
                className="bg-gray-700 px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-all flex items-center cursor-pointer"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
                Previous
              </button>
              <span className="text-sm">
                {rowsPerPage === 'all' ? 'Showing All Rows' : `Page ${currentPage} of ${totalPages}`}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || rowsPerPage === 'all'}
                className="bg-gray-700 px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-gray-600 transition-all flex items-center cursor-pointer"
              >
                Next
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </button>
            </div>
            <motion.div
              className="p-8 rounded-2xl bg-gradient-to-tr from-gray-900/80 via-gray-900 to-black/80 shadow-2xl max-w-5xl min-h-[620px] mx-auto backdrop-blur-xl border border-gray-700/50"
              initial="hidden"
              animate="visible"
              variants={panelVariants}
            >
              {xAxis && yAxis && paginatedData.length > 0 ? (
                <>
                  <motion.div
                    className="mb-8 text-white bg-gray-900/30 p-6 rounded-lg border border-gray-700/50"
                    variants={panelVariants}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xl font-semibold tracking-wide flex items-center">
                        <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2M9 19"></path>
                        </svg>
                        Quick Stats – {yAxis}
                      </h3>
                      <select
                        value={statsScope}
                        onChange={(e) => setStatsScope(e.target.value)}
                        className="rounded-lg p-2 bg-gray-800/90 text-white border border-gray-600 focus:ring-2 ring-blue-400 outline-none transition-all hover:bg-gray-700 cursor-pointer"
                      >
                        <option value="entire">Entire Dataset</option>
                        <option value="page">Current Page</option>
                      </select>
                    </div>
                    <p className="text-sm italic mb-4 text-gray-300">{aiSummary}</p>
                    {columnTypes[yAxis] === 'number' && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm bg-gray-800/30 p-4 rounded-lg">
                        {[
                          { label: 'Min', value: stats.min, icon: '🔽' },
                          { label: 'Max', value: stats.max, icon: '🔼' },
                          { label: 'Mean', value: stats.mean, icon: '📉' },
                          { label: 'Median', value: stats.median, icon: '📈' },
                          { label: 'Std Dev', value: stats.stdDev, icon: '📊' },
                        ].map((stat, index) => (
                          <motion.div
                            key={index}
                            className="flex items-center p-2 rounded hover:bg-gray-700/50 transition-colors"
                            whileHover={{ scale: 1.05 }}
                          >
                            <span className="mr-2">{stat.icon}</span>
                            <div>
                              <strong>{stat.label}:</strong> {stat.value.toFixed(2)}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                  {renderChart()}
                  {filteredData.length > 20 && (rowsPerPage === 'all' || rowsPerPage > 20) ? (
                    <p className="text-sm text-gray-300 text-center mt-2">
                      X-axis labels hidden for large datasets. Hover over data points for details.
                    </p>
                  ) : null}
                </>
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-gray-300">
                  <p className="text-lg font-medium mb-2">🔎 Select X and Y axis or adjust filters to visualize data</p>
                  <p className="text-sm opacity-60">No data matches current filters or header row may be incorrect...</p>
                </div>
              )}
            </motion.div>
          </div>
        ) : null}
      </div>
      <Footer />
    </div>
  );
}

export default Analytics;