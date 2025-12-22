import { useState } from 'react'
import StockData from '../components/StockData'
import RunningTradeData from '../components/RunningTradeData'

const BEARER_TOKEN = import.meta.env.VITE_STOCKBIT_BEARER_TOKEN

export default function Home() {
  const [inputSymbol, setInputSymbol] = useState('SUPA')
  const [symbol, setSymbol] = useState('SUPA')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSymbol(inputSymbol.toUpperCase())
  }

  return (
    <div className="max-w-7xl mx-auto pt-8 px-4">
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h1 className="text-2xl font-bold mb-4">Anjay ngetrek</h1>

        <form
          onSubmit={handleSubmit}
          className="max-w-xs flex justify-end flex-col gap-3"
        >
          <div className="flex-1 flex flex-col gap-2">
            <label
              htmlFor="symbol"
              className="text-sm font-medium text-gray-600"
            >
              Ticker
            </label>

            <input
              id="symbol"
              type="text"
              value={inputSymbol}
              onChange={(e) =>
                setInputSymbol(e.target.value.toUpperCase())
              }
              placeholder="Masukkan kode saham (contoh: SUPA)"
              maxLength={10}
              className="p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Cari
          </button>
        </form>
      </div>

      <div className="flex gap-6">
        <StockData symbol={symbol} token={BEARER_TOKEN} />
        <RunningTradeData symbol={symbol} token={BEARER_TOKEN} />
      </div>
    </div>
  )
}
