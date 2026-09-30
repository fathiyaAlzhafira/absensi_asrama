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
        $role = $this->request->getQuery('role');
        $search = $this->request->getQuery('search');

        $usersTable = $this->fetchTable('Users');
        $query = $usersTable->find()->contain(['Kamars' => ['Gedungs']]);

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

        $users = $query->all()->map(function ($u) {
            return [
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
        });

        return $this->jsonSuccess($users->toArray());
    }

    /**
     * Tambah Pengguna Baru (Admin)
     * POST /api/users
     */
    public function add(): Response
    {
        $this->request->allowMethod(['post']);
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
        $usersTable = $this->fetchTable('Users');

        $user = $usersTable->get($id);
        if ($usersTable->delete($user)) {
            return $this->jsonSuccess([], 'Pengguna berhasil dihapus.');
        }

        return $this->jsonError('Gagal menghapus pengguna.', 500);
    }
}
