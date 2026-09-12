import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { QrCode, ShieldCheck, CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';

// Inisialisasi Supabase dari Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// LOGO BRAND REYYZTORE PERMANEN
const BRAND_LOGO_URL = "https://eqteeombnjaptjezhyyh.supabase.co/storage/v1/object/public/assets/image.jpg";

// PIN RAHASIA ADMIN (Kamu bisa ubah angka 999888 ini sesuai keinginanmu!)
const ADMIN_SECRET_PIN = "999888"; 

export default function App() {
  const [cardId, setCardId] = useState('001');
  const [targetUrl, setTargetUrl] = useState('');
  const [pin, setPin] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isEditMode, setIsEditMode] = useState(false);

  // State Dashboard Admin
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [allCards, setAllCards] = useState([]);
  const [showPins, setShowPins] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlId = params.get('id');
    const editParam = params.get('edit');
    const adminParam = params.get('admin');

    if (adminParam === 'true') {
      setIsAdminMode(true);
      setLoading(false);
      return;
    }

    if (urlId) setCardId(urlId);
    if (editParam === 'true') setIsEditMode(true);

    fetchCardData(urlId || '001');
  }, []);

  const fetchCardData = async (id) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!supabase) {
      setMessage({ type: 'warning', text: 'Supabase API Key belum terkonfigurasi di Environment Variables Vercel.' });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', id)
        .single();

      if (data) {
        setIsActive(data.is_active);
        setTargetUrl(data.target_url || '');
        
        const params = new URLSearchParams(window.location.search);
        if (data.is_active && data.target_url && params.get('edit') !== 'true') {
          window.location.href = data.target_url;
          return;
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal mengambil data dari Supabase: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPinInput === ADMIN_SECRET_PIN) {
      setIsAdminAuthenticated(true);
      fetchAllCards();
    } else {
      alert("PIN Admin Salah!");
    }
  };

  const fetchAllCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('cards').select('*').order('id', { ascending: true });
      if (error) throw error;
      setAllCards(data || []);
    } catch (err) {
      alert("Gagal mengambil data admin: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validasi PIN 6 Angka
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      setMessage({ type: 'error', text: 'PIN harus berupa 6 digit angka!' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isActive && isEditMode) {
        const { data: currentCard } = await supabase.from('cards').select('pin').eq('id', cardId).single();
        if (currentCard && currentCard.pin !== oldPin) {
          setMessage({ type: 'error', text: 'PIN Lama Salah!' });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.from('cards').upsert({
        id: cardId,
        target_url: targetUrl,
        pin: pin,
        is_active: true
      });

      if (error) throw error;

      setIsActive(true);
      setIsEditMode(false);
      setMessage({ type: 'success', text: 'Berhasil disimpan! Plakat NFC kamu sudah aktif.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Gagal menyimpan: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPin = (id) => {
    setShowPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // TAMPILAN DASHBOARD ADMIN
  if (isAdminMode) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, maxWidth: '650px' }}>
          <div style={styles.brandContainer}>
            <img src={BRAND_LOGO_URL} alt="Reyyztore" style={styles.brandLogo} />
            <span style={styles.brandName}>Reyyztore Admin</span>
          </div>

          <div style={styles.header}>
            <ShieldCheck size={36} color="#0070f3" />
            <h2 style={styles.title}>Dashboard Control Plakat</h2>
          </div>

          {!isAdminAuthenticated ? (
            <form onSubmit={handleAdminLogin} style={styles.form}>
              <p style={{ textAlign: 'center', fontSize: '14px', color: '#4b5563' }}>
                Masukkan PIN Admin Rahasia untuk Masuk:
              </p>
              <input
                type="password"
                placeholder="Masukkan 6 Digit PIN Admin"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                maxLength={6}
                required
                style={styles.input}
              />
              <button type="submit" style={styles.submitBtn}>Masuk Dashboard</button>
            </form>
          ) : (
            <div>
              <h3>Daftar Seluruh Plakat NFC ({allCards.length})</h3>
              {loading ? <p>Memuat data...</p> : (
                <div style={{ overflowX: 'auto', marginTop: '15px' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Target Link Google</th>
                        <th style={styles.th}>PIN User (6 Digit)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCards.map((c) => (
                        <tr key={c.id}>
                          <td style={styles.td}><strong>#{c.id}</strong></td>
                          <td style={styles.td}>
                            <span style={{ color: c.is_active ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                              {c.is_active ? 'Aktif' : 'Belum'}
                            </span>
                          </td>
                          <td style={{ ...styles.td, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.target_url || '-'}
                          </td>
                          <td style={styles.td}>
                            {c.pin ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                  {showPins[c.id] ? c.pin : '••••••'}
                                </span>
                                <button onClick={() => toggleShowPin(c.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                                  {showPins[c.id] ? <EyeOff size={14} color="#6b7280" /> : <Eye size={14} color="#6b7280" />}
                                </button>
                              </div>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // TAMPILAN USER / HOMEPAGE / AKTIVASI KARTU
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* LOGO BRAND REYYZTORE DI POJOK KIRI ATAS */}
        <div style={styles.brandContainer}>
          <img src={BRAND_LOGO_URL} alt="Reyyztore" style={styles.brandLogo} />
          <span style={styles.brandName}>Reyyztore</span>
        </div>

        <div style={styles.header}>
          <QrCode size={36} color="#0070f3" />
          <h2 style={styles.title}>Google Review Portal</h2>
          <span style={styles.badge}>ID Plakat: #{cardId}</span>
        </div>

        {message.text && (
          <div style={{
            ...styles.alert,
            backgroundColor: message.type === 'error' ? '#ffebe9' : message.type === 'warning' ? '#fff8c5' : '#e6ffec',
            color: message.type === 'error' ? '#cf222e' : message.type === 'warning' ? '#9a6700' : '#1a7f37'
          }}>
            {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {loading ? (
          <div style={styles.loadingBox}>
            <RefreshCw className="spin" size={24} color="#0070f3" />
            <p>Memuat data plakat...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} style={styles.form}>
            {isActive && !isEditMode ? (
              <div style={styles.activeStateBox}>
                <CheckCircle size={48} color="#10b981" />
                <h3>Plakat NFC Sudah Aktif!</h3>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>Mengalihkan ke Google Maps...</p>
                <button type="button" onClick={() => setIsEditMode(true)} style={styles.secondaryBtn}>
                  Edit Link / PIN (6 Digit)
                </button>
              </div>
            ) : (
              <>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{isActive ? 'Edit Link Google Review' : 'Aktivasi Plakat NFC'}</h3>
                
                {isActive && isEditMode && (
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>PIN 6-Digit Lama:</label>
                    <input
                      type="password"
                      placeholder="Masukkan PIN 6 Angka Lama"
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value)}
                      maxLength={6}
                      required
                      style={styles.input}
                    />
                  </div>
                )}

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Link Google Review / Maps Toko:</label>
                  <input
                    type="url"
                    placeholder="https://g.page/r/xxxx/review"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Buat PIN 6 Angka (Untuk Edit Nanti):</label>
                  <input
                    type="password"
                    placeholder="Masukkan 6 Digit Angka (Contoh: 123456)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    maxLength={6}
                    required
                    style={styles.input}
                  />
                </div>

                <button type="submit" style={styles.submitBtn} disabled={loading}>
                  {isActive ? 'Simpan Perubahan' : 'Aktifkan Plakat Sekarang'}
                </button>

                {isEditMode && (
                  <button type="button" onClick={() => setIsEditMode(false)} style={styles.cancelBtn}>
                    Batal Edit
                  </button>
                )}
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif', padding: '15px' },
  card: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '420px', position: 'relative' },
  
  // Style Branding Reyyztore Pojok Kiri Atas
  brandContainer: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  brandLogo: { width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' },
  brandName: { fontSize: '14px', fontWeight: 'bold', color: '#111827' },

  header: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '20px' },
  title: { margin: 0, fontSize: '18px', color: '#111827', fontWeight: 'bold' },
  badge: { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' },
  alert: { padding: '10px 12px', borderRadius: '8px', border: '1px solid', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' },
  loadingBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0', gap: '10px', color: '#6b7280' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px' },
  submitBtn: { padding: '12px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' },
  cancelBtn: { padding: '8px', backgroundColor: 'transparent', color: '#6b7280', border: 'none', fontSize: '13px', cursor: 'pointer' },
  activeStateBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center', padding: '10px 0' },
  secondaryBtn: { padding: '8px 14px', backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', marginTop: '8px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '10px' },
  th: { borderBottom: '2px solid #e5e7eb', padding: '8px', textAlign: 'left', backgroundColor: '#f9fafb' },
  td: { borderBottom: '1px solid #e5e7eb', padding: '8px' }
};

