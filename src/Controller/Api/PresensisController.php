<?php
declare(strict_types=1);

namespace App\Controller\Api;

use Cake\Http\Response;
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
        $kamarIds = $this->getKamarIdsByGedung($gedungId);
        $totalKamar = count($kamarIds);

        $penghuniIds = $this->getPenghuniUserIdsByGedung($gedungId);
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

            $penghuniIds = $this->getPenghuniUserIdsByGedung((int)$gedung->id);
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

            $penghuniIds = $this->getPenghuniUserIdsByGedung((int)$gedung->id);
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
            // Admin: ambil semua kamar
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

        foreach ($results as $p) {
            $status = strtolower((string)$p->status);
            if ($status === 'hadir') {
                $jumlahHadir++;
            } elseif ($status === 'terlambat') {
                $jumlahTerlambat++;
            } elseif ($status === 'izin') {
                $jumlahIzin++;
            } elseif ($status === 'alpa') {
                $jumlahTidakHadir++;
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

            $formattedData[] = [
                'id' => $p->id,
                'user_id' => $p->user_id,
                'nama' => $p->user ? $p->user->nama : '-',
                'nim' => $p->user ? $p->user->nim : '-',
                'kamar' => ($p->user && $p->user->kamar) ? $p->user->kamar->nomor_kamar : '-',
                'gedung' => ($p->user && $p->user->kamar && $p->user->kamar->gedung) ? $p->user->kamar->gedung->nama : ($gedungInfo['nama'] ?? '-'),
                'sesi' => ucfirst(strtolower((string)$p->sesi)),
                'tanggal' => $tanggalStr,
                'waktu' => $waktuStr,
                'status' => $status,
                'keterangan' => $p->keterangan ?? '-',
            ];
        }

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
            'filter_terpasang' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'sesi' => $sesiParam ?: 'Semua',
                'kamar' => $kamarParam ?: 'Semua',
            ],
            'data' => $formattedData,
        ]);
    }
    /**
     * Riwayat Presensi Pengguna
     * GET /api/presensis/my-history
     */
    public function myHistory(): Response
    {
        $user = $this->requireAuth();
        if (!$user) {
            return $this->authErrorResponse;
        }

        $userId = $user->id;
        $presensisTable = $this->fetchTable('Presensis');

        $list = $presensisTable->find()
            ->where(['Presensis.user_id' => $userId])
            ->orderBy(['Presensis.tanggal' => 'DESC', 'Presensis.waktu' => 'DESC'])
            ->all();

        return $this->jsonSuccess($list->toArray());
    }

    /**
     * Status Presensi Hari Ini (Dashboard)
     * GET /api/presensis/today-status
     */
    public function todayStatus(): Response
    {
        $user = $this->requireAuth();
        if (!$user) {
            return $this->authErrorResponse;
        }

        $userId = $user->id;
        $presensisTable = $this->fetchTable('Presensis');
        $today = date('Y-m-d');

        $subuh = $presensisTable->find()
            ->where(['user_id' => $userId, 'tanggal' => $today, 'sesi' => 'subuh'])
            ->first();

        $malam = $presensisTable->find()
            ->where(['user_id' => $userId, 'tanggal' => $today, 'sesi' => 'malam'])
            ->first();

        return $this->jsonSuccess([
            'today' => $today,
            'subuh' => $subuh ? ['status' => $subuh->status, 'waktu' => $subuh->waktu->format('H:i')] : null,
            'malam' => $malam ? ['status' => $malam->status, 'waktu' => $malam->waktu->format('H:i')] : null
        ]);
    }

    /**
     * Kirim Presensi
     * POST /api/presensis
     */
    public function add(): Response
    {
        $this->request->allowMethod(['post']);
        $user = $this->requireAuth();
        if (!$user) {
            return $this->authErrorResponse;
        }

        $userId = $user->id;
        $presensisTable = $this->fetchTable('Presensis');

        $data = $this->request->getData();
        $data['user_id'] = $userId;
        $data['tanggal'] = $data['tanggal'] ?? date('Y-m-d');
        $data['waktu'] = $data['waktu'] ?? date('H:i:s');

        $presensi = $presensisTable->newEntity($data);
        if ($presensisTable->save($presensi)) {
            return $this->jsonSuccess($presensi->toArray(), 'Presensi berhasil dicatat!', 201);
        }

        return $this->jsonError('Gagal mencatat presensi.', 422, $presensi->getErrors());
    }

    private function getAuthUserId(): int
    {
        $authHeader = $this->request->getHeaderLine('Authorization');
        if (!empty($authHeader) && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $decoded = base64_decode($matches[1]);
            $parts = explode(':', $decoded);
            if (!empty($parts[0])) {
                return (int)$parts[0];
            }
        }
        return 4; // default Ahmad Fauzan jika belum ada token
    }
}
