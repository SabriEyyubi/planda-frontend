type Mode = 'developer' | 'inventory' | 'leads' | 'broker' | 'admin';

const content = {
  developer: {
    eyebrow: 'NOVA YAPI',
    title: 'Genel bakış',
    description: 'Son 30 günlük operasyon özeti',
    metrics: [
      ['Görüntülenme', '18.420'],
      ['Yeni talep', '42'],
      ['Uygun stok', '23'],
      ['Tamamlanma', '%86'],
    ],
    columns: ['Proje', 'Görüntülenme', 'Talep', 'Stok', 'Durum'],
    rows: [
      ['Nova Başakşehir', '9.840', '24', '23', 'Güncel'],
      ['Vadi Loft', '5.120', '11', '18', 'Güncelleme gerekli'],
      ['Marmara Terrace', '3.460', '7', '9', 'Taslak'],
    ],
  },
  inventory: {
    eyebrow: 'CANLI STOK',
    title: 'Nova Başakşehir — stok',
    description: 'Fiyat ve durum değişiklikleri versiyon kontrollüdür.',
    metrics: [
      ['Toplam', '142'],
      ['Uygun', '23'],
      ['Rezerve', '8'],
      ['Güncel olmayan', '18'],
    ],
    columns: ['Daire', 'Blok', 'Kat', 'Tip', 'Net', 'Fiyat', 'Durum'],
    rows: [
      ['A-101', 'A', '1', '1+1', '62,5 m²', '₺7.500.000', 'Uygun'],
      ['A-204', 'A', '2', '2+1', '86,5 m²', '₺8.750.000', 'Uygun'],
      ['B-305', 'B', '3', '3+1', '124 m²', '₺11.200.000', 'Rezerve'],
    ],
  },
  leads: {
    eyebrow: 'SATIŞ BORU HATTI',
    title: 'Talepler',
    description: '3 saati aşan yanıtsız: 3',
    metrics: [
      ['Yeni', '12'],
      ['İletişimde', '18'],
      ['Nitelikli', '7'],
      ['Kapandı', '5'],
    ],
    columns: ['Müşteri', 'Proje', 'Daire', 'Dil', 'Geliş', 'Durum'],
    rows: [
      ['Ayşe Demir', 'Nova Başakşehir', '2+1', 'TR', '12 dk', 'Yeni'],
      ['Mehmet Kaya', 'Nova Başakşehir', '3+1', 'TR', '48 dk', 'İletişimde'],
      ['Elena Petrova', 'Vadi Loft', '1+1', 'RU', '2 sa', 'Nitelikli'],
    ],
  },
  broker: {
    eyebrow: 'BROKER MODE',
    title: 'Broker proje listesi',
    description: 'Broker fiyatları ve komisyon bilgileri kamuya açık değildir.',
    metrics: [
      ['Aktif proje', '38'],
      ['Uygun stok', '214'],
      ['Materyal', '96'],
      ['Komisyon', '%3'],
    ],
    columns: [
      'Proje',
      'Public fiyat',
      'Broker fiyat',
      'Komisyon',
      'Stok',
      'Güncelleme',
    ],
    rows: [
      ['Nova Başakşehir', '₺7,5M', '₺7,25M', '%3', '23', 'Bugün'],
      ['Vadi Loft', '₺9,2M', '₺8,95M', '%3', '18', 'Bugün'],
      ['Marmara Terrace', '₺6,8M', '₺6,6M', '%2,5', '9', 'Dün'],
    ],
  },
  admin: {
    eyebrow: 'PLATFORM OPERASYONU',
    title: 'Onay kuyruğu',
    description: 'Son veri taraması bugün 06:00',
    metrics: [
      ['Bekleyen', '17'],
      ['Kritik sorun', '4'],
      ['Güncel proje', '126'],
      ['Broker teklif', '38'],
    ],
    columns: ['Proje', 'Şirket', 'Tür', 'Tamamlanma', 'Gönderim', 'Durum'],
    rows: [
      ['Vadi Loft', 'Vadi GYO', 'Yeni proje', '%96', '2 sa', 'İncelemede'],
      [
        'Marmara Terrace',
        'MRT İnşaat',
        'Güncelleme',
        '%88',
        '5 sa',
        'Eksik veri',
      ],
      ['Aden Bahçeşehir', 'Aden Yapı', 'Yeni proje', '%100', '1 gün', 'Hazır'],
    ],
  },
} satisfies Record<
  Mode,
  {
    eyebrow: string;
    title: string;
    description: string;
    metrics: string[][];
    columns: string[];
    rows: string[][];
  }
>;

export function OperationsScreen({ mode }: { mode: Mode }) {
  const screen = content[mode];
  return (
    <section className="ops-screen">
      <div className="ops-heading">
        <div>
          <span className="eyebrow">{screen.eyebrow}</span>
          <h1>{screen.title}</h1>
          <p>{screen.description}</p>
        </div>
        <button className="button">
          {mode === 'broker'
            ? 'Fiyat listesini indir'
            : mode === 'admin'
              ? 'Veri kalitesi'
              : 'Dışa aktar'}
        </button>
      </div>
      {mode === 'broker' && (
        <p className="privacy-callout">
          Bu ekrandaki fiyat, komisyon ve materyaller yalnız BROKER rolüne
          açıktır; public yanıtlara dahil edilmez.
        </p>
      )}
      {mode === 'inventory' && (
        <p className="warning-callout">
          18 dairenin fiyatı 48 saatten uzun süredir güncellenmedi.
        </p>
      )}
      <div className="metric-grid">
        {screen.metrics.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Son 30 gün</small>
          </article>
        ))}
      </div>
      <div className="ops-card">
        <div className="table-toolbar">
          <button type="button">Tümü</button>
          <button type="button">Güncel</button>
          <button type="button">Aksiyon gerekli</button>
        </div>
        <div className="data-table" role="table">
          <div
            className="data-row data-row--head"
            role="row"
            style={{
              gridTemplateColumns: `repeat(${screen.columns.length}, minmax(8rem, 1fr))`,
            }}
          >
            {screen.columns.map((column) => (
              <b role="columnheader" key={column}>
                {column}
              </b>
            ))}
          </div>
          {screen.rows.map((row) => (
            <div
              className="data-row"
              role="row"
              key={row[0]}
              style={{
                gridTemplateColumns: `repeat(${screen.columns.length}, minmax(8rem, 1fr))`,
              }}
            >
              {row.map((cell, index) => (
                <span role="cell" key={index}>
                  {index === row.length - 1 ? (
                    <i
                      className={
                        cell === 'Uygun' ||
                        cell === 'Güncel' ||
                        cell === 'Hazır'
                          ? 'status-good'
                          : 'status-warn'
                      }
                    >
                      {cell}
                    </i>
                  ) : (
                    cell
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
