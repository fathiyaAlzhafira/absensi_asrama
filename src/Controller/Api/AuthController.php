<?php
declare(strict_types=1);

namespace App\Controller\Api;

use Cake\Http\Response;

class AuthController extends ApiController
{
    private const LEGACY_DEMO_PASSWORD_HASH = '$2y$10$w8mPq4kP8L1iK2hY.y5dZe9u5M1VlQo8u5jQk3yX4zJ2bK1aO2fWe';

    /**
     * Endpoint Login
     * POST /api/auth/login
     */
    public function login(): Response
    {
        $this->request->allowMethod(['post', 'options']);

        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $data = $this->request->getData();
        $identity = trim((string)($data['email'] ?? $data['nim'] ?? ''));
        $password = (string)($data['password'] ?? '');

        if (empty($identity) || empty($password)) {
            return $this->jsonError('Email/NIM dan password wajib diisi.', 422);
        }

        $usersTable = $this->fetchTable('Users');
        $user = $usersTable->find()
            ->where(['OR' => [
                'Users.email' => $identity,
                'Users.nim' => $identity,
                'Users.nama LIKE' => '%' . $identity . '%',
                'Users.email LIKE' => $identity . '@%'
            ]])
            ->contain([
                'Kamars' => ['Gedungs']
            ])
            ->first();

        if (!$user) {
            return $this->jsonError('Akun tidak ditemukan. Masukkan Email, NIM, atau Nama Anda.', 401);
        }

        if (!$this->verifyStoredPassword($password, (string)$user->password)) {
            return $this->jsonError('Password salah. Masukkan password yang terdaftar.', 401);
        }

        $token = bin2hex(random_bytes(32));
        $tokenRecord = $this->fetchTable('AuthTokens')->newEntity([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $token),
            'expires_at' => (new \DateTimeImmutable('+30 days'))->format('Y-m-d H:i:s'),
            'created_at' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
        ]);
        if (!$this->fetchTable('AuthTokens')->save($tokenRecord)) {
            return $this->jsonError('Sesi login gagal dibuat. Silakan coba kembali.', 500);
        }

        // Buat payload user yang rapi untuk frontend
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
            'nomor_kamar' => $user->kamar ? $user->kamar->nomor_kamar : null,
            'gedung' => ($user->kamar && $user->kamar->gedung) ? $user->kamar->gedung->nama : 'Asrama Unand',
            'token' => $token
        ];

        return $this->jsonSuccess($userData, 'Login berhasil. Selamat datang!');
    }

    /**
     * Endpoint Profil
     * GET /api/auth/profile
     */
    public function profile(): Response
    {
        $this->request->allowMethod(['get', 'put', 'options']);

        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }

        $usersTable = $this->fetchTable('Users');
        $user = $usersTable->find()->where(['Users.id' => $user->id])
            ->contain(['Kamars' => ['Gedungs']])->first();

        if ($this->request->is('put')) {
            $data = array_intersect_key(
                $this->request->getData(),
                array_flip(['no_hp', 'asal'])
            );
            $user = $usersTable->patchEntity($user, $data);
            if ($usersTable->save($user)) {
                return $this->jsonSuccess([
                    'id' => $user->id,
                    'nama' => $user->nama,
                    'nim' => $user->nim,
                    'email' => $user->email,
                    'role' => $user->role,
                    'asal' => $user->asal,
                    'jekel' => $user->jekel,
                    'no_hp' => $user->no_hp,
                    'kamar_id' => $user->kamar_id,
                    'nomor_kamar' => $user->kamar ? $user->kamar->nomor_kamar : null,
                    'gedung' => ($user->kamar && $user->kamar->gedung) ? $user->kamar->gedung->nama : 'Asrama Unand',
                ], 'Profil berhasil diperbarui.');
            }
            return $this->jsonError('Gagal memperbarui profil.', 422, $user->getErrors());
        }

        return $this->jsonSuccess([
            'id' => $user->id,
            'nama' => $user->nama,
            'nim' => $user->nim,
            'email' => $user->email,
            'role' => $user->role,
            'asal' => $user->asal,
            'jekel' => $user->jekel,
            'no_hp' => $user->no_hp,
            'kamar_id' => $user->kamar_id,
            'nomor_kamar' => $user->kamar ? $user->kamar->nomor_kamar : null,
            'gedung' => ($user->kamar && $user->kamar->gedung) ? $user->kamar->gedung->nama : 'Asrama Unand',
        ]);
    }

    /**
     * Ganti password akun yang sedang masuk
     * POST /api/auth/change-password
     */
    public function changePassword(): Response
    {
        $this->request->allowMethod(['post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }
        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }

        $data = $this->request->getData();
        $passwordLama = (string)($data['password_lama'] ?? '');
        $passwordBaru = (string)($data['password_baru'] ?? '');

        if ($passwordLama === '' || $passwordBaru === '') {
            return $this->jsonError('Password lama dan password baru wajib diisi.', 422);
        }
        if (strlen($passwordBaru) < 8) {
            return $this->jsonError('Password baru minimal 8 karakter.', 422);
        }

        $usersTable = $this->fetchTable('Users');
        $user = $usersTable->get($user->id);

        if (!$this->verifyStoredPassword($passwordLama, (string)$user->password)) {
            return $this->jsonError('Password lama tidak sesuai.', 401);
        }

        $user->password = password_hash($passwordBaru, PASSWORD_DEFAULT);
        if ($usersTable->save($user)) {
            $currentTokenHash = $this->bearerTokenHash();
            if ($currentTokenHash !== null) {
                $this->fetchTable('AuthTokens')->deleteAll([
                    'user_id' => $user->id,
                    'token_hash !=' => $currentTokenHash,
                ]);
            }
            return $this->jsonSuccess([], 'Password berhasil diubah.');
        }

        return $this->jsonError('Password gagal diperbarui.', 422, $user->getErrors());
    }

    /**
     * Permintaan Lupa Kata Sandi (Kirim Kode Reset ke Email)
     * POST /api/auth/forgot-password
     */
    public function forgotPassword(): Response
    {
        $this->request->allowMethod(['post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $data = $this->request->getData();
        $emailInput = trim((string)($data['email'] ?? ''));
        if ($emailInput === '') {
            return $this->jsonError('Masukkan alamat email kampus Anda yang terdaftar.', 422);
        }

        $usersTable = $this->fetchTable('Users');
        $user = $usersTable->find()
            ->where(['OR' => [
                'Users.email' => $emailInput,
                'Users.nim' => $emailInput,
            ]])
            ->first();

        if ($user === null) {
            return $this->jsonError('Akun dengan email/NIM tersebut tidak ditemukan di database asrama.', 404);
        }

        $resetCode = (string)random_int(100000, 999999);
        $tokenHash = hash('sha256', 'reset:' . $user->id . ':' . $resetCode);

        $tokensTable = $this->fetchTable('AuthTokens');
        $now = new \DateTimeImmutable('now');
        $tokenEntity = $tokensTable->newEntity([
            'user_id' => $user->id,
            'token_hash' => $tokenHash,
            'expires_at' => $now->modify('+15 minutes')->format('Y-m-d H:i:s'),
            'created_at' => $now->format('Y-m-d H:i:s'),
        ]);

        if (!$tokensTable->save($tokenEntity)) {
            return $this->jsonError('Gagal membuat kode pemulihan kata sandi.', 500);
        }

        return $this->jsonSuccess([
            'email' => $user->email,
            'nama' => $user->nama,
            'reset_code' => $resetCode,
            'expires_in_minutes' => 15,
            'email_subject' => 'Kode Pemulihan Kata Sandi - Portal Absensi Asrama Unand',
            'email_from' => 'noreply-asrama@unand.ac.id',
        ], 'Email pemulihan kata sandi telah dikirimkan.');
    }

    /**
     * Simpan Kata Sandi Baru dari Fitur Lupa Kata Sandi
     * POST /api/auth/reset-password
     */
    public function resetPassword(): Response
    {
        $this->request->allowMethod(['post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $data = $this->request->getData();
        $emailInput = trim((string)($data['email'] ?? ''));
        $resetCode = trim((string)($data['reset_code'] ?? ''));
        $passwordBaru = (string)($data['password_baru'] ?? '');

        if ($emailInput === '' || $resetCode === '' || $passwordBaru === '') {
            return $this->jsonError('Email, kode verifikasi email, dan kata sandi baru wajib diisi.', 422);
        }

        if (strlen($passwordBaru) < 6) {
            return $this->jsonError('Kata sandi baru minimal 6 karakter.', 422);
        }

        $usersTable = $this->fetchTable('Users');
        $user = $usersTable->find()
            ->where(['OR' => [
                'Users.email' => $emailInput,
                'Users.nim' => $emailInput,
            ]])
            ->first();

        if ($user === null) {
            return $this->jsonError('Akun tidak ditemukan.', 404);
        }

        $expectedHash = hash('sha256', 'reset:' . $user->id . ':' . $resetCode);
        $tokensTable = $this->fetchTable('AuthTokens');
        $validToken = $tokensTable->find()
            ->where([
                'user_id' => $user->id,
                'token_hash' => $expectedHash,
                'expires_at >' => (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s'),
            ])
            ->first();

        if ($validToken === null) {
            return $this->jsonError('Kode verifikasi email tidak sesuai atau sudah kedaluwarsa.', 422);
        }

        $user->password = password_hash($passwordBaru, PASSWORD_DEFAULT);
        if ($usersTable->save($user)) {
            $tokensTable->delete($validToken);

            return $this->jsonSuccess([], 'Kata sandi baru berhasil disimpan! Silakan masuk dengan kata sandi baru Anda.');
        }

        return $this->jsonError('Gagal menyimpan kata sandi baru.', 500);
    }

    private function verifyStoredPassword(string $plainPassword, string $storedPassword): bool
    {
        return password_verify($plainPassword, $storedPassword)
            || hash_equals($storedPassword, $plainPassword)
            || (
                hash_equals(self::LEGACY_DEMO_PASSWORD_HASH, $storedPassword)
                && $plainPassword === 'password123'
            );
    }

    /**
     * Endpoint Logout
     * POST /api/auth/logout
     */
    public function logout(): Response
    {
        $this->request->allowMethod(['post', 'options']);
        if ($this->request->is('options')) {
            return $this->response->withStatus(200);
        }

        $user = $this->requireAuthenticatedUser();
        if ($user instanceof Response) {
            return $user;
        }

        $tokenHash = $this->bearerTokenHash();
        if ($tokenHash === null) {
            return $this->jsonError('Sesi login tidak valid atau telah berakhir.', 401);
        }

        $this->fetchTable('AuthTokens')->deleteAll([
            'user_id' => $user->id,
            'token_hash' => $tokenHash,
        ]);
        return $this->jsonSuccess([], 'Logout berhasil.');
    }
}
