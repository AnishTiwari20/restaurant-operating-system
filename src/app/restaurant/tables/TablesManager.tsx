'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Plus, Trash2, QrCode as QrIcon, Printer, Download, X, Eye } from 'lucide-react';

interface TableData {
  id: string;
  number: string;
  createdAt: string;
}

interface Props {
  initialTables: TableData[];
  restaurantId: string;
  restaurantSlug: string;
}

export default function TablesManager({ initialTables, restaurantId, restaurantSlug }: Props) {
  const [tables, setTables] = useState<TableData[]>(initialTables);
  const [newNumber, setNewNumber] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [activeQrTable, setActiveQrTable] = useState<TableData | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [origin, setOrigin] = useState('');

  // Get window origin on client
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Generate QR code base64 whenever active table changes
  useEffect(() => {
    if (activeQrTable && origin) {
      const targetUrl = `${origin}/r/${restaurantSlug}/t/${activeQrTable.id}`;
      QRCode.toDataURL(targetUrl, { width: 400, margin: 2 })
        .then((url) => {
          setQrCodeDataUrl(url);
        })
        .catch((err) => {
          console.error('Failed to generate QR Code', err);
        });
    } else {
      setQrCodeDataUrl('');
    }
  }, [activeQrTable, origin, restaurantSlug]);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;
    setIsAdding(true);

    try {
      const res = await fetch('/api/restaurant/tables/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurantId, number: newNumber.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setTables((prev) => [...prev, data.table].sort((a, b) => a.number.localeCompare(b.number)));
        setNewNumber('');
      } else {
        alert(data.message || 'Error creating table.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table? Any orders associated with it will remain, but the table QR will stop working.')) {
      return;
    }

    try {
      const res = await fetch('/api/restaurant/tables/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setTables((prev) => prev.filter((t) => t.id !== id));
        if (activeQrTable?.id === id) {
          setActiveQrTable(null);
        }
      } else {
        alert('Failed to delete table.');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting table.');
    }
  };

  const handlePrint = () => {
    if (!activeQrTable || !qrCodeDataUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to print.');
      return;
    }

    const targetUrl = `${origin}/r/${restaurantSlug}/t/${activeQrTable.id}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - Table ${activeQrTable.number}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              text-align: center;
              padding: 40px;
              color: #000;
            }
            .card {
              border: 3px solid #000;
              border-radius: 24px;
              padding: 30px;
              max-width: 380px;
              margin: 0 auto;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            h1 {
              font-size: 28px;
              margin: 0 0 5px 0;
              font-weight: 800;
            }
            p {
              font-size: 14px;
              color: #555;
              margin: 0 0 25px 0;
            }
            img {
              width: 280px;
              height: 280px;
              margin-bottom: 20px;
            }
            .table-badge {
              display: inline-block;
              background: #000;
              color: #fff;
              font-weight: 900;
              font-size: 20px;
              padding: 8px 24px;
              border-radius: 12px;
              margin-top: 10px;
            }
            .footer {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #888;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${restaurantSlug.toUpperCase().replace('-', ' ')}</h1>
            <p>Scan to view menu & place your order</p>
            <img src="${qrCodeDataUrl}" alt="QR Code" />
            <div>
              <span class="table-badge">TABLE ${activeQrTable.number}</span>
            </div>
            <div class="footer">Powered by RestaurantOS</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Table Management</h1>
        <p className="text-slate-500 text-xs mt-1">
          Create tables, generate unique table QR codes, and download or print them for physical placement.
        </p>
      </div>

      {/* Grid: Create Table & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Table Form */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm h-fit space-y-4">
          <h2 className="font-extrabold text-sm text-slate-800">Create Table</h2>
          <form onSubmit={handleAddTable} className="space-y-4">
            <div>
              <label htmlFor="table-num" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Table Label / Number
              </label>
              <input
                id="table-num"
                type="text"
                required
                disabled={isAdding}
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="e.g. 6 or VIP-1"
                className="w-full bg-slate-50 border border-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-xs transition-colors outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isAdding || !newNumber.trim()}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow shadow-cyan-500/5 cursor-pointer disabled:opacity-50"
            >
              <Plus size={14} />
              <span>Add Table</span>
            </button>
          </form>
        </div>

        {/* Tables Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-extrabold text-sm text-slate-800">Active Tables ({tables.length})</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {tables.length === 0 ? (
              <div className="sm:col-span-2 md:col-span-3 text-center py-12 bg-white border border-slate-200 border-dashed rounded-3xl p-6">
                <p className="text-slate-500 text-xs">No tables created yet. Add one to generate a QR.</p>
              </div>
            ) : (
              tables.map((table) => {
                const isActiveQr = activeQrTable?.id === table.id;
                return (
                  <div
                    key={table.id}
                    className={`bg-white border rounded-2xl p-4.5 flex flex-col justify-between gap-4 transition-all ${
                      isActiveQr ? 'border-cyan-500 bg-cyan-500/[0.01]' : 'border-slate-200/85 hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-lg font-black text-slate-900">Table {table.number}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">ID: {table.id.slice(0, 8)}...</span>
                      </div>

                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="text-slate-400 hover:text-red-650 p-1.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => setActiveQrTable(table)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                        isActiveQr
                          ? 'bg-cyan-500 text-white border-cyan-500 shadow'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-350 text-slate-650 hover:text-slate-900'
                      }`}
                    >
                      <QrIcon size={14} />
                      <span>{isActiveQr ? 'Viewing QR' : 'Generate QR'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal Drawer */}
      {activeQrTable && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl animate-fade-in text-left">
            {/* Top accent */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-teal-500" />

            <button
              onClick={() => setActiveQrTable(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-750 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-extrabold text-slate-900 text-base">Table QR Details</h3>
            <p className="text-slate-500 text-xs mt-1 uppercase font-bold tracking-wider">
              Table {activeQrTable.number}
            </p>

            <div className="my-6 p-4 bg-white border-4 border-slate-100 rounded-2xl inline-block shadow-inner w-full text-center">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 mx-auto flex items-center justify-center text-slate-400 font-mono text-[10px]">
                  Generating...
                </div>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[10px] text-slate-550 text-left font-mono break-all mb-6">
              <span className="font-bold text-slate-600 uppercase tracking-wider block mb-1">Target URL:</span>
              {origin}/r/{restaurantSlug}/t/{activeQrTable.id}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrint}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={14} />
                <span>Print QR</span>
              </button>

              <a
                href={qrCodeDataUrl}
                download={`Table_${activeQrTable.number}_QR.png`}
                className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-black py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
              >
                <Download size={14} />
                <span>Download</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
