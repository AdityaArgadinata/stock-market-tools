import { useState } from 'react'
import StockData from './components/StockData'
import './App.css'

const BEARER_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjU3MDc0NjI3LTg4MWItNDQzZC04OTcyLTdmMmMzOTNlMzYyOSIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7InVzZSI6IkFkaXR5YUFyZ2FkaW5hdGEiLCJlbWEiOiJhZGl0ZGV2ZWxvcEBnbWFpbC5jb20iLCJmdWwiOiJBZGl0eWEgQXJnYWRpbmF0YSIsInNlcyI6ImxCdkVRd0NiR1doM3Vib2oiLCJkdmMiOiI2NzhjZjAxZGJiYzE2N2U5ZTI1ZmRhZmJkOTViYjM4OCIsInVpZCI6MzgzMDU3NSwiY291IjoiSUQifSwiZXhwIjoxNzY2Mzc5NDg0LCJpYXQiOjE3NjYyOTMwODQsImlzcyI6IlNUT0NLQklUIiwianRpIjoiNzliZWJlZDMtMTc0NC00NDdjLWFjMjYtNzg3NmQ1YjkwMjMxIiwibmJmIjoxNzY2MjkzMDg0LCJ2ZXIiOiJ2MSJ9.uMrEsokSwaGl9HFJXN1Hy0bA8_lmOQ4DAgGXAuulS3m7UbNVUV7HKwMVG0ULqtPzVhnQ0tDSw7peE_gIK_2vheBVaNPfRD5N8ON1hrzEehtlDuUXi9JqzgpR1aHU5uOIObIDvKNYis8U7-Ixek0Re-kQaTcyRUuk3Hf96Vx5g8_s6cu3q5mESoS33ijbeVD-rFr8XwpF8h740EESbirGI7cijY9D3TvvndJ7RCUUVvPry4arjgh7FhW6GLsxYdvfDOVllW50BaysnbZ23kdqIFn5zsUMoLSupMnTZgIvEPdSt8jIleL5UbDnuepA2eGQqr2k240kmyZRuovbRoLK3g'

function App() {
  const [inputSymbol, setInputSymbol] = useState('SUPA')
  const [symbol, setSymbol] = useState('SUPA')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSymbol(inputSymbol.toUpperCase())
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>Stock Tools</h1>

        <form onSubmit={handleSubmit} className="symbol-form">
          <div className="symbol-form-group">
            <label htmlFor="symbol">Kode Saham</label>
            <input
              id="symbol"
              type="text"
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
              placeholder="Masukkan kode saham (contoh: SUPA)"
              maxLength={10}
            />
          </div>
          <button type="submit" className="submit-button">Cari</button>
        </form>
      </div>
      <div className="content-container">
        <StockData symbol={symbol} token={BEARER_TOKEN} />
        <div>
          <p>running trade dan volume spike</p>
        </div>
        <div>
          <p>antrian cabut pasang order book</p>
        </div>
      </div>
    </div>
  )
}

export default App
