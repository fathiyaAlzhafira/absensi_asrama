<?php
declare(strict_types=1);

namespace App\Controller\Api;

use Cake\Http\Response;

class UsersController extends ApiController
{
    /**
     * List Users dengan filter role dan search
     * GET /api/users
     * - Admin: Dapat melihat semua pengguna atau filter role apa pun.
     * - Fasilitator: Hanya dapat melihat pengguna role 'penghuni' di gedung binaannya.
     */
    public function index(): Response
    {
        $this->request->allowMethod(['get', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $user = $this->requireAuth(['admin', 'fasil']);
        if (!$user) {
            return $this->authErrorResponse;
        }
        $role = $this->request->getQuery('role');
        $search = $this->request->getQuery('search');

        $usersTable = $this->fetchTable('Users');
        $query = $usersTable->find()
            ->contain([
                'Kamars' => [
                    'joinType' => 'LEFT',
                    'Gedungs' => [
                        'joinType' => 'LEFT',
                    ],
                ],
            ])
            ->orderBy(['Users.id' => 'DESC']);

        if ($user->role === 'fasil') {
            // Fasilitator HANYA boleh mengambil data pengguna dengan role 'penghuni'
            if (!empty($role) && $role !== 'penghuni') {
                return $this->jsonError(
                    'Akses ditolak. Fasilitator hanya memiliki wewenang melihat data penghuni.',
                    403
                );
            }

            $gedung = $this->getFasilGedung($user);
            if (!$gedung) {
                return $this->authErrorResponse;
            }

            $penghuniIds = $this->getPenghuniUserIdsByGedung((int)$gedung->id, $user->lantai ? (int)$user->lantai : null);
            if (empty($penghuniIds)) {
                return $this->jsonSuccess([]);
            }

            $query->where([
                'Users.role' => 'penghuni',
                'Users.id IN' => $penghuniIds,
            ]);
        } else {
            // Role Admin: bebas melihat atau memfilter role pengguna
            if (!empty($role) && $role !== 'all') {
                $query->where(['Users.role' => $role]);
            }
        }

        if (!empty($search)) {
            $query->where(['OR' => [
                'Users.nama LIKE' => "%$search%",
                'Users.nim LIKE' => "%$search%",
                'Users.email LIKE' => "%$search%"
            ]]);
        }

        $allGedungsMap = $this->fetchTable('Gedungs')->find()->all()->combine('id', 'nama')->toArray();

        $usersList = [];
        foreach ($query->all() as $u) {
            $fotoProfil = $u->foto_profil;
            $fotoUrl = null;
            if (!empty($fotoProfil)) {
                $fotoUrl = str_starts_with((string)$fotoProfil, 'http')
                    ? (string)$fotoProfil
                    : '/' . ltrim((string)$fotoProfil, '/');
            }

            $gedungNama = null;
            $gedungId = null;
            $lantaiVal = null;

            if ($u->kamar && $u->kamar->gedung) {
                $gedungNama = $u->kamar->gedung->nama;
                $gedungId = $u->kamar->gedung->id;
                $lantaiVal = $u->kamar->lantai;
            } elseif ($u->role === 'fasil') {
                $gedungId = $u->gedung_id;
                if ($gedungId && isset($allGedungsMap[$gedungId])) {
                    $gedungNama = $allGedungsMap[$gedungId];
                } else {
                    $fg = $this->fetchTable('Gedungs')->find()->where(['id_user' => $u->id])->first();
                    if ($fg) {
                        $gedungId = $fg->id;
                        $gedungNama = $fg->nama;
                    }
                }
                $lantaiVal = $u->lantai;
            }

            $usersList[] = [
                'id'          => $u->id,
                'nama'        => $u->nama,
                'nim'         => $u->nim,
                'email'       => $u->email,
                'role'        => $u->role,
                'asal'        => $u->asal,
                'jekel'       => $u->jekel,
                'no_hp'       => $u->no_hp,
                'foto_profil' => $fotoUrl,
                'kamar_id'    => $u->kamar_id,
                'kamar'       => $u->kamar ? $u->kamar->nomor_kamar : null,
                'lantai'      => $lantaiVal,
                'gedung'      => $gedungNama,
                'gedung_id'   => $gedungId,
            ];
        }

        return $this->jsonSuccess($usersList);
    }

    /**
     * Detail Penghuni
     * GET /api/users/{id}/detail
     * - Fasil: hanya untuk penghuni di gedung binaannya
     * - Admin: semua pengguna
     */
    public function detail(string $id): Response
    {
        $auth = $this->requireAuth(['admin', 'fasil']);
        if (!$auth) {
            return $this->authErrorResponse;
        }

        $usersTable = $this->fetchTable('Users');
        $user = $usersTable->find()
            ->where(['Users.id' => $id])
            ->contain(['Kamars' => ['Gedungs']])
            ->first();

        if (!$user) {
            return $this->jsonError('Penghuni tidak ditemukan.', 404);
        }

        // Fasil hanya boleh lihat penghuni di gedung binaannya (dan lantai binaannya jika dispesifikasikan)
        if ($auth->role === 'fasil') {
            if ($user->role !== 'penghuni') {
                return $this->jsonError('Akses ditolak. Hanya data penghuni yang dapat dilihat.', 403);
            }
            $gedung = $this->getFasilGedung($auth);
            if (!$gedung) {
                return $this->authErrorResponse;
            }
            $userGedungId = $user->kamar?->gedung_id ?? $user->gedung_id;
            if ((int)$userGedungId !== (int)$gedung->id) {
                return $this->jsonError('Akses ditolak. Penghuni ini bukan bagian dari gedung binaan Anda.', 403);
            }
            $userLantai = $user->kamar?->lantai ?? $user->lantai;
            if (!empty($auth->lantai) && !empty($userLantai)) {
                if ((int)$userLantai !== (int)$auth->lantai) {
                    return $this->jsonError('Akses ditolak. Penghuni ini bukan bagian dari lantai binaan Anda.', 403);
                }
            }
        }

        $fotoProfil = $user->foto_profil;
        $fotoUrl = null;
        if (!empty($fotoProfil)) {
            $fotoUrl = str_starts_with((string)$fotoProfil, 'http')
                ? (string)$fotoProfil
                : '/' . ltrim((string)$fotoProfil, '/');
        }

        return $this->jsonSuccess([
            'id'          => $user->id,
            'nama'        => $user->nama,
            'nim'         => $user->nim,
            'email'       => $user->email,
            'role'        => $user->role,
            'asal'        => $user->asal,
            'jekel'       => $user->jekel,
            'no_hp'       => $user->no_hp,
            'foto_profil' => $fotoUrl,
            'kamar_id'    => $user->kamar_id,
            'kamar'       => $user->kamar ? $user->kamar->nomor_kamar : null,
            'lantai'      => $user->kamar ? $user->kamar->lantai : null,
            'gedung'      => ($user->kamar && $user->kamar->gedung) ? $user->kamar->gedung->nama : null,
            'gedung_id'   => ($user->kamar && $user->kamar->gedung) ? $user->kamar->gedung->id : null,
        ]);
    }

    /**
     * Riwayat Presensi Penghuni
     * GET /api/users/{id}/presensis
     */
    public function presensis(string $id): Response
    {
        $auth = $this->requireAuth(['admin', 'fasil']);
        if (!$auth) {
            return $this->authErrorResponse;
        }

        // Periksa penghuni & scope gedung
        $usersTable = $this->fetchTable('Users');
        $penghuni = $usersTable->find()
            ->where(['Users.id' => $id])
            ->contain(['Kamars'])
            ->first();

        if (!$penghuni || $penghuni->role !== 'penghuni') {
            return $this->jsonError('Penghuni tidak ditemukan.', 404);
        }

        if ($auth->role === 'fasil') {
            $gedung = $this->getFasilGedung($auth);
            if (!$gedung) {
                return $this->authErrorResponse;
            }
            $userGedungId = $penghuni->kamar?->gedung_id;
            if ((int)$userGedungId !== (int)$gedung->id) {
                return $this->jsonError('Akses ditolak. Penghuni ini bukan bagian dari gedung binaan Anda.', 403);
            }
        }

        $presensisTable = $this->fetchTable('Presensis');
        $list = $presensisTable->find()
            ->where(['Presensis.user_id' => $id])
            ->orderBy(['Presensis.tanggal' => 'DESC', 'Presensis.waktu' => 'DESC'])
            ->all();

        $data = [];
        foreach ($list as $p) {
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

            $data[] = [
                'id'         => $p->id,
                'tanggal'    => $tanggalStr,
                'sesi'       => ucfirst(strtolower((string)$p->sesi)),
                'waktu'      => $waktuStr,
                'status'     => strtolower((string)$p->status),
                'keterangan' => $p->keterangan ?? '',
                'lat'        => $p->lat,
                'long'       => $p->long,
            ];
        }

        return $this->jsonSuccess($data);
    }

    /**
     * Riwayat Izin Penghuni
     * GET /api/users/{id}/izins
     */
    public function izins(string $id): Response
    {
        $auth = $this->requireAuth(['admin', 'fasil']);
        if (!$auth) {
            return $this->authErrorResponse;
        }

        // Periksa penghuni & scope gedung
        $usersTable = $this->fetchTable('Users');
        $penghuni = $usersTable->find()
            ->where(['Users.id' => $id])
            ->contain(['Kamars'])
            ->first();

        if (!$penghuni || $penghuni->role !== 'penghuni') {
            return $this->jsonError('Penghuni tidak ditemukan.', 404);
        }

        if ($auth->role === 'fasil') {
            $gedung = $this->getFasilGedung($auth);
            if (!$gedung) {
                return $this->authErrorResponse;
            }
            $userGedungId = $penghuni->kamar?->gedung_id;
            if ((int)$userGedungId !== (int)$gedung->id) {
                return $this->jsonError('Akses ditolak. Penghuni ini bukan bagian dari gedung binaan Anda.', 403);
            }
        }

        $izinsTable = $this->fetchTable('Izins');
        $list = $izinsTable->find()
            ->where(['Izins.user_id' => $id])
            ->orderBy(['Izins.created_at' => 'DESC'])
            ->all();

        $data = [];
        foreach ($list as $izin) {
            $tglMulai = ($izin->tanggal_mulai instanceof \DateTimeInterface)
                ? $izin->tanggal_mulai->format('Y-m-d')
                : (string)$izin->tanggal_mulai;

            $tglSelesai = ($izin->tanggal_selesai instanceof \DateTimeInterface)
                ? $izin->tanggal_selesai->format('Y-m-d')
                : (string)$izin->tanggal_selesai;

            $createdAt = ($izin->created_at instanceof \DateTimeInterface)
                ? $izin->created_at->format('Y-m-d H:i:s')
                : (string)$izin->created_at;

            $buktiFile = $izin->bukti_file ?? null;
            $buktiUrl = null;
            if (!empty($buktiFile)) {
                $buktiUrl = str_starts_with((string)$buktiFile, 'http')
                    ? (string)$buktiFile
                    : '/' . ltrim((string)$buktiFile, '/');
            }

            $data[] = [
                'id'              => $izin->id,
                'jenis_izin'      => $izin->jenis_izin,
                'tanggal_mulai'   => $tglMulai,
                'tanggal_selesai' => $tglSelesai,
                'keterangan'      => $izin->keterangan,
                'bukti_url'       => $buktiUrl,
                'bukti_file'      => $buktiFile,
                'status'          => $izin->status,
                'catatan_fasil'   => $izin->catatan_fasil ?? '',
                'created_at'      => $createdAt,
            ];
        }

        return $this->jsonSuccess($data);
    }

    /**
     * Tambah Pengguna Baru (Admin)
     * POST /api/users/add
     */
    public function add(): Response
    {
        $this->request->allowMethod(['post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $admin = $this->requireAdminUser();
        if ($admin instanceof Response) {
            return $admin;
        }

        $usersTable = $this->fetchTable('Users');

        $data = $this->request->getData();
        $role = $data['role'] ?? 'penghuni';

        // 1. Validasi Nama
        $nama = trim((string)($data['nama'] ?? ''));
        if ($nama === '') {
            return $this->jsonError('Nama lengkap pengguna wajib diisi.', 422);
        }

        // 2. Validasi Email
        $email = strtolower(trim((string)($data['email'] ?? '')));
        if ($email === '') {
            return $this->jsonError('Email kampus wajib diisi.', 422);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->jsonError('Format email tidak valid. Masukkan alamat email yang lengkap.', 422);
        }

        if ($role === 'penghuni') {
            if (!str_ends_with($email, '@student.unand.ac.id')) {
                return $this->jsonError('Email penghuni asrama wajib menggunakan domain resmi: @student.unand.ac.id (contoh: nama@student.unand.ac.id).', 422);
            }
        }

        // Cek keunikan email
        $dupEmail = $usersTable->find()->where(['email' => $email])->first();
        if ($dupEmail) {
            return $this->jsonError("Email '{$email}' sudah terdaftar pada pengguna lain.", 422);
        }
        $data['email'] = $email;

        // 3. Validasi NIM (Tepat 10 Digit Angka untuk Penghuni)
        if ($role === 'penghuni') {
            $nim = trim((string)($data['nim'] ?? ''));
            if ($nim === '') {
                return $this->jsonError('NIM wajib diisi untuk penghuni asrama.', 422);
            }
            if (!preg_match('/^\d{10}$/', $nim)) {
                return $this->jsonError('NIM penghuni harus terdiri dari tepat 10 digit angka (contoh: 2311521001).', 422);
            }
            $dupNim = $usersTable->find()->where(['nim' => $nim])->first();
            if ($dupNim) {
                return $this->jsonError("NIM '{$nim}' sudah terdaftar pada pengguna lain.", 422);
            }
            $data['nim'] = $nim;
        } else {
            if (!empty($data['nim'])) {
                $nim = trim((string)$data['nim']);
                if (!preg_match('/^\d{10}$/', $nim)) {
                    return $this->jsonError('NIM harus terdiri dari tepat 10 digit angka.', 422);
                }
                $dupNim = $usersTable->find()->where(['nim' => $nim])->first();
                if ($dupNim) {
                    return $this->jsonError("NIM '{$nim}' sudah terdaftar pada pengguna lain.", 422);
                }
                $data['nim'] = $nim;
            } else {
                $data['nim'] = null;
            }
        }

        if (empty($data['password'])) {
            $firstWord = explode(' ', trim($nama))[0] ?? 'User';
            $cleanFirstWord = preg_replace('/[^A-Za-z0-9]/', '', $firstWord) ?: 'User';
            $defaultRawPassword = $cleanFirstWord . ($data['nim'] ?? '123456');
            $data['password'] = password_hash($defaultRawPassword, PASSWORD_DEFAULT);
        } else {
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        // Atur penempatan gedung dan lantai
        if ($role === 'fasil') {
            $data['kamar_id'] = null;
            $data['gedung_id'] = !empty($data['gedung_id']) ? (int)$data['gedung_id'] : null;
            $data['lantai'] = !empty($data['lantai']) ? (int)$data['lantai'] : null;
        } elseif ($role === 'penghuni') {
            if (!empty($data['kamar_id'])) {
                $kamarObj = $this->fetchTable('Kamars')->find()->where(['id' => $data['kamar_id']])->first();
                if ($kamarObj) {
                    $data['gedung_id'] = (int)$kamarObj->gedung_id;
                    $data['lantai'] = (int)$kamarObj->lantai;
                }
            } else {
                $data['gedung_id'] = null;
                $data['lantai'] = null;
            }
        }

        $user = $usersTable->newEntity($data);
        if ($usersTable->save($user)) {
            // Jika role fasil dan gedung_id dipilih, tautkan juga ke tabel gedungs.id_user jika belum terisi
            if ($user->role === 'fasil' && !empty($user->gedung_id)) {
                $gedungsTable = $this->fetchTable('Gedungs');
                $gedungEntity = $gedungsTable->find()->where(['id' => $user->gedung_id])->first();
                if ($gedungEntity && empty($gedungEntity->id_user)) {
                    $gedungEntity->id_user = $user->id;
                    $gedungsTable->save($gedungEntity);
                }
            }

            $savedUser = $usersTable->find()
                ->where(['Users.id' => $user->id])
                ->contain(['Kamars' => ['Gedungs']])
                ->first();

            $fasilGedungNama = null;
            if ($user->role === 'fasil' && !empty($user->gedung_id)) {
                $g = $this->fetchTable('Gedungs')->find()->where(['id' => $user->gedung_id])->first();
                $fasilGedungNama = $g?->nama;
            }

            $userData = [
                'id' => $user->id,
                'nama' => $user->nama,
                'nim' => $user->nim,
                'email' => $user->email,
                'role' => $user->role,
                'asal' => $user->asal,
                'jekel' => $user->jekel,
                'no_hp' => $user->no_hp,
                'kamar_id' => $user->kamar_id,
                'kamar' => ($savedUser && $savedUser->kamar) ? $savedUser->kamar->nomor_kamar : null,
                'lantai' => ($savedUser && $savedUser->kamar) ? $savedUser->kamar->lantai : $user->lantai,
                'gedung' => ($savedUser && $savedUser->kamar && $savedUser->kamar->gedung) ? $savedUser->kamar->gedung->nama : $fasilGedungNama,
                'gedung_id' => $user->gedung_id,
            ];
            return $this->jsonSuccess($userData, 'Pengguna berhasil ditambahkan.', 201);
        }

        $errors = $user->getErrors();
        $errorMsgs = [];
        foreach ($errors as $field => $errList) {
            if (is_array($errList)) {
                $errorMsgs[] = implode(', ', $errList);
            } else {
                $errorMsgs[] = (string)$errList;
            }
        }
        $firstError = !empty($errorMsgs) ? implode('. ', $errorMsgs) : 'Gagal menambahkan pengguna.';
        return $this->jsonError($firstError, 422, $errors);
    }

    /**
     * Update Pengguna
     * PUT /api/users/:id
     */
    public function edit(string $id): Response
    {
        $this->request->allowMethod(['put', 'post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $admin = $this->requireAdminUser();
        if ($admin instanceof Response) {
            return $admin;
        }

        $usersTable = $this->fetchTable('Users');
        $user = $usersTable->get($id);
        $data = $this->request->getData();

        $role = $data['role'] ?? $user->role;

        if (array_key_exists('email', $data)) {
            $email = strtolower(trim((string)$data['email']));
            if ($email === '') {
                return $this->jsonError('Email kampus tidak boleh kosong.', 422);
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return $this->jsonError('Format email tidak valid. Masukkan alamat email yang lengkap.', 422);
            }
            if ($role === 'penghuni' && !str_ends_with($email, '@student.unand.ac.id')) {
                return $this->jsonError('Email penghuni asrama wajib menggunakan domain resmi: @student.unand.ac.id.', 422);
            }
            $dupEmail = $usersTable->find()->where(['email' => $email, 'id !=' => $id])->first();
            if ($dupEmail) {
                return $this->jsonError("Email '{$email}' sudah digunakan oleh pengguna lain.", 422);
            }
            $data['email'] = $email;
        }

        if (array_key_exists('nim', $data)) {
            if ($data['nim'] !== '' && $data['nim'] !== null) {
                $nim = trim((string)$data['nim']);
                if (!preg_match('/^\d{10}$/', $nim)) {
                    return $this->jsonError('NIM harus terdiri dari tepat 10 digit angka (contoh: 2311521001).', 422);
                }
                $dupNim = $usersTable->find()->where(['nim' => $nim, 'id !=' => $id])->first();
                if ($dupNim) {
                    return $this->jsonError("NIM '{$nim}' sudah digunakan oleh pengguna lain.", 422);
                }
                $data['nim'] = $nim;
            } else {
                if ($role === 'penghuni') {
                    return $this->jsonError('NIM wajib diisi untuk penghuni asrama.', 422);
                }
                $data['nim'] = null;
            }
        }

        if (!empty($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        } else {
            unset($data['password']);
        }

        // Atur penempatan gedung dan lantai
        if ($role === 'fasil') {
            $data['kamar_id'] = null;
            if (array_key_exists('gedung_id', $data)) {
                $data['gedung_id'] = !empty($data['gedung_id']) ? (int)$data['gedung_id'] : null;
            }
            if (array_key_exists('lantai', $data)) {
                $data['lantai'] = !empty($data['lantai']) ? (int)$data['lantai'] : null;
            }
        } elseif ($role === 'penghuni') {
            if (!empty($data['kamar_id'])) {
                $kamarObj = $this->fetchTable('Kamars')->find()->where(['id' => $data['kamar_id']])->first();
                if ($kamarObj) {
                    $data['gedung_id'] = (int)$kamarObj->gedung_id;
                    $data['lantai'] = (int)$kamarObj->lantai;
                }
            } elseif (array_key_exists('kamar_id', $data) && empty($data['kamar_id'])) {
                $data['gedung_id'] = null;
                $data['lantai'] = null;
            }
        }

        $user = $usersTable->patchEntity($user, $data);
        if ($usersTable->save($user)) {
            // Jika role fasil dan gedung_id dipilih, tautkan ke gedungs.id_user jika gedung belum ada fasilnya
            if ($user->role === 'fasil') {
                $gedungsTable = $this->fetchTable('Gedungs');
                if (!empty($user->gedung_id)) {
                    $gedungEntity = $gedungsTable->find()->where(['id' => $user->gedung_id])->first();
                    if ($gedungEntity && (empty($gedungEntity->id_user) || (int)$gedungEntity->id_user === (int)$user->id)) {
                        $gedungEntity->id_user = $user->id;
                        $gedungsTable->save($gedungEntity);
                    }
                }
            }

            $savedUser = $usersTable->find()
                ->where(['Users.id' => $user->id])
                ->contain(['Kamars' => ['Gedungs']])
                ->first();

            $fasilGedungNama = null;
            if ($user->role === 'fasil' && !empty($user->gedung_id)) {
                $g = $this->fetchTable('Gedungs')->find()->where(['id' => $user->gedung_id])->first();
                $fasilGedungNama = $g?->nama;
            }

            $userData = [
                'id' => $user->id,
                'nama' => $user->nama,
                'nim' => $user->nim,
                'email' => $user->email,
                'role' => $user->role,
                'asal' => $user->asal,
                'jekel' => $user->jekel,
                'no_hp' => $user->no_hp,
                'kamar_id' => $user->kamar_id,
                'kamar' => ($savedUser && $savedUser->kamar) ? $savedUser->kamar->nomor_kamar : null,
                'lantai' => ($savedUser && $savedUser->kamar) ? $savedUser->kamar->lantai : $user->lantai,
                'gedung' => ($savedUser && $savedUser->kamar && $savedUser->kamar->gedung) ? $savedUser->kamar->gedung->nama : $fasilGedungNama,
                'gedung_id' => $user->gedung_id,
            ];
            return $this->jsonSuccess($userData, 'Data pengguna berhasil diperbarui.');
        }

        $errors = $user->getErrors();
        $errorMsgs = [];
        foreach ($errors as $field => $errList) {
            if (is_array($errList)) {
                $errorMsgs[] = implode(', ', $errList);
            } else {
                $errorMsgs[] = (string)$errList;
            }
        }
        $firstError = !empty($errorMsgs) ? implode('. ', $errorMsgs) : 'Gagal memperbarui pengguna.';
        return $this->jsonError($firstError, 422, $errors);
    }

    /**
     * Hapus Pengguna
     * DELETE /api/users/:id
     */
    public function delete(string $id): Response
    {
        $this->request->allowMethod(['delete', 'post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $admin = $this->requireAdminUser();
        if ($admin instanceof Response) {
            return $admin;
        }

        $usersTable = $this->fetchTable('Users');
        $user = $usersTable->get($id);
        if ($usersTable->delete($user)) {
            return $this->jsonSuccess([], 'Pengguna berhasil dihapus.');
        }

        return $this->jsonError('Gagal menghapus pengguna.', 500);
    }
}
