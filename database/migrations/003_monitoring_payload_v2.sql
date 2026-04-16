-- SIMOKARDI - Migration 003: Normalisasi payload monitoring ke format v2
-- Jalankan: mysql -u root -p simokardi < database/migrations/003_monitoring_payload_v2.sql

USE simokardi;

-- ===============================
-- POLA MAKAN (string -> object)
-- Format baru:
-- {
--   karbohidrat: { makanan: string, porsi: number },
--   protein: { makanan: string, porsi: number },
--   sayur: { makanan: string, porsi: number },
--   buah: { makanan: string, porsi: number }
-- }
-- ===============================
UPDATE monitoring
SET data_json = JSON_SET(
  data_json,
  '$.karbohidrat',
    IF(
      JSON_TYPE(JSON_EXTRACT(data_json, '$.karbohidrat')) = 'OBJECT',
      JSON_EXTRACT(data_json, '$.karbohidrat'),
      JSON_OBJECT(
        'makanan',
        COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.karbohidrat')), ''),
        'porsi',
        0
      )
    ),
  '$.protein',
    IF(
      JSON_TYPE(JSON_EXTRACT(data_json, '$.protein')) = 'OBJECT',
      JSON_EXTRACT(data_json, '$.protein'),
      JSON_OBJECT(
        'makanan',
        COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.protein')), ''),
        'porsi',
        0
      )
    ),
  '$.sayur',
    IF(
      JSON_TYPE(JSON_EXTRACT(data_json, '$.sayur')) = 'OBJECT',
      JSON_EXTRACT(data_json, '$.sayur'),
      JSON_OBJECT(
        'makanan',
        COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.sayur')), ''),
        'porsi',
        0
      )
    ),
  '$.buah',
    IF(
      JSON_TYPE(JSON_EXTRACT(data_json, '$.buah')) = 'OBJECT',
      JSON_EXTRACT(data_json, '$.buah'),
      JSON_OBJECT(
        'makanan',
        COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.buah')), ''),
        'porsi',
        0
      )
    )
)
WHERE domain = 'pola_makan';

-- ===============================
-- ISTIRAHAT
-- Format lama: jam_tidur
-- Format baru: jam_tidur_siang + jam_tidur_malam
-- ===============================
UPDATE monitoring
SET data_json = JSON_SET(
  data_json,
  '$.jam_tidur_malam',
    COALESCE(
      CAST(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.jam_tidur_malam')) AS DECIMAL(4,1)),
      CAST(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.jam_tidur')) AS DECIMAL(4,1)),
      0
    ),
  '$.jam_tidur_siang',
    COALESCE(
      CAST(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.jam_tidur_siang')) AS DECIMAL(4,1)),
      0
    )
)
WHERE domain = 'istirahat';

-- ===============================
-- AKTIVITAS FISIK
-- Format lama: menit_aktivitas_fisik + menit_olahraga
-- Format baru: kategori_aktivitas_harian (ringan/sedang/berat)
-- ===============================
UPDATE monitoring
SET data_json = JSON_SET(
  data_json,
  '$.kategori_aktivitas_harian',
    COALESCE(
      NULLIF(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.kategori_aktivitas_harian')), ''),
      CASE
        WHEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.menit_aktivitas_fisik')) AS UNSIGNED), 0) >= 150
         AND COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.menit_olahraga')) AS UNSIGNED), 0) >= 75
          THEN 'berat'
        WHEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.menit_aktivitas_fisik')) AS UNSIGNED), 0) >= 150
          OR COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.menit_olahraga')) AS UNSIGNED), 0) >= 75
          THEN 'sedang'
        WHEN COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.menit_aktivitas_fisik')) AS UNSIGNED), 0) > 0
          OR COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(data_json, '$.menit_olahraga')) AS UNSIGNED), 0) > 0
          THEN 'ringan'
        ELSE ''
      END
    )
)
WHERE domain = 'aktivitas_fisik';

