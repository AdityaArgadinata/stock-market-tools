import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface BrokerStalkerProps {
  token: string;
}

interface BrokerData {
  blot?: string;
  blotv?: string;
  bval?: string;
  bvalv?: string;
  netbs_broker_code: string;
  netbs_buy_avg_price?: string;
  netbs_sell_avg_price?: string;
  netbs_date: string;
  netbs_stock_code: string;
  type: string;
  slot?: string;
  slotv?: string;
  sval?: string;
  svalv?: string;
}

interface BandarDetector {
  average: number;
  avg: {
    accdist: string;
    amount: number;
    percent: number;
    vol: number;
  };
  avg5: {
    accdist: string;
    amount: number;
    percent: number;
    vol: number;
  };
  broker_accdist: string;
  number_broker_buysell: number;
  top1: {
    accdist: string;
    amount: number;
    percent: number;
    vol: number;
  };
  top3: {
    accdist: string;
    amount: number;
    percent: number;
    vol: number;
  };
  top5: {
    accdist: string;
    amount: number;
    percent: number;
    vol: number;
  };
  top10: {
    accdist: string;
    amount: number;
    percent: number;
    vol: number;
  };
  total_buyer: number;
  total_seller: number;
  value: number;
  volume: number;
}

interface BrokerActivityData {
  bandar_detector: BandarDetector;
  broker_summary: {
    brokers_buy: BrokerData[];
    brokers_sell: BrokerData[];
  };
}

interface ApiResponse {
  message: string;
  data: BrokerActivityData;
}

const BrokerStalker = ({ token }: BrokerStalkerProps) => {
  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to get date N days ago in YYYY-MM-DD format
  const getDateDaysAgo = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getTodayDate();
  const thirtyDaysAgo = getDateDaysAgo(30);

  const [data, setData] = useState<BrokerActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brokerCode, setBrokerCode] = useState('AK');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  
  // Export states
  const [exportFromDate, setExportFromDate] = useState(thirtyDaysAgo);
  const [exportToDate, setExportToDate] = useState(today);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');

  const fetchBrokerActivity = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = `https://exodus.stockbit.com/findata-view/marketdetectors/activity/${brokerCode}/detail?page=1&limit=1000&to=${toDate}&from=${fromDate}&transaction_type=TRANSACTION_TYPE_NET&market_board=MARKET_BOARD_REGULER&investor_type=INVESTOR_TYPE_ALL`;
      
      console.log('Fetching URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse = await response.json();
      console.log('API Response:', result);
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchBrokerActivityByDate = async (date: string): Promise<BrokerActivityData | null> => {
    try {
      const url = `https://exodus.stockbit.com/findata-view/marketdetectors/activity/${brokerCode}/detail?page=1&limit=1000&to=${date}&from=${date}&transaction_type=TRANSACTION_TYPE_NET&market_board=MARKET_BOARD_REGULER&investor_type=INVESTOR_TYPE_ALL`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch data for ${date}`);
        return null;
      }
      
      const result: ApiResponse = await response.json();
      return result.data;
    } catch (err) {
      console.error(`Error fetching data for ${date}:`, err);
      return null;
    }
  };

  useEffect(() => {
    fetchBrokerActivity();
  }, []);

  const parseScientificNotation = (val: string | number | undefined): number => {
    if (val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;
    if (val.includes('e+') || val.includes('e-')) {
      return parseFloat(val);
    }
    return parseFloat(val) || 0;
  };

  const formatLotNumber = (val: string | number | undefined): string => {
    if (val === undefined) return '';
    const num = parseScientificNotation(val);
    // If whole number (no decimals), return as integer
    if (num % 1 === 0) {
      return Math.floor(num).toString();
    }
    // Otherwise, show up to 3 decimal places
    return num.toFixed(3);
  };

  const formatNumber = (num: number | string | undefined): string => {
    if (num === undefined) return '0';
    const value = parseScientificNotation(num);
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const formatCurrency = (num: number | string | undefined): string => {
    if (num === undefined) return '0';
    const value = parseScientificNotation(num);
    const absValue = Math.abs(value);
    const isNegative = value < 0;
    
    let formatted: string;
    if (absValue >= 1000000000000) {
      formatted = (absValue / 1000000000000).toFixed(2) + 'T';
    } else if (absValue >= 1000000000) {
      formatted = (absValue / 1000000000).toFixed(2) + 'B';
    } else if (absValue >= 1000000) {
      formatted = (absValue / 1000000).toFixed(2) + 'M';
    } else if (absValue >= 1000) {
      formatted = (absValue / 1000).toFixed(2) + 'K';
    } else {
      formatted = absValue.toLocaleString('id-ID');
    }
    
    return isNegative ? `-${formatted}` : formatted;
  };

  const getDatesInRange = (startDate: string, endDate: string): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    while (start <= end) {
      dates.push(start.toISOString().split('T')[0]);
      start.setDate(start.getDate() + 1);
    }
    
    return dates;
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Mempersiapkan export...');
    
    console.log(`Starting export with Broker Code: ${brokerCode}`);
    
    try {
      // Generate date range, then sort by latest-first for Excel output
      const dates = getDatesInRange(exportFromDate, exportToDate)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const totalDates = dates.length;
      
      console.log(`Export: ${totalDates} dates from ${exportFromDate} to ${exportToDate}`);
      
      if (totalDates > 1000) {
        alert('Maksimal range tanggal adalah 2 tahun (1000 hari)');
        setIsExporting(false);
        return;
      }
      
      const workbook = XLSX.utils.book_new();
      const allData: any[] = [];
      
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        setExportStatus(`Mengambil data ${date} (${i + 1}/${totalDates})...`);
        setExportProgress(Math.round(((i + 1) / totalDates) * 100));
        
        console.log(`Fetching data for ${date}...`);
        const dayData = await fetchBrokerActivityByDate(date);
        
        if (dayData && dayData.broker_summary) {
          const buyCount = dayData.broker_summary.brokers_buy?.length || 0;
          const sellCount = dayData.broker_summary.brokers_sell?.length || 0;
          console.log(`${date}: ${buyCount} buy, ${sellCount} sell records`);
          
          // Add header row (labels aligned under Broker Code columns)
          allData.push({
            'Date': date,
            'Broker Code': 'BROKERS BUY',
            'Stock Code': '',
            'Type': '',
            'Lot': '',
            'Value': '',
            'Avg Price': '',
            'Broker Code (Sell)': 'BROKERS SELL',
            'Stock Code (Sell)': '',
            'Type (Sell)': '',
            'Lot (Sell)': '',
            'Value (Sell)': '',
            'Avg Price (Sell)': ''
          });
          
          const brokersBuy = dayData.broker_summary.brokers_buy || [];
          const brokersSell = dayData.broker_summary.brokers_sell || [];
          const maxRows = Math.max(brokersBuy.length, brokersSell.length);
          
          // If no transactions at all, add a dash row with date
          if (maxRows === 0) {
            allData.push({
              'Date': date,
              'Broker Code': '-',
              'Stock Code': '-',
              'Type': '-',
              'Lot': '-',
              'Value': '-',
              'Avg Price': '-',
              'Broker Code (Sell)': '-',
              'Stock Code (Sell)': '-',
              'Type (Sell)': '-',
              'Lot (Sell)': '-',
              'Value (Sell)': '-',
              'Avg Price (Sell)': '-'
            });
          }

          // Add data rows side by side
          for (let j = 0; j < maxRows; j++) {
            const buyBroker = brokersBuy[j];
            const sellBroker = brokersSell[j];
            
            const row: any = {
              'Date': date,
              'Broker Code': buyBroker?.netbs_broker_code || '',
              'Stock Code': buyBroker?.netbs_stock_code || '',
              'Type': buyBroker?.type || '',
              'Lot': buyBroker?.blot ? formatLotNumber(buyBroker.blot) : '',
              'Value': buyBroker?.bval ? formatCurrency(buyBroker.bval) : '',
              'Avg Price': buyBroker?.netbs_buy_avg_price ? parseScientificNotation(buyBroker.netbs_buy_avg_price).toFixed(3) : '',
              'Broker Code (Sell)': sellBroker?.netbs_broker_code || '',
              'Stock Code (Sell)': sellBroker?.netbs_stock_code || '',
              'Type (Sell)': sellBroker?.type || '',
              'Lot (Sell)': sellBroker?.slot ? formatLotNumber(sellBroker.slot) : '',
              'Value (Sell)': sellBroker?.sval ? formatCurrency(sellBroker.sval) : '',
              'Avg Price (Sell)': sellBroker?.netbs_sell_avg_price ? parseScientificNotation(sellBroker.netbs_sell_avg_price).toFixed(3) : ''
            };
            
            allData.push(row);
          }
          
          allData.push({
            'Date': '',
            'Broker Code': '',
            'Stock Code': '',
            'Type': '',
            'Lot': '',
            'Value': '',
            'Avg Price': '',
            'Broker Code (Sell)': '',
            'Stock Code (Sell)': '',
            'Type (Sell)': '',
            'Lot (Sell)': '',
            'Value (Sell)': '',
            'Avg Price (Sell)': ''
          });
        } else {
          console.log(`${date}: No data returned from API`);
        }
        
        // Add delay to avoid overwhelming the API - increase for long ranges
        if (i < dates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      console.log(`Total rows collected: ${allData.length}`);
      
      if (allData.length === 0) {
        alert('Tidak ada data untuk range tanggal yang dipilih. Pastikan tanggal valid dan broker code benar.');
        setIsExporting(false);
        return;
      }
      
      setExportStatus('Membuat file Excel...');
      
      const worksheet = XLSX.utils.json_to_sheet(allData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 15 }, // Date
        { wch: 12 }, // Broker Code
        { wch: 12 }, // Stock Code
        { wch: 10 }, // Type
        { wch: 15 }, // Lot
        { wch: 18 }, // Value
        { wch: 15 }, // Avg Price
        { wch: 12 }, // Broker Code (Sell)
        { wch: 12 }, // Stock Code (Sell)
        { wch: 10 }, // Type (Sell)
        { wch: 15 }, // Lot (Sell)
        { wch: 18 }, // Value (Sell)
        { wch: 15 }  // Avg Price (Sell)
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Broker Activity');
      
      const fileName = `Broker_${brokerCode}_${exportFromDate}_to_${exportToDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      setExportStatus('Export selesai!');
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus('');
      }, 2000);
      
    } catch (err) {
      console.error('Export error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setExportStatus(`Error saat export: ${errorMsg}`);
      alert(`Export gagal: ${errorMsg}`);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus('');
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">No data available</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900">Broker Stalker - Activity Detail</h1>
      
      {/* Filter & Export Controls - Side by Side */}
      <div className="flex gap-6 mb-6">
        {/* Filter Controls */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1">
          <h2 className="text-base font-semibold mb-4 text-gray-900">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Broker Code</label>
              <input
                type="text"
                value={brokerCode}
                onChange={(e) => setBrokerCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && fetchBrokerActivity()}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="AK"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <button
            onClick={fetchBrokerActivity}
            className="mt-4 px-6 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm"
          >
            Fetch Data
          </button>
        </div>

        {/* Export to Excel Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1">
          <h2 className="text-base font-semibold mb-1 text-gray-900">Export to Excel</h2>
          <p className="text-xs text-gray-500 mb-4">Max 2 tahun per export</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">From Date</label>
              <input
                type="date"
                value={exportFromDate}
                onChange={(e) => setExportFromDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={isExporting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">To Date</label>
              <input
                type="date"
                value={exportToDate}
                onChange={(e) => setExportToDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={isExporting}
              />
            </div>
          </div>
          
          <button
            onClick={exportToExcel}
            disabled={isExporting}
            className={`w-full px-6 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm ${
              isExporting 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
            }`}
          >
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </button>
          
          {isExporting && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-700">{exportStatus}</span>
                <span className="text-xs font-medium text-gray-700">{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bandar Detector Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold mb-4 text-gray-900">Bandar Detector Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="text-xs text-gray-500 mb-1">Total Value</div>
            <div className="text-base font-semibold text-gray-900">{formatCurrency(data.bandar_detector.value)}</div>
          </div>
          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="text-xs text-gray-500 mb-1">Total Volume</div>
            <div className="text-base font-semibold text-gray-900">{formatNumber(data.bandar_detector.volume)}</div>
          </div>
          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="text-xs text-gray-500 mb-1">Total Buyers</div>
            <div className="text-base font-semibold text-gray-900">{data.bandar_detector.total_buyer}</div>
          </div>
          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="text-xs text-gray-500 mb-1">Total Sellers</div>
            <div className="text-base font-semibold text-gray-900">{data.bandar_detector.total_seller}</div>
          </div>
          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="text-xs text-gray-500 mb-1">Average</div>
            <div className="text-base font-semibold text-gray-900">{formatNumber(data.bandar_detector.average)}</div>
          </div>
          <div className="border border-gray-200 p-4 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <div className="text-xs text-gray-500 mb-1">Broker AccDist</div>
            <div className="text-base font-semibold text-gray-900">{data.bandar_detector.broker_accdist}</div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold mb-3 text-gray-900">Top Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="border border-gray-200 p-4 rounded-lg bg-white hover:shadow-md transition-shadow">
              <h4 className="text-sm font-semibold mb-3 text-gray-900">Top 1</h4>
              <p className="text-xs text-gray-600 mb-1">Amount: <span className="font-medium text-gray-900">{formatCurrency(data.bandar_detector.top1.amount)}</span></p>
              <p className="text-xs text-gray-600 mb-1">Volume: <span className="font-medium text-gray-900">{formatNumber(data.bandar_detector.top1.vol)}</span></p>
              <p className="text-xs text-gray-600 mb-1">Percent: <span className="font-medium text-gray-900">{data.bandar_detector.top1.percent.toFixed(2)}%</span></p>
              <p className="text-xs text-gray-600">AccDist: <span className="font-medium text-gray-900">{data.bandar_detector.top1.accdist}</span></p>
            </div>
            <div className="border border-gray-200 p-4 rounded-lg bg-white hover:shadow-md transition-shadow">
              <h4 className="text-sm font-semibold mb-3 text-gray-900">Top 3</h4>
              <p className="text-xs text-gray-600 mb-1">Amount: <span className="font-medium text-gray-900">{formatCurrency(data.bandar_detector.top3.amount)}</span></p>
              <p className="text-xs text-gray-600 mb-1">Volume: <span className="font-medium text-gray-900">{formatNumber(data.bandar_detector.top3.vol)}</span></p>
              <p className="text-xs text-gray-600 mb-1">Percent: <span className="font-medium text-gray-900">{data.bandar_detector.top3.percent.toFixed(2)}%</span></p>
              <p className="text-xs text-gray-600">AccDist: <span className="font-medium text-gray-900">{data.bandar_detector.top3.accdist}</span></p>
            </div>
            <div className="border border-gray-200 p-4 rounded-lg bg-white hover:shadow-md transition-shadow">
              <h4 className="text-sm font-semibold mb-3 text-gray-900">Top 5</h4>
              <p className="text-xs text-gray-600 mb-1">Amount: <span className="font-medium text-gray-900">{formatCurrency(data.bandar_detector.top5.amount)}</span></p>
              <p className="text-xs text-gray-600 mb-1">Volume: <span className="font-medium text-gray-900">{formatNumber(data.bandar_detector.top5.vol)}</span></p>
              <p className="text-xs text-gray-600 mb-1">Percent: <span className="font-medium text-gray-900">{data.bandar_detector.top5.percent.toFixed(2)}%</span></p>
              <p className="text-xs text-gray-600">AccDist: <span className="font-medium text-gray-900">{data.bandar_detector.top5.accdist}</span></p>
            </div>
            <div className="border border-gray-200 p-4 rounded-lg bg-white hover:shadow-md transition-shadow">
              <h4 className="text-sm font-semibold mb-3 text-gray-900">Top 10</h4>
              <p className="text-xs text-gray-600 mb-1">Amount: <span className="font-medium text-gray-900">{formatCurrency(data.bandar_detector.top10.amount)}</span></p>
              <p className="text-xs text-gray-600 mb-1">Volume: <span className="font-medium text-gray-900">{formatNumber(data.bandar_detector.top10.vol)}</span></p>
              <p className="text-xs text-gray-600 mb-1">Percent: <span className="font-medium text-gray-900">{data.bandar_detector.top10.percent.toFixed(2)}%</span></p>
              <p className="text-xs text-gray-600">AccDist: <span className="font-medium text-gray-900">{data.bandar_detector.top10.accdist}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Brokers Buy & Sell Side by Side */}
      <div className="flex gap-4">
        {/* Brokers Buy - Left */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1">
          <h2 className="text-base font-semibold mb-4 text-green-600">Brokers Buy</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Stock Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Buy Lot
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Buy Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Avg Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {data.broker_summary.brokers_buy.map((broker, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {broker.netbs_stock_code}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {broker.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatNumber(broker.blot)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(broker.bval)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatNumber(broker.netbs_buy_avg_price)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {broker.netbs_date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Brokers Sell - Right */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1">
          <h2 className="text-base font-semibold mb-4 text-red-600">Brokers Sell</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Stock Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Sell Lot
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Sell Value
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Avg Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {data.broker_summary.brokers_sell.map((broker, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {broker.netbs_stock_code}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-orange-50 text-orange-700 border border-orange-200">
                        {broker.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatNumber(broker.slot)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(broker.sval)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatNumber(broker.netbs_sell_avg_price)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {broker.netbs_date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerStalker;
