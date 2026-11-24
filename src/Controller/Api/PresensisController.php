<?php
declare(strict_types=1);

namespace App\Controller\Api;

use Cake\Http\Response;
use App\Utility\GeoJsonFence;
use InvalidArgumentException;
use Cake\I18n\Date;
use Cake\I18n\Time;
use DateTimeImmutable;
use DateTimeZone;

class PresensisController extends ApiController
{
    /**
     * Statistik Dashboard Fasilitator
     * GET /api/presensis/fasil-dashboard
     *
     * Menghitung statistik presensi dan izin hari ini untuk gedung binaan
     * fasilitator yang sedang login.
     */
    public function fasilDashboard(): Response
    {
        $user = $this->requireAuth('fasil');
        if (!$user) {
            return $this->authErrorResponse;
        }

        $gedung = $this->getFasilGedung($user);
        if (!$gedung) {
            return $this->authErrorResponse;
        }

        $gedungId = (int)$gedung->id;
        $fasilLantai = !empty($user->lantai) ? (int)$user->lantai : null;
        $kamarIds = $this->getKamarIdsByGedung($gedungId, $fasilLantai);
        $totalKamar = count($kamarIds);

        $penghuniIds = $this->getPenghuniUserIdsByGedung($gedungId, $fasilLantai);
        $totalPenghuni = count($penghuniIds);

        // Tanggal dan waktu lokal Indonesia (WIB)
        $now = new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta'));
        $today = $now->format('Y-m-d');
        $currentTime = $now->format('H:i');

        $izinsTable = $this->fetchTable('Izins');

        // 1. Izin disetujui yang aktif pada hari ini
        $approvedIzinsToday = empty($penghuniIds) ? [] : $izinsTable->find()
            ->where([
                'Izins.user_id IN' => $penghuniIds,
                'Izins.status' => 'disetujui',
                'Izins.tanggal_mulai <=' => $today,
                'Izins.tanggal_selesai >=' => $today,
            ])
            ->all();

        $penghuniIzinTodayIds = empty($approvedIzinsToday) ? [] : array_unique($approvedIzinsToday->extract('user_id')->toArray());
        $totalIzinToday = count($penghuniIzinTodayIds);

        // 2. Permohonan izin berstatus pending di gedung binaan
        $pendingIzins = empty($penghuniIds) ? [] : $izinsTable->find()
            ->where([
                'Izins.user_id IN' => $penghuniIds,
                'Izins.status' => 'pending',
            ])
            ->contain(['Users' => ['Kamars']])
            ->orderBy(['Izins.created_at' => 'ASC'])
            ->all();

        $totalPendingIzin = count($pendingIzins);

        // 3. Catatan presensi hari ini
        $presensisTable = $this->fetchTable('Presensis');
        $presensiToday = empty($penghuniIds) ? [] : $presensisTable->find()
            ->where([
                'Presensis.user_id IN' => $penghuniIds,
                'Presensis.tanggal' => $today,
            ])
            ->all();

        $subuhHadirIds = [];
        $subuhTerlambatIds = [];
        $malamHadirIds = [];
        $malamTerlambatIds = [];

        foreach ($presensiToday as $p) {
            $sesi = strtolower((string)$p->sesi);
            $status = strtolower((string)$p->status);
            $uid = (int)$p->user_id;

            if ($sesi === 'subuh') {
                if ($status === 'hadir') {
                    $subuhHadirIds[$uid] = true;
                } elseif ($status === 'terlambat') {
                    $subuhTerlambatIds[$uid] = true;
                }
            } elseif ($sesi === 'malam') {
                if ($status === 'hadir') {
                    $malamHadirIds[$uid] = true;
                } elseif ($status === 'terlambat') {
                    $malamTerlambatIds[$uid] = true;
                }
            }
        }

        // Perhitungan sesi Subuh
        $subuhAttendedUsers = $subuhHadirIds + $subuhTerlambatIds;
        $totalSubuhHadir = count($subuhAttendedUsers);
        $subuhIzinCount = count(array_diff($penghuniIzinTodayIds, array_keys($subuhAttendedUsers)));
        $subuhBelumPresensi = max(0, $totalPenghuni - $totalSubuhHadir - $subuhIzinCount);
        $subuhPersen = $totalPenghuni > 0 ? round(($totalSubuhHadir / $totalPenghuni) * 100, 1) : 0.0;

        // Perhitungan sesi Malam
        $malamAttendedUsers = $malamHadirIds + $malamTerlambatIds;
        $totalMalamHadir = count($malamAttendedUsers);
        $malamIzinCount = count(array_diff($penghuniIzinTodayIds, array_keys($malamAttendedUsers)));
        $malamBelumPresensi = max(0, $totalPenghuni - $totalMalamHadir - $malamIzinCount);
        $malamPersen = $totalPenghuni > 0 ? round(($totalMalamHadir / $totalPenghuni) * 100, 1) : 0.0;

        // Ringkasan global hari ini
        $allAttendedTodayUsers = $subuhAttendedUsers + $malamAttendedUsers;
        $totalHadirHariIni = count($allAttendedTodayUsers);
        $totalBelumHariIni = max(0, $totalPenghuni - $totalHadirHariIni - $totalIzinToday);
        $persentaseHariIni = $totalPenghuni > 0 ? round(($totalHadirHariIni / $totalPenghuni) * 100, 1) : 0.0;

        // Penentuan sesi aktif saat ini
        $sesiAktif = null;
        if ($currentTime >= '04:00' && $currentTime <= '06:00') {
            $sesiAktif = 'subuh';
        } elseif ($currentTime >= '18:00' && $currentTime <= '20:30') {
            $sesiAktif = 'malam';
        }

        // Format daftar ringkas 5 izin pending untuk widget dashboard
        $pendingPermitsList = [];
        foreach ($pendingIzins as $izin) {
            if (count($pendingPermitsList) >= 5) {
                break;
            }

            $tglMulai = ($izin->tanggal_mulai instanceof \DateTimeInterface)
                ? $izin->tanggal_mulai->format('d-m-Y')
                : (string)$izin->tanggal_mulai;
            $tglSelesai = ($izin->tanggal_selesai instanceof \DateTimeInterface)
                ? $izin->tanggal_selesai->format('d-m-Y')
                : (string)$izin->tanggal_selesai;

            $pendingPermitsList[] = [
                'id' => $izin->id,
                'user_id' => $izin->user_id,
                'nama' => $izin->user ? $izin->user->nama : '-',
                'nim' => $izin->user ? $izin->user->nim : '-',
                'kamar' => ($izin->user && $izin->user->kamar) ? $izin->user->kamar->nomor_kamar : '-',
                'jenis' => $izin->jenis_izin,
                'periode' => $tglMulai . ' s/d ' . $tglSelesai,
                'alasan' => $izin->keterangan,
                'file' => $izin->bukti_file,
                'fileUrl' => '/' . ltrim((string)$izin->bukti_file, '/'),
                'created_at' => ($izin->created_at instanceof \DateTimeInterface)
                    ? $izin->created_at->format('d-m-Y H:i')
                    : (string)$izin->created_at,
            ];
        }

        return $this->jsonSuccess([
            'gedung' => [
                'id' => $gedung->id,
                'nama' => $gedung->nama,
                'total_kamar' => $totalKamar,
            ],
            'tanggal' => $today,
            'waktu_server' => $now->format('H:i:s'),
            'sesi_aktif' => $sesiAktif,
            'ringkasan' => [
                'total_penghuni' => $totalPenghuni,
                'total_kamar' => $totalKamar,
                'total_hadir_hari_ini' => $totalHadirHariIni,
                'total_belum_hari_ini' => $totalBelumHariIni,
                'total_izin_hari_ini' => $totalIzinToday,
                'persentase_kehadiran' => $persentaseHariIni,
                'total_izin_pending' => $totalPendingIzin,
            ],
            'subuh' => [
                'label' => 'Subuh (04.00 - 06.00 WIB)',
                'hadir' => $totalSubuhHadir,
                'terlambat' => count($subuhTerlambatIds),
                'izin' => $subuhIzinCount,
                'belum_presensi' => $subuhBelumPresensi,
                'persentase' => $subuhPersen,
            ],
            'malam' => [
                'label' => 'Malam (18.00 - 20.30 WIB)',
                'hadir' => $totalMalamHadir,
                'terlambat' => count($malamTerlambatIds),
                'izin' => $malamIzinCount,
                'belum_presensi' => $malamBelumPresensi,
                'persentase' => $malamPersen,
            ],
            'pending_permits' => $pendingPermitsList,
        ]);
    }

    /**
     * Monitoring Presensi Fasilitator & Admin
     * GET /api/presensis/monitoring
     *
     * Menampilkan daftar presensi mahasiswa dengan filter tanggal, sesi, kamar, status, dan pencarian.
     * Untuk role fasilitator, data otomatis dibatasi hanya untuk gedung binaannya.
     */
    public function monitoring(): Response
    {
        $user = $this->requireAuth(['fasil', 'admin']);
        if (!$user) {
            return $this->authErrorResponse;
        }

        $presensisTable = $this->fetchTable('Presensis');
        $query = $presensisTable->find()
            ->contain([
                'Users' => [
                    'Kamars' => [
                        'Gedungs'
                    ]
                ]
            ]);

        $gedungInfo = null;
        $kamarsList = [];

        if ($user->role === 'fasil') {
            $gedung = $this->getFasilGedung($user);
            if (!$gedung) {
                return $this->authErrorResponse;
            }

            $gedungInfo = [
                'id' => $gedung->id,
                'nama' => $gedung->nama,
            ];

            $fasilLantai = !empty($user->lantai) ? (int)$user->lantai : null;
            $penghuniIds = $this->getPenghuniUserIdsByGedung((int)$gedung->id, $fasilLantai);
            if (empty($penghuniIds)) {
                return $this->jsonSuccess([
                    'gedung' => $gedungInfo,
                    'kamars' => [],
                    'total' => 0,
                    'data' => [],
                ]);
            }

            $query->where(['Presensis.user_id IN' => $penghuniIds]);

            // Ambil daftar nomor kamar di gedung binaan untuk opsi dropdown
            $kamarsTable = $this->fetchTable('Kamars');
            $kamarsList = $kamarsTable->find()
                ->select(['id', 'nomor_kamar'])
                ->where(['Kamars.gedung_id' => $gedung->id])
                ->orderBy(['Kamars.nomor_kamar' => 'ASC'])
                ->all()
                ->map(fn($k) => [
                    'id' => $k->id,
                    'nomor_kamar' => $k->nomor_kamar,
                ])
                ->toArray();
        } else {
            // Admin: ambil semua kamar untuk opsi filter
            $kamarsTable = $this->fetchTable('Kamars');
            $kamarsList = $kamarsTable->find()
                ->select(['id', 'nomor_kamar', 'gedung_id'])
                ->orderBy(['Kamars.nomor_kamar' => 'ASC'])
                ->all()
                ->map(fn($k) => [
                    'id' => $k->id,
                    'nomor_kamar' => $k->nomor_kamar,
                ])
                ->toArray();
        }

        // Filter tanggal (format YYYY-MM-DD)
        $tanggalParam = $this->request->getQuery('tanggal');
        if (!empty($tanggalParam) && $tanggalParam !== 'Semua' && $tanggalParam !== 'all') {
            $query->where(['Presensis.tanggal' => $tanggalParam]);
        }

        // Filter sesi (Subuh / Malam)
        $sesiParam = $this->request->getQuery('sesi');
        if (!empty($sesiParam) && $sesiParam !== 'Semua' && $sesiParam !== 'all') {
            $query->where(['LOWER(Presensis.sesi)' => strtolower($sesiParam)]);
        }

        // Filter status kehadiran (hadir, terlambat, izin, alpa)
        $statusParam = $this->request->getQuery('status');
        if (!empty($statusParam) && $statusParam !== 'Semua' && $statusParam !== 'all') {
            $query->where(['LOWER(Presensis.status)' => strtolower($statusParam)]);
        }

        // Filter kamar (bisa via id atau nomor kamar)
        $kamarParam = $this->request->getQuery('kamar_id') ?: $this->request->getQuery('kamar');
        if (!empty($kamarParam) && $kamarParam !== 'Semua' && $kamarParam !== 'all') {
            if (is_numeric($kamarParam)) {
                $query->where(['Users.kamar_id' => (int)$kamarParam]);
            } else {
                $query->matching('Users.Kamars', function ($q) use ($kamarParam) {
                    return $q->where(['Kamars.nomor_kamar' => $kamarParam]);
                });
            }
        }

        // Filter pencarian teks (Nama atau NIM)
        $search = trim((string)($this->request->getQuery('search') ?: $this->request->getQuery('q')));
        if ($search !== '') {
            $query->where([
                'OR' => [
                    'Users.nama LIKE' => '%' . $search . '%',
                    'Users.nim LIKE' => '%' . $search . '%',
                ],
            ]);
        }

        $query->orderBy([
            'Presensis.tanggal' => 'DESC',
            'Presensis.waktu' => 'DESC',
            'Presensis.id' => 'DESC',
        ]);

        $results = $query->all();

        $formattedData = [];
        foreach ($results as $p) {
            $waktuStr = '-';
            if (is_object($p->waktu) && method_exists($p->waktu, 'format')) {
                $waktuStr = $p->waktu->format('H:i') . ' WIB';
            } elseif (!empty($p->waktu)) {
                $waktuStr = substr((string)$p->waktu, 0, 5) . ' WIB';
            }

            $tanggalStr = '';
            if (is_object($p->tanggal) && method_exists($p->tanggal, 'format')) {
                $tanggalStr = $p->tanggal->format('Y-m-d');
            } else {
                $tanggalStr = substr((string)$p->tanggal, 0, 10);
            }

            $latLong = '-';
            if ($p->lat !== null && $p->long !== null && (float)$p->lat != 0.0 && (float)$p->long != 0.0) {
                $latLong = $p->lat . ', ' . $p->long;
            }

            $fotoUrl = null;
            if (!empty($p->foto_wajah)) {
                $fotoUrl = str_starts_with((string)$p->foto_wajah, 'http')
                    ? (string)$p->foto_wajah
                    : '/' . ltrim((string)$p->foto_wajah, '/');
            }

            $formattedData[] = [
                'id' => $p->id,
                'user_id' => $p->user_id,
                'nama' => $p->user ? $p->user->nama : '-',
                'nim' => $p->user ? $p->user->nim : '-',
                'kamar' => ($p->user && $p->user->kamar) ? $p->user->kamar->nomor_kamar : '-',
                'kamar_id' => $p->user ? $p->user->kamar_id : null,
                'gedung' => ($p->user && $p->user->kamar && $p->user->kamar->gedung) ? $p->user->kamar->gedung->nama : ($gedungInfo['nama'] ?? '-'),
                'sesi' => ucfirst(strtolower((string)$p->sesi)),
                'tanggal' => $tanggalStr,
                'waktu' => $waktuStr,
                'status' => strtolower((string)$p->status),
                'lat' => $p->lat,
                'long' => $p->long,
                'latLong' => $latLong,
                'foto' => $fotoUrl,
                'foto_wajah' => $fotoUrl,
                'catatan' => $p->keterangan ?? '',
                'keterangan' => $p->keterangan ?? '',
                'created_at' => ($p->created_at instanceof \DateTimeInterface)
                    ? $p->created_at->format('Y-m-d H:i:s')
                    : (string)$p->created_at,
            ];
        }

        return $this->jsonSuccess([
            'gedung' => $gedungInfo,
            'kamars' => $kamarsList,
            'total' => count($formattedData),
            'data' => $formattedData,
        ]);
    }

    /**
     * Detail Catatan Presensi
     * GET /api/presensis/monitoring/{id}
     *
     * Menampilkan detail lengkap sebuah catatan presensi.
     * Memverifikasi apakah catatan tersebut berada di gedung binaan fasilitator yang sedang login.
     */
    public function monitoringDetail(string $id): Response
    {
        $user = $this->requireAuth(['fasil', 'admin']);
        if (!$user) {
            return $this->authErrorResponse;
        }

        $presensisTable = $this->fetchTable('Presensis');
        $p = $presensisTable->find()
            ->where(['Presensis.id' => $id])
            ->contain([
                'Users' => [
                    'Kamars' => [
                        'Gedungs'
                    ]
                ]
            ])
            ->first();

        if (!$p) {
            return $this->jsonError('Data presensi tidak ditemukan.', 404);
        }

        // Pengecekan scope gedung untuk fasilitator
        if ($user->role === 'fasil') {
            $gedung = $this->getFasilGedung($user);
            if (!$gedung) {
                return $this->authErrorResponse;
            }

            $userGedungId = $p->user?->kamar?->gedung_id;
            if ((int)$userGedungId !== (int)$gedung->id) {
                return $this->jsonError('Anda tidak memiliki hak akses untuk data presensi di luar gedung binaan Anda.', 403);
            }
        }

        $waktuStr = '-';
        if ($p->waktu instanceof \DateTimeInterface) {
            $waktuStr = $p->waktu->format('H:i') . ' WIB';
        } elseif (!empty($p->waktu)) {
            $waktuStr = substr((string)$p->waktu, 0, 5) . ' WIB';
        }

        $tanggalStr = '';
        if ($p->tanggal instanceof \DateTimeInterface) {
            $tanggalStr = $p->tanggal->format('Y-m-d');
        } else {
            $tanggalStr = (string)$p->tanggal;
        }

        $latLong = '-';
        if ($p->lat !== null && $p->long !== null && (float)$p->lat != 0.0 && (float)$p->long != 0.0) {
            $latLong = $p->lat . ', ' . $p->long;
        }

        $fotoUrl = null;
        if (!empty($p->foto_wajah)) {
            $fotoUrl = str_starts_with((string)$p->foto_wajah, 'http')
                ? (string)$p->foto_wajah
                : '/' . ltrim((string)$p->foto_wajah, '/');
        }

        return $this->jsonSuccess([
            'id' => $p->id,
            'user_id' => $p->user_id,
            'nama' => $p->user ? $p->user->nama : '-',
            'nim' => $p->user ? $p->user->nim : '-',
            'email' => $p->user ? $p->user->email : '-',
            'kamar' => ($p->user && $p->user->kamar) ? $p->user->kamar->nomor_kamar : '-',
            'kamar_id' => $p->user ? $p->user->kamar_id : null,
            'gedung' => ($p->user && $p->user->kamar && $p->user->kamar->gedung) ? $p->user->kamar->gedung->nama : '-',
            'sesi' => ucfirst(strtolower((string)$p->sesi)),
            'tanggal' => $tanggalStr,
            'waktu' => $waktuStr,
            'status' => strtolower((string)$p->status),
            'lat' => $p->lat,
            'long' => $p->long,
            'latLong' => $latLong,
            'foto' => $fotoUrl,
            'foto_wajah' => $fotoUrl,
            'catatan' => $p->keterangan ?? '',
            'keterangan' => $p->keterangan ?? '',
            'created_at' => ($p->created_at instanceof \DateTimeInterface)
                ? $p->created_at->format('Y-m-d H:i:s')
                : (string)$p->created_at,
        ]);
    }

    /**
     * Laporan Rekap Presensi Fasilitator & Admin
     * GET /api/presensis/laporan
     *
     * Menampilkan rekapitulasi presensi penghuni berdasarkan gedung binaan
     * dengan filter rentang tanggal, sesi, kamar, dan pencarian.
     */
    public function laporan(): Response
    {
        $this->request->allowMethod(['get', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $user = $this->requireAuth(['fasil', 'admin']);
        if (!$user) {
            return $this->authErrorResponse;
        }

        try {
        $presensisTable = $this->fetchTable('Presensis');
        $query = $presensisTable->find()
            ->contain([
                'Users' => [
                    'joinType' => 'LEFT',
                    'Kamars' => [
                        'joinType' => 'LEFT',
                        'Gedungs' => [
                            'joinType' => 'LEFT',
                        ],
                    ],
                ],
            ]);

        $gedungInfo = null;
        $kamarsList = [];

        if ($user->role === 'fasil') {
            $gedung = $this->getFasilGedung($user);
            if (!$gedung) {
                return $this->authErrorResponse;
            }

            $gedungInfo = [
                'id' => $gedung->id,
                'nama' => $gedung->nama,
            ];

            $fasilLantai = !empty($user->lantai) ? (int)$user->lantai : null;
            $penghuniIds = $this->getPenghuniUserIdsByGedung((int)$gedung->id, $fasilLantai);
            if (empty($penghuniIds)) {
                return $this->jsonSuccess([
                    'gedung' => $gedungInfo,
                    'kamars' => [],
                    'ringkasan' => [
                        'total_presensi' => 0,
                        'jumlah_hadir' => 0,
                        'jumlah_terlambat' => 0,
                        'total_hadir' => 0,
                        'jumlah_izin' => 0,
                        'jumlah_tidak_hadir' => 0,
                        'persentase_kehadiran' => 0.0,
                    ],
                    'filter_terpasang' => [
                        'start_date' => $this->request->getQuery('start_date') ?: $this->request->getQuery('tanggal_mulai'),
                        'end_date' => $this->request->getQuery('end_date') ?: $this->request->getQuery('tanggal_akhir'),
                        'sesi' => $this->request->getQuery('sesi') ?: 'Semua',
                        'kamar' => $this->request->getQuery('kamar') ?: 'Semua',
                    ],
                    'data' => [],
                ]);
            }

            $query->where(['Presensis.user_id IN' => $penghuniIds]);

            // Ambil daftar nomor kamar di gedung binaan untuk opsi dropdown filter
            $kamarsTable = $this->fetchTable('Kamars');
            $kamarsList = $kamarsTable->find()
                ->select(['id', 'nomor_kamar'])
                ->where(['Kamars.gedung_id' => $gedung->id])
                ->orderBy(['Kamars.nomor_kamar' => 'ASC'])
                ->all()
                ->map(fn($k) => [
                    'id' => $k->id,
                    'nomor_kamar' => $k->nomor_kamar,
                ])
                ->toArray();
        } else {
            // Admin: opsional filter gedung_id dan ambil daftar kamar
            $gedungIdParam = $this->request->getQuery('gedung_id');
            if (!empty($gedungIdParam) && $gedungIdParam !== 'all' && $gedungIdParam !== 'Semua') {
                $gedungsTable = $this->fetchTable('Gedungs');
                $gedungRow = $gedungsTable->find()->where(['Gedungs.id' => (int)$gedungIdParam])->first();
                if ($gedungRow !== null) {
                    $gedungInfo = [
                        'id' => $gedungRow->id,
                        'nama' => $gedungRow->nama,
                    ];
                }
                $penghuniIds = $this->getPenghuniUserIdsByGedung((int)$gedungIdParam);
                if (empty($penghuniIds)) {
                    return $this->jsonSuccess([
                        'gedung' => $gedungInfo,
                        'kamars' => [],
                        'ringkasan' => [
                            'total_presensi' => 0,
                            'jumlah_hadir' => 0,
                            'jumlah_terlambat' => 0,
                            'total_hadir' => 0,
                            'jumlah_izin' => 0,
                            'jumlah_tidak_hadir' => 0,
                            'persentase_kehadiran' => 0.0,
                        ],
                        'rekap_mahasiswa' => [],
                        'rekap_gedung' => [],
                        'filter_terpasang' => [
                            'start_date' => $this->request->getQuery('start_date') ?: $this->request->getQuery('tanggal_mulai'),
                            'end_date' => $this->request->getQuery('end_date') ?: $this->request->getQuery('tanggal_akhir'),
                            'sesi' => $this->request->getQuery('sesi') ?: 'Semua',
                            'kamar' => $this->request->getQuery('kamar') ?: 'Semua',
                            'gedung_id' => $gedungIdParam,
                        ],
                        'data' => [],
                    ]);
                }
                $query->where(['Presensis.user_id IN' => $penghuniIds]);
            }

            $kamarsTable = $this->fetchTable('Kamars');
            $kamarsQuery = $kamarsTable->find()
                ->select(['id', 'nomor_kamar', 'gedung_id'])
                ->orderBy(['Kamars.nomor_kamar' => 'ASC']);
            if (!empty($gedungIdParam) && $gedungIdParam !== 'all' && $gedungIdParam !== 'Semua') {
                $kamarsQuery->where(['Kamars.gedung_id' => (int)$gedungIdParam]);
            }
            $kamarsList = $kamarsQuery->all()
                ->map(fn($k) => [
                    'id' => $k->id,
                    'nomor_kamar' => $k->nomor_kamar,
                ])
                ->toArray();
        }

        // Filter rentang tanggal
        $startDate = $this->request->getQuery('start_date') ?: $this->request->getQuery('tanggal_mulai');
        $endDate = $this->request->getQuery('end_date') ?: $this->request->getQuery('tanggal_akhir');

        if (!empty($startDate)) {
            $query->where(['Presensis.tanggal >=' => $startDate]);
        }
        if (!empty($endDate)) {
            $query->where(['Presensis.tanggal <=' => $endDate]);
        }

        // Filter sesi (Subuh / Malam)
        $sesiParam = $this->request->getQuery('sesi');
        if (!empty($sesiParam) && $sesiParam !== 'Semua' && $sesiParam !== 'all') {
            $query->where(['LOWER(Presensis.sesi)' => strtolower($sesiParam)]);
        }

        // Filter status kehadiran jika ada
        $statusParam = $this->request->getQuery('status');
        if (!empty($statusParam) && $statusParam !== 'Semua' && $statusParam !== 'all') {
            $query->where(['LOWER(Presensis.status)' => strtolower($statusParam)]);
        }

        // Filter kamar
        $kamarParam = $this->request->getQuery('kamar_id') ?: $this->request->getQuery('kamar');
        if (!empty($kamarParam) && $kamarParam !== 'Semua' && $kamarParam !== 'all') {
            if (is_numeric($kamarParam)) {
                $query->where(['Users.kamar_id' => (int)$kamarParam]);
            } else {
                $query->matching('Users.Kamars', function ($q) use ($kamarParam) {
                    return $q->where(['Kamars.nomor_kamar' => $kamarParam]);
                });
            }
        }

        // Filter pencarian teks (Nama atau NIM)
        $search = trim((string)($this->request->getQuery('search') ?: $this->request->getQuery('q')));
        if ($search !== '') {
            $query->where([
                'OR' => [
                    'Users.nama LIKE' => '%' . $search . '%',
                    'Users.nim LIKE' => '%' . $search . '%',
                ],
            ]);
        }

        $query->orderBy([
            'Presensis.tanggal' => 'DESC',
            'Presensis.waktu' => 'DESC',
            'Presensis.id' => 'DESC',
        ]);

        $results = $query->all();

        $jumlahHadir = 0;
        $jumlahTerlambat = 0;
        $jumlahIzin = 0;
        $jumlahTidakHadir = 0;
        $formattedData = [];
        $rekapMahasiswaMap = [];
        $rekapGedungMap = [];

        foreach ($results as $p) {
            $status = strtolower((string)$p->status);
            if ($status === 'hadir') {
                $jumlahHadir++;
            } elseif ($status === 'terlambat') {
                $jumlahTerlambat++;
            } elseif ($status === 'izin') {
                $jumlahIzin++;
            } elseif (in_array($status, ['alpa', 'alfa'], true)) {
                $jumlahTidakHadir++;
            }

            $waktuStr = '-';
            if (is_object($p->waktu) && method_exists($p->waktu, 'format')) {
                $waktuStr = $p->waktu->format('H:i') . ' WIB';
            } elseif (!empty($p->waktu)) {
                $waktuStr = substr((string)$p->waktu, 0, 5) . ' WIB';
            }

            $tanggalStr = '';
            if (is_object($p->tanggal) && method_exists($p->tanggal, 'format')) {
                $tanggalStr = $p->tanggal->format('Y-m-d');
            } else {
                $tanggalStr = substr((string)$p->tanggal, 0, 10);
            }

            $namaUser = $p->user ? $p->user->nama : '-';
            $nimUser = $p->user ? $p->user->nim : '-';
            $kamarUser = ($p->user && $p->user->kamar) ? $p->user->kamar->nomor_kamar : '-';
            $gedungUser = ($p->user && $p->user->kamar && $p->user->kamar->gedung)
                ? $p->user->kamar->gedung->nama
                : ($gedungInfo['nama'] ?? '-');

            $uid = (int)$p->user_id;
            if (!isset($rekapMahasiswaMap[$uid])) {
                $rekapMahasiswaMap[$uid] = [
                    'user_id' => $uid,
                    'nama' => $namaUser,
                    'nim' => $nimUser ?: '-',
                    'gedung' => $gedungUser,
                    'kamar' => $kamarUser,
                    'hadir' => 0,
                    'izin' => 0,
                    'alfa' => 0,
                    'total' => 0,
                    'persentase_hadir' => 0.0,
                ];
            }
            if ($status === 'hadir' || $status === 'terlambat') {
                $rekapMahasiswaMap[$uid]['hadir']++;
            } elseif ($status === 'izin') {
                $rekapMahasiswaMap[$uid]['izin']++;
            } elseif (in_array($status, ['alpa', 'alfa'], true)) {
                $rekapMahasiswaMap[$uid]['alfa']++;
            }
            $rekapMahasiswaMap[$uid]['total']++;

            if (!isset($rekapGedungMap[$gedungUser])) {
                $rekapGedungMap[$gedungUser] = [
                    'gedung' => $gedungUser,
                    'hadir' => 0,
                    'izin' => 0,
                    'alfa' => 0,
                    'total' => 0,
                    'persentase_hadir' => 0.0,
                ];
            }
            if ($status === 'hadir' || $status === 'terlambat') {
                $rekapGedungMap[$gedungUser]['hadir']++;
            } elseif ($status === 'izin') {
                $rekapGedungMap[$gedungUser]['izin']++;
            } elseif (in_array($status, ['alpa', 'alfa'], true)) {
                $rekapGedungMap[$gedungUser]['alfa']++;
            }
            $rekapGedungMap[$gedungUser]['total']++;

            $formattedData[] = [
                'id' => $p->id,
                'user_id' => $p->user_id,
                'nama' => $namaUser,
                'nim' => $nimUser,
                'kamar' => $kamarUser,
                'gedung' => $gedungUser,
                'sesi' => ucfirst(strtolower((string)$p->sesi)),
                'tanggal' => $tanggalStr,
                'waktu' => $waktuStr,
                'status' => $status,
                'keterangan' => $p->keterangan ?? '-',
            ];
        }

        foreach ($rekapMahasiswaMap as &$mRow) {
            $mRow['persentase_hadir'] = $mRow['total'] > 0
                ? round(($mRow['hadir'] / $mRow['total']) * 100, 1)
                : 0.0;
        }
        unset($mRow);

        foreach ($rekapGedungMap as &$gRow) {
            $gRow['persentase_hadir'] = $gRow['total'] > 0
                ? round(($gRow['hadir'] / $gRow['total']) * 100, 1)
                : 0.0;
        }
        unset($gRow);

        $rekapMahasiswa = array_values($rekapMahasiswaMap);
        usort($rekapMahasiswa, static fn($a, $b) => strcmp((string)$a['nama'], (string)$b['nama']));
        $rekapGedung = array_values($rekapGedungMap);
        usort($rekapGedung, static fn($a, $b) => strcmp((string)$a['gedung'], (string)$b['gedung']));

        $totalPresensi = count($formattedData);
        $totalHadirKeseluruhan = $jumlahHadir + $jumlahTerlambat;
        $persentaseKehadiran = $totalPresensi > 0 ? round(($totalHadirKeseluruhan / $totalPresensi) * 100, 1) : 0.0;

        return $this->jsonSuccess([
            'gedung' => $gedungInfo,
            'kamars' => $kamarsList,
            'ringkasan' => [
                'total_presensi' => $totalPresensi,
                'jumlah_hadir' => $jumlahHadir,
                'jumlah_terlambat' => $jumlahTerlambat,
                'total_hadir' => $totalHadirKeseluruhan,
                'jumlah_izin' => $jumlahIzin,
                'jumlah_tidak_hadir' => $jumlahTidakHadir,
                'persentase_kehadiran' => $persentaseKehadiran,
            ],
            'rekap_mahasiswa' => $rekapMahasiswa,
            'rekap_gedung' => $rekapGedung,
            'filter_terpasang' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'sesi' => $sesiParam ?: 'Semua',
                'kamar' => $kamarParam ?: 'Semua',
                'gedung_id' => $this->request->getQuery('gedung_id') ?: 'all',
            ],
            'data' => $formattedData,
        ]);
        } catch (\Throwable $e) {
            return $this->jsonError('Gagal memuat data laporan: ' . $e->getMessage(), 500);
        }
    }
    /**
     * Riwayat Presensi Pengguna
     * GET /api/presensis/my-history
     */
    public function myHistory(): Response
    {
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }
        $this->syncResidentHistory((int)$user->id);

        $presensisTable = $this->fetchTable('Presensis');
        $list = $presensisTable->find()
            ->where(['Presensis.user_id' => $user->id])
            ->orderBy(['Presensis.tanggal' => 'DESC', 'Presensis.id' => 'DESC'])
            ->all();

        return $this->jsonSuccess($list->toArray());
    }

    /**
     * Status Presensi Hari Ini (Dashboard)
     * GET /api/presensis/today-status
     */
    public function todayStatus(): Response
    {
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }
        $this->syncResidentHistory((int)$user->id);

        $presensisTable = $this->fetchTable('Presensis');
        $today = (new \DateTimeImmutable('now', new \DateTimeZone('Asia/Jakarta')))->format('Y-m-d');

        $subuh = $presensisTable->find()
            ->where(['user_id' => $user->id, 'tanggal' => $today, 'sesi' => 'subuh'])
            ->first();

        $malam = $presensisTable->find()
            ->where(['user_id' => $user->id, 'tanggal' => $today, 'sesi' => 'malam'])
            ->first();

        // Periksa apakah ada izin aktif (pending / disetujui) untuk sesi hari ini
        $izinsTable = $this->fetchTable('Izins');
        $activeIzins = $izinsTable->find()
            ->where([
                'user_id' => $user->id,
                'status IN' => ['pending', 'disetujui'],
                'tanggal_mulai <=' => $today,
                'tanggal_selesai >=' => $today
            ])
            ->all();

        $subuhIzinStatus = null;
        $subuhIzinId = null;
        $malamIzinStatus = null;
        $malamIzinId = null;
        foreach ($activeIzins as $iz) {
            if ($iz->sesi === 'semua' || empty($iz->sesi)) {
                $subuhIzinStatus = $iz->status;
                $subuhIzinId = $iz->id;
                $malamIzinStatus = $iz->status;
                $malamIzinId = $iz->id;
            } elseif ($iz->sesi === 'subuh') {
                $subuhIzinStatus = $iz->status;
                $subuhIzinId = $iz->id;
            } elseif ($iz->sesi === 'malam') {
                $malamIzinStatus = $iz->status;
                $malamIzinId = $iz->id;
            }
        }

        $subuhData = $subuh
            ? ['status' => $subuh->status, 'waktu' => $subuh->waktu->format('H:i')]
            : ($subuhIzinStatus ? [
                'status' => $subuhIzinStatus === 'pending' ? 'izin_pending' : 'izin',
                'waktu' => $subuhIzinStatus === 'pending' ? 'Menunggu Verifikasi' : 'Izin Disetujui',
                'izin_id' => $subuhIzinId,
            ] : null);
        $malamData = $malam
            ? ['status' => $malam->status, 'waktu' => $malam->waktu->format('H:i')]
            : ($malamIzinStatus ? [
                'status' => $malamIzinStatus === 'pending' ? 'izin_pending' : 'izin',
                'waktu' => $malamIzinStatus === 'pending' ? 'Menunggu Verifikasi' : 'Izin Disetujui',
                'izin_id' => $malamIzinId,
            ] : null);

        return $this->jsonSuccess([
            'today' => $today,
            'subuh' => $subuhData,
            'malam' => $malamData,
            'jadwal' => $this->scheduleConfig(),
        ]);
    }

    /**
     * Kirim Presensi
     * POST /api/presensis
     */
    public function add(): Response
    {
        $this->request->allowMethod(['post']);
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }
        if ($user->role !== 'penghuni') {
            return $this->jsonError('Hanya penghuni asrama yang dapat mengirim presensi.', 403);
        }

        $presensisTable = $this->fetchTable('Presensis');
        $resident = $this->fetchTable('Users')->find()
            ->where(['Users.id' => $user->id])
            ->contain(['Kamars' => ['Gedungs']])
            ->first();
        if ($resident === null || $resident->kamar === null || $resident->kamar->gedung === null) {
            return $this->jsonError('Pengguna belum memiliki penempatan kamar dan gedung.', 422);
        }
        $gedung = $resident->kamar->gedung;
        if (!$gedung->is_active) {
            return $this->jsonError('Gedung tempat tinggal sedang tidak aktif.', 422);
        }
        if (empty($gedung->geofence_geojson)) {
            return $this->jsonError('Batas geofence gedung belum dikonfigurasi.', 422);
        }

        $data = $this->request->getData();
        $now = new \DateTimeImmutable('now', new \DateTimeZone('Asia/Jakarta'));
        $minutes = ((int)$now->format('G') * 60) + (int)$now->format('i');
        $schedule = $this->scheduleBounds();
        $sesi = match (true) {
            $minutes >= $schedule['subuh_mulai'] && $minutes < $schedule['subuh_selesai'] => 'subuh',
            $minutes >= $schedule['malam_mulai'] && $minutes < $schedule['malam_selesai'] => 'malam',
            default => null,
        };

        if ($sesi === null || ($data['sesi'] ?? null) !== $sesi) {
            return $this->jsonError('Presensi sedang ditutup atau sesi sudah berakhir.', 422);
        }

        if ($presensisTable->exists([
            'user_id' => $user->id,
            'tanggal' => $now->format('Y-m-d'),
            'sesi' => $sesi,
        ])) {
            return $this->jsonError('Presensi ' . $sesi . ' hari ini sudah tercatat.', 409);
        }

        $todayStr = $now->format('Y-m-d');
        $approvedIzin = $this->fetchTable('Izins')->find()
            ->where([
                'user_id' => $user->id,
                'status' => 'disetujui',
                'tanggal_mulai <=' => $todayStr,
                'tanggal_selesai >=' => $todayStr,
                'OR' => [
                    ['sesi IN' => ['semua', $sesi]],
                    ['sesi IS' => null],
                ],
            ])
            ->first();
        if ($approvedIzin !== null) {
            return $this->jsonError(
                'Anda sudah memiliki izin yang disetujui untuk sesi ' . $sesi . ' hari ini.',
                409
            );
        }

        if (
            !isset($data['lat'], $data['long']) ||
            !is_numeric($data['lat']) ||
            !is_numeric($data['long']) ||
            (float)$data['lat'] < -90 ||
            (float)$data['lat'] > 90 ||
            (float)$data['long'] < -180 ||
            (float)$data['long'] > 180
        ) {
            return $this->jsonError('Lokasi perangkat belum tersedia atau tidak valid.', 422);
        }

        try {
            $geometry = GeoJsonFence::parse((string)$gedung->geofence_geojson);
        } catch (InvalidArgumentException $exception) {
            return $this->jsonError('Batas geofence gedung tidak valid.', 422);
        }
        if (!GeoJsonFence::contains($geometry, (float)$data['lat'], (float)$data['long'], 35.0)) {
            return $this->jsonError('Lokasi berada di luar area gedung.', 422);
        }

        $photoData = $data['foto_wajah'] ?? '';
        if (
            !is_string($photoData) ||
            strlen($photoData) > 5_600_000 ||
            !preg_match('/\Adata:image\/jpeg;base64,([A-Za-z0-9+\/=]+)\z/', $photoData, $matches)
        ) {
            return $this->jsonError('Foto kamera tidak valid atau ukurannya terlalu besar.', 422);
        }

        $photoContents = base64_decode($matches[1], true);
        if ($photoContents === false || strlen($photoContents) > 4 * 1024 * 1024) {
            return $this->jsonError('Foto kamera tidak valid atau ukurannya terlalu besar.', 422);
        }

        $imageInfo = getimagesizefromstring($photoContents);
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        if (
            $imageInfo === false ||
            $imageInfo[0] > 4000 ||
            $imageInfo[1] > 4000 ||
            $finfo->buffer($photoContents) !== 'image/jpeg'
        ) {
            return $this->jsonError('Foto harus berupa gambar JPEG yang valid.', 422);
        }

        $uploadDirectory = ROOT . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'presensi';
        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0750, true) && !is_dir($uploadDirectory)) {
            return $this->jsonError('Penyimpanan foto presensi tidak dapat disiapkan.', 500);
        }

        $filename = bin2hex(random_bytes(16)) . '.jpg';
        $photoPath = $uploadDirectory . DIRECTORY_SEPARATOR . $filename;
        if (file_put_contents($photoPath, $photoContents, LOCK_EX) !== strlen($photoContents)) {
            if (is_file($photoPath)) {
                unlink($photoPath);
            }
            return $this->jsonError('Foto presensi gagal disimpan.', 500);
        }

        $data = [
            'user_id' => $user->id,
            'tanggal' => $now->format('Y-m-d'),
            'waktu' => $now->format('H:i:s'),
            'sesi' => $sesi,
            'lat' => $data['lat'],
            'long' => $data['long'],
            'status' => 'hadir',
            'foto_wajah' => $filename,
        ];

        try {
            $presensi = $presensisTable->newEntity($data);
            if ($presensisTable->save($presensi)) {
                // Hapus izin pending pada sesi dan tanggal ini karena penghuni sudah berhasil presensi hadir
                $this->fetchTable('Izins')->deleteAll([
                    'user_id' => $user->id,
                    'status' => 'pending',
                    'tanggal_mulai' => $todayStr,
                    'tanggal_selesai' => $todayStr,
                    'sesi' => $sesi,
                ]);

                return $this->jsonSuccess($presensi->toArray(), 'Presensi berhasil dicatat!', 201);
            }
        } catch (\Throwable $error) {
            unlink($photoPath);
            throw $error;
        }

        unlink($photoPath);
        return $this->jsonError('Gagal mencatat presensi.', 422, $presensi->getErrors());
    }

    /**
     * Foto presensi milik penghuni yang sedang masuk.
     * GET /api/presensis/{id}/photo
     */
    public function photo(string $id): Response
    {
        $this->request->allowMethod(['get']);
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }

        $presensi = $this->fetchTable('Presensis')->find()
            ->where([
                'Presensis.id' => $id,
                'Presensis.user_id' => $user->id,
            ])
            ->first();

        if ($presensi === null || !preg_match('/\A[a-f0-9]{32}\.jpg\z/', (string)$presensi->foto_wajah)) {
            return $this->jsonError('Foto presensi tidak ditemukan.', 404);
        }

        $photoPath = ROOT . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'presensi'
            . DIRECTORY_SEPARATOR . $presensi->foto_wajah;
        if (!is_file($photoPath)) {
            return $this->jsonError('Foto presensi tidak ditemukan.', 404);
        }

        return $this->response->withFile($photoPath, ['download' => false]);
    }

    /**
     * @return array<string, string>
     */
    private function scheduleConfig(): array
    {
        $defaults = [
            'jam_subuh_mulai' => '04:00',
            'jam_subuh_selesai' => '06:00',
            'jam_malam_mulai' => '18:00',
            'jam_malam_selesai' => '20:30',
        ];
        try {
            $record = $this->fetchTable('PengaturanPresensi')->find()->orderBy(['id' => 'ASC'])->first();
            if ($record === null) {
                return $defaults;
            }
            $fmt = static function (mixed $val, string $fallback): string {
                if (is_object($val) && method_exists($val, 'format')) {
                    return (string)$val->format('H:i');
                }
                if (preg_match('/\A([01]\d|2[0-3]):([0-5]\d)/', str_replace('.', ':', (string)$val), $m)) {
                    return $m[1] . ':' . $m[2];
                }

                return $fallback;
            };

            return [
                'jam_subuh_mulai' => $fmt($record->jam_subuh_mulai, $defaults['jam_subuh_mulai']),
                'jam_subuh_selesai' => $fmt($record->jam_subuh_selesai, $defaults['jam_subuh_selesai']),
                'jam_malam_mulai' => $fmt($record->jam_malam_mulai, $defaults['jam_malam_mulai']),
                'jam_malam_selesai' => $fmt($record->jam_malam_selesai, $defaults['jam_malam_selesai']),
            ];
        } catch (\Throwable) {
            return $defaults;
        }
    }

    /**
     * @return array<string, int>
     */
    private function scheduleBounds(): array
    {
        $cfg = $this->scheduleConfig();
        $toMin = static function (string $hhmm): int {
            [$h, $m] = array_map('intval', explode(':', $hhmm));

            return ($h * 60) + $m;
        };

        return [
            'subuh_mulai' => $toMin($cfg['jam_subuh_mulai']),
            'subuh_selesai' => $toMin($cfg['jam_subuh_selesai']),
            'malam_mulai' => $toMin($cfg['jam_malam_mulai']),
            'malam_selesai' => $toMin($cfg['jam_malam_selesai']),
        ];
    }

    /**
     * Sinkronkan izin yang disetujui serta sesi yang terlewat (Alfa) ke dalam tabel presensis
     * agar Riwayat Presensi selalu mencatat Hadir, Izin, maupun Alfa secara lengkap.
     */
    private function syncResidentHistory(int $userId): void
    {
        $presensisTable = $this->fetchTable('Presensis');
        $izinsTable = $this->fetchTable('Izins');

        // 1. Sinkronkan seluruh izin yang sudah disetujui ke tabel presensis
        $approvedIzins = $izinsTable->find()
            ->where([
                'user_id' => $userId,
                'status' => 'disetujui',
            ])
            ->all();

        foreach ($approvedIzins as $izin) {
            $startStr = is_object($izin->tanggal_mulai) && method_exists($izin->tanggal_mulai, 'format')
                ? $izin->tanggal_mulai->format('Y-m-d')
                : substr((string)$izin->tanggal_mulai, 0, 10);
            $endStr = is_object($izin->tanggal_selesai) && method_exists($izin->tanggal_selesai, 'format')
                ? $izin->tanggal_selesai->format('Y-m-d')
                : substr((string)$izin->tanggal_selesai, 0, 10);
            $sessions = ($izin->sesi === 'subuh' || $izin->sesi === 'malam')
                ? [$izin->sesi]
                : ['subuh', 'malam'];

            $current = new \DateTimeImmutable($startStr);
            $end = new \DateTimeImmutable($endStr);
            while ($current <= $end) {
                $dateStr = $current->format('Y-m-d');
                foreach ($sessions as $sesi) {
                    $existing = $presensisTable->find()
                        ->where([
                            'user_id' => $userId,
                            'tanggal' => $dateStr,
                            'sesi' => $sesi,
                        ])
                        ->first();
                    if ($existing === null) {
                        $entity = $presensisTable->newEntity([
                            'user_id' => $userId,
                            'tanggal' => $dateStr,
                            'waktu' => '00:00:00',
                            'sesi' => $sesi,
                            'status' => 'izin',
                            'keterangan' => 'Izin disetujui: ' . ($izin->keterangan ?: $izin->jenis_izin),
                        ]);
                        $presensisTable->save($entity);
                    } elseif (in_array(strtolower((string)$existing->status), ['alpa', 'alfa'], true)) {
                        $existing->status = 'izin';
                        $existing->keterangan = 'Izin disetujui: ' . ($izin->keterangan ?: $izin->jenis_izin);
                        $presensisTable->save($existing);
                    }
                }
                $current = $current->modify('+1 day');
            }
        }

        // 2. Catat otomatis status Alfa ('alpa') untuk setiap sesi yang sudah melewati jam selesai
        $now = new \DateTimeImmutable('now', new \DateTimeZone('Asia/Jakarta'));
        $todayStr = $now->format('Y-m-d');
        $currentMinutes = ((int)$now->format('G') * 60) + (int)$now->format('i');
        $bounds = $this->scheduleBounds();

        // Kumpulkan tanggal yang perlu dievaluasi: hari ini + tanggal yang sudah memiliki aktivitas presensi
        $datesToEvaluate = [$todayStr => true];
        $existingDates = $presensisTable->find()
            ->select(['tanggal'])
            ->where(['user_id' => $userId, 'tanggal <=' => $todayStr])
            ->all();
        foreach ($existingDates as $row) {
            $dStr = is_object($row->tanggal) && method_exists($row->tanggal, 'format')
                ? $row->tanggal->format('Y-m-d')
                : substr((string)$row->tanggal, 0, 10);
            if ($dStr !== '' && $dStr <= $todayStr) {
                $datesToEvaluate[$dStr] = true;
            }
        }

        foreach (array_keys($datesToEvaluate) as $evalDate) {
            $closedSessions = [];
            if ($evalDate < $todayStr) {
                $closedSessions = ['subuh', 'malam'];
            } else {
                if ($currentMinutes >= $bounds['subuh_selesai']) {
                    $closedSessions[] = 'subuh';
                }
                if ($currentMinutes >= $bounds['malam_selesai']) {
                    $closedSessions[] = 'malam';
                }
            }

            foreach ($closedSessions as $closedSesi) {
                if ($presensisTable->exists([
                    'user_id' => $userId,
                    'tanggal' => $evalDate,
                    'sesi' => $closedSesi,
                ])) {
                    continue;
                }

                $hasApprovedPermit = $izinsTable->exists([
                    'user_id' => $userId,
                    'status' => 'disetujui',
                    'tanggal_mulai <=' => $evalDate,
                    'tanggal_selesai >=' => $evalDate,
                    'OR' => [
                        ['sesi IN' => ['semua', $closedSesi]],
                        ['sesi IS' => null],
                    ],
                ]);

                if (!$hasApprovedPermit) {
                    $alpaEntity = $presensisTable->newEntity([
                        'user_id' => $userId,
                        'tanggal' => $evalDate,
                        'waktu' => '00:00:00',
                        'sesi' => $closedSesi,
                        'status' => 'alpa',
                        'keterangan' => 'Tidak melakukan presensi (Melewati batas waktu sesi)',
                    ]);
                    $presensisTable->save($alpaEntity);
                }
            }
        }
    }
}
