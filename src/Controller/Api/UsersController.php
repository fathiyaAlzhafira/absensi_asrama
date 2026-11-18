<?php
declare(strict_types=1);

namespace App\Controller\Api;

use Cake\Http\Response;

class UsersController extends ApiController
{
    /**
     * List Users dengan filter role dan search
     * GET /api/users
     */
    public function index(): Response
    {
        $this->request->allowMethod(['get', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $admin = $this->requireAdminUser();
        if ($admin instanceof Response) {
            return $admin;
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

        if (!empty($role) && $role !== 'all') {
            $query->where(['Users.role' => $role]);
        }

        if (!empty($search)) {
            $query->where(['OR' => [
                'Users.nama LIKE' => "%$search%",
                'Users.nim LIKE' => "%$search%",
                'Users.email LIKE' => "%$search%"
            ]]);
        }

        $usersList = [];
        foreach ($query->all() as $u) {
            $usersList[] = [
                'id' => $u->id,
                'nama' => $u->nama,
                'nim' => $u->nim,
                'email' => $u->email,
                'role' => $u->role,
                'asal' => $u->asal,
                'jekel' => $u->jekel,
                'no_hp' => $u->no_hp,
                'kamar_id' => $u->kamar_id,
                'kamar' => $u->kamar ? $u->kamar->nomor_kamar : null,
                'gedung' => ($u->kamar && $u->kamar->gedung) ? $u->kamar->gedung->nama : null,
            ];
        }

        return $this->jsonSuccess($usersList);
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
        if (isset($data['nim']) && $data['nim'] !== '' && $data['nim'] !== null) {
            $data['nim'] = trim((string)$data['nim']);
            if (!preg_match('/\A\d+\z/', $data['nim'])) {
                return $this->jsonError('NIM hanya boleh berisi angka.', 422);
            }
        } else {
            $data['nim'] = null;
        }
        if (empty($data['password'])) {
            $buildingPrefix = 'Asrama';
            if (!empty($data['kamar_id'])) {
                $room = $this->fetchTable('Kamars')->find()
                    ->where(['Kamars.id' => $data['kamar_id']])
                    ->contain(['Gedungs'])
                    ->first();
                if ($room && $room->gedung && !empty($room->gedung->nama)) {
                    $buildingPrefix = preg_replace('/\s+/', '', (string)$room->gedung->nama);
                }
            }
            $defaultRawPassword = $buildingPrefix . ($data['nim'] ?? '123456');
            $data['password'] = password_hash($defaultRawPassword, PASSWORD_DEFAULT);
        } else {
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        $user = $usersTable->newEntity($data);
        if ($usersTable->save($user)) {
            $savedUser = $usersTable->find()
                ->where(['Users.id' => $user->id])
                ->contain(['Kamars' => ['Gedungs']])
                ->first();
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
                'gedung' => ($savedUser && $savedUser->kamar && $savedUser->kamar->gedung) ? $savedUser->kamar->gedung->nama : null,
            ];
            return $this->jsonSuccess($userData, 'Pengguna berhasil ditambahkan.', 201);
        }

        return $this->jsonError('Gagal menambahkan pengguna.', 422, $user->getErrors());
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

        if (array_key_exists('nim', $data)) {
            if ($data['nim'] !== '' && $data['nim'] !== null) {
                $data['nim'] = trim((string)$data['nim']);
                if (!preg_match('/\A\d+\z/', $data['nim'])) {
                    return $this->jsonError('NIM hanya boleh berisi angka.', 422);
                }
            } else {
                $data['nim'] = null;
            }
        }

        if (!empty($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        } else {
            unset($data['password']);
        }

        $user = $usersTable->patchEntity($user, $data);
        if ($usersTable->save($user)) {
            $savedUser = $usersTable->find()
                ->where(['Users.id' => $user->id])
                ->contain(['Kamars' => ['Gedungs']])
                ->first();
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
                'gedung' => ($savedUser && $savedUser->kamar && $savedUser->kamar->gedung) ? $savedUser->kamar->gedung->nama : null,
            ];
            return $this->jsonSuccess($userData, 'Data pengguna berhasil diperbarui.');
        }

        return $this->jsonError('Gagal memperbarui pengguna.', 422, $user->getErrors());
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
