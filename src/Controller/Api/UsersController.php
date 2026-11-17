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
        $user = $this->requireAuth(['admin', 'fasil']);
        if (!$user) {
            return $this->authErrorResponse;
        }

        $role = $this->request->getQuery('role');
        $search = $this->request->getQuery('search');

        $usersTable = $this->fetchTable('Users');
        $query = $usersTable->find()->contain(['Kamars' => ['Gedungs']]);

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

            $penghuniIds = $this->getPenghuniUserIdsByGedung((int)$gedung->id);
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

        // Sortir
        $query->orderBy(['Users.nama' => 'ASC']);

        $users = $query->all()->map(function ($u) {
            $fotoProfil = $u->foto_profil;
            $fotoUrl = null;
            if (!empty($fotoProfil)) {
                $fotoUrl = str_starts_with((string)$fotoProfil, 'http')
                    ? (string)$fotoProfil
                    : '/' . ltrim((string)$fotoProfil, '/');
            }
            return [
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
                'lantai'      => $u->kamar ? $u->kamar->lantai : null,
                'gedung'      => ($u->kamar && $u->kamar->gedung) ? $u->kamar->gedung->nama : null,
                'gedung_id'   => ($u->kamar && $u->kamar->gedung) ? $u->kamar->gedung->id : null,
            ];
        });

        return $this->jsonSuccess($users->toArray());
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

        // Fasil hanya boleh lihat penghuni di gedung binaannya
        if ($auth->role === 'fasil') {
            if ($user->role !== 'penghuni') {
                return $this->jsonError('Akses ditolak. Hanya data penghuni yang dapat dilihat.', 403);
            }
            $gedung = $this->getFasilGedung($auth);
            if (!$gedung) {
                return $this->authErrorResponse;
            }
            $userGedungId = $user->kamar?->gedung_id;
            if ((int)$userGedungId !== (int)$gedung->id) {
                return $this->jsonError('Akses ditolak. Penghuni ini bukan bagian dari gedung binaan Anda.', 403);
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
     * POST /api/users
     */
    public function add(): Response
    {
        $this->request->allowMethod(['post']);
        $auth = $this->requireAuth('admin');
        if (!$auth) {
            return $this->authErrorResponse;
        }

        $usersTable = $this->fetchTable('Users');

        $data = $this->request->getData();
        if (empty($data['password'])) {
            $data['password'] = password_hash('password123', PASSWORD_DEFAULT);
        } else {
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        $user = $usersTable->newEntity($data);
        if ($usersTable->save($user)) {
            return $this->jsonSuccess($user->toArray(), 'Pengguna berhasil ditambahkan.', 201);
        }

        return $this->jsonError('Gagal menambahkan pengguna.', 422, $user->getErrors());
    }

    /**
     * Update Pengguna
     * PUT /api/users/:id
     */
    public function edit(string $id): Response
    {
        $this->request->allowMethod(['put', 'post']);
        $auth = $this->requireAuth('admin');
        if (!$auth) {
            return $this->authErrorResponse;
        }

        $usersTable = $this->fetchTable('Users');
        $user = $usersTable->get($id);
        $data = $this->request->getData();

        if (!empty($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        } else {
            unset($data['password']);
        }

        $user = $usersTable->patchEntity($user, $data);
        if ($usersTable->save($user)) {
            return $this->jsonSuccess($user->toArray(), 'Data pengguna berhasil diperbarui.');
        }

        return $this->jsonError('Gagal memperbarui pengguna.', 422, $user->getErrors());
    }

    /**
     * Hapus Pengguna
     * DELETE /api/users/:id
     */
    public function delete(string $id): Response
    {
        $this->request->allowMethod(['delete', 'post']);
        $auth = $this->requireAuth('admin');
        if (!$auth) {
            return $this->authErrorResponse;
        }

        $usersTable = $this->fetchTable('Users');
        $user = $usersTable->get($id);
        if ($usersTable->delete($user)) {
            return $this->jsonSuccess([], 'Pengguna berhasil dihapus.');
        }

        return $this->jsonError('Gagal menghapus pengguna.', 500);
    }
}
