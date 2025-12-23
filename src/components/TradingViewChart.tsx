import { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
}

function TradingViewWidget({ symbol = 'NASDAQ:AAPL' }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Bersihkan seluruh isi container untuk hindari duplikasi chart
    if (container.current) {
      while (container.current.firstChild) {
        container.current.removeChild(container.current.firstChild);
      }
    }

    // Hapus script lama jika ada
    if (scriptRef.current && container.current && container.current.contains(scriptRef.current)) {
      container.current.removeChild(scriptRef.current);
      scriptRef.current = null;
    }

    // Buat script baru dengan config JSON
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      allow_symbol_change: true,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      interval: 'D',
      locale: 'en',
      save_image: true,
      style: '1',
      symbol: 'IDX:'+symbol,
      theme: 'light',
      timezone: 'Asia/Jakarta',
      gridColor: 'rgba(242, 242, 242, 0.06)',
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies: [],
      autosize: true,
    });

    // Append script jika container ada
    if (container.current) {
      container.current.appendChild(script);
      scriptRef.current = script;
    }

    // Cleanup saat unmount atau update
    return () => {
      if (container.current) {
        while (container.current.firstChild) {
          container.current.removeChild(container.current.firstChild);
        }
      }
      if (scriptRef.current && container.current && container.current.contains(scriptRef.current)) {
        container.current.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [symbol]);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: '100%', width: '100%' }}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ height: 'calc(100% - 32px)', width: '100%' }}
      ></div>
      <div className="tradingview-widget-copyright">
        <a
          href={`https://www.tradingview.com/symbols/IDX-${symbol.replace(':', '-')}/`}
          rel="noopener nofollow"
          target="_blank"
        >
          <span className="blue-text">{symbol} stock chart</span>
        </a>
        <span className="trademark"> by TradingView</span>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);